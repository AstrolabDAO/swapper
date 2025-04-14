import { ICowSwapQuote, ICowSwapQuoteResponse } from "./types";

import { JITAggregator } from "@/abstract";
import { zeroAddress } from "@/constants";
import { AggId, IStatusResponse, TransactionRequest } from "@/types";
import {
  IBtrSwapParams,
  IStatusParams,
  ISwapStep,
  IToken,
  ITransactionRequestWithEstimate,
  ProtocolType,
  StepType,
} from "@/types";
import {
  addEstimatesToTr,
  emptyEstimate,
  fetchJson,
  formatError,
  toBigInt,
  weiToString,
} from "@/utils";

/**
 * CoW Protocol (CowSwap) Aggregator Implementation.
 * NB: Native token swaps are currently disabled as they require an EVM library.
 * @see https://docs.cow.fi/cow-protocol/reference/apis/
 */
export class CowSwap extends JITAggregator {
  private static readonly GPV2_VAULT_RELAYER_ADDRESS = "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110";
  private static readonly APP_DATA_HASH =
    "0xf249b3db926aa5b5a1b18f3fec86b9cc99b9a8a99ad7e8034242d2838ae97422";

  public quoteOnly = true; // CowSwap needs an extra signature step

  constructor() {
    super(AggId.COWSWAP);
    this.routerByChainId = {
      1: "0xCowSwapGPv2", // Placeholder - CowSwap uses off-chain signing
      100: "0xCowSwapGPv2",
    };
    this.aliasByChainId = { 1: "mainnet", 100: "xdai" };
    // Approval is to the Vault, which might vary or be fetched dynamically
    this.approvalAddressByChainId = {
      1: CowSwap.GPV2_VAULT_RELAYER_ADDRESS,
      100: CowSwap.GPV2_VAULT_RELAYER_ADDRESS,
    };
  }

  /**
   * Constructs the CowSwap API root URL for a given chain ID.
   * @param chainId - The chain ID.
   * @returns The API root URL string.
   * @throws {Error} if the chain is not supported.
   */
  protected getApiRoot(chainId: number): string {
    this.ensureChainSupported(chainId);
    return `${this.baseApiUrl}/${this.aliasByChainId[chainId]}`;
  }

