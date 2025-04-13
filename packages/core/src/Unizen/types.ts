// Unizen API Documentation: https://docs.unizen.io/
// API Base URL: https://zcx.com/api/zcx/trade/v1

/**
 * Parameters for requesting quotes from Unizen API
 */
export interface IUnizenQuoteParams {
  fromTokenAddress: string;
  chainId: string;
  toTokenAddress: string;
  destinationChainId?: string;
  amount: string;
  sender: string;
  receiver?: string;
  deadline?: number;
  slippage?: number;
  excludedDexes?: Record<string, string[]>;
  priceImpactProtectionPercentage?: number;
  isSplit?: boolean;
  disableEstimate?: boolean;
}

/**
 * Token information in Unizen responses
 */
export interface IUnizenToken {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  chainId: number;
  buyTax: number;
  sellTax: number;
  priceInUsd: number;
}

/**
 * Protocol information in trade routes
 */
export interface IUnizenProtocol {
  name: string;
  logo: string;
  route: string[];
  percentage: number;
}

/**
 * Transaction call data
 */
export interface IUnizenTransactionCall {
  targetExchange: string;
  sellToken: string;
  buyToken: string;
  amountDelta: string;
  amount: string;
  data: string;
}

/**
 * Transaction info data
 */
export interface IUnizenTransactionInfo {
  feeReceiver: string;
  feePercent: string;
  sharePercent: string;
  srcToken: string;
  dstToken: string;
  deadline: number;
  slippage: number;
  tokenHasTaxes: boolean;
  path: string[];
  tradeType: number;
  amountIn: string;
  amountOutMin: string;
  actualQuote: string;
  uuid: string;
  apiId: string;
  userPSFee: number;
}

/**
 * Transaction data structure for single-chain swaps
 */
export interface IUnizenTransactionData {
  info: IUnizenTransactionInfo;
  call: IUnizenTransactionCall[];
}

/**
 * Cross-chain transaction parameters
 */
export interface IUnizenCrossChainTransactionParams {
  dstChain: number;
  srcPool: number;
  dstPool: number;
  isFromNative: boolean;
  srcToken: string;
  amount: string;
  nativeFee: string;
  gasDstChain: number;
  receiver: string;
  dstToken: string;
  actualQuote: string;
  minQuote: string;
  uuid: string;
  userPSFee: number;
  apiId: string;
  tradeType: number;
}

/**
 * Transaction data structure for cross-chain swaps
 */
export interface IUnizenCrossChainTransactionData {
  srcCalls: IUnizenTransactionCall[];
  dstCalls: IUnizenTransactionCall[];
  params: IUnizenCrossChainTransactionParams;
  nativeFee: string;
  tradeProtocol: string;
}

/**
 * Bridge/provider information
 */
export interface IUnizenProviderInfo {
  name: string;
  logo: string;
  contractVersion: string;
  website: string;
  docsLink: string;
  description: string;
}

/**
 * Trade parameters used in cross-chain quotes
 */
export interface IUnizenTradeParams {
  tokenIn: string;
  tokenOut: string;
  sender: string;
  slippage: number;
  srcChainId: number;
  dstChainId: number;
  receiver: string;
  inNative: boolean;
  outNative: boolean;
  deadline: number;
  tokenInfo: IUnizenToken[];
  amount: string;
  uuid: string;
  userPSFee: number;
  uuidPercentage: number;
  excludeeDexList: any;
  chainIdToCurve: any;
  srcChainTokenHasTaxes: boolean;
  dstChainTokenHasTaxes: boolean;
}

/**
 * Response for single-chain quote requests
 */
export interface IUnizenQuoteResult {
  fromTokenAmount: string;
  toTokenAmount: string;
  toTokenAmountWithoutFee: string;
  deltaAmount: string;
  tokenFrom: IUnizenToken;
  tokenTo: IUnizenToken;
  tradeType: number;
  protocol: IUnizenProtocol[];
  transactionData: IUnizenTransactionData;
  nativeValue: string;
  contractVersion: string;
  gasPrice?: string;
  estimateGas?: string;
  estimateGasError?: string;
  gasCostInUSD?: number;
  slippage: number;
  priceImpact: number;
}

/**
 * Response for cross-chain quote requests
 */
export interface IUnizenCrossQuoteResult {
  srcTrade: IUnizenQuoteResult;
  dstTrade: IUnizenQuoteResult;
  transactionData: IUnizenCrossChainTransactionData;
  nativeValue: string;
  nativeFee: string;
  processingTime: number;
  tradeProtocol: string;
  crossChainTradeQuotesType: string;
  sourceChainId: number;
  destinationChainId: number;
  uuid: string;
  apiKeyUuid: string;
  contractVersion: string;
  tradeParams: IUnizenTradeParams;
  providerInfo: IUnizenProviderInfo;
  slippage: number;
  priceImpact: number;
}

/**
 * Response for swap data requests
 */
export interface IUnizenSwapData {
  data: string;
  contractVersion: string;
  estimateGas: string;
  estimateGasError: string;
  nativeValue: string;
  insufficientFunds: boolean;
  insufficientGas: boolean;
  insufficientAllowance: boolean;
  allowance: string;
  gasPrice: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}
