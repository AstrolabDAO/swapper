// Based on: https://documenter.getpostman.com/view/31745911/2sAYJ7feNK#589f43a0-5859-4e65-9dcf-f675dfb17e59

/**
 * Request payload for RocketX `/api/v1/rocketx/get/quotation` endpoint.
 */
export interface IRocketXQuoteRequest {
  fromAddress: string;
  fromToken: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
  };
  toToken: {
    address: string;
    chainId: number;
    decimals: number;
    symbol: string;
  };
  fromAmount: string;
  slippage?: number;
  enableMetaTxn?: boolean;
  receiverAddress?: string;
}

/**
 * Expected structure of a successful response from RocketX `/api/v1/rocketx/get/quotation` endpoint.
 */
export interface IRocketXQuoteResponse {
  status: number;
  success: boolean;
  message?: string;
  result?: {
    routeId: string;
    fromToken: {
      address: string;
      chainId: number;
      decimals: number;
      symbol: string;
      logoURI?: string;
      name?: string;
    };
    toToken: {
      address: string;
      chainId: number;
      decimals: number;
      symbol: string;
      logoURI?: string;
      name?: string;
    };
    fromAmount: string;
    toAmount: string;
    estimatedGas: string;
    minReceived?: string;
    executionDuration?: number;
    serviceFee: {
      percentage?: string;
      amount?: string;
      // ... other potential fee details
    };
    aggregator?: {
      name: string;
      logo?: string;
    };
    tool?: {
      name: string;
      logo?: string;
    };
    // ... other potential fields from the API response
  };
  error?: {
    code: number;
    message: string;
  };
}
