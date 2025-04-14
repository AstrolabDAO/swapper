import {
  AggId,
  IStatusParams,
  IStatusResponse,
  IBtrSwapParams,
  ITransactionRequestWithEstimate,
} from "./types";

import c from "@/config";
import { MAX_SLIPPAGE_BPS } from "@/constants";
import { notImplemented, validateParams, withLatency } from "@/utils";

/**
 * Base class for all DEX aggregators.
 * Provides common functionality and requires implementation of specific methods.
 */
export abstract class BaseAggregator {
  public readonly id: AggId; // Unique identifier for the aggregator
  public readonly apiKey: string; // API key, if required
  public readonly baseApiUrl: string; // Base URL for the aggregator's API
  public readonly integrator: string; // Default integrator/integrator ID
  public readonly referrer?: string | `0x${string}`; // Referrer address for fee sharing
  public readonly feeBps: number = 0; // Fee percentage in basis points (e.g., 50 for 0.5%)

  // Router addresses by chain ID, specific to the aggregator's contracts
  public routerByChainId: { [chainId: number]: string } = {};
  // Chain aliases used by the API (e.g., "eth", "1", "ethereum")
  public aliasByChainId: { [chainId: number]: string | number } = {};
  // Allowance addresses by chain ID, specific to the aggregator's contracts
  public approvalAddressByChainId: { [chainId: number]: string } = {};
  // Signature receiver addresses by chain ID for EIP 712/1271 gasless signatures, specific to the aggregator's contracts
  public signatureReceiverByChainId: { [chainId: number]: string } = {};

  constructor(aggId: AggId) {
    this.id = aggId;
    // Get configuration from config.ts
    const aggregatorConfig = c[this.id];

    if (!aggregatorConfig) {
      throw new Error(`No configuration found for aggregator ID: ${this.id}`);
    }
    if (!aggregatorConfig.apiRoot) {
      throw new Error(`[${this.id}] Missing base API URL`);
    }
    // Initialize properties from config
    this.baseApiUrl = aggregatorConfig.apiRoot;
    this.apiKey = aggregatorConfig.apiKey ?? "";
    this.integrator = aggregatorConfig.integrator ?? "astrolab";
    this.referrer = String(aggregatorConfig.referrer ?? "");
    this.feeBps = aggregatorConfig.feeBps ?? 0;
  }

  /** Default validation, checks token addresses & chain IDs */
  protected overloadParams = (p: IBtrSwapParams): IBtrSwapParams => {
    if (p.overloaded) return p;
    // Restore validation check
    if (!validateParams(p)) {
      throw new Error(`[${this.id}] Invalid quote parameters: ${JSON.stringify(p)}`);
    }
    p.output.chainId ||= p.input.chainId; // default to monochain swap
    p.receiver ||= p.payer; // default to paying address
    p.aggIds = p.aggIds
      ? p.aggIds.includes(this.id)
        ? p.aggIds
        : [...p.aggIds, this.id]
      : [this.id];
    p.maxSlippage ||= MAX_SLIPPAGE_BPS; // default to 5%
    p.overloaded = true;
    return p;
  };

  /**
   * Gets the API root URL for a given chain ID.
   * @param chainId - The chain ID.
   * @returns The API root URL or undefined if not supported.
   */
  protected getApiRoot(_chainId: number): string {
    return this.baseApiUrl;
  }

  // Implementation MUST be provided by subclasses
  protected abstract convertParams(params: IBtrSwapParams): Record<string, any> | undefined;

  // Implementation MUST be provided by subclasses
  public abstract getQuote(params: IBtrSwapParams): Promise<any | undefined>;

