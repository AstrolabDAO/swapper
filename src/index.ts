import { weiToString } from "@astrolabs/hardhat";

import * as OneInch from "./OneInch";
import * as ZeroX from "./ZeroX";
import * as ParaSwap from "./ParaSwap";
import * as KyberSwap from "./KyberSwap";
import * as Squid from "./Squid";
import * as LiFi from "./LiFi";
import * as Socket from "./Socket";

import { Aggregator, AggregatorId, ISwapperParams, ITransactionRequestWithEstimate } from "./types";

export const aggregatorById: { [key: string]: Aggregator } = {
  [AggregatorId.ONE_INCH]: <Aggregator>OneInch,
  [AggregatorId.ZERO_X]: <Aggregator>ZeroX,
  [AggregatorId.PARASWAP]: <Aggregator>ParaSwap,
  [AggregatorId.KYBERSWAP]: <Aggregator>KyberSwap,
  [AggregatorId.SQUID]: <Aggregator>Squid,
  [AggregatorId.LIFI]: <Aggregator>LiFi,
  [AggregatorId.SOCKET]: <Aggregator>Socket,
};

export async function getCallData(o: ISwapperParams): Promise<string> {
  return (await getTransactionRequest(o))?.data?.toString() ?? ""; // res.to == router address
}

export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  o.aggregatorId ??= [AggregatorId.LIFI, AggregatorId.SQUID, AggregatorId.SOCKET];
  o.project ??= "astrolab";
  o.amountWei = weiToString(o.amountWei);
  o.maxSlippage ||= 2_000; // NOTE: 20% in bps (pessimistic slippage for tests)
  if (!(o.aggregatorId instanceof Array))
    o.aggregatorId = [o.aggregatorId];

  // compare quotes/routes
  let trs = (await Promise.all(
    o.aggregatorId.map(async (aggregatorId): Promise<ITransactionRequestWithEstimate|undefined> => {
      const aggregator = aggregatorById[aggregatorId];
      const tr = aggregator.getTransactionRequest(o);
      tr.then(tr => {
        if (tr) tr.aggregatorId = aggregatorId;
      });
    return tr;
  }))).filter(tr => !!tr) as ITransactionRequestWithEstimate[];

  if (trs.length == 0) {
    console.error(`No viable route found for ${swapperParamsToString(o)}`);
    return;
  }

  // find best exchange rate
  trs = trs.sort((tr1, tr2) => tr1!.estimatedExchangeRate! < tr2!.estimatedExchangeRate! ? 1 : -1);

  console.log(`${trs.length} routes found for ${swapperParamsToString(o)}:\n${
    trs.map(tr => tr.aggregatorId).join(" > ")}`);

  const best = trs[0];

  if (best?.data) {
    // get rid of testPayer in the transactionRequest
    (best.data as string)?.replace(best.from!.substring(2), o.payer.substring(2));
    // replace o.testPayer with o.payer
    best.from = o.payer;
  }
  return best;
}

export function shortAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function compactWei(wei: number|string|BigInt) {
  wei = Math.round(Number(wei)/1e4) * 1e4;
  return wei.toExponential().replace(/\.0+e/, 'e');
}

export function swapperParamsToString(o: ISwapperParams, callData?: string) {
  return `${o.aggregatorId ? o.aggregatorId : 'Meta'} swap: ${o.inputChainId}:${shortAddress(o.input)} (${compactWei(Number(o.amountWei))} wei) -> ${
      o.outputChainId ?? o.inputChainId}:${shortAddress(o.output)}${
        callData ? ` (callData: ${callData.substring(0, 32)}... ${callData.length}bytes)` : ""}`;
}

export interface IEstimateParams {
  tr: ITransactionRequestWithEstimate;
  inputAmountWei: bigint;
  outputAmountWei: bigint;
  inputDecimals: number;
  outputDecimals: number;
}

export function addEstimatesToTransactionRequest(o: IEstimateParams): ITransactionRequestWithEstimate {
  const roundExps = [Math.max(o.inputDecimals - 8, 3), Math.max(o.outputDecimals - 8, 3)];
  const amount = Number(BigInt(o.inputAmountWei) / BigInt(10 ** roundExps[0])) / (10 ** (o.inputDecimals - roundExps[0]));
  o.tr.estimatedOutput = Number(BigInt(o.outputAmountWei) / BigInt(10 ** roundExps[1])) / (10 ** (o.outputDecimals - roundExps[1]));
  o.tr.estimatedOutputWei = o.outputAmountWei.toString();
  o.tr.estimatedExchangeRate = o.tr.estimatedOutput / amount;
  return o.tr;
}

export * from "./types";
export {
  OneInch,
  ZeroX,
  ParaSwap,
  KyberSwap,
  Squid,
  LiFi,
  Socket
}
