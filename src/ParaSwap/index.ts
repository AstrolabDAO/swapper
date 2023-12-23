import qs from "qs";
import { ISwapperParams, ITransactionRequestWithEstimate, validateQuoteParams } from "../types";

// PasarSwap specific types
interface ISwapExchange {
  exchange: string;
  srcAmount: string|number;
  destAmount: string|number;
  percent: string|number;
  data: {
    router: string;
    path: string[];
    factory: string;
    initCode: string;
    feeFactor: string|number;
    pools: {
      address: string;
      fee: string|number;
      direction: boolean;
    }[];
    gasUSD: string;
  };
}

interface ISwap {
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  destDecimals: number;
  swapExchanges: ISwapExchange[];
}

interface IOther {
  exchange: string;
  srcAmount: string;
  destAmount: string;
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

interface IPriceRoute {
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
    swaps: ISwap[];
  };
  others: IOther;
  gasCostUSD: string;
  gasCost: string;
  side: string;
  tokenTransferProxy: string;
  contractAddress: string;
  contractMethod: string;
  srcUSD: string;
  destUSD: string;
  partner: string;
  partnerFee: number;
  maxImpactReached: boolean;
  hmac: string;
}

interface IQuoteParams {
  srcToken: string;
  srcDecimals?: number;
  destToken: string;
  destDecimals?: number;
  amount: string;
  side: 'SELL' | 'BUY';
  network: number;
  gasPrice?: number;
  ignoreChecks?: boolean;
  ignoreGasEstimate?: boolean;
  onlyParams?: boolean;
  otherExchangePrices?: boolean;
  priceRoute?: IPriceRoute;
  slippage?: number;
  userAddress: string;
  txOrigin?: string;
  receiver?: string;
  includeDEXS?: string[];
  excludeDEXS?: string[];
  includeContractMethods?: string[];
  excludeContractMethods?: string[];
  route?: string;
  partner?: string; // project name
  partnerAddress?: string; // project treasury address for surplus
  takeSurplus?: boolean; // send positive slippage to partnerAddress (default: false)
  deadline?: number;
}

interface IQuoteData {
  from: string;
  to: string;
  value: number;
  data: string | Uint8Array;
  gasPrice: number;
  gas: number;
  chainId: number;
}

export const routerByChainId: { [id: number]: string } = {
  1: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  10: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  56: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  100: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  137: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  250: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  324: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57", // zksync cmon ser
  1101: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  8217: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  8453: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  42161: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
  43114: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
};

const apiKey = process.env?.PARASWAP_API_KEY;
const apiRoot = "https://api.paraswap.io";

const convertParams = (o: ISwapperParams): IQuoteParams => ({
  network: o.inputChainId,
  side: "SELL",
  srcToken: o.input,
  destToken: o.output,
  amount: o.amountWei.toString(),
  userAddress: o.receiver ?? o.payer,
  // txOrigin: o.payer,
  partner: o.project ?? "astrolab",
  slippage: o.maxSlippage!, // bps
  deadline: Math.floor(Date.now() / 1000) + 300, // 5min
  ignoreChecks: true,
  ignoreGasEstimate: true,
  otherExchangePrices: true,
});

// NB: inspired by official docs https://developers.paraswap.network/api/examples
export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  o.amountWei = BigInt(o.amountWei.toString());
  const priceRoute = await getQuote(o);
  const params = convertParams(o);
  const paramsWithRoute = { ...params, priceRoute };
  try {
    const res = await fetch(
      `${apiRoot}/transactions/${o.inputChainId}?${qs.stringify(params)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paramsWithRoute),
      },
    );
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    return await res.json();
  } catch (e) {
    throw new Error(`getTransactionRequest failed: ${e}`);
  }
}

export async function getQuote(o: ISwapperParams): Promise<IPriceRoute|undefined> {
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  try {
    const url = `${apiRoot}/prices/${o.inputChainId}?${qs.stringify(params)}`;
    const res = await fetch(url);
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    return await res.json();
  } catch (e) {
    throw new Error(`getQuote failed: ${e}`);
  }
}
