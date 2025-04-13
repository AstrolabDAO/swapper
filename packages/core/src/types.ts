/** Basic interface for objects that can be reliably converted to a string. */
export interface Stringifiable {
  toString(): string;
}

/** Enumeration of supported DEX aggregators. */
export enum AggId {
  // Meta-Aggregators (Order matches src/index.ts imports)
  LIFI = "LIFI",
  SOCKET = "SOCKET",
  SQUID = "SQUID",
  RANGO = "RANGO",
  UNIZEN = "UNIZEN",
  ROCKETX = "ROCKETX", // Currently commented out in src/index.ts

  // Passive Liquidity Aggregators (Order matches src/index.ts imports)
  ONE_INCH = "ONE_INCH",
  ZERO_X = "ZERO_X",
  PARASWAP = "PARASWAP",
  ODOS = "ODOS",
  KYBERSWAP = "KYBERSWAP",
  OPENOCEAN = "OPENOCEAN",
  FIREBIRD = "FIREBIRD",
  BEBOP = "BEBOP", // Currently commented out in src/index.ts

  // JIT / Intent-Based / RFQ (Order partially matches src/index.ts commented imports)
  // TODO: Implement full support for gasless/intent types
  DEBRIDGE = "DEBRIDGE",
  COWSWAP = "COWSWAP",
  HASHFLOW = "HASHFLOW",
  AIRSWAP = "AIRSWAP",
  ONE_INCH_FUSION = "ONE_INCH_FUSION",
  PARASWAP_DELTA = "PARASWAP_DELTA",
  UNIZEN_GASLESS = "UNIZEN_GASLESS",
}

/** Supported blockchain types. */
export enum ChainType {
  EVM = "EVM",
  COSMOS = "COSMOS",
  SOLANA = "SOLANA",
  SUI = "SUI",
  APTOS = "APTOS",
}

/** Supported protocol types. */
export enum ProtocolType {
  DEX = "DEX",
  CEX = "CEX",
  OTC = "OTC",
  AGGREGATOR = "AGGREGATOR",
  BRIDGE = "BRIDGE",
}

/** Supported step types. */
export enum StepType {
  SWAP = "SWAP",
  BRIDGE = "BRIDGE",
  CROSS_CHAIN_SWAP = "CROSS_CHAIN_SWAP", // swap + bridge or bridge + swap
  CONTRACT_CALL = "CONTRACT_CALL",
  TRANSFER = "TRANSFER", // eg. fee payment, rerouting...
}

/** Standardized status codes for swap operations. */
export enum OpStatus {
  WAITING = "WAITING",
  PENDING = "PENDING",
  DONE = "DONE",
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
  NEEDS_GAS = "NEEDS_GAS",
  ONGOING = "ON_GOING", // Consistent casing
  PARTIAL_SUCCESS = "PARTIAL_SUCCESS",
  NOT_FOUND = "NOT_FOUND",
}

export enum SerializationMode {
  JSON = "JSON",
  CSV = "CSV",
  TABLE = "TABLE",
}

export enum DisplayMode {
  // full transaction request with estimates
  ALL = "ALL",
  BEST = "BEST",
  // only built transaction
  ALL_COMPACT = "ALL_COMPACT", // { nonce, value, to, data } json or nonce,value,to,data csv
  BEST_COMPACT = "BEST_COMPACT", // same as above, array
  // ranked transaction request with estimates
  RANK = "RANK",
}

/** Tuple type representing basic token information: [address, symbol, decimals] */
export type TokenInfoTuple = [address: string, symbol: string, decimals?: number];

/** Common token representation used across different aggregators. */
export interface IToken {
  chainId: number;
  address?: string;
  name: string;
  symbol?: string;
  decimals: number;
  priceUsd?: string;
  logo?: string; // svg or uri
}

/** Details about the specific tool (protocol/DEX) used in a swap step. */
export interface IProtocol {
  id: string;
  name: string;
  description?: string;
  type?: ProtocolType;
  logo?: string; // svg or uri
}

