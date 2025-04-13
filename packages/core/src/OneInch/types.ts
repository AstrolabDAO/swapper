import { TransactionRequest } from "@/types"; // Import shared TransactionRequest

/** Represents the core data returned by the 1inch swap API. */
export interface IOneInchRouteData {
  toAmount: string | number;
  tx: TransactionRequest;
}

/** Response structure from the 1inch quote API endpoint */
export interface IOneInchQuoteApiResponse {
  dstAmount: string;
  gas: string;
}

/** Response structure from the 1inch swap API endpoint */
export interface IOneInchSwapApiResponse {
  tx: TransactionRequest;
  dstAmount: string;
}
