import { I0xQuoteResponse } from "./types";

import { BaseAggregator } from "@/abstract";
import { nativeTokenAddress, zeroAddress } from "@/constants";
import {
  AggId,
  IBtrSwapParams,
  ICostEstimate,
  ISwapEstimate,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
} from "@/types";
import {
  addEstimatesToTr,
  buildQueryParams,
  emptyCostEstimate,
  emptyEstimate,
  fetchJson,
} from "@/utils";

/**
 * 0x V2 API Aggregator Implementation.
 * @see https://docs.0x.org/0x-api-swap/api-references/get-swap-v1-quote
 */
export class ZeroX extends BaseAggregator {
  constructor() {
    super(AggId.ZERO_X);
    // Router address is dynamic based on chain, typically returned by API
    this.routerByChainId = {};
    this.aliasByChainId = {
      1: "", // Ethereum mainnet (no prefix)
      10: "optimism",
      56: "bsc",
      137: "polygon",
      250: "fantom",
      8453: "base",
      42161: "arbitrum",
      43114: "avalanche",
    };
    // Approval address also typically comes from API response
    this.approvalAddressByChainId = {};
  }

  protected getApiRoot(chainId: number): string {
    this.ensureChainSupported(chainId);
    return `https://${chainId === 1 ? "" : this.aliasByChainId[chainId] + "."}api.0x.org/swap/v1`;
  }

  private getHeaders = (): Record<string, string> =>
    this.apiKey ? { "0x-api-key": this.apiKey } : {};

  /**
   * Converts BTR Swap parameters to 0x API query parameters.
   */
  protected convertParams(params: IBtrSwapParams): Record<string, string | number | undefined> {
    const { input, output, inputAmountWei, payer, receiver, maxSlippage } = params;
    return {
      // Compare token address to zeroAddress
      sellToken: input.address === zeroAddress ? nativeTokenAddress : input.address,
      buyToken: output.address === zeroAddress ? nativeTokenAddress : output.address,
      sellAmount: inputAmountWei.toString(),
      takerAddress: payer,
      receiver: receiver ?? undefined,
      slippagePercentage: maxSlippage ? (maxSlippage / 10000).toString() : undefined,
      integrator: this.integrator,
      // feeRecipient: this.feeRecipient,
      // buyTokenPercentageFee: this.feePercent ? (this.feePercent / 100).toString() : undefined,
    };
  }

  /**
   * Fetches a quote from the 0x API v2.
   * @param p - BTR Swap parameters.
   * @returns A promise resolving to the quote response, or undefined if an error occurs.
   */
  public async getQuote(p: IBtrSwapParams): Promise<I0xQuoteResponse | undefined> {
    p = this.overloadParams(p);
    try {
      const queryParams = this.convertParams(p);
      // Use p.input.chainId
      const apiRoot = this.getApiRoot(Number(p.input.chainId));
      const url = `${apiRoot}/quote?${buildQueryParams(queryParams)}`;

      const response = await fetchJson<I0xQuoteResponse>(url, {
        headers: this.getHeaders(),
      });

      // Basic validation
      if (!response?.buyAmount || !response?.transaction) {
        throw new Error("[ZeroX] Invalid quote response structure");
      }
      return response;
    } catch (error) {
      this.handleError(error, "[ZeroX] getQuote");
      return undefined;
    }
  }

  /**
   * Extracts cost estimates from a 0x quote
   */
  private processCostEstimate = (quote: I0xQuoteResponse): ICostEstimate => {
    const costs = emptyCostEstimate();

    // Gas costs
    costs.gasCostWei =
      BigInt(quote.transaction?.gasPrice || "0") * BigInt(quote.transaction?.gas || "0");

    if (quote.fees) {
      costs.gasCostUsd = quote.fees.gasFee ? parseFloat(quote.fees.gasFee.amount) || 0 : 0;

      // Protocol fees
      if (quote.fees.zeroExFee) costs.feeCostWei = BigInt(quote.fees.zeroExFee.amount || "0");

      if (quote.fees.integratorFee) {
        costs.feeCostWei += BigInt(quote.fees.integratorFee.amount || "0");
        costs.feeCostUsd += parseFloat(quote.fees.integratorFee.amount) || 0;
      }
    }

    return costs;
  };

  /**
   * Fetches a transaction request from the 0x API v2
   */
  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      if (!p.payer) {
        throw new Error("[ZeroX] Payer address is required");
      }

      const quote = await this.getQuote(p);
      if (!quote) return undefined;

      if (quote.issues?.allowance) {
        console.warn(
          `[ZeroX] Allowance issue: ${quote.issues.allowance.token} needs approval for ${quote.issues.allowance.spender}`,
        );
      }
      if (quote.sellToken !== p.input.address || quote.buyToken !== p.output.address) {
        throw new Error("[ZeroX] Invalid quote response structure");
      }
      const chainId = Number(p.input.chainId);
      const approvalAddress = quote.issues?.allowance?.spender || this.getApprovalAddress(chainId);
      if (!approvalAddress) {
        throw new Error("[ZeroX] No approval address available");
      }

      const costEstimates = this.processCostEstimate(quote);
      const inputAmount = Number(quote.sellAmount) / 10 ** p.input.decimals;
      const outputAmount = Number(quote.buyAmount) / 10 ** p.output.decimals;

      const estimates: ISwapEstimate & ICostEstimate = {
        ...emptyEstimate(),
        ...costEstimates,
        input: inputAmount,
        inputWei: BigInt(quote.sellAmount),
        output: outputAmount,
        outputWei: BigInt(quote.buyAmount),
        exchangeRate: outputAmount / inputAmount,
      };

      return addEstimatesToTr({
        ...quote.transaction,
        chainId: Number(p.input.chainId),
        params: p,
        steps: [
          {
            type: StepType.SWAP,
            description: "Swap via 0x",
            protocol: { id: "0x", name: "0x Protocol", logo: "", type: ProtocolType.AGGREGATOR },
            input: p.input,
            output: p.output,
            inputChainId: chainId,
            outputChainId: chainId,
            estimates,
          },
        ],
      });
    } catch (error) {
      this.handleError(error, "[ZeroX] getTransactionRequest");
      return undefined;
    }
  }
}

export const zeroXAggregator = new ZeroX();
