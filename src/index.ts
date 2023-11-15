import * as OneInch from "./OneInch";
import * as ZeroX from "./ZeroX";
import * as ParaSwap from "./ParaSwap";
import * as KyberSwap from "./KyberSwap";
import * as Squid from "./Squid";
import * as LiFi from "./LiFi";
import * as Socket from "./Socket";

import { Aggregator, AggregatorId, ISwapperParams, ITransactionRequestWithEstimate, Stringifiable } from "./types";

// aggregatorId to aggregator mapping used by meta-aggregating getTransactionRequest
export const aggregatorById: { [key: string]: Aggregator } = {
  [AggregatorId.ONE_INCH]: <Aggregator>OneInch,
  [AggregatorId.ZERO_X]: <Aggregator>ZeroX,
  [AggregatorId.PARASWAP]: <Aggregator>ParaSwap,
  [AggregatorId.KYBERSWAP]: <Aggregator>KyberSwap,
  [AggregatorId.SQUID]: <Aggregator>Squid,
  [AggregatorId.LIFI]: <Aggregator>LiFi,
  [AggregatorId.SOCKET]: <Aggregator>Socket,
};

/**
 * Extracts the `callData` from the `transactionRequest` (if any).
 * @param o - The swapper parameters.
 * @returns A promise that resolves to a string representing the call data.
 */
export async function getCallData(o: ISwapperParams): Promise<string> {
  return (await getTransactionRequest(o))?.data?.toString() ?? ""; // res.to == router address
}

/**
 * Gets the meta-aggregated (best) transaction request for given swap parameters from at least one aggregator.
 * @param o - The swapper parameters.
 * @returns A promise that resolves to the transaction request with an estimate, or `undefined` if none found.
 */
export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  o.aggregatorId ??= [AggregatorId.LIFI, AggregatorId.SQUID, AggregatorId.SOCKET];
  o.project ??= "astrolab";
  o.amountWei = weiToString(o.amountWei as any);
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

export const weiToString = (wei: string|number|bigint|Stringifiable) => {
  if (typeof wei === "string") {
      return wei;
  } else if (typeof wei === "number") {
      wei = BigInt(Math.round(wei));
    return wei.toString();
  } else {
    return wei.toString();
  }
};

// round wei to a compact printable number (exponential notation)
export function compactWei(wei: number|string|BigInt) {
  wei = Math.round(Number(wei)/1e4) * 1e4;
  return wei.toExponential().replace(/\.0+e/, 'e');
}

export function shortenAddress(address: string, start=4, end=4, sep="."): string {
  const len = address.length;
  return address.slice(0, 2 + start) + sep + address.slice(len - end, len);
}

/**
 * Converts swapper parameters into a human-readable string format.
 * @param o - The swapper parameters.
 * @param callData - The call data (optional).
 * @returns A human-readable string representation of the swapper parameters.
 */
export function swapperParamsToString(o: ISwapperParams, callData?: string) {
  return `${o.aggregatorId ? o.aggregatorId : 'Meta'} swap: ${o.inputChainId}:${shortenAddress(o.input)} (${compactWei(Number(o.amountWei))} wei) -> ${
      o.outputChainId ?? o.inputChainId}:${shortenAddress(o.output)}${
        callData ? ` (callData: ${callData.substring(0, 32)}... ${callData.length}bytes)` : ""}`;
}

// estimate normalization from bridge/dex aggregator consisting of the transactionRequest and raw estimated transaction output
export interface IEstimateParams {
  tr: ITransactionRequestWithEstimate;
  inputAmountWei: bigint;
  outputAmountWei: bigint;
  inputDecimals: number;
  outputDecimals: number;
}

/**
 * Normalizes `IEstimateParams` into `ITransactionRequestWithEstimate` with comparable exchange rate and estimated output.
 * @param o - The estimate parameters.
 * @returns The transaction request with estimates.
 */
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
