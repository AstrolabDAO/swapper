import qs from "qs";
import { addEstimatesToTransactionRequest } from "../";
import { ICommonStep, ICustomContractCall, ISwapperParams, ITransactionRequestWithEstimate, TransactionRequest, validateQuoteParams } from "../types";
import { IToken as ICommonToken } from "../types";

// Squid specific types
interface IQuoteParams {
  enableBoost: boolean;
  toChain: string | number;
  toToken: string;
  fromChain: string | number;
  fromToken: string;
  fromAddress: string;
  fromAmount: number | string;
  slippage: number | string;
  slippageConfig?: {
    autoMode: number;
  };
  toAddress: string;
  quoteOnly?: boolean;
  customContractCalls?: ICustomContractCall[];
  postHook?: IPostHook;
  prefer?: string[];
  receiveGasOnDestination?: boolean;
  integrator?: string;
}

export enum SquidCallType {
  DEFAULT = 0,
  FULL_TOKEN_BALANCE = 1,
  FULL_NATIVE_BALANCE = 2,
  COLLECT_TOKEN_BALANCE = 3, // unused in hooks
}

export enum ChainType {
  EVM = "evm",
  Cosmos = "cosmos"
}

interface IPostHook {
  chainType: ChainType;
  calls: ISquidCustomCall[];
}

export interface ISquidCustomCall {
  chainType: ChainType;
  callType: SquidCallType;
  target: string;
  value: string;
  callData: string;
  payload: {
    tokenAddress: string,
    inputPos: number,
  },
  estimatedGas: string;
}

interface IStatusParams {
  transactionId: string;
  fromChainId?: string;
  toChainId?: string;
  integrator?: string;
}

export interface IToken {
  type: string;
  chainId: string;
  address?: string;
  name: string;
  symbol: string;
  axelarNetworkSymbol?: string;
  decimals: number;
  logoURI: string;
  coingeckoId: string;
  subGraphId: string;
  subGraphOnly?: boolean;
  usdPrice: number;
}

interface CustomData {
  poolFees: number[];
  swapGasEstimate: string;
}

interface ISwap {
  chainId: string;
  dex: string;
  factory: string;
  quoterV2: string;
  swapRouter: string;
  path: string[];
  slippage: number;
  custom: CustomData;
  target: string;
}

interface IBridgeCall {
  name: string;
  provider: string;
  type: string;
}

export interface IAction {
  type: string;
  chainType: string;
  data: ISwap | IBridgeCall;
  fromChain: string;
  toChain: string;
  fromToken: IToken;
  toToken: IToken;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  exchangeRate: string;
  priceImpact: string;
  stage: number;
  provider: string;
  description: string;
}

interface IQuoteResponse {
  route: IRoute;
}

interface IFeeCosts {
  amount: string;
  amountUsd: string;
  description: string;
  gasLimit: string;
  gasMultiplier: string;
  name: string;
  token: IToken;
}

interface IGasCosts {
  amount: string;
  amountUsd: string;
  gasLimit: string;
  name: string;
  token: IToken;
  type: string;
}

interface IEstimate {
  fromAmount: string;
  fromAmountUSD: string;
  sendAmount: string;
  toAmount: string;
  toAmountUSD: string;
  actions: IAction[];
  feeCosts: IFeeCosts[];
  gasCosts: IGasCosts[];
  exchangeRate: string;
  estimatedRouteDuration: number;
  aggregatePriceImpact: string;
  aggregateSlippage: string;
  isBoostSupported: boolean;
  toToken: IToken;
  fromToken: IToken;
}

interface ITransactionRequest extends TransactionRequest {
  routeType: string;
  target: string;
  targetAddress?: string;
}

interface IRoute {
  estimate: IEstimate;
  params: IQuoteParams;
  transactionRequest: ITransactionRequest;
}

const apiRoot = "https://v2.api.squidrouter.com/v2";
const apiKey = process.env?.SQUID_API_KEY;

const generateHook = (contractCall: ICustomContractCall, outputToken: string)
  : ISquidCustomCall => {
  return {
    chainType: ChainType.EVM,
    callType: SquidCallType.FULL_TOKEN_BALANCE,
    target: contractCall.toAddress!,
    value: "0",
    callData: contractCall.callData,
    payload: {
      tokenAddress: outputToken,
      inputPos: 1,
    },
    // todo: verify if enough gas here to pay LZ
    estimatedGas: contractCall.gasLimit ?? "20000"
  }
}

export const convertParams = (o: ISwapperParams): IQuoteParams => ({
  enableBoost: true,
  fromToken: o.input,
  fromChain: o.inputChainId!.toString(),
  toToken: o.output,
  toChain: (o.outputChainId ?? o.inputChainId).toString(),
  fromAddress: o.payer ?? o.testPayer,
  fromAmount: o.amountWei.toString(),
  toAddress: o.receiver ?? o.payer,
  slippage: o.maxSlippage! / 100, // in % (eg. .001 = .1%)
  slippageConfig: {
    autoMode: 1,
  },
  quoteOnly: false, // false == no transaction request
  receiveGasOnDestination: o.receiveGasOnDestination ?? false,
  integrator: process.env?.SQUID_PROJECT_ID ?? "astrolab-api",
  postHook: o.customContractCalls?.length ?
    {
      chainType: ChainType.EVM,
      calls: [generateHook(o.customContractCalls[0], o.output)]
    } : undefined,
});

