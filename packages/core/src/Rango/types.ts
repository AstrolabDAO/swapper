// Types based on Rango API response structure
// Source: https://api.rango.exchange/basic/swagger.json

/** Represents an asset identifier used in the Rango API. */
export interface IRangoAssetIdentifier {
  blockchain: string;
  symbol: string;
  address: string | null;
}

/** Represents a token in Rango API */
export interface IRangoToken {
  blockchain: string;
  symbol: string;
  name?: string | null;
  isPopular?: boolean;
  chainId?: string;
  address: string | null;
  decimals: number;
  image?: string;
  blockchainImage?: string;
  usdPrice?: number;
  supportedSwappers?: string[];
}

/** Represents fee metadata for network gas costs */
export interface IRangoFeeMeta {
  type: string;
  gasLimit?: string;
  gasPrice?: string;
}

/** Represents a fee in Rango API response */
export interface IRangoFee {
  token: IRangoToken;
  expenseType: string;
  amount: string;
  name: string;
  meta?: IRangoFeeMeta;
}

/** Represents a swapper in Rango API */
export interface IRangoSwapper {
  id: string;
  title: string;
  logo: string;
  swapperGroup?: string;
  types?: string[];
  enabled?: boolean;
}

/** Represents the parameters for a quote request to the Rango API. */
export interface IRangoQuoteParams {
  from: string;
  to: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  slippage: string;
  chainId: string;
  disableEstimate?: boolean;
  referrerAddress?: string;
  referrerFee?: string;
  referrerCode?: string;
  swappers?: string;
  swappersExclude?: boolean;
  swapperGroups?: string;
  swappersGroupsExclude?: boolean;
  infiniteApprove?: boolean;
  contractCall?: boolean;
  messagingProtocols?: string;
  sourceContract?: string;
  destinationContract?: string;
  imMessage?: string;
  avoidNativeFee?: boolean;
  enableCentralizedSwappers?: boolean;
}

/** Represents a step in the swap path */
export interface IRangoPath {
  swapper: IRangoSwapper;
  swapperType: string;
  from: IRangoToken;
  to: IRangoToken;
  inputAmount: string;
  expectedOutput: string;
  estimatedTimeInSeconds?: number;
}

/** Structure for the transaction details within the Rango API response. */
export interface IRangoTxData {
  txTo: string;
  txData: string;
  value: string | null;
  gasLimit: string | null;
  gasPrice: string | null;
  // NB: Other fields like 'from', 'blockChain', 'sendsFromAddress', 'approvalData'
  // are often redundant or handled elsewhere in our integration.
}

/** Structure for the route details within the Rango API response. */
export interface IRangoRoute {
  outputAmount: string;
  outputAmountMin?: string;
  outputAmountUsd?: number;
  swapper?: IRangoSwapper;
  from?: IRangoToken;
  to?: IRangoToken;
  fee?: IRangoFee[];
  path?: IRangoPath[];
  // NB: The full API response contains more route details if needed.
}

/** Main structure for the Rango `/basic/swap` API response. */
export interface IRangoSwapResponse {
  route: IRangoRoute | null;
  tx: IRangoTxData | null;
  error?: string | null;
  warnings?: string[] | null;
  requestId?: string;
  resultType?: string;
}
