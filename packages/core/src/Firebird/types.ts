/**
 * Parameters for the Firebird API `/quote` endpoint.
 */
export interface IFirebirdQuoteParams {
  chainId: number;
  from: string;
  to: string;
  amount: string;
  receiver?: string;
  slippage?: number;
  source?: string;
  ref?: string | number;
  // TODO: Consider adding optional params like excludeSources, includeSources based on full Firebird docs.
}

/**
 * Payload for the Firebird API `/encode` endpoint.
 * NB: Firebird's `/encode` endpoint appears to accept the *entire response object* from the `/quote` endpoint as its payload.
 */
export type IFirebirdEncodePayload = IFirebirdQuoteResponse;

/**
 * Structure of the `maxReturn` object within the Firebird quote response.
 */
export interface IFirebirdMaxReturn {
  totalTo: string;
  totalGas: string;
}

/**
 * Structure of the main `quoteData` object within the Firebird quote response.
 */
export interface IFirebirdQuoteData {
  maxReturn: IFirebirdMaxReturn;
}

/**
 * Overall structure of the response from the Firebird API `/quote` endpoint.
 */
export interface IFirebirdQuoteResponse {
  quoteData: IFirebirdQuoteData;
}

/**
 * Structure of the `encodedData` object within the Firebird `/encode` response.
 */
export interface IFirebirdEncodedData {
  router: string;
  data: string;
  value?: string;
}

/**
 * Overall structure of the response from the Firebird API `/encode` endpoint.
 */
export interface IFirebirdEncodeResponse {
  encodedData: IFirebirdEncodedData;
}

/**
 * Optional internal interface combining quote and encode data for convenience.
 */
export interface IFirebirdFullQuote {
  quoteResponse: IFirebirdQuoteResponse;
  encodeResponse: IFirebirdEncodeResponse;
  rawGasEstimate?: string;
}
