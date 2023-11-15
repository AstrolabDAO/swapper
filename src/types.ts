import { TransactionRequest } from "@astrolabs/hardhat";
import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";

export enum AggregatorId {
  SQUID = "SQUID",
  SOCKET = "SOCKET",
  LIFI = "LIFI",
  KYBERSWAP = "KYBERSWAP",
  ONE_INCH = "ONE_INCH",
  ZERO_X = "ZERO_X",
  PARASWAP = "PARASWAP",
  SIFI = "SIFI",
}

export interface ISwapperParams {
  aggregatorId?: string|string[];
  input: string;
  inputChainId: number;
  output: string;
  outputChainId?: number;
  amountWei: string|number|bigint|BigNumber;
  payer: string; // actual caller
  testPayer?: string; // impersonated on the api
  receiver?: string;
  referrer?: string;
  project?: string; // == integrator
  deadline?: number;
  maxSlippage?: number;
}

export interface ITransactionRequestWithEstimate extends TransactionRequest {
  aggregatorId?: string;
  estimatedExchangeRate?: string|number;
  estimatedOutput?: string|number;
  estimatedOutputWei?: string|bigint|BigNumber;
  estimatedGas?: string|number;
  estimatedSlippage?: string|number;
}

export type Aggregator = {
  routerByChainId: { [key: number]: string };
  getTransactionRequest: (o: ISwapperParams) => Promise<ITransactionRequestWithEstimate|undefined>;
};

export const validateQuoteParams = (o: ISwapperParams) =>
  !(
    [o.input, o.output, o.payer].some((v) => !isAddress(v)) ||
    isNaN(o.inputChainId) ||
    o.inputChainId < 0 ||
    !o.amountWei || o.amountWei < BigNumber.from(0)
  );
