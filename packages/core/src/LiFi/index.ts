import {
  ILifiBestQuote,
  ILifiGasSuggestionParams,
  ILifiSwapStep,
  ILifiToken,
  ILifiTransactionStatus,
} from "./types";

import { BaseAggregator } from "@/abstract";
import { AggId, IStatusResponse, OpStatus } from "@/types";
import {
  IBtrSwapParams,
  ICostEstimate,
  IProtocol,
  IStatusParams,
  ISwapStep,
  IToken,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
  TransactionRequest,
} from "@/types";
import {
  addEstimatesToTr,
  buildQueryParams,
  fetchJson,
  formatError,
  mapKToKV,
  weiToString,
} from "@/utils";

/**
 * LiFi Aggregator Implementation.
 * @see https://docs.li.fi/li.fi-api/li.fi-api
 */
export class LiFi extends BaseAggregator {
  constructor() {
    super(AggId.LIFI);
    // Set up router addresses for supported chains
    this.routerByChainId = {
      1: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Ethereum
      10: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Optimism
      56: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // BNB Chain
      100: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Gnosis Chain
      137: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Polygon
      250: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Fantom
      8453: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Base
      59144: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Linea
      42161: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Arbitrum
      43114: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE", // Avalanche
    };
    // Use chain ID as string for alias lookup if required by LiFi
    this.aliasByChainId = mapKToKV(this.routerByChainId, (k) => k.toString());
    this.approvalAddressByChainId = this.routerByChainId;
  }

  /**
   * Calculates a gas estimate from costs arrays
   */
  private processCostEstimate = (gasCosts: any[], feeCosts: any[]): ICostEstimate => ({
    gasCostUsd: this.sumCosts(gasCosts, "amountUSD") as number,
    gasCostWei: this.sumCosts(gasCosts, "amount") as bigint,
    feeCostUsd: this.sumCosts(feeCosts, "amountUSD") as number,
    feeCostWei: this.sumCosts(feeCosts, "amount") as bigint,
  });

  /**
   * Helper to sum cost arrays from LiFi responses.
   * Handles both string amounts (for Wei) and USD amounts (for float).
   */
  private sumCosts(
    costs: { amount?: string; amountUSD?: string }[] | undefined,
    key: "amount" | "amountUSD",
  ): bigint | number {
    if (!costs) return key === "amount" ? BigInt(0) : 0;

    // Use parseFloat for amountUSD, BigInt for amount
    if (key === "amountUSD") {
      return costs.reduce((sum, cost) => sum + parseFloat(cost.amountUSD || "0"), 0);
    } else {
      return costs.reduce((sum, cost) => sum + BigInt(cost.amount || "0"), BigInt(0));
    }
  }

