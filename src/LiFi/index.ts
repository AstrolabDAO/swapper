import { ITransactionRequestWithEstimate, TransactionRequest, IToolDetails, ICommonStep, ICustomContractCall } from "../types";
import qs from "qs";
import { ISwapperParams, validateQuoteParams } from "../types";
import { addEstimatesToTransactionRequest } from "../";

// LiFi specific types
export interface ILifiContractCall {
  fromAmount?: string;
  fromTokenAddress?: string;
  toContractAddress?: string;
  toContractCallData?: string;
  toContractGasLimit?: string;
};

interface IQuoteParams {
  fromToken: string;
  fromChain: string;
  toToken: string;
  toChain: string;
  toAmount?: string;
  fromAmount: number | string;
  fromAddress: string;
  toAddress?: string;
  order?: "CHEAPEST" | "FASTEST" | "SAFEST" | "RECOMMENDED";
  slippage?: number;
  maxPriceImpact?: number;
  integrator?: string;
  referrer?: string;
  allowDestinationCall?: boolean;
  allowBridges?: string[];
  allowExchanges?: boolean[];
  denyBridges?: string[];
  denyExchanges?: string[];
  preferBridges?: string[];
  preferExchanges?: boolean[];
  contractCalls?: ILifiContractCall[];
}

interface IStatusParams {
  txHash: string;
  bridge?: string;
  fromChain?: string;
  toChain?: string;
}

export interface IToken {
  address: string;
  decimals: number;
  symbol: string;
  chainId: number;
  coinKey?: string;
  name: string;
  logoURI?: string;
  priceUSD?: string;
}

interface IBid {
  user: string;
  router: string;
  initiator: string;
  sendingChainId: number;
  sendingAssetId: string;
  amount: string;
  receivingChainId: number;
  receivingAssetId: string;
  amountReceived: string;
  receivingAddress: string;
  transactionId: string;
  expiry: number;
  callDataHash: string;
  callTo: string;
  encryptedCallData: string;
  sendingChainTxManagerAddress: string;
  receivingChainTxManagerAddress: string;
  bidExpiry: number;
  bidSignature: string;
  gasFeeInReceivingToken: string;
  totalFee: string;
  metaTxRelayerFee: string;
  routerFee: string;
}

interface IData {
  bid: IBid;
}

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

interface IEstimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: string;
  feeCosts: IFeeCost[];
  gasCosts: IGasCost[];
}

interface IAction {
  fromChainId: number;
  fromAmount: string;
  toChainId: number;
  fromToken: IToken;
  toToken: IToken;
  slippage?: number;
  fromAddress: string;
  toAddress: string;
}

export interface IStep {
  id: string;
  type: string;
  toolDetails: IToolDetails;
  tool: string;
  action: IAction;
  data?: IData;
  integrator?: string;
  referrer?: string;
  execution?: string;
  estimate: IEstimate;
  transactionRequest?: TransactionRequest;
}

interface IInsurance {
  state: string;
  feeAmountUsd: string;
}

interface IRoute {
  id: string;
  containsSwitchChain: boolean;
  fromAmount: string;
  fromAmountUSD: string;
  fromChainId: number;
  fromToken: IToken;
  gasCostUSD: string;
  insurance: IInsurance;
  steps: IStep[];
  tags: ('CHEAPEST' | 'FASTEST' | 'RECOMMENDED')[];
  toAmount: string;
  toAmountMin: string;
  toAmountUSD: string;
  toChainId: number;
  toToken: IToken;
}

interface IQuote {
  routes: IRoute[];
  transactionRequest?: TransactionRequest;
}

interface IBestQuote extends IStep {
  transactionRequest: TransactionRequest;
  estimate: IEstimate;
  includedSteps?: IStep[];
}

const apiRoot = "https://li.quest/v1";
const apiKey = process.env?.LIFI_API_KEY;

