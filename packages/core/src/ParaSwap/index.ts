import { IParaSwapRoute, TransactionRequest } from "./types";

import { BaseAggregator } from "@/abstract";
import {
  AggId,
  IBtrSwapParams,
  ICostEstimate,
  ISwapEstimate,
  ISwapStep,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
} from "@/types";
import {
  addEstimatesToTr,
  buildQueryParams,
  emptyEstimate,
  fetchJson,
  formatError,
  mapKToKV,
} from "@/utils";

/**
 * ParaSwap Aggregator Implementation.
 * @see https://developers.paraswap.io/api/master
 */
export class ParaSwap extends BaseAggregator {
  constructor() {
    super(AggId.PARASWAP);
    this.routerByChainId = {
      // Augustus V6.2
      1: "0x6a000f20005980200259b80c5102003040001068", // Ethereum
      10: "0x6a000f20005980200259b80c5102003040001068", // Optimism
      56: "0x6a000f20005980200259b80c5102003040001068", // BNB Chain
      137: "0x6a000f20005980200259b80c5102003040001068", // Polygon
      250: "0x6a000f20005980200259b80c5102003040001068", // Fantom
      8453: "0x6a000f20005980200259b80c5102003040001068", // Base
      42161: "0x6a000f20005980200259b80c5102003040001068", // Arbitrum
      43114: "0x6a000f20005980200259b80c5102003040001068", // Avalanche
    };
    this.aliasByChainId = mapKToKV(this.routerByChainId); // ParaSwap uses chain ID as string alias
    this.approvalAddressByChainId = this.routerByChainId;
  }

  /**
   * Returns API headers for ParaSwap requests
   */
  private getHeaders(contentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }
    if (contentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  /**
   * Converts BTR Swap parameters to ParaSwap API format.
   * @param params - BTR Swap parameters
   * @param isPrice - Whether this is for a price quote (true) or transaction build (false)
   * @returns ParaSwap-specific parameters
   */
  protected convertParams(params: IBtrSwapParams, isPrice = false): Record<string, any> {
    const { input, output, inputAmountWei, maxSlippage } = params;
    return {
      network: Number(params.input.chainId),
      srcToken: input.address,
      destToken: output.address,
      srcAmount: inputAmountWei.toString(),
      srcDecimals: params.input.decimals,
      destDecimals: params.output.decimals,
      slippage: maxSlippage!,
      side: "SELL",
      // includeDEXS: params.exchangeWhitelist?.join(","),
      // excludeDEXS: params.exchangeBlacklist?.join(","),
      partner: this.integrator,
      ...(!isPrice && {
        userAddress: params.payer,
        receiver: params.receiver,
      }),
    };
  }

  /**
   * Fetches a price quote from the ParaSwap API.
   * @param p - BTR Swap parameters
   * @returns Promise resolving to the best price route, or undefined
   */
  public async getQuote(p: IBtrSwapParams): Promise<IParaSwapRoute | undefined> {
    p = this.overloadParams(p);
    try {
      const url = `${this.getApiRoot(Number(p.input.chainId))}/prices/?${buildQueryParams(this.convertParams(p, true))}`;
      const response = await fetchJson<{ priceRoute: IParaSwapRoute }>(url, {
        headers: this.getHeaders(),
      });
      if (!response.priceRoute) {
        throw formatError("Invalid quote response", 400, response);
      }
      return response.priceRoute;
    } catch (error) {
      this.handleError(error, "[ParaSwap] getQuote");
      return undefined;
    }
  }

  /**
   * Fetches a transaction request for a ParaSwap swap.
   * @param p - BTR Swap parameters
   * @returns Promise resolving to the transaction request with estimates, or undefined
   */
  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const priceRoute = await this.getQuote(p);
      if (!priceRoute) throw new Error("Failed to get quote");

      const routerAddress = this.getRouterAddress(Number(p.input.chainId));
      if (!routerAddress) throw new Error(`No router for chain ${p.input.chainId}`);

      // Build transaction
      const buildParams = {
        ...this.convertParams(p),
        priceRoute,
        srcAmount: priceRoute.srcAmount,
        destAmount: priceRoute.destAmount,
        userAddress: p.payer,
        receiver: p.receiver,
        otherExchangePrices: false,
      };

      const url = `${this.getApiRoot(Number(p.input.chainId))}/transactions/${Number(p.input.chainId)}`;
      const tx = await fetchJson<TransactionRequest | { message: string }>(url, {
        method: "POST",
        headers: this.getHeaders(true),
        body: JSON.stringify(buildParams),
      });

      if ("message" in tx) throw formatError(tx.message as string, 500, tx);
      if (!tx?.data || !tx?.to) throw formatError("Invalid response", 500, tx);
      if (tx.to.toLowerCase() !== routerAddress.toLowerCase())
        throw formatError(`Router mismatch: ${tx.to} vs ${routerAddress}`, 500, tx);

      const inputAmount = Number(priceRoute.srcAmount) / 10 ** p.input.decimals;
      const outputAmount = Number(priceRoute.destAmount) / 10 ** p.output.decimals;
      const estimates: ICostEstimate & ISwapEstimate = {
        ...emptyEstimate(),
        input: inputAmount,
        inputWei: priceRoute.srcAmount,
        output: outputAmount,
        outputWei: priceRoute.destAmount,
        exchangeRate: outputAmount / inputAmount,
        gasCostUsd: parseFloat(priceRoute.gasCostUSD ?? "0"),
        gasCostWei: BigInt(priceRoute.gasCost ?? "0"),
        // TODO: add fee estimates
      };

      const chainId = Number(p.input.chainId);

      const steps: ISwapStep[] = [
        {
          type: StepType.SWAP,
          description: "Swap via ParaSwap",
          input: p.input,
          output: p.output,
          inputChainId: chainId,
          outputChainId: chainId,
          protocol: {
            id: "paraswap",
            name: "ParaSwap",
            logo: "",
            type: ProtocolType.AGGREGATOR,
          },
          estimates,
        },
      ];

      // Build final transaction object using the standardized structure
      return addEstimatesToTr({
        ...tx,
        from: p.payer,
        chainId,
        params: p,
        steps,
      });
    } catch (error) {
      this.handleError(error, "[ParaSwap] getTransactionRequest");
      return undefined;
    }
  }
}

export const paraSwapAggregator = new ParaSwap();
