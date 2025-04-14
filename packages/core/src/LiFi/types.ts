import { TransactionRequest } from "@/types";

/** Optional custom contract call parameters for Li.FI routes. */
export interface ILifiContractCall {
  fromAmount?: string;
  fromTokenAddress?: string;
  toContractAddress?: string;
  toContractCallData?: string;
  toContractGasLimit?: string;
}

/** Interface for gas cost details */
export interface IGasCost {
  amount: string;
  amountUSD: string;
  token: {
    address: string;
    decimals: number;
    symbol: string;
    chainId?: number;
    name?: string;
    coinKey?: string;
    logoURI?: string;
    priceUSD?: string;
  };
}

/** Interface for fee cost details */
export interface IFeeCost {
  name: string;
  description: string;
  percentage: string;
  amount: string;
  amountUSD: string;
  token: {
    address: string;
    decimals: number;
    symbol: string;
    chainId?: number;
    name?: string;
    coinKey?: string;
    logoURI?: string;
    priceUSD?: string;
  };
}

/** Parameters for requesting a quote from the Li.FI API. */
export interface ILifiQuoteParams {
  fromToken: string;
  fromChain: string | number;
  toToken: string;
  toChain: string | number;
  toAmount?: string;
  fromAmount: number | string;
  fromAddress: string;
  toAddress?: string;
  order?: "CHEAPEST" | "FASTEST" | "SAFEST" | "RECOMMENDED";
  slippage?: number;
  maxPriceImpact?: number;
  integrator?: string;
  referrer?: string;
  allowDestinationCall?: boolean;
  allowBridges?: string[];
  allowExchanges?: string[];
  denyBridges?: string[];
  denyExchanges?: string[];
  preferBridges?: string[];
  preferExchanges?: string[];
  contractCalls?: ILifiContractCall[];
}

/** Parameters for requesting gas suggestions (optional). */
export interface ILifiGasSuggestionParams {
  fromToken?: string;
  fromChain?: string | number;
  toChain?: string | number;
  toToken?: string;
  chainId: number;
}

/** Represents a token within the Li.FI API context. */
export interface ILifiToken {
  address: string;
  decimals: number;
  symbol: string;
  chainId: number;
  coinKey?: string;
  name: string;
  logoURI?: string;
  priceUSD?: string;
}

/** Represents bid data, potentially related to RFQ or specific protocols used internally by Li.FI. */
export interface ILifiBid {
  user: string;
  router: string;
  initiator: string;
  sendingChainId: number;
  sendingAssetId: string;
  amount: string;
  receivingChainId: number;
  receivingAssetId: string;
  amountReceived: string;
  receivingAddress: string;
  transactionId: string;
  expiry: number;
  callDataHash: string;
  callTo: string;
  encryptedCallData: string;
  sendingChainTxManagerAddress: string;
  receivingChainTxManagerAddress: string;
  bidExpiry: number;
  bidSignature: string;
  gasFeeInReceivingToken: string;
  totalFee: string;
  metaTxRelayerFee: string;
  routerFee: string;
}

/** Wrapper for bid data within a step. */
export interface ILifiData {
  bid: ILifiBid;
}

/** Represents estimated costs and outcomes for a Li.FI swap step or route. */
export interface ILifiEstimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: string;
  feeCosts: IFeeCost[];
  gasCosts: IGasCost[];
}

/** Represents the core action within a Li.FI step (e.g., swap, bridge). */
export interface ILifiAction {
  fromChainId: number;
  fromAmount: string;
  toChainId: number;
  fromToken: ILifiToken;
  toToken: ILifiToken;
  slippage?: number;
  fromAddress: string;
  toAddress: string;
}

/** Represents a protocol used in a Li.FI route. */
export interface ILifiTool {
  key: string;
  name: string;
  logoURI: string;
}

/** Represents a single step within a Li.FI route. */
export interface ILifiSwapStep {
  id: string;
  type: string;
  toolDetails: ILifiTool;
  tool: string;
  action: ILifiAction;
  data?: ILifiData;
  integrator?: string;
  referrer?: string;
  execution?: string;
  estimate: ILifiEstimate;
  transactionRequest?: TransactionRequest;
}

/** Insurance details for a Li.FI route. */
export interface ILifiInsurance {
  state: string;
  feeAmountUsd: string;
}

/** Represents a complete route found by the Li.FI API. */
export interface ILifiRoute {
  id: string;
  containsSwitchChain: boolean;
  fromAmount: string;
  fromAmountUSD: string;
  fromChainId: number;
  fromToken: ILifiToken;
  gasCostUSD: string;
  insurance: ILifiInsurance;
  steps: ILifiSwapStep[];
  tags: ("CHEAPEST" | "FASTEST" | "RECOMMENDED")[];
  toAmount: string;
  toAmountMin: string;
  toAmountUSD: string;
  toChainId: number;
  toToken: ILifiToken;
}

/** Response structure for the Li.FI quote endpoint. */
export interface ILifiQuote {
  routes: ILifiRoute[];
  transactionRequest?: TransactionRequest;
}

/** Represents the best quote selected from multiple options. */
export interface ILifiBestQuote extends ILifiSwapStep {
  transactionRequest: TransactionRequest;
  estimate: ILifiEstimate;
  includedSteps?: ILifiSwapStep[];
}

/** Detailed token information for transaction status. */
export interface ILifiTokenDetails {
  address: string;
  chainId: number;
  symbol: string;
  decimals: number;
  name: string;
  coinKey: string;
  logoURI: string;
  priceUSD: string;
}

/** Details about the sending side of a Li.FI transaction. */
export interface ILifiSendingDetails {
  txHash: string;
  txLink: string;
  amount: string;
  token: ILifiTokenDetails;
  chainId: number;
  gasPrice: string;
  gasUsed: string;
  gasToken: ILifiTokenDetails;
  gasAmount: string;
  gasAmountUSD: string;
  amountUSD: string;
  value: string;
  timestamp: number;
}

/** Details about the receiving side of a Li.FI transaction. */
export interface ILifiReceivingDetails {
  txHash: string;
  txLink: string;
  amount: string;
  token: ILifiTokenDetails;
  chainId: number;
  gasPrice: string;
  gasUsed: string;
  gasToken: ILifiTokenDetails;
  gasAmount: string;
  gasAmountUSD: string;
  amountUSD: string;
  value: string;
  timestamp: number;
}

/** Metadata associated with a Li.FI transaction. */
export interface ILifiMetadata {
  integrator: string;
}

/** Represents the status of a Li.FI transaction. */
export interface ILifiTransactionStatus {
  transactionId: string;
  sending: ILifiSendingDetails;
  receiving: ILifiReceivingDetails;
  lifiExplorerLink: string;
  fromAddress: string;
  toAddress: string;
  tool: string;
  status: string;
  substatus: string;
  substatusMessage: string;
  metadata: ILifiMetadata;
  bridgeExplorerLink: string;
}