export const convertParams = (o: ISwapperParams): IQuoteParams => ({
  fromToken: o.input,
  fromChain: networkById[o.inputChainId],
  toToken: o.output,
  toAmount: o.amountWei?.toString() || undefined,
  toChain: networkById[o.outputChainId ?? o.inputChainId],
  fromAmount: o.amountWei.toString(),
  fromAddress: o.testPayer ?? o.payer,
  toAddress: o.receiver ?? o.payer,
  order: "RECOMMENDED",
  slippage: o.maxSlippage! / 10_000, // in % (eg. .001 = .1%)
  maxPriceImpact: (o.maxSlippage! / 10_000) * 2, // in % (eg. .01 = 1%)
  integrator: o.project ?? process.env.LIFI_PROJECT_ID ?? "astrolab",
  // referrer: undefined,
  allowDestinationCall: true,
  contractCalls: o.customContractCalls?.length ? [{
    fromAmount: o.amountWei.toString(),
    fromTokenAddress: o.output,
    toContractAddress: o.customContractCalls?.[0].toAddress,
    toContractCallData: o.customContractCalls?.[0].callData,
    toContractGasLimit: o.customContractCalls?.[0].gasLimit ?? '10000',
  }] : undefined,
  // allowBridges: [],
  // allowExchanges: [],
  denyBridges: o.denyBridges ?? [],
  denyExchanges: o.denyExchanges ?? [],
  // preferBridges: ["cctp", "hop", "across"],
  // preferExchanges: [],
});

// cf. https://docs.li.fi/li.fi-api/li.fi-api/requesting-supported-chains
// curl https://li.quest/v1/chains
export const networkById: { [chainId: number]: string } = {
  1: "eth",
  10: "opt",
  25: "cro",
  56: "bsc",
  66: "okt",
  100: "dai",
  106: "vel",
  122: "fus",
  137: "pol",
  250: "ftm",
  288: "bob",
  324: "era",
  1101: "pze",
  1284: "moo",
  1285: "mor",
  8453: "bas",
  59144: "lna",
  42161: "arb",
  42220: "cel",
  43114: "ava",
  1313161554: "aur",
};

export const routerByChainId: { [id: number]: string } = {
  1: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  10: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  25: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  56: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  66: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  100: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  106: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  122: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  137: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  250: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  288: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  324: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  1101: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  1284: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  1285: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  8453: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  59144: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  42161: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  42220: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  43114: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
  1313161554: "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE",
};

export const parseSteps = (steps: IStep[]): ICommonStep[] => {
  const commonSteps: ICommonStep[] = [];
  for (const i in steps) {
    const step = steps[i];
    commonSteps.push({
      id: step.id,
      type: step.type,
      description: '',
      fromToken: step.action.fromToken,
      toToken: step.action.toToken,
      fromAmount: step.action.fromAmount,
      fromChain: step.action.fromChainId,
      toChain: step.action.toChainId,
      slippage: step.action.slippage,
      estimate: step.estimate,
      fromAddress:  step.action.fromAddress,
      toAddress:  step.action.toAddress,
      tool: step.tool,
      toolDetails: step.toolDetails,
    });
  }
  return commonSteps;
}

export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate | undefined> {
  const quote = o.customContractCalls?.length ? await getContractCallsQuote(o) : await getQuote(o);
  const tr = quote?.transactionRequest as ITransactionRequestWithEstimate;
  if (!tr) return;
  return addEstimatesToTransactionRequest({
    steps: parseSteps(quote!.includedSteps ?? []),
    tr,
    inputAmountWei: BigInt(o.amountWei as string),
    outputAmountWei: BigInt(quote!.estimate.toAmount),
    inputDecimals: quote!.action.fromToken.decimals,
    outputDecimals: quote!.action.toToken.decimals,
  });
}

// cf. https://apidocs.li.fi/reference/post_quote-contractcalls
// Perform multiple contract calls across blockchains
export async function getContractCallsQuote(o: ISwapperParams): Promise<IBestQuote | undefined> {
  if (!apiKey) console.warn("missing env.LIFI_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const url = `${apiRoot}/quote/contractCalls`;
  const body = convertParams(o);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(apiKey ? { "x-lifi-api-key": apiKey } : {})
      },
      body: JSON.stringify(body),
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.() ?? '?'}`);
    return await res.json();
  } catch (e) {
    console.error(`getContractCallsQuote failed: ${e}`);
  }
}

// cf. https://apidocs.li.fi/reference/get_quote
// Get a quote for your desired transfer
export async function getQuote(o: ISwapperParams): Promise<IBestQuote | undefined> {
  if (!apiKey) console.warn("missing env.LIFI_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  const url = `${apiRoot}/quote?${qs.stringify(params)}`;
  try {
    const res = await fetch(url, {
      headers: apiKey ? { "x-lifi-api-key": apiKey } : {},
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
  if (!apiKey) console.warn("missing env.LIFI_API_KEY");
  try {
    const res = await fetch(`${apiRoot}/status?${qs.stringify(o)}`);
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (e) {
    console.error(`getStatus failed: ${e}`);
  }
}
