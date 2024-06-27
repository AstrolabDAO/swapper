export interface IQuoteParams {
    fromTokenAddress: string;
    chainId: string;
    toTokenAddress: string;
    destinationChainId?: string;
    amount: string;
    sender: string;
    receiver?: string;
    deadline?: number;
    slippage?: number;
    excludedDexes?: Map<string, string[]>;
    priceImpactProtectionPercentage?: number;   
    isSplit?: boolean;
    disableEstimate?: boolean;
}

export interface IToken {
  name: string;
  symbol: string;
  decimals: number;
  contractAddress: string;
  chainId: number;
  buyTax: number;
  sellTax: number;
}

export interface IQuoteResult {
  fromTokenAmount: string;
  toTokenAmount: string;
  deltaAmount: string;
  tokenFrom: IToken;
  tokenTo: IToken;
  tradeType: number;
  protocol: QuoteProtocol[];
  transactionData: TransactionData;
  nativeValue: string;
  contractVersion: string;
  gasPrice: string;
  estimateGas: string;
  estimateGasError?: string;
}

export interface ICrossQuoteResult {
  srcTrade: IQuoteResult;
  dstTrade: IQuoteResult;
  transactionData: CrossChainTransactionData;
  nativeValue: string;
  nativeFee: string;
  processingTime: number;
  tradeProtocol: string;
  crossChainTradeQuotesType: string;
  sourceChainId: number;
  destinationChainId: number,
  uuid:string;
  apiKeyUuid: string;
  contractVersion: string;
  tradeParams: TradeParams;
  providerInfo: ProviderInfo;
}

export type QuoteProtocol = {
  name: string;
  logo: string;
  route: string[];
  percentage: number;
}

export type TransactionData = {
  info: TransactionDataInfo;
  call: TransactionDataCall[];
}

export type TransactionDataInfo = {
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

export type CrossChainTransactionData = {
    srcCalls: TransactionDataCall[];
    dstCalls: TransactionDataCall[];
    params: CrossChainTransactionDataParams;
    nativeFee: string;
    tradeProtocol: string;
}

export type CrossChainTransactionDataParams = {
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

export type TransactionDataCall = {
  targetExchange: string;
  sellToken: string;
  buyToken: string;
  amountDelta: string;
  amount: string;
  data: string;
}

export type ProviderInfo = {
  name: string;
  logo: string;
  contractVersion: string;
  website: string;
  docsLink: string;
  description: string;
}

export type TradeParams = {
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
    tokenInfo: IToken[];
    amount: string;
    uuid: string;
    userPSFee: number;
    uuidPercentage: number;
    excludeeDexList: any;
    chainIdToCurve: any;
    srcChainTokenHasTaxes: boolean;
    dstChainTokenHasTaxes: boolean;
}

export type SwapData = {
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