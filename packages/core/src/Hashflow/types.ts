/** Represents the `quoteData` object returned by the Hashflow RFQ API. */
export interface IHashflowQuoteData {
  pool: string;
  eoa?: string;
  trader: string;
  effectiveTrader?: string;
  baseToken: string;
  quoteToken: string;
  baseTokenAmount: string;
  quoteTokenAmount: string;
  quoteExpiry: number;
  nonce: string;
  txid: string;
}

/** Represents the successful response structure from the Hashflow RFQ API (`/taker/v2/rfq`). */
export interface IHashflowRfqResponse {
  status: string;
  quoteData: IHashflowQuoteData;
  signature: string;
  gasEstimate: string;
}

/** Structure formatted for encoding the `tradeSingleHop` function call based on API response. */
export interface IFormattedTradeQuote {
  pool: string;
  externalAccount: string;
  trader: string;
  effectiveTrader: string;
  baseToken: string;
  quoteToken: string;
  effectiveBaseTokenAmount: string;
  maxBaseTokenAmount: string;
  maxQuoteTokenAmount: string;
  quoteExpiry: number;
  nonce: string;
  txid: string; // `0x${string}`
  signature: string; // `0x${string}`
}

export {};
