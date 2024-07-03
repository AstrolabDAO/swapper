import qs from "qs";

import {
  addEstimatesToTransactionRequest
} from "../";

import {
  ISwapperParams,
  validateQuoteParams,
  ITransactionRequestWithEstimate,
} from "../types";

// UNIZEN specific types
import {
  ICrossQuoteResult,
  IQuoteParams,
  IQuoteResult,
  TransactionData,
  SwapData,
  CrossChainTransactionData
} from './types'

// curl https://api.zcx.com/trade/v1/info/chains
export const networkById: { [chainId: number]: string } = {
  1: "ethereum",
  10: "optimism",
  56: "bsc",
  137: "polygon",
  250: "fantom",
  8453: "base",
  42161: "arbitrum",
  43114: "avax",
};

const apiRoot = "http://api.zcx.com/trade/v1";
const apiKey = process.env?.UNIZEN_API_KEY;

const getExcludedDexesList = (o: ISwapperParams): Map<string,string[]> => {
  let res = new Map<string, string[]>();
  if (o.denyExchanges?.length){
    res.set(String(o.inputChainId), o.denyExchanges?.concat(o.denyBridges ?? []));
    if (o.outputChainId){
      res.set(String(o.outputChainId), o.denyExchanges?.concat(o.denyBridges ?? []))
    }
  }
  return res;
}

const getTargetAddress = async (version: string, chainId: number) : Promise<string | undefined> => {
  const baseUrlSpender = `${apiRoot}/${chainId}/approval/spender?contractVersion=${version}`;
  try {
    const responseSpender = await fetch(baseUrlSpender, {
      headers: apiKey ? { "x-api-key": apiKey } : {}
    });
    const responseJson = await responseSpender.json();
    return responseJson.address;
} catch (e) {
    console.error(`unizen getTargetAddress failed: ${e}`);
    return undefined;
  }
}

export const convertQuoteParams = (o: ISwapperParams): IQuoteParams => ({
  fromTokenAddress: o.input,
  chainId: String(o.inputChainId),
  toTokenAddress: o.output,
  destinationChainId: o.outputChainId ? String(o.outputChainId) : undefined,
  amount: String(o.amountWei),
  sender: o.payer,
  receiver: o.receiver ?? undefined,
  slippage: o.maxSlippage,
  deadline: o.deadline,
  isSplit: false,
  excludedDexes: getExcludedDexesList(o),
});



export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate | undefined> {
  const isCrossSwap = !!o.outputChainId;
  const quotes = isCrossSwap ? await getCrossChainQuote(o) : await getSingleChainQuote(o);
  if (!quotes?.length) return;
  const bestQuote = quotes[0];
  const tradeType = isCrossSwap ? undefined : (bestQuote as IQuoteResult).tradeType;
  const swapData = await getSwapData(o.inputChainId, bestQuote.transactionData, bestQuote.nativeValue, o.payer, o.receiver ?? o.payer, tradeType);
  const spender = await getTargetAddress(swapData!.contractVersion, o.inputChainId);
  console.log('spender', spender);
  const tr = {
    from: o.payer,
    to: spender,
    value: o.amountWei,
    data: swapData?.data,
    gasLimit: Number(BigInt(swapData!.estimateGas)) * 2
  } as ITransactionRequestWithEstimate;

  const toTokenAmount = isCrossSwap ? (bestQuote as ICrossQuoteResult).dstTrade.toTokenAmount : (bestQuote as IQuoteResult).toTokenAmount;
  const tokenFromDecimals = isCrossSwap ? (bestQuote as ICrossQuoteResult).tradeParams.tokenInfo[0].decimals : (bestQuote as IQuoteResult).tokenFrom.decimals;
  const tokenToDecimals = isCrossSwap ? (bestQuote as ICrossQuoteResult).tradeParams.tokenInfo[1].decimals : (bestQuote as IQuoteResult).tokenTo.decimals;

  return addEstimatesToTransactionRequest({
    tr,
    inputAmountWei: BigInt(o.amountWei as string),
    outputAmountWei: BigInt(toTokenAmount),
    inputDecimals: tokenFromDecimals,
    outputDecimals: tokenToDecimals,
    approvalAddress: o.payer ?? '',
    totalGasUsd: 0,
    totalGasWei: swapData!.estimateGas
  });
}

// cf. https://api.zcx.com/trade/docs#/Single%20chain%20methods/QuoteSingleController_getSingleQuote
// Get a quote for your desired transfer.
export async function getSingleChainQuote(o: ISwapperParams): Promise<IQuoteResult[] | undefined> {
  if (!apiKey) console.warn("missing env.UNIZEN_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertQuoteParams(o);
  const url = `${apiRoot}/${params.chainId}/quote/single?${qs.stringify(params, { skipNulls: true})}`;
  try {
    const res = await fetch(url, {
      headers: apiKey ? { "x-api-key": apiKey } : {},
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.() ?? '?'}`);
    return await res.json();
  } catch (e) {
    console.error(`getSingleChainQuote failed: ${e}`);
  }
}

// cf. https://api.zcx.com/trade/docs#/Cross%20chain%20methods/QuoteCrossController_getCrossQuote
// Get a quote for your desired transfer.
export async function getCrossChainQuote(o: ISwapperParams): Promise<ICrossQuoteResult[] | undefined> {
  if (!apiKey) console.warn("missing env.UNIZEN_API_KEY, using public");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertQuoteParams(o);
  const url = `${apiRoot}/${params.chainId}/quote/cross?${qs.stringify(params, { skipNulls: true})}`;
  try {
    const res = await fetch(url, {
      headers: apiKey ? { "x-api-key": apiKey } : {},
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.() ?? '?'}`);
    return await res.json();
  } catch (e) {
    console.error(`getCrossChainQuote failed: ${e}`);
  }
}

// cf. https://api.zcx.com/trade/docs#/Single%20chain%20methods/SwapSingleController_getSingleSwap
// Generate trade data for an on-chain swap.
export async function getSwapData(chainId: number, transactionData: TransactionData | CrossChainTransactionData, nativeValue: string, account: string, receiver: string, tradeType?: number): Promise<SwapData | undefined> {
  if (!apiKey) console.warn("missing env.UNIZEN_API_KEY, using public");
  const swapType = tradeType ? "single": "cross";
  const url = `${apiRoot}/${chainId}/swap/${swapType}`;
  const body = tradeType 
    ? {
      transactionData,
      nativeValue,
      account,
      receiver: receiver || account,
      tradeType
    } 
    : {
      transactionData,
      nativeValue,
      account,
      receiver: receiver || account
    } ;
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body), 
      headers: apiKey ? 
        { 
          "x-api-key": apiKey, 
          "Content-Type": "application/json" 
        } :
        {
          "Content-Type": "application/json"
        },
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.() ?? '?'}`);
    return await res.json();
  } catch (e) {
    console.error(`getSwapData failed: ${e}`);
  }
}
