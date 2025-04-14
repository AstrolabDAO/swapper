import { IOdosAssembleResponse, IOdosQuoteParams, IOdosQuoteResponse } from "./types";

import { BaseAggregator } from "@/abstract";
import {
  AggId,
  ICostEstimate,
  ISwapEstimate,
  IBtrSwapParams,
  ISwapStep,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
  TransactionRequest,
} from "@/types";
import {
  addEstimatesToTr,
  emptyEstimate,
  fetchJson,
  formatError,
  mapKToKV,
  toBigInt,
} from "@/utils";

/**
 * Odos Aggregator Implementation.
 * @see https://docs.odos.xyz/product/sor/v2/api-reference
 */
export class Odos extends BaseAggregator {
  constructor() {
    super(AggId.ODOS);
    this.routerByChainId = {
      1: "0x19CeD9a5760383a7F39A542fCcf484bf1668fE70", // Ethereum
      10: "0x4A87236677542A0A0101799F335105e095644F26", // Optimism
      56: "0xC9aE4E6Ed580A6745791F675C10f579f1fc3CCC3", // BNB Chain
      137: "0x2dAc1708C936A04B05A8876C99a718F6507655F0", // Polygon
      324: "0x95142817185A49B040FACacb9096a8576AFD8570", // zkSync Era
      8453: "0xB31e1A6499198127154D474500A0140D7B98C518", // Base
      42161: "0x8f24ABF18c417B956b64385511698464EC19C98b", // Arbitrum
      43114: "0x6E913191760a784Ff05ED7059f3F9199AF76aA6A", // Avalanche
    };
    this.aliasByChainId = mapKToKV(this.routerByChainId);
    this.approvalAddressByChainId = this.routerByChainId;
  }

  /**
   * Returns API headers for Odos requests
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(this.apiKey && { "x-api-key": this.apiKey }),
    };
  }

  private apiRequest = async <T = any>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: any,
    chainId?: number | string,
  ): Promise<T> => {
    if (!chainId) throw new Error("[Odos] Chain ID required for API request");
    const url = `${this.getApiRoot(Number(chainId))}/${endpoint}`;
    return fetchJson<T>(url, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  protected convertParams = (p: IBtrSwapParams): IOdosQuoteParams => {
    return {
      // Use p.input.chainId
      chainId: Number(p.input.chainId),
      // gasPrice: "0", // Let Odos determine gas price
      inputTokens: [
        {
          tokenAddress: p.input.address!,
          amount: p.inputAmountWei.toString(),
        },
      ],
      outputTokens: [
        {
          tokenAddress: p.output.address!,
          proportion: 1,
        },
      ],
      slippageLimitPercent: (p.maxSlippage ?? 100) / 100, // Use 100 BPS (1%) as default
      userAddr: p.payer,
      recipient: p.receiver ?? p.payer,
      referralCode: Number(this.referrer || "0"),
    };
  };

  private processTransactionRequest = (
    tx: Partial<TransactionRequest>,
    params: IBtrSwapParams,
    quote: IOdosQuoteResponse,
  ): ITransactionRequestWithEstimate => {
    const inputAmount = Number(quote.inputTokens[0]?.amount || "0") / 10 ** params.input.decimals;
    const outputAmount =
      Number(quote.outputTokens[0]?.amount || "0") / 10 ** params.output.decimals;
    const estimates: ICostEstimate & ISwapEstimate = {
      ...emptyEstimate(),
      gasCostWei: toBigInt(quote.gasEstimate),
      input: inputAmount,
      inputWei: quote.inputTokens[0]?.amount || "0",
      output: outputAmount,
      outputWei: quote.outputTokens[0]?.amount || "0",
      exchangeRate: outputAmount / inputAmount,
    };

    const steps: ISwapStep[] = [
      {
        type: StepType.SWAP,
        description: "Swap via Odos",
        input: params.input,
        output: params.output,
        inputChainId: Number(params.input.chainId),
        outputChainId: Number(params.output.chainId || params.input.chainId),
        protocol: {
          id: "odos",
          name: "Odos",
          logo: "",
          type: ProtocolType.AGGREGATOR,
        },
        estimates,
      },
    ];

    return addEstimatesToTr({
      ...tx,
      params,
      steps,
    });
  };

  public async getQuote(p: IBtrSwapParams): Promise<IOdosQuoteResponse | undefined> {
    p = this.overloadParams(p);
    try {
      const quoteRequestBody = this.convertParams(p);
      if (!quoteRequestBody) {
        // Handle cases where convertParams might return undefined, though current logic doesn't
        throw new Error("[Odos] Failed to generate quote request parameters");
      }

      const response = await this.apiRequest<IOdosQuoteResponse>(
        `sor/quote/v2`,
        "POST",
        quoteRequestBody,
        // Use p.input.chainId
        Number(p.input.chainId), // Pass chainId for logging/potential use
      );

      if (!response?.pathId) {
        // Check for pathId as validation
        throw formatError("Invalid quote response from Odos", 400, response);
      }
      return response;
    } catch (error) {
      // Remove the old commented-out convertParams logic below
      this.handleError(error, "[Odos] getQuoteInternal");
      return undefined; // Return undefined on error
    }
  }

  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const quote = await this.getQuote(p);
      if (!quote?.pathId) {
        // Error handled in getQuoteInternal
        return undefined;
      }

      const assembleRequestBody = {
        userAddr: p.payer,
        pathId: quote.pathId,
        simulate: false, // Get actual transaction data
      };

      const assembleResponse = await this.apiRequest<IOdosAssembleResponse>(
        `sor/assemble`,
        "POST",
        assembleRequestBody,
        // Use p.input.chainId
        Number(p.input.chainId),
      );

      if (!assembleResponse?.transaction) {
        throw formatError("Invalid assemble response from Odos", 500, assembleResponse);
      }
      const { transaction } = assembleResponse;

      const tx: Partial<TransactionRequest> = {
        // No aggId here
        approvalAddress: transaction.to, // Odos router needs approval
        from: transaction.from,
        to: transaction.to,
        data: transaction.data,
        value: transaction.value, // Already string wei
        chainId: Number(p.input.chainId),
      };

      // Check if payer matches response 'from'
      if (p.payer.toLowerCase() !== transaction.from.toLowerCase()) {
        console.warn(`[Odos] Payer mismatch: Request ${p.payer}, Response ${transaction.from}`);
      }

      // Correct the call, use tx and remove assembleResponse if not needed by processTransactionRequest
      return this.processTransactionRequest(tx, p, quote /*, assembleResponse */);
    } catch (error) {
      this.handleError(error, "[Odos] getTransactionRequest");
      return undefined;
    }
  }
}

export const odosAggregator = new Odos();
