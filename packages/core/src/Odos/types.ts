/**
 * Interface for Odos quote request parameters
 */
export interface IOdosQuoteParams {
  gasPrice?: string;
  chainId: string | number;
  inputTokens: { tokenAddress: string; amount: string }[];
  outputTokens: { tokenAddress: string; proportion: number }[];
  userAddr: string;
  recipient?: string;
  slippageLimitPercent: number;
  referralCode: number;
  disableRFQs?: boolean;
  compact?: boolean;
}

/**
 * Interface for Odos quote response
 */
export interface IOdosQuoteResponse {
  pathId: string;
  blockNumber: string;
  gasEstimate: string;
  gasEstimateValue: string;
  inputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
  outputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
}

/**
 * Interface for Odos assemble response
 */
export interface IOdosAssembleResponse {
  transaction: {
    from: string;
    to: string;
    data: string;
    value: string;
  };
  inputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
  outputTokens: Array<{
    tokenAddress: string;
    amount: string;
  }>;
}

export {};
