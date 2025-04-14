import { TransactionRequest } from "@/types";

/** Represents details about a swap performed on a specific exchange within a ParaSwap route. */
export interface IParaSwapExchange {
  exchange: string;
  srcAmount: string | number;
  destAmount: string | number;
  percent: string | number;
  data: {
    router: string;
    path: string[];
    factory: string;
    initCode: string;
    feeFactor: string | number;
    pools: {
      address: string;
      fee: string | number;
      direction: boolean;
    }[];
    gasUSD: string;
  };
}

/** Represents one leg of a potential swap route, possibly involving multiple exchanges. */
export interface IParaSwapSwap {
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  destDecimals: number;
  swapExchanges: IParaSwapExchange[];
}

/** Represents alternative routes considered by ParaSwap but not chosen as the best. */
export interface IOther extends Omit<IParaSwapExchange, "data"> {
  unit: string;
  data: {
    router: string;
    path: string[];
    factory: string;
    initCode: string;
    feeFactor: number;
    pools: {
      address: string;
      fee: number;
      direction: boolean;
    }[];
    gasUSD: string;
  };
}

/** Detailed information about the best price route found by ParaSwap. */
export interface IParaSwapRoute {
  blockNumber: number;
  network: number;
  srcToken: string;
  srcDecimals: number;
  srcAmount: string;
  destToken: string;
  destDecimals: number;
  destAmount: string;
  bestRoute: {
    percent: number;
    swaps: IParaSwapSwap[];
  };
  others: IOther;
  gasCostUSD?: string;
  gasCost?: string;
  side: string;
  tokenTransferProxy: string;
  contractAddress: string;
  contractMethod: string;
  srcUSD: string;
  destUSD: string;
  integratorId: string;
  integratorIdFee: number;
  maxImpactReached: boolean;
  hmac: string;
}

/** Parameters for the ParaSwap getRate (price route) request. */
export interface IParaSwapQuoteParams {
  srcToken: string;
  srcDecimals?: number;
  destToken: string;
  destDecimals?: number;
  amount: string;
  side: "SELL" | "BUY";
  network: number;
  gasPrice?: number;
  ignoreChecks?: boolean;
  ignoreGasEstimate?: boolean;
  onlyParams?: boolean;
  otherExchangePrices?: boolean;
  priceRoute?: IParaSwapRoute;
  slippage?: number;
  userAddress: string;
  txOrigin?: string;
  receiver?: string;
  includeDEXS?: string[];
  excludeDEXS?: string[];
  includeContractMethods?: string[];
  excludeContractMethods?: string[];
  route?: string;
  integratorId?: string;
  integratorIdAddress?: string;
  takeSurplus?: boolean;
  deadline?: number;
}

/** Deprecated or simplified response structure? (Appears less used than IPriceRoute for quotes). */
export interface IParaSwapQuoteData {
  from: string;
  to: string;
  value: number;
  data: string | Uint8Array;
  gasPrice: number;
  gas: number;
  chainId: number;
}

/** Parameters derived from IPriceRoute needed for the buildTx request. */
export interface IParaSwapBuildTxParams {
  network: number;
  side: string;
  srcToken: string;
  destToken: string;
  amount: string;
  userAddress: string;
  integratorId: string;
  slippage?: number;
  deadline?: number;
  ignoreChecks: boolean;
  ignoreGasEstimate: boolean;
  otherExchangePrices: boolean;
  srcAmount: string;
  destAmount: string;
  receiver?: string;
  priceRoute: IParaSwapRoute;
  gasPrice?: string; // API might expect string or number, use string for safety
  // TODO: Verify and add any other keys required by buildTx based on ParaSwap docs.
}

/** Type alias for the ParaSwap SDK instance */
export type IParaSwapSDK = Record<string, unknown>;

export { TransactionRequest };
