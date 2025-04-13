import { BaseAggregator } from "@/abstract";
import config from "@/config";
import { aggregatorsWithContractCalls, defaultAggregators, MAX_SLIPPAGE_BPS } from "@/constants";
import { firebirdAggregator } from "@/Firebird";
import { kyberSwapAggregator } from "@/KyberSwap";
import { lifiAggregator } from "@/LiFi";
import { odosAggregator } from "@/Odos";
import { oneInchAggregator } from "@/OneInch";
import { openOceanAggregator } from "@/OpenOcean";
import { paraSwapAggregator } from "@/ParaSwap";
import { rangoAggregator } from "@/Rango";
import { socketAggregator } from "@/Socket";
import { squidAggregator } from "@/Squid";
import {
  AggId,
  IBtrSwapParams,
  IBtrSwapCliParams,
  ITransactionRequestWithEstimate,
  DisplayMode,
  SerializationMode,
} from "@/types";
import { unizenAggregator } from "@/Unizen";
import {
  paramsToString,
  sortTrsByRate,
  trToString,
  compactTrs,
  getTrPerformance,
  getTrPerformanceTable,
  serialize,
  getToken,
} from "@/utils";
import { zeroXAggregator } from "@/ZeroX";

/** Mapping of AggId to its corresponding Aggregator implementation instance. */
export const aggregatorById: { [key: string]: BaseAggregator } = {
  // Meta-Aggregators
  [AggId.SQUID]: squidAggregator,
  [AggId.LIFI]: lifiAggregator,
  [AggId.SOCKET]: socketAggregator,
  [AggId.RANGO]: rangoAggregator,
  [AggId.UNIZEN]: unizenAggregator,

  // Passive liquidity aggregators
  [AggId.ONE_INCH]: oneInchAggregator,
  [AggId.ZERO_X]: zeroXAggregator,
  [AggId.PARASWAP]: paraSwapAggregator,
  [AggId.KYBERSWAP]: kyberSwapAggregator,
  [AggId.ODOS]: odosAggregator,
  [AggId.FIREBIRD]: firebirdAggregator,
  [AggId.OPENOCEAN]: openOceanAggregator,
};

/**
 * Fetches the transaction request and extracts only the `data` (calldata) field.
 * Useful for scenarios where only the calldata is needed without executing the transaction.
 * @param o - BTR Swap parameters.
 * @returns A promise resolving to the transaction calldata string, or an empty string if no data is found.
 */
export async function getCallData(o: IBtrSwapParams): Promise<string> {
  // Fetches the best transaction request and returns its data field.
  return (await getBestTransactionRequest(o))?.data?.toString() ?? "";
}

/**
 * Fetches transaction requests from multiple aggregators and sorts by best exchange rate.
 * @param o - BTR Swap parameters.
 * @returns Array of successful transaction requests sorted by rate, or undefined if none succeed.
 * @throws {Error} If no viable routes are found.
 */
export async function getAllTimedTr(
  o: IBtrSwapParams,
): Promise<ITransactionRequestWithEstimate[] | undefined> {
  // Set default aggregators based on requirements
  o.aggIds ??= o.customContractCalls?.length ? aggregatorsWithContractCalls : defaultAggregators;
  if (!(o.aggIds instanceof Array)) o.aggIds = [o.aggIds];
  o.expiryMs ??= 5_000; // 5s timeout

  // Fetch quotes concurrently with timeout
  const trs = (
    await Promise.all(
      o.aggIds.map(async (aggId: string): Promise<ITransactionRequestWithEstimate | undefined> => {
        const aggregator = aggregatorById[aggId];
        if (!aggregator) throw new Error(`Aggregator not found: ${aggId}`);

        try {
          const timeoutPromise = new Promise<undefined>((resolve) =>
            setTimeout(() => resolve(undefined), o.expiryMs),
          );

          const tr = await Promise.race([aggregator.getTimedTr(o), timeoutPromise]);
          if (tr && !tr.aggId) tr.aggId = aggregator.id;
          return tr;
        } catch (e) {
          console.error(`[${aggId}] Error retrieving tx`, e);
          return undefined;
        }
      }),
    )
  ).filter(Boolean) as ITransactionRequestWithEstimate[];

  if (trs.length === 0) {
    throw new Error(
      `No viable routes found for ${paramsToString(o)} across aggregators: ${o.aggIds.join(", ")}`,
    );
  }

  // Sort by best rate and ensure correct payer address
  const sortedTrs = sortTrsByRate(trs);
  sortedTrs.forEach((tr) => {
    if (tr?.data) tr.from = o.payer;
  });

  // Preserve original aggregator IDs
  const originalAggIds = [...o.aggIds];
  o.aggIds = originalAggIds;

  console.log(
    `${sortedTrs.length} routes found for ${paramsToString(o)} (best: ${sortedTrs[0].aggId}):\n${sortedTrs
      .map((tr) => trToString(tr))
      .join("\n")}`,
  );

  return sortedTrs;
}

/**
 * Gets the single best transaction request from the available aggregators based on estimated exchange rate.
 * The result can be formatted for logging using trToString().
 * @param o - BTR Swap parameters.
 * @returns A promise resolving to the best transaction request, or undefined if none found.
 */
export const getBestTransactionRequest = async (
  o: IBtrSwapParams,
): Promise<ITransactionRequestWithEstimate | undefined> => (await getAllTimedTr(o))?.[0];

// Export types and functions needed by the CLI and other consumers
export { AggId, defaultAggregators, MAX_SLIPPAGE_BPS, DisplayMode, SerializationMode };
export { config };
export { compactTrs, getTrPerformance, getTrPerformanceTable, serialize, getToken };
export type { IBtrSwapParams, IBtrSwapCliParams, ITransactionRequestWithEstimate };
