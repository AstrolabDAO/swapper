import { IOneInchQuoteApiResponse, IOneInchSwapApiResponse } from "./types";

import { BaseAggregator } from "@/abstract";
import { nativeTokenAddress, zeroAddress } from "@/constants";
import {
  AggId,
  ICostEstimate,
  ISwapEstimate,
  IBtrSwapParams,
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
 * 1inch Aggregator Implementation.
 * @see https://portal.1inch.dev/documentation/swap/swagger
 */
export class OneInch extends BaseAggregator {
  constructor() {
    super(AggId.ONE_INCH);
    // Fusion v2 Routers
    this.routerByChainId = {
      1: "0x111111125421ca6dc452d289314280a0f8842a65", // Ethereum
      10: "0x111111125421ca6dc452d289314280a0f8842a65", // Optimism
      56: "0x111111125421ca6dc452d289314280a0f8842a65", // BNB Chain
      137: "0x111111125421ca6dc452d289314280a0f8842a65", // Polygon
      324: "0x111111125421ca6dc452d289314280a0f8842a65", // zkSync Era
      8453: "0x111111125421ca6dc452d289314280a0f8842a65", // Base
      42161: "0x111111125421ca6dc452d289314280a0f8842a65", // Arbitrum
      43114: "0x111111125421ca6dc452d289314280a0f8842a65", // Avalanche
    };
    // 1inch uses numeric chain IDs in the URL path
    this.aliasByChainId = mapKToKV(this.routerByChainId, (k) => k.toString());
    this.approvalAddressByChainId = this.routerByChainId;
  }

  /**
   * Constructs the 1inch API root URL for a given chain ID.
   * Overrides BaseAggregator.getApiRoot to add chain-specific path.
   * @throws {Error} If chain is not supported
   */
  protected getApiRoot(chainId: number): string {
    this.ensureChainSupported(chainId);
    return `${this.baseApiUrl}/${this.aliasByChainId[chainId]}`;
  }

  /**
   * Returns authentication headers for 1inch API requests
   */
  private getHeaders = (): Record<string, string> => ({
    accept: "application/json",
    ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
  });

  /**
   * Converts BTR Swap parameters to 1inch API format.
   * @param p - BTR Swap parameters
   * @returns Record of parameters formatted for 1inch API
   */
  protected convertParams(p: IBtrSwapParams): Record<string, any> {
    const { input, output, inputAmountWei, payer, receiver, maxSlippage } = p;
    return {
      // Compare token address to zeroAddress
      src: input.address === zeroAddress ? nativeTokenAddress : input.address,
      dst: output.address === zeroAddress ? nativeTokenAddress : output.address,
      amount: inputAmountWei.toString(),
      from: payer,
      slippage: maxSlippage! / 100, // Convert BPS to percentage
      receiver: receiver ?? undefined,
      // Add other optional params like protocols, fee, gasPrice etc. if needed
      // protocols: p.exchangeWhitelist?.join(","),
      // excludedProtocols: p.exchangeBlacklist?.join(","),
      // fee: this.feePercent ? (this.feePercent / 100).toString() : undefined, // Convert percentage to decimal string
      integrator: this.integrator,
    };
  }

  /**
   * Fetches a quote from the 1inch API.
   * @param p - Swapper parameters.
   * @returns Promise resolving to the quote response, or undefined on error.
   */
  public async getQuote(p: IBtrSwapParams): Promise<IOneInchQuoteApiResponse | undefined> {
    p = this.overloadParams(p);
    try {
      const url = `${this.getApiRoot(Number(p.input.chainId))}/quote?${buildQueryParams({ ...this.convertParams(p), includeGas: true })}`;
      const quote = await fetchJson<IOneInchQuoteApiResponse>(url, { headers: this.getHeaders() });
      if (!quote?.dstAmount) {
        throw new Error("Invalid quote response from 1inch");
      }
      return quote;
    } catch (error) {
      this.handleError(error, "[OneInch] getQuote");
      return undefined;
    }
  }

  /**
   * Fetches a transaction request for a 1inch swap.
   */
  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      // Use p.input.chainId
      const chainId = Number(p.input.chainId);
      const apiRoot = this.getApiRoot(chainId);
      const headers = this.getHeaders();
      const approvalAddress = this.getApprovalAddress(chainId);

      if (!approvalAddress) throw new Error(`[OneInch] No approval address for chain ${chainId}`);

      // Prepare request parameters
      const baseParams = this.convertParams(p);
      const urls = {
        swap: `${apiRoot}/swap?${buildQueryParams({
          ...baseParams,
          disableEstimate: true,
        })}`,
      };

      // Fetch swap data (quote is implicitly done via swap endpoint)
      const swap = await fetchJson<IOneInchSwapApiResponse>(urls.swap, { headers });

      // Validate responses
      if (!swap?.tx || !swap?.dstAmount) {
        throw formatError("Invalid API response", 500, { swap });
      }

      if (swap.tx.to?.toLowerCase() !== approvalAddress.toLowerCase()) {
        throw formatError(`Router mismatch: ${swap.tx.to} vs ${approvalAddress}`, 500, swap);
      }

      const quote = await this.getQuote(p);
      const inputAmount = Number(p.inputAmountWei) / 10 ** p.input.decimals;
      const outputAmount = Number(swap.dstAmount) / 10 ** p.output.decimals;
      const estimates: ICostEstimate & ISwapEstimate = {
        ...emptyEstimate(),
        gasCostWei: BigInt(quote?.gas || "0"),
        input: inputAmount,
        inputWei: p.inputAmountWei.toString(),
        output: outputAmount,
        outputWei: swap.dstAmount,
        exchangeRate: outputAmount / inputAmount,
        // TODO: add gas/fee estimates
      };

      // Build transaction with estimates following the standardized pattern
      return addEstimatesToTr({
        ...swap.tx,
        from: p.payer, // Ensure 'from' is set correctly from params
        chainId: chainId,
        params: p,
        steps: [
          {
            type: StepType.SWAP,
            description: "Swap via 1inch",
            input: p.input,
            output: p.output,
            inputChainId: chainId,
            outputChainId: chainId, // Assuming same chain swap
            protocol: {
              id: "1inch",
              name: "1inch",
              logo: "",
              type: ProtocolType.AGGREGATOR,
            },
            estimates,
          },
        ],
      });
    } catch (error) {
      this.handleError(error, "[OneInch] getTransactionRequest");
      return undefined;
    }
  }
}

export const oneInchAggregator = new OneInch();