export const routerByChainId: { [id: number]: string } = {
  1: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  10: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  56: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  137: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  250: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  314: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  1284: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  2222: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  5000: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  8453: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  42161: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  42220: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  43114: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  59144: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  534352: "0xce16F69375520ab01377ce7B88f5BA8C48F8D666",
  // "osmosis-1": "",
  // "cosmoshub-4": "",
  // "kaiyo-1": "",
  // "neutron-1": "",
  // "stargaze-1": "",
  // "axelar-dojo-1": "",
  // "umee-1": "",
  // "secret-4": "",
  // "core-1": "",
  // "sommelier-3": "",
  // "stride-1": "",
  // "injective-1": "",
  // "crescent-1": "",
  // "phoenix-1": "",
  // "juno-1": "",
  // "evmos_9001-2": "",
  // "carbon-1": "",
  // "regen-1": "",
  // "agoric-3": "",
  // "chihuahua-1": "",
  // "akashnet-2": "",
  // "comdex-1": "",
  // "archway-1": "",
  // "quicksilver-2": "",
  // "omniflixhub-1": "",
  // "migaloo-1": "",
  // "mars-1": "",
  // "columbus-5": "",
  // "mantle-1": "",
  // "gravity-bridge-3": "",
  // "bitcanna-1": "",
  // "bitsong-2b": "",
  // "cheqd-mainnet-1": "",
  // "mainnet-3": "",
  // "desmos-mainnet": "",
  // "irishub-1": "",
  // "ixo-5": "",
  // "jackal-1": "",
  // "likecoin-mainnet-2": "",
  // "lum-network-1": "",
  // "sentinelhub-2": "",
  // "noble-1": "",
  // "pirin-1": "",
  // "dydx-mainnet-1": "",
  // "celestia": "",
};

export const parseSteps = (steps: IAction[]): ICommonStep[] => {
  const commonSteps: ICommonStep[] = [];
  for (const step of steps) {
    commonSteps.push({
      type: step.type,
      description: step.description,
      fromToken: parseToken(step.fromToken),
      toToken: parseToken(step.toToken),
      fromAmount: step.fromAmount,
      toAmount: step.toAmount,
      fromChain: parseInt(step.fromChain),
      toChain: parseInt(step.toChain ?? '0'),
      tool: step.provider,
      toolDetails: {
        key: step.provider,
        logoURI: '',
        name: step.provider,
      }
    });
  }
  return commonSteps;
}

export const parseToken = (token: IToken): ICommonToken => {
  return {
    address: token?.address ?? '',
    decimals: token?.decimals ?? 0,
    symbol: token?.symbol ?? '',
    chainId: token?.chainId ?? '',
    name: token?.name ?? '',
    logoURI: token?.logoURI ?? '',
    priceUSD: token?.usdPrice?.toString()  ?? '0',
  };
};

export async function getTransactionRequest(o: ISwapperParams)
  : Promise<ITransactionRequestWithEstimate | undefined> {
  const quote = await getQuote(o) as IQuoteResponse;
  const tr = quote?.route.transactionRequest as (ITransactionRequest & ITransactionRequestWithEstimate);
  if (!tr) return;
  tr.to ??= tr.target ?? tr.targetAddress;
  const gasCosts = [...quote.route.estimate.gasCosts, ...quote.route.estimate.feeCosts];
  return addEstimatesToTransactionRequest({
    totalGasUsd: gasCosts.map((c) => parseFloat(c.amountUsd === '' ? '0': c.amountUsd)).reduce((a, b) => a + b, 0),
    totalGasWei: BigInt(gasCosts.map((c) => c.amount).reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0))),
    steps: parseSteps(quote!.route.estimate.actions ?? []),
    tr,
    inputAmountWei: BigInt(o.amountWei as string),
    outputAmountWei: BigInt(quote!.route.estimate.toAmount),
    inputDecimals: quote!.route.estimate.fromToken.decimals,
    outputDecimals: quote!.route.estimate.toToken.decimals,
    approvalAddress: tr.to,
  });
}

// cf. https://apidocs.li.fi/reference/get_quote
// Get a quote for your desired transfer
export async function getQuote(o: ISwapperParams): Promise<IQuoteResponse | undefined> {
  if (!apiKey) console.warn("missing env.SQUID_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  const url = `${apiRoot}/route`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integrator-id": params.integrator!,
        ...(apiKey && { "api-key": apiKey }),
      },
      body: JSON.stringify(params),
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.() ?? '?'}`);
    return await res.json();
  } catch (e) {
    console.error(`getQuote failed: ${e}`);
  }
}

// Check the status of your cross-chain transfers
// while (result.status !== "DONE" && result.status !== "FAILED")
//   result = await getStatus(quote.tool, fromChain, toChain, tx.hash);
export async function getStatus(o: IStatusParams) {
  if (!apiKey) console.warn("missing env.SQUID_API_KEY");
  try {
    const res = await fetch(`${apiRoot}/status?${qs.stringify(o)}`, {
      headers: {
        "x-integrator-id": o.integrator! ?? "astrolab-api",
        ...(apiKey && { "api-key": apiKey }),
      }
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (e) {
    console.error(`getStatus failed: ${e}`);
  }
}