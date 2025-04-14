import { IRocketXQuoteRequest, IRocketXQuoteResponse } from "./types";

import { UnimplementedAggregator } from "@/abstract";
import { nativeTokenAddress, zeroAddress } from "@/constants";
import {
  AggId,
  IStatusParams,
  IStatusResponse,
  IBtrSwapParams,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
  TransactionRequest,
} from "@/types";
import { addEstimatesToTr, emptyEstimate, fetchJson, formatError } from "@/utils";

/**
 * RocketX Aggregator Implementation.
 * NB: RocketX requires a separate buildTx step similarly to Socket after getting the quote, which is not implemented here.
 * @see https://docs.rocketx.exchange/
 */
export class RocketX extends UnimplementedAggregator {
  constructor() {
    super(AggId.ROCKETX);
    this.routerByChainId = {
      1: "0x5D6B6DB4B4f88B04114eB1D7857A00A276f10871", // Example - Replace with actual if available
      // Add other chains as needed
    };
    this.aliasByChainId = {}; // RocketX seems to use numeric chain IDs
    this.approvalAddressByChainId = this.routerByChainId;
  }

  private getHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    // Add API key header if needed
    ...(this.apiKey && { "api-key": this.apiKey }),
  });

  /**
   * Converts BTR Swap parameters to RocketX API quote parameters.
   * @param p - BTR Swap parameters.
   * @returns Parameters formatted for the RocketX /quote endpoint.
   * @throws Error if parameters are invalid.
   */
  protected convertParams = (p: IBtrSwapParams): IRocketXQuoteRequest => {
    const { input, output, inputAmountWei, payer, receiver, maxSlippage } = p;
    // Structure matches IRocketXQuoteRequest
    return {
      fromAddress: payer,
      fromToken: {
        address: input.address === zeroAddress ? nativeTokenAddress : input.address!,
        chainId: Number(input.chainId),
        decimals: Number(input.decimals), // Ensure decimals is number
        symbol: input.symbol || "",
      },
      toToken: {
        address: output.address === zeroAddress ? nativeTokenAddress : output.address!,
        chainId: Number(output.chainId),
        decimals: Number(output.decimals), // Ensure decimals is number
        symbol: output.symbol || "",
      },
      fromAmount: inputAmountWei.toString(),
      slippage: (maxSlippage ?? 50) / 100, // Convert BPS to percentage points (e.g., 50 BPS = 0.5)
      receiverAddress: receiver ?? payer,
      enableMetaTxn: false, // Assuming default
    };
  };

  /**
   * Fetches a quote from the RocketX API.
   * @param p - BTR Swap parameters.
   * @returns A promise resolving to the quote response, or undefined if an error occurs.
   */
  public async getQuote(p: IBtrSwapParams): Promise<IRocketXQuoteResponse | undefined> {
    p = this.overloadParams(p);
    try {
      const quoteParams = this.convertParams(p);
      const url = `${this.getApiRoot(Number(p.input.chainId))}/main/v2/quote`;
      const response = await fetchJson<IRocketXQuoteResponse>(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(quoteParams),
      });

      // Basic validation of the response
      if (!response?.result?.toAmount) {
        throw formatError("Invalid quote response from RocketX", 400, response);
      }

      return response;
    } catch (error) {
      this.handleError(error, "[RocketX] getQuote");
      return undefined;
    }
  }

  /**
   * Fetches a transaction request from the RocketX API.
   * NB: Returns a partial request as RocketX requires a separate buildTx step not implemented here.
   * @param p - BTR Swap parameters.
   * @returns A promise that resolves to a partial transaction request containing estimates, or undefined.
   */
  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const quoteResponse = await this.getQuote(p);
      if (!quoteResponse?.result) {
        throw new Error("[RocketX] Failed to get quote");
      }

      const tx: Partial<TransactionRequest> = {
        // Use Partial<TransactionRequest>
        from: p.payer,
        to: undefined, // Requires buildTx
        data: undefined, // Requires buildTx
        value: undefined, // Value usually comes from buildTx for native swaps
        chainId: Number(p.input.chainId), // Include chainId
      };
      return addEstimatesToTr({
        ...tx,
        params: p,
        steps: [
          {
            type: StepType.SWAP,
            description: "RocketX Swap",
            input: p.input,
            output: p.output,
            protocol: {
              id: "rocketx",
              name: "RocketX",
              logo: "",
              type: ProtocolType.AGGREGATOR,
            },
            estimates: emptyEstimate(),
          },
        ],
      });
    } catch (error) {
      this.handleError(error, "[RocketX] getTransactionRequest");
      return undefined;
    }
  }

  /**
   * Gets the status of a previous RocketX transaction.
   * @param p - Status parameters including transaction hash and chain ID.
   * @returns A promise resolving to the transaction status or undefined.
   */
  public async getStatus(_p: IStatusParams): Promise<IStatusResponse | undefined> {
    this.handleError(
      new Error("Status checking not yet implemented for RocketX"),
      "[RocketX] getStatus",
    );
    return undefined;
  }
}

export const rocketXAggregator = new RocketX();
