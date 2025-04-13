import { ChainType, TransactionRequest } from "@/types"; // Import shared types

/** Enum defining different types of custom calls supported by Squid. */
export enum SquidCallType {
  DEFAULT = 0,
  FULL_TOKEN_BALANCE = 1,
  FULL_NATIVE_BALANCE = 2,
  COLLECT_TOKEN_BALANCE = 3,
}

// Re-export ChainType if it's specific to Squid's usage or context, otherwise use the one from @/types directly.
// export { ChainType } from "@/types"; // If it's truly shared

/** Represents a post-swap hook configuration for Squid. */
export interface IPostHook {
  chainType: ChainType;
  calls: ISquidCustomCall[];
}

/** Represents a single custom contract call within a Squid route or hook. */
export interface ISquidCustomCall {
  chainType: ChainType;
  callType: SquidCallType;
  target: string;
  value: string;
  callData: string;
  payload: {
    tokenAddress: string;
    inputPos: number;
  };
  estimatedGas: string;
}

/** Parameters for quote requests to the Squid API. */
export interface IQuoteParams {
  enableBoost: boolean;
  toChain: string | number;
  toToken: string;
  fromChain: string | number;
  fromToken: string;
  fromAddress: string;
  fromAmount: number | string;
  slippage: number | string;
  slippageConfig?: {
    autoMode: number;
  };
  toAddress: string;
  quoteOnly?: boolean;
  customContractCalls?: any[];
  postHook?: IPostHook;
  prefer?: string[];
  receiveGasOnDestination?: boolean;
  integrator?: string;
}

/** Represents a token within the Squid API context. */
export interface ISquidToken {
  type: string;
  chainId: string;
  address?: string;
  name: string;
  symbol: string;
  axelarNetworkSymbol?: string;
  decimals: number;
  logoURI: string;
  coingeckoId: string;
  subGraphId: string;
  subGraphOnly?: boolean;
  usdPrice: number;
}

/** Custom data associated with a swap action, like pool fees. */
export interface ISquidCustomData {
  poolFees: number[];
  swapGasEstimate: string;
}

/** Represents a swap action within a Squid route estimate. */
export interface ISquidSwap {
  chainId: string;
  dex: string;
  factory: string;
  quoterV2: string;
  swapRouter: string;
  path: string[];
  slippage: number;
  custom: ISquidCustomData;
  target: string;
}

/** Represents a bridge call action within a Squid route estimate. */
export interface ISquidBridgeCall {
  name: string;
  provider: string;
  type: string;
}

/** Represents a single action (swap or bridge) within a Squid route estimate. */
export interface ISquidAction {
  type: string;
  chainType: string;
  data: ISquidSwap | ISquidBridgeCall;
  fromChain: string;
  toChain: string;
  fromToken: ISquidToken;
  toToken: ISquidToken;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  exchangeRate: string;
  priceImpact: string;
  stage: number;
  provider: string;
  description: string;
  logoURI: string;
}

/** Represents a fee cost component within a Squid estimate. */
export interface ISquidFeeCosts {
  amount: string;
  amountUsd: string;
  description: string;
  gasLimit: string;
  gasMultiplier: string;
  name: string;
  token: ISquidToken;
}

/** Represents a gas cost component within a Squid estimate. */
export interface ISquidGasCosts {
  amount: string;
  amountUsd: string;
  gasLimit: string;
  name: string;
  token: ISquidToken;
  type: string;
}

/** Represents the overall estimate for a Squid route. */
export interface ISquidEstimate {
  fromAmount: string;
  fromAmountUSD: string;
  sendAmount: string;
  toAmount: string;
  toAmountUSD: string;
  actions: ISquidAction[];
  feeCosts: ISquidFeeCosts[];
  gasCosts: ISquidGasCosts[];
  exchangeRate: string;
  estimatedRouteDuration: number;
  aggregatePriceImpact: string;
  aggregateSlippage: string;
  isBoostSupported: boolean;
  toToken: ISquidToken;
  fromToken: ISquidToken;
}

/** Extends the shared TransactionRequest with Squid-specific fields. */
export interface ISquidTransactionRequest extends TransactionRequest {
  routeType: string;
  target: string;
  targetAddress?: string;
}

/** Represents a complete route returned by the Squid API, including estimate and transaction details. */
export interface ISquidRoute {
  estimate: ISquidEstimate;
  params: IQuoteParams;
  transactionRequest: ISquidTransactionRequest;
}

/** Response structure for the Squid quote endpoint. */
export interface ISquidQuoteResponse {
  route: ISquidRoute;
}

/** Parameters for status check requests to the Squid API. */
export interface IStatusParams {
  transactionId: string;
  fromChainId?: string;
  toChainId?: string;
  integrator?: string;
}

/** Information about a transaction on a specific chain within the Squid status response. */
export interface ISquidChainInfo {
  transactionId: string;
  blockNumber: number;
  callEventStatus: string;
  callEventLog: any[];
  chainData: any;
  transactionUrl: string;
}

/** Breakdown of time spent in different stages of a cross-chain transaction via Squid. */
export interface ISquidTimeSpent {
  call_express_executed: number;
  express_executed_confirm: number;
  call_confirm: number;
  call_approved: number;
  express_executed_approved: number;
  total: number;
  approved_executed: number;
}

/** Represents an error encountered during a transaction tracked by Squid. */
export interface ISquidTransactionError {
  message: string;
  txHash: string;
  chain: string;
}

/** Response structure for the Squid transaction status endpoint. */
export interface ISquidTransactionStatus {
  id: string;
  status: string;
  gasStatus: string;
  isGMPTransaction: boolean;
  axelarTransactionUrl: string;
  fromChain: ISquidChainInfo;
  toChain: ISquidChainInfo;
  timeSpent: ISquidTimeSpent;
  error?: ISquidTransactionError;
  squidTransactionStatus: string;
}