  /**
   * Helper to call the CowSwap API endpoints.
   * @param endpoint - API endpoint to call (e.g., "orders")
   * @param method - HTTP method
   * @param body - Optional request body
   * @param chainId - Chain ID (default: 1)
   * @returns API response
   */
  private async callApi<T = any>(
    endpoint: string,
    method: string = "GET",
    body?: any,
    chainId: number = 1,
  ): Promise<T> {
    const apiRoot = this.getApiRoot(chainId);
    if (!apiRoot) {
      throw new Error(`[CowSwap] Chain ID ${chainId} not supported`);
    }

    const fullUrl = `${apiRoot}/api/v1/${endpoint}`;

    try {
      const res = await fetchJson<T>(fullUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // CowSwap specific error check (if applicable, based on their API structure)
      // Example: if (res.errorType) throw new Error(res.description);
      return res;
    } catch (e) {
      // Rethrow standard errors
      if (e instanceof Error) {
        throw new Error(`CowSwap API request failed: ${e.message}`);
      } else {
        throw new Error(`Unknown error during CowSwap API request: ${e}`);
      }
    }
  }

  protected convertParams = (p: IBtrSwapParams): Record<string, any> => {
    const {
      input, // IToken
      output, // IToken
      inputAmountWei,
      payer,
      receiver,
    } = p;

    const isNativeSell = input.address === zeroAddress;
    const isNativeBuy = output.address === zeroAddress;

    const baseQuote: Record<string, any> = {
      sellToken: isNativeSell ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : input.address,
      buyToken: isNativeBuy ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : output.address,
      receiver: receiver ?? payer,
      from: payer,
      sellAmountBeforeFee: inputAmountWei.toString(),
      kind: "sell", // or "buy"
      partiallyFillable: false,
      signingScheme: "ethsign",
      // onchainOrder: false, // requires custom pre-sign approval
      // "buyTokenBalance": "erc20",
      // "sellTokenBalance": "erc20"
    };

    return baseQuote;
  };

  private parseToken = (
    chainId: number,
    tokenAddress: string,
    symbol?: string,
    decimals?: number,
  ): IToken => ({
    address: tokenAddress,
    symbol: symbol || "???", // Placeholder symbol
    decimals: decimals || 18,
    chainId: chainId,
    name: symbol || "Unknown Token",
    logo: "", // Placeholder logo
  });

  private parseSteps = (p: IBtrSwapParams, quote: ICowSwapQuote): ISwapStep[] => {
    // CowSwap is effectively a single step off-chain order
    return [
      {
        id: "cowswap-order",
        type: StepType.SWAP,
        description: "CowSwap Order",
        input: p.input,
        output: p.output,
        inputChainId: Number(p.input.chainId),
        outputChainId: Number(p.output.chainId || p.input.chainId),
        payer: p.payer,
        receiver: p.receiver ?? p.payer,
        protocol: {
          id: AggId.COWSWAP,
          name: "CowSwap",
          logo: "",
          type: ProtocolType.DEX, // Or appropriate type
        },
        estimates: {
          ...emptyEstimate(),
          input: weiToString(p.inputAmountWei),
          inputWei: p.inputAmountWei.toString(),
          output: weiToString(quote.buyAmount || "0"),
          outputWei: quote.buyAmount || "0",
          feeCostWei: toBigInt(quote.feeAmount || "0"),
        },
      },
    ];
  };

  private processTransactionRequest = (
    quoteData: ICowSwapQuote,
    params: IBtrSwapParams,
    steps: ISwapStep[],
  ): ITransactionRequestWithEstimate => {
    // Create the base transaction part (which is empty for CowSwap as it requires off-chain signing)
    const tx: Partial<TransactionRequest> = {
      aggId: this.id,
      chainId: Number(params.input.chainId),
      // No to, data, value for standard CowSwap flow (uses signature)
    };
    return addEstimatesToTr({
      ...tx,
      params,
      steps,
    });
  };

  public async getQuote(p: IBtrSwapParams): Promise<ICowSwapQuoteResponse | undefined> {
    p = this.overloadParams(p);
    try {
      const chainId = Number(p.input.chainId);
      const quoteRequest = this.convertParams(p);

      const response = await this.callApi<ICowSwapQuoteResponse>(
        "quote",
        "POST",
        quoteRequest,
        chainId,
      );

      if (!response?.quote?.buyAmount) {
        throw formatError("Invalid quote response from CowSwap", 400, response);
      }
      return response;
    } catch (error) {
      this.handleError(error, "[CowSwap] getQuote");
      return undefined;
    }
  }

  /**
   * CowSwap requires an off-chain signature, so this method primarily returns the quote data.
   * The actual "transaction" is the signed order message.
   */
  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const quoteResponse = await this.getQuote(p);
      if (!quoteResponse) {
        // getQuote handles error logging
        return undefined;
      }

      const steps = this.parseSteps(p, quoteResponse.quote);

      // Construct the object using processTransactionRequest
      const result = this.processTransactionRequest(quoteResponse.quote, p, steps);

      // Add the raw quote data needed for signing to customData
      result.customData = {
        ...result.customData,
        cowSwapQuote: quoteResponse.quote,
      };

      return result;
    } catch (error) {
      this.handleError(error, "[CowSwap] getTransactionRequest");
      return undefined;
    }
  }

  // getStatus remains unchanged for now
  public async getStatus(_p: IStatusParams): Promise<IStatusResponse | undefined> {
    // ... implementation ...
    return undefined; // Placeholder
  }
}

export const cowSwapAggregator = new CowSwap();