  /**
   * Fetches the transaction request with latency tracking
   * @param params - Parameters for the transaction
   * @returns Promise with transaction request and latency metrics
   */
  public abstract getTransactionRequest(
    params: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined>;

  /**
   * Gets the transaction request with latency tracking.
   * Calls getTransactionRequest and adds latency measurements.
   * @param params - Standard BTR Swap parameters.
   * @returns A promise resolving to the transaction request with latency.
   */
  public async getTimedTr(
    params: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    const [tr, latencyMs] = await withLatency(() => this.getTransactionRequest(params));
    if (tr) {
      tr.latencyMs = latencyMs;
    }
    return tr;
  }

  /**
   * Fetches the status of a transaction previously submitted via this aggregator.
   * Not all aggregators support or require this.
   * @param params - Parameters identifying the transaction (e.g., tx hash, chain IDs).
   * @returns A promise resolving to the transaction status, or undefined if not supported/found.
   */
  public async getStatus(_params: IStatusParams): Promise<IStatusResponse | undefined> {
    console.warn(`[${this.id}] getStatus is not implemented.`);
    return undefined; // Default implementation: not supported
  }

  /**
   * Checks if a given chain ID is supported by this aggregator.
   * A chain is considered supported if it has an entry in either routerByChainId or aliasByChainId.
   * @param chainId - The chain ID to check.
   * @returns True if the chain is supported, false otherwise.
   */
  public isChainSupported(chainId: number): boolean {
    return chainId in this.routerByChainId || chainId in this.aliasByChainId;
  }

  /**
   * Ensures that a given chain ID is supported by this aggregator.
   * @param chainId - The chain ID to check.
   * @throws {Error} if the chain is not supported.
   */
  public ensureChainSupported(chainId: number): void {
    if (!this.isChainSupported(chainId)) {
      throw new Error(`[${this.id}] Chain ${chainId} not supported`);
    }
  }

  /**
   * Standardized error handling for aggregator API calls.
   * Subclasses can override this to add custom error handling.
   * @param error - The error that occurred.
   * @param context - A string describing where/how the error occurred.
   */
  public handleError(error: unknown, context: string): void {
    // Simple error handling with standard Error objects
    console.error(
      `[${this.id}] ${context} error:`,
      error instanceof Error ? error.message : String(error),
    );

    // Additional logging for debugging if needed
    if (error && typeof error === "object" && "stack" in error) {
      console.debug(`[${this.id}] Error stack:`, (error as Error).stack);
    }
    // throw error;
  }

  /**
   * Fetches the router address for a given chain ID.
   * @param chainId - The chain ID.
   * @returns The router address, or undefined if not found.
   */
  public getRouterAddress(chainId: number): string | undefined {
    return this.routerByChainId[chainId];
  }

  /**
   * Gets the approval address for a specific chain ID.
   * Defaults to the router address if not explicitly set.
   * @param chainId - The chain ID
   * @returns The approval address or undefined if not found
   */
  public getApprovalAddress(chainId: number): string | undefined {
    // First check dedicated approval address
    if (chainId in this.approvalAddressByChainId) {
      return this.approvalAddressByChainId[chainId];
    }
    // Fallback to router address
    return this.getRouterAddress(chainId);
  }
}

/**
 * Base class for aggregators that are not yet implemented.
 * Provides default implementations that throw "not implemented" errors.
 */
export abstract class UnimplementedAggregator extends BaseAggregator {
  public baseApiUrl: string = "";

  /**
   * Converts standard parameters to aggregator-specific format.
   * @param params - BTR Swap parameters.
   * @returns Aggregator-specific parameters or undefined.
   */
  protected convertParams(_params: IBtrSwapParams): Record<string, any> | undefined {
    notImplemented("convertParams");
    return undefined;
  }

  /**
   * Gets a quote for the swap.
   * @param params - BTR Swap parameters.
   * @returns A promise resolving to the quote or undefined.
   */
  public async getQuote(_params: IBtrSwapParams): Promise<any | undefined> {
    notImplemented("getQuote");
    return undefined;
  }

  /**
   * Gets the transaction request for executing the swap.
   * @param params - BTR Swap parameters.
   * @returns A promise resolving to the transaction request or undefined.
   */
  public async getTransactionRequest(
    _params: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    notImplemented("getTransactionRequest");
    return undefined;
  }
}

/**
 * Currently ALL DISABLED due to permit/signature (EIP 712/1271) encoding dependency.
 */
export abstract class JITAggregator extends UnimplementedAggregator {}
