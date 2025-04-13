/** Structure containing gas price suggestions from OpenOcean. */
export interface IOpenOceanGasPriceData {
  instant?: string | number;
  /** Suggested gas price for fast confirmation.
   * Can be a legacy gasPrice (string/number) or an EIP-1559 object. */
  fast?:
    | string
    | number
    | {
        maxFeePerGas?: string | number;
        maxPriorityFeePerGas?: string | number;
      };
  standard?: string | number;
  slow?: string | number;
}

/** Response structure for the OpenOcean `/gas-price` endpoint. */
export interface IOpenOceanGasPriceResponse {
  code: number;
  data?: IOpenOceanGasPriceData;
  message?: string;
}

/** Structure containing the details of a swap quote from OpenOcean. */
export interface IOpenOceanSwapData {
  chainId: number;
  inToken: { symbol: string; address: string; decimals: number };
  outToken: { symbol: string; address: string; decimals: number };
  inAmount: string;
  outAmount: string;
  estimatedGas: number;
  minOutAmount: string;
  from: string;
  to: string;
  value: string;
  data: string;
  gasPrice?: string;
}

/** Response structure for the OpenOcean `/swap_quote` endpoint. */
export interface IOpenOceanSwapResponse {
  code: number;
  data?: IOpenOceanSwapData;
  message?: string;
}

export {};