/** Represents a blockchain transaction request, compatible with ethers.js/viem structures. */
export type TransactionRequest = {
  to?: string;
  from?: string;
  nonce?: bigint | string | Stringifiable;
  gasLimit?: bigint | string | Stringifiable;
  gasPrice?: bigint | string | Stringifiable;
  data?: Uint8Array | string;
  value?: bigint | string | Stringifiable;
  chainId?: number;
  type?: number;
  maxPriorityFeePerGas?: bigint | string | Stringifiable;
  maxFeePerGas?: bigint | string | Stringifiable;
  // add-ons
  aggId?: AggId;
  approvalAddress?: string;
  customData?: Record<string, any>;
  latencyMs?: number; // Time taken by the aggregator to respond
};

/** Represents a custom contract call to be potentially included in a swap route. */
export interface ICustomContractCall {
  toAddress?: string;
  callData: string;
  gasLimit?: string;
  inputPos?: number;
}

/** Core parameters required for fetching a swap quote or transaction. */
export interface IBtrSwapParams {
  aggIds?: AggId[];
  input: IToken;
  output: IToken;
  inputAmountWei: string | number | bigint | Stringifiable;
  outputAmountWei?: string | number | bigint | Stringifiable; // niche, use input instead
  payer: string;
  testPayer?: string; // for testing, default to payer
  receiver?: string; // default to payer
  integrator?: string; // project id / integrator id
  referrer?: string; // referrer address or code
  maxSlippage?: number; // default to 500 (5%)
  customContractCalls?: ICustomContractCall[];
  bridgeBlacklist?: string[]; // exclude bridges
  exchangeBlacklist?: string[]; // exclude exchanges
  sendGas?: boolean; // default to false
  overloaded?: boolean; // default to false
  expiryMs?: number; // default to 5s
}

/** Extended parameters for CLI operations. */
export interface IBtrSwapCliParams extends IBtrSwapParams {
  apiKeys?: Record<string, string>;
  integratorIds?: Record<string, string>;
  referrerCodes?: Record<string, string | number>;
  feesBps?: Record<string, number>;
  displayModes?: DisplayMode[];
  serializationMode?: SerializationMode;
  envFile?: string;
  executable?: string;
}

/** Estimate details for a swap step. */
export interface ISwapEstimate {
  exchangeRate?: string | number;
  input?: string | number; // decimal
  inputWei?: string | bigint;
  output?: string | number; // decimal
  outputWei?: string | bigint;
  slippage?: string | number; // default to 0
  priceImpact?: string | number; // default to 0
}

/** Consolidated gas and fee estimates for a transaction. */
export interface ICostEstimate {
  gasCostUsd: number;
  gasCostWei: bigint;
  feeCostUsd: number;
  feeCostWei: bigint;
  feeToken?: IToken; // by default, the fee is in the same token as the input token
}

/** Represents a single step within a complex swap route (e.g., swap, bridge). */
export interface ISwapStep {
  id?: string;
  type: StepType;
  description?: string;
  input?: IToken;
  output?: IToken;
  inputChainId?: number;
  outputChainId?: number;
  payer?: string;
  receiver?: string;
  protocol?: IProtocol;
  estimates?: ISwapEstimate & ICostEstimate;
}

/** Extends the base TransactionRequest with swap-specific estimates and details. */
export interface ITransactionRequestWithEstimate extends TransactionRequest {
  params: IBtrSwapParams;
  steps: ISwapStep[]; // should at least have one step
  globalEstimates: ISwapEstimate & ICostEstimate; // if one step, this is the step's estimates
  latencyMs: number; // Response time from the aggregator in milliseconds
}

/** Performance metrics for a quote/transaction request. */
export interface IQuotePerformance {
  aggId: string;
  exchangeRate: number;
  output: number;
  gasCostUsd: number;
  feeCostUsd: number;
  latencyMs: number;
  steps: number;
  protocols: string[];
}

/** Parameters for fetching the status of a transaction. */
export interface IStatusParams {
  aggId?: AggId;
  inputChainId?: string;
  outputChainId?: string;
  txHash?: string;
  txId: string;
}

/** Response structure for transaction status requests. */
export interface IStatusResponse {
  id: string;
  status: OpStatus;
  txHash?: string;
  receivingTx?: string;
  sendingTx?: string;
  substatus?: string;
  substatusMessage?: string;
}