  private getHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(this.apiKey && { "X-API-Key": this.apiKey }),
  });

  protected convertParams = (p: IBtrSwapParams): Record<string, any> => {
    return {
      fromChain: p.input.chainId.toString(),
      fromToken: p.input.address,
      fromAddress: p.payer,
      fromAmount: weiToString(p.inputAmountWei),
      toChain: this.aliasByChainId[Number(p.output.chainId)] || p.output.chainId.toString(),
      toToken: p.output.address,
      toAddress: p.receiver ?? p.payer,
      integrator: p.integrator || this.integrator,
      order: "RECOMMENDED",
      ...(p.maxSlippage && { slippage: p.maxSlippage / 10000 }),
      ...((this.referrer || p.referrer) && { referrer: p.referrer ?? this.referrer }),
      ...(p.bridgeBlacklist?.length && { denyBridges: p.bridgeBlacklist.join(",") }),
      ...(p.exchangeBlacklist?.length && { denyExchanges: p.exchangeBlacklist.join(",") }),
    };
  };

  private apiRequest = async <T = any>(
    endpoint: string,
    params?: Record<string, any>,
    method: "GET" | "POST" = "GET",
    body?: any,
  ): Promise<T> => {
    const url = new URL(`${this.baseApiUrl}/${endpoint}`);

    if (method === "GET" && params) {
      // Filter out undefined values before building query string
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined),
      );
      url.search = buildQueryParams(filteredParams);
    }

    return fetchJson<T>(url, {
      method,
      headers: this.getHeaders(),
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
    });
  };

  private parseToken = (token: ILifiToken): IToken => ({
    address: token.address ?? "",
    decimals: token.decimals,
    symbol: token.symbol,
    chainId: token.chainId ?? 1, // Default to 1 if undefined? Check LiFi docs
    name: token.name,
    logo: token.logoURI,
    priceUsd: token.priceUSD,
  });

  private parseSteps = (steps: ILifiSwapStep[]): ISwapStep[] =>
    steps.map((step) => {
      const inputAmount = Number(step.estimate.fromAmount) / 10 ** step.action.fromToken.decimals;
      const outputAmount = Number(step.estimate.toAmount) / 10 ** step.action.toToken.decimals;
      return {
        id: step.id,
        type:
          step.type === "swap"
            ? StepType.SWAP
            : step.type === "cross"
              ? StepType.BRIDGE
              : StepType.TRANSFER,
        description: `${step.toolDetails?.name || step.tool || "Step"} via LiFi`,
        input: this.parseToken(step.action.fromToken),
        output: this.parseToken(step.action.toToken),
        inputChainId: step.action.fromChainId,
        outputChainId: step.action.toChainId,
        payer: step.action.fromAddress,
        receiver: step.action.toAddress,
        protocol: {
          name: step.toolDetails?.name || step.tool || "",
          id: step.toolDetails?.key || step.tool || "",
          logo: step.toolDetails?.logoURI || "",
          type: step.type === "swap" ? ProtocolType.DEX : ProtocolType.BRIDGE,
        } as IProtocol,
        estimates: {
          input: inputAmount,
          inputWei: step.estimate.fromAmount,
          output: outputAmount,
          outputWei: step.estimate.toAmount,
          exchangeRate: outputAmount / inputAmount,
          slippage: step.action.slippage || 0,
          gasCostUsd: this.sumCosts(step.estimate.gasCosts, "amountUSD") as number,
          gasCostWei: this.sumCosts(step.estimate.gasCosts, "amount") as bigint,
          feeCostUsd: this.sumCosts(step.estimate.feeCosts, "amountUSD") as number,
          feeCostWei: this.sumCosts(step.estimate.feeCosts, "amount") as bigint,
        },
      };
    });

  private processTransactionRequest = (
    tx: TransactionRequest,
    step: ILifiSwapStep,
    includedSteps: ILifiSwapStep[] = [step],
  ): ITransactionRequestWithEstimate => {
    if (!tx.to || !tx.data) throw new Error("Incomplete transaction request");

    const steps = this.parseSteps(includedSteps);
    const firstStep = steps[0];
    const lastStep = steps[steps.length - 1];
    if (!firstStep || !lastStep) throw new Error("No valid steps found");

    const inputAmountWei = BigInt(step.estimate.fromAmount);
    const outputAmountWei = BigInt(step.estimate.toAmountMin);
    if (inputAmountWei === 0n || outputAmountWei === 0n)
      throw new Error("Step zero input or output amount detected in overall estimate");

    const params: IBtrSwapParams = {
      input: this.parseToken(step.action.fromToken),
      output: this.parseToken(step.action.toToken),
      inputAmountWei: step.action.fromAmount,
      payer: step.action.fromAddress,
      receiver: step.action.toAddress,
      maxSlippage: step.action.slippage,
    };

    return addEstimatesToTr({
      ...tx,
      params: params,
      steps,
    });
  };

  private parseTransactionStatus = (status: ILifiTransactionStatus): IStatusResponse => ({
    id: status.transactionId || "",
    status:
      {
        DONE: OpStatus.DONE,
        PENDING: OpStatus.PENDING,
        FAILED: OpStatus.FAILED,
        NOT_FOUND: OpStatus.NOT_FOUND,
      }[status.status?.toUpperCase() ?? ""] ?? OpStatus.PENDING,
    substatus: status.substatus,
    substatusMessage: status.substatusMessage,
    txHash: status.sending?.txHash,
    sendingTx: status.sending?.txHash,
    receivingTx: status.receiving?.txHash,
  });

  public async getQuote(p: IBtrSwapParams): Promise<ILifiBestQuote | undefined> {
    p = this.overloadParams(p);
    try {
      const params = this.convertParams(p);
      const response = await this.apiRequest<ILifiBestQuote>("quote", params);
      if (!response?.estimate?.toAmount || !response?.action?.toToken) {
        throw formatError("LiFi quote response missing essential fields", 400, response);
      }
      return response;
    } catch (error) {
      this.handleError(error, "[LiFi] getQuote");
      return undefined;
    }
  }

  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const quote = await this.getQuote(p);
      if (!quote?.transactionRequest) {
        throw formatError("Failed to get a valid transactionRequest from LiFi quote", 400, quote);
      }

      return this.processTransactionRequest(
        quote.transactionRequest,
        quote,
        quote.includedSteps || [quote],
      );
    } catch (error) {
      this.handleError(error, "[LiFi] getTransactionRequest");
      return undefined;
    }
  }

  public async getStatus(p: IStatusParams): Promise<IStatusResponse | undefined> {
    try {
      if (!p.txHash) {
        throw new Error("Missing transaction hash for LiFi getStatus");
      }

      const params = {
        txHash: p.txHash,
        ...(p.inputChainId && { fromChain: p.inputChainId }),
        ...(p.outputChainId && { toChain: p.outputChainId }),
      };

      const statusResponse = await this.apiRequest<ILifiTransactionStatus>("status", params);

      if (!statusResponse?.status && !statusResponse?.sending?.txHash) {
        throw formatError("Invalid status response structure from LiFi", 404, statusResponse);
      }

      if (
        statusResponse.status?.toUpperCase() === "NOT_FOUND" &&
        statusResponse.sending?.txHash === p.txHash
      ) {
        return {
          id: p.txHash,
          status: OpStatus.PENDING,
          substatusMessage: "Transaction found but bridging/receiving status unknown.",
          sendingTx: statusResponse.sending.txHash,
        };
      }

      return this.parseTransactionStatus(statusResponse);
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        return {
          id: p.txHash || "",
          status: OpStatus.NOT_FOUND,
          substatusMessage: "Transaction not found by LiFi API.",
        };
      }
      this.handleError(error, "[LiFi] getStatus");
      return undefined;
    }
  }

  public async gasSuggestion(p: ILifiGasSuggestionParams): Promise<unknown> {
    try {
      if (!p.chainId) {
        throw new Error("Missing chainId for LiFi gasSuggestion");
      }
      return await this.apiRequest<unknown>("gas-suggestion", { chain: p.chainId });
    } catch (error) {
      this.handleError(error, `[LiFi] gasSuggestion (chain: ${p.chainId})`);
      return undefined;
    }
  }
}

export const lifiAggregator = new LiFi();
