import qs from "qs";

import {
  addEstimatesToTransactionRequest
} from "../";

import {
  ISwapperParams,
  validateQuoteParams,
  ITransactionRequestWithEstimate,
} from "../types";

// UNIZEN speicifc types
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

export const routerV1ByChainId: { [id: string]: string } = {
  "ethereum" : "0xd3f64BAa732061F8B3626ee44bab354f854877AC",
  "bsc": "0x880E0cE34F48c0cbC68BF3E745F17175BA8c650e",
  "polygon": "0x07d0ac7671D4242858D0cebcd34ec03907685947",
  "avax": "0x1C7F7e0258c81CF41bcEa31ea4bB5191914Bf7D7",
  "fantom": "0xBE2A77399Cde40EfbBc4e89207332c4a4079c83D",
  "arbitrum": "0x1C7F7e0258c81CF41bcEa31ea4bB5191914Bf7D7",
  "optimism": "0xad1D43efCF92133A9a0f33e5936F5ca10f2b012E",
  "base": "0x4F68248ecB782647D1E5981a181bBe1bfFee1040"
};

export const routerV2ByChainId: { [id: string]: string } = {
  "ethereum": "0xf140bE1825520F773Ff0F469786FCA65c876885f",
  "bsc": "0x12067e4473a1f00e58fa24e38e2cf3e53e21a33d",
  "polygon": "0x85f8fb7ac814d0a6a0b16bc207df5bbc631f1ca6",
  "avax": "0x468ae09BD4c8B4D9f7601e37B6c061776FeCFE3B",
  "fantom": "0xD38559966E53B651794aD4df6DDc190d2235180E",
  "arbitrum": "0x9660b95fcDBA4B0f5917C47b703179E03a28bf27",
  "optimism": "0x3ce6e87922e62fc279152c841102eb2bf5497010"
};

export const routerV3ByChainId: { [id: string]: string } = {
  "ethereum": "0xCf2DBA4e5C9f1B47AC09dc712A0F7bD8eE31A15d",
  "bsc": "0xa9c430de6a91132330A09BE41f9f19bf45702f74",
  "polygon": "0xCf2DBA4e5C9f1B47AC09dc712A0F7bD8eE31A15d",
  "avax": "0xa9c430de6a91132330A09BE41f9f19bf45702f74",
  "arbitrum": "0xa9c430de6a91132330A09BE41f9f19bf45702f74",
  "optimism": "0xa9c430de6a91132330A09BE41f9f19bf45702f74",
  "base": "0xa9c430de6a91132330A09BE41f9f19bf45702f74"
};

const apiRoot = "http://api.zcx.com/trade/v1";
const apiKey = process.env?.UNIZEN_API_KEY;

const getExcludedDexesList = (o: ISwapperParams): Map<string,string[]> => {
  let res = new Map<string, string[]>();
  if (o.denyExchanges?.length){
    res.set(String(o.inputChainId), o.denyExchanges?.concat(o.denyBridges ?? []));
    if (o.outputChainId != undefined){
      res.set(String(o.outputChainId), o.denyExchanges?.concat(o.denyBridges ?? []))
    }
  }
  return res;
}

const getTargetAddress = (version: string, chainId: number) : string => {
  switch(version){
    case "v1":
      return routerV1ByChainId[networkById[chainId]]
    case "v2":
      return routerV2ByChainId[networkById[chainId]]
    case "v3":
      return routerV3ByChainId[networkById[chainId]]
  }
  return "";
}

export const convertQuoteParams = (o: ISwapperParams): IQuoteParams => ({
  fromTokenAddress: o.input,
  chainId: String(o.inputChainId),
  toTokenAddress: o.output,
  destinationChainId: o.outputChainId != undefined ? String(o.outputChainId) : undefined,
  amount: String(o.amountWei),
  sender: o.payer,
  receiver: o.receiver ?? undefined,
  slippage: o.maxSlippage,
  deadline: o.deadline,
  isSplit: false,
  excludedDexes: getExcludedDexesList(o),
});



export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate | undefined> {
  const isCrossSwap = o.outputChainId != undefined;
  const quotes = isCrossSwap ? await getCrossChainQuote(o) : await getSingleChainQuote(o);
  if (!quotes?.length) return;
  const bestQuote = quotes[0];
  const tradeType = isCrossSwap ? undefined : (bestQuote as IQuoteResult).tradeType;
  const swapData = await getSwapData(o.inputChainId, bestQuote.transactionData, bestQuote.nativeValue, o.payer, o.receiver ?? o.payer, tradeType);
  const tr = {
    from: o.payer,
    to: getTargetAddress(swapData!.contractVersion, o.inputChainId),
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
  const quoteType = params.destinationChainId != undefined ? "cross": "single";
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
  const swapType = tradeType != undefined ? "single": "cross";
  const url = `${apiRoot}/${chainId}/swap/${swapType}`;
  const body = tradeType != undefined 
    ? {
      transactionData : transactionData,
      nativeValue: nativeValue,
      account: account,
      receiver: receiver,
      tradeType: tradeType
    } 
    : {
      transactionData : transactionData,
      nativeValue: nativeValue,
      account: account,
      receiver: receiver
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
