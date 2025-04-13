/**
 * Parameters for the 0x API v2 `/swap/allowance-holder/price` or `/swap/allowance-holder/quote` endpoints.
 */
export interface I0xQuoteParams {
  chainId: number;
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  // buyAmount?: string; // Obsolete in v2
  taker?: string;
  slippageBps?: number;
  integrator?: string;
  swapFeeRecipient?: string;
  swapFeeBps?: number;
  swapFeeToken?: string;
  tradeSurplusRecipient?: string;
  skipValidation?: boolean;
  excludedSources?: string;
  includedSources?: string;
  enableRfq?: boolean;
}

/**
 * Fee structure in the quote response
 */
export interface I0xFee {
  amount: string;
  token: string;
  type: string;
}

/**
 * Issues that may affect transaction execution
 */
export interface I0xIssues {
  allowance: {
    token: string;
    spender: string;
    amount: string;
  } | null;
  balance: {
    token: string;
    amount: string;
  } | null;
  simulationIncomplete: boolean;
  invalidSourcesPassed: string[];
}

/**
 * Fill information in the route
 */
export interface I0xFill {
  from: string;
  to: string;
  source: string;
  proportionBps: string;
}

/**
 * Token information in the route
 */
export interface I0xToken {
  address: string;
  symbol: string;
}

/**
 * Transaction details for execution
 */
export interface I0xTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
}

/**
 * Price response from the 0x API v2 `/swap/allowance-holder/price` endpoint.
 */
export interface I0xPriceResponse {
  blockNumber: string;
  sellAmount: string;
  buyAmount: string;
  sellToken: string;
  buyToken: string;
  fees: {
    integratorFee: I0xFee | null;
    zeroExFee: I0xFee | null;
    gasFee: I0xFee | null;
  };
  liquidityAvailable: boolean;
  priceImpactBps: string;
  sources: {
    name: string;
    proportionBps: string;
  }[];
}

/**
 * Quote response from the 0x API v2 `/swap/allowance-holder/quote` endpoint.
 * Extends the price response with transaction information.
 */
export interface I0xQuoteResponse extends I0xPriceResponse {
  issues: I0xIssues;
  minBuyAmount: string;
  route: {
    fills: I0xFill[];
    tokens: I0xToken[];
  };
  transaction: I0xTransaction;
}
