import qs from "qs";
import { ISwapperParams, validateQuoteParams } from "../types";
import { ITransactionRequestWithEstimate } from "../types";

// KyberSwap specific types
interface IQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string|number;
  saveGas: boolean;
  includedSources?: string[];
  excludedSources?: string[];
  gasInclude?: boolean;
  gasPrice?: string;
  feeAmount?: string|number;
  chargeFeeBy?: string;
  isInBps?: boolean;
  feeReceiver?: string;
  source?: string;
  slippageTolerance?: string|number;
}

interface IExtraFee {
  feeAmount: string;
  chargeFeeBy: string;
  isInBps: boolean;
  feeReceiver: string;
}

interface IPoolExtra {
  swapFee: string;
}

interface IPool {
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

interface IRouteSummary {
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
}

interface IData {
  routeSummary: IRouteSummary;
  routerAddress: string;
}

export interface IQuoteData {
  code: number;
  message: string;
  data: IData;
  requestId: string;
}

interface IBuildResponse {
  code: number;
  message: string;
  data: {
    amountIn: number;
    amountInUsd: number;
    amountOut: number;
    amountOutUsd: number;
    gas: number;
    gasUsd: number;
    outputChange: {
      amount: string;
      percent: number;
      level: number;
    },
    data: string;
    routerAddress: string;
  };
}

export const networkById: { [id: number]: string } = {
  1: "ethereum",
  10: "optimism",
  56: "bsc",
  137: "polygon",
  250: "fantom",
  324: "zksync",
  1101: "polygon-zkevm",
  8453: "base",
  42161: "arbitrum",
  43114: "avalanche",
  59144: "linea",
  534352: "scroll",
  1313161554: "aurora",
};

// cf. https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/contracts/aggregator-contract-addresses
export const routerByChainId: { [id: number]: string } = {
  1: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  10: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  25: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  56: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  137: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  250: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  324: "0x3F95eF3f2eAca871858dbE20A93c01daF6C2e923",
  1101: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  8217: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  8453: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  42161: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  42220: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  43114: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  59144: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  534352: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
  1313161554: "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5",
};

const apiKey = process.env?.KYBERSWAP_API_KEY;
const apiRoot = (networkId: number) =>
  `https://aggregator-api.kyberswap.com/${networkById[networkId]}/api/v1`;

const convertParams = (o: ISwapperParams): IQuoteParams => ({
  tokenIn: o.input,
  tokenOut: o.output,
  amountIn: o.amountWei.toString(),
  saveGas: false, // saveGas == route is sorted by gas price
  gasInclude: true,
  slippageTolerance: o.maxSlippage!, // bps
  source: apiKey || o.project || "astrolab",
});

// NB: prefer using token unwrapped symbols (eg. weth->eth) to avoid missing/poor data feeds
export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  if (!apiKey) console.warn("missing env.KYBERSWAP_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  try {
    const routeSummary = (await getQuote(o))?.data?.routeSummary;
    if (!routeSummary) return undefined;
    const url = `${apiRoot(o.inputChainId)}/route/build?${qs.stringify(params)}`;
    const res = await fetch(
      `${apiRoot(o.inputChainId)}/route/build?${qs.stringify(o)}`,
      {
        method: "POST",
        body: JSON.stringify({
          routeSummary,
          recipient: o.receiver ?? o.payer,
          sender: o.payer,
          source: params.source,
          skipSimulateTx: true,
          slippageTolerance: params.slippageTolerance,
          deadline: Math.floor(Date.now() / 1000) + 300, // 5min,
        }),
        headers: {
          "x-client-id": params.source!,
          "Content-Type": "application/json",
        },
      },
    );
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    const resBody: IBuildResponse = await res.json();
    return {
      from: o.payer,
      to: resBody.data.routerAddress,
      data: resBody.data.data,
      gasLimit: resBody.data.gas * 2
    };
  } catch (e) {
    throw new Error(`getTransactionRequest failed: ${e}`);
  }
}

export async function getQuote(o: ISwapperParams): Promise<IQuoteData|undefined> {
  if (!apiKey) console.warn("missing env.KYBERSWAP_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  try {
    const url = `${apiRoot(o.inputChainId)}/routes?${qs.stringify(params)}`;
    const res = await fetch(url,
      { headers: { "x-client-id": params.source! } },
    );
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    return await res.json();
  } catch (e) {
    throw new Error(`getQuote failed: ${e}`);
  }
}
