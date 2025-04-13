/** Structure for the quote object within the CowSwap quote response. */
export interface ICowSwapQuote {
  sellToken: string;
  buyToken: string;
  receiver: string;
  sellAmount: string;
  buyAmount: string;
  validTo: number;
  appData: string;
  feeAmount: string;
  kind: string;
  partiallyFillable: boolean;
  // Add other potential fields if known, e.g., sellTokenBalance, buyTokenBalance
}

/** Structure for the response from the CowSwap /quote endpoint. */
export interface ICowSwapQuoteResponse {
  quote: ICowSwapQuote;
  id: string;
  // Add other potential top-level fields if known
}

export {};
