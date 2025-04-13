/** Parameters for the KyberSwap `/routes` endpoint. */
export interface IQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string | number;
  saveGas: boolean;
  includedSources?: string[];
  excludedSources?: string[];
  gasInclude?: boolean;
  gasPrice?: string;
  feeAmount?: string | number;
  chargeFeeBy?: string;
  isInBps?: boolean;
  feeReceiver?: string;
  source?: string;
  slippageTolerance?: string | number;
}

/** Details about the extra fee charged by KyberSwap. */
export interface IExtraFee {
  feeAmount: string;
  chargeFeeBy: string;
  isInBps: boolean;
  feeReceiver: string;
}

/** Extra details specific to a pool used in the route. */
export interface IPoolExtra {
  swapFee: string;
}

/** Represents a single pool hop within a KyberSwap route segment. */
export interface IPool {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  limitReturnAmount: string;
  swapAmount: string;
  amountOut: string;
  exchange: string;
  poolLength: number;
  poolType: string;
  poolExtra: IPoolExtra;
  extra: null;
}

/** Summary of the best route found by the KyberSwap aggregator. */
export interface IRouteSummary {
  tokenIn: string;
  amountIn: string;
  amountInUsd: string;
  tokenInMarketPriceAvailable: boolean;
  tokenOut: string;
  amountOut: string;
  amountOutUsd: string;
  tokenOutMarketPriceAvailable: boolean;
  gas: string;
  gasPrice: string;
  gasUsd: string;
  extraFee: IExtraFee;
  route: IPool[][];
  routerAddress?: string;
}

/** Wrapper for the route summary data in the `/routes` response. */
export interface IData {
  routeSummary: IRouteSummary;
  routerAddress: string;
}

/** Response structure for the KyberSwap `/routes` endpoint. */
export interface IQuoteData {
  code: number;
  message: string;
  data: IData;
  requestId: string;
}

/** Response structure for the KyberSwap `/route/build` endpoint. */
export interface IBuildResponse {
  code: number;
  message: string;
  data: {
    amountIn: string;
    amountInUsd: string;
    amountOut: string;
    amountOutUsd: string;
    gas: string;
    gasUsd: string;
    outputChange: {
      amount: string;
      percent: number;
      level: number;
    };
    data: string;
    routerAddress: string;
  };
}
