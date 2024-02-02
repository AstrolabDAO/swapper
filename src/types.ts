
export interface IToken {
  chainId: string;
  address?: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  priceUSD?: string;
}

export type TransactionRequest = {
  to?: string;
  from?: string;
  nonce?: bigint|string|Stringifiable;
  gasLimit?: bigint|string|Stringifiable;
  gasPrice?: bigint|string|Stringifiable;
  data?: Uint8Array|string;
  value?: bigint|string|Stringifiable;
  chainId?: number;
  type?: number;
  accessList?: any;
  maxPriorityFeePerGas?: bigint|string|Stringifiable;
  maxFeePerGas?: bigint|string|Stringifiable;
  customData?: Record<string, any>;
  ccipReadEnabled?: boolean;
};

export enum AggregatorId {
  SQUID = "SQUID",
  SOCKET = "SOCKET",
  LIFI = "LIFI",
  KYBERSWAP = "KYBERSWAP",
  ONE_INCH = "ONE_INCH",
  ZERO_X = "ZERO_X",
  PARASWAP = "PARASWAP",
}

export interface Stringifiable {
  toString: () => string;
}

export interface ICustomContractCall {
  toAddress?: string;
  callData: string;
  gasLimit?: string;
}

export interface ISwapperParams {
  aggregatorId?: string|string[];
  input: string;
  inputChainId: number;
  output: string;
  outputChainId?: number;
  amountWei: string|number|bigint|Stringifiable;
  payer: string; // actual caller
  testPayer?: string; // impersonated on the api
  receiver?: string;
  referrer?: string;
  project?: string; // == integrator
  deadline?: number;
  maxSlippage?: number;
  customContractCalls?: ICustomContractCall[];
  postHook?: ICustomContractCall[];
  denyBridges?: string[];
  denyExchanges?: string[];
}

export interface ITransactionRequestWithEstimate extends TransactionRequest {
  aggregatorId?: string;
  estimatedExchangeRate?: string|number;
  estimatedOutput?: string|number;
  estimatedOutputWei?: Stringifiable|string|bigint;
  estimatedGas?: string|number;
  estimatedSlippage?: string|number;
  steps?: ICommonStep[];
  approvalAddress?: string;
}

export type Aggregator = {
  routerByChainId: { [key: number]: string };
  getTransactionRequest: (o: ISwapperParams) => Promise<ITransactionRequestWithEstimate|undefined>;
};

interface IFeeCost {
  name: string;
  description?: string;
  percentage: string;
  token: IToken;
  amount?: string;
  amountUSD: string;
  included: boolean;
}

interface IGasCost {
  type: string;
  price?: string;
  estimate?: string;
  limit?: string;
  amount: string;
  amountUSD?: string;
  token: IToken;
}

export interface IEstimate {
  fromAmount?: string;
  toAmount?: string;
  toAmountMin?: string;
  approvalAddress?: string;
  feeCosts?: IFeeCost[];
  gasCosts?: IGasCost[];
}

export interface IToolDetails {
  key: string; // protocol name
  logoURI: string;
  name: string;
}


export interface ICommonStep {
  id?: string,
  type: string,
  description?: string,
  fromToken?: IToken,
  toToken?: IToken,
  fromAmount?: string,
  toAmount?: string,
  fromChain?: number,
  toChain?: number,
  fromAddress?: string,
  toAddress?: string,
  tool?: string,
  toolDetails?: IToolDetails,
  estimate?: IEstimate,
  slippage?: number,
}

const isAddress = (s: string): boolean => /^0x[a-fA-F0-9]{40}$/i.test(s);

export const validateQuoteParams = (o: ISwapperParams) =>
  !(
    [o.input, o.output, o.payer].some((v) => !isAddress(v)) ||
    isNaN(o.inputChainId) ||
    o.inputChainId < 0 ||
    !o.amountWei || BigInt(o.amountWei.toString()) < 0n
  );