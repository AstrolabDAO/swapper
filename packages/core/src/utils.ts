import { addresses } from "@/constants";
import {
  ICostEstimate,
  IQuotePerformance,
  ISwapEstimate,
  IBtrSwapParams,
  IToken,
  ITransactionRequestWithEstimate,
  SerializationMode,
  Stringifiable,
  TokenInfoTuple,
  TransactionRequest,
  AggId,
} from "@/types";

// Type alias for header configuration
export type HeaderConfig = string[] | Record<string, string>;

/**
 * Sanitizes values for serialization.
 * @param val - The value to sanitize.
 * @returns The sanitized value as a string.
 */
function sanitize(val: any): string {
  if (val === undefined) return "undefined";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "bigint" || typeof val === "function" || typeof val === "symbol")
    return val.toString();
  if (typeof val === "number" && !Number.isFinite(val)) return val.toString();
  return val;
}
/**
 * Flattens an object into a single-level object with dot notation keys.
 * @param o - Object to flatten
 * @param prefix - Key prefix
 * @param out - Output accumulator
 * @returns Flattened object
 */
function flatten(o: any, prefix = "", out: Record<string, any> = {}): Record<string, any> {
  for (const [k, v] of Object.entries(o)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if (Array.isArray(v)) {
        if (v.some((item) => item && typeof item === "object" && !(item instanceof Date))) {
          v.forEach((item, index) => flatten(item, `${path}[${index}]`, out));
        } else {
          out[path] = v;
        }
      } else {
        flatten(v, path, out);
      }
    } else {
      out[path] = v;
    }
  }
  return out;
}

/**
 * Converts an object to a JSON string with sanitized values.
 * @param o - The object to convert.
 * @param spaces - The number of spaces to use for formatting.
 * @returns The JSON string.
 */
export const toJSON = (o: any, spaces = 2): string =>
  JSON.stringify(o, (_, val) => sanitize(val), spaces);

/**
 * Prepares data for CSV/Table conversion by flattening objects and organizing headers and rows.
 * Handles both string array headers and key-to-header mapping.
 * Formats numbers and arrays consistently.
 * @param rows - The array of objects to convert.
 * @param includeHeader - Whether to include the header row.
 * @param headers - Optional header configuration (array or key-to-header map).
 * @returns An array where the first element is headers (if includeHeader is true) and the rest are formatted data rows.
 */
export function toCSVData(
  rows: Record<string, any>[],
  includeHeader = true,
  headers?: HeaderConfig,
): string[][] {
  if (!rows.length) return includeHeader ? [[]] : [];
  const flattenedRows = rows.map((r) => flatten(r));

  let displayHeaders: string[];
  let dataKeys: string[];

  if (Array.isArray(headers)) {
    displayHeaders = headers;
    dataKeys = headers;
  } else if (headers) {
    displayHeaders = Object.values(headers);
    dataKeys = Object.keys(headers);
  } else {
    displayHeaders = [...new Set(flattenedRows.flatMap(Object.keys))];
    dataKeys = displayHeaders;
  }

  // Apply formatting *before* sanitizing
  const dataRows = flattenedRows.map((r) =>
    dataKeys.map((key) => {
      let value = r[key];
      if (value !== null && value !== undefined) {
        if (typeof value === "number") {
          // Format floats to 3 decimal places, keep integers as is
          value = Number.isInteger(value) ? value : value.toFixed(3);
        }
        if (Array.isArray(value)) {
          value = (value as string[]).join("|"); // Join all arrays with pipe separator
        }
      }
      return sanitize(value ?? ""); // Sanitize after potential formatting
    }),
  );

  return includeHeader ? [displayHeaders, ...dataRows] : dataRows;
}

/**
 * Converts an array of objects to a CSV string.
 * @param rows - The array of objects to convert.
 * @param includeHeader - Whether to include the header row.
 * @param headers - Optional header configuration (array or key-to-header map).
 * @param separator - The separator to use between values (default: comma).
 * @returns The CSV string.
 */
export function toCSV(
  rows: Record<string, any>[],
  includeHeader = true,
  headers?: HeaderConfig,
  separator = ",",
): string {
  const data = toCSVData(rows, includeHeader, headers);
  if (!data.length) return "";

  const escape = (val: any): string => {
    const str = String(val ?? "");
    return new RegExp(`["${separator}\n]`).test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  return data.map((row) => row.map(escape).join(separator)).join("\n");
}
/**
 * Converts an array of objects to a table string.
 * @param rows - The array of objects to convert.
 * @param options - The options for the table.
 * @returns The table string.
 */
export function toTable(
  rows: Record<string, any>[],
  {
    includeHeader = true,
    headers,
    columnWidths = 12,
    padding = 1,
  }: {
    includeHeader?: boolean;
    headers?: HeaderConfig;
    columnWidths?: number | number[];
    padding?: number;
  } = {},
): string {
  const data = toCSVData(rows, includeHeader, headers);
  if (!data.length || !data[0].length) return "";

  const widths = Array.isArray(columnWidths)
    ? data[0].map((_, i) => columnWidths[i] ?? 12)
    : Array(data[0].length).fill(columnWidths);

  const formatCell = (v: any, w: number): string => {
    const s = String(v ?? "");
    const pad = " ".repeat(padding);
    const contentWidth = w - padding * 2;

    return s.length > contentWidth
      ? `${pad}${s.slice(0, contentWidth - 1)}…${pad}`
      : `${pad}${s.padEnd(contentWidth)}${pad}`;
  };

  const makeDiv = (start: string, mid: string, end: string) =>
    start + widths.map((w) => "─".repeat(w)).join(mid) + end;

  const divider = makeDiv("┌", "┬", "┐");
  const bottomDiv = makeDiv("└", "┴", "┘");
  const midDiv = includeHeader && data.length > 1 ? makeDiv("├", "┼", "┤") : "";

  const tableRows = data.map((r) => `│${r.map((c, i) => formatCell(c, widths[i])).join("│")}│`);

  return [
    divider,
    includeHeader ? tableRows[0] : null,
    midDiv || null,
    ...(includeHeader ? tableRows.slice(1) : tableRows),
    bottomDiv,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Serializes an object to JSON or CSV format.
 * @param o - Object to serialize
 * @param options - Serialization options
 * @returns Serialized string
 */
export function serialize(
  o: any,
  options: {
    mode?: SerializationMode;
    spaces?: number;
    headers?: HeaderConfig; // Updated type
    includeHeader?: boolean;
    separator?: string;
    columnWidths?: number | number[];
    padding?: number;
  } = {},
): string {
  const {
    mode = SerializationMode.JSON,
    spaces = 2,
    includeHeader = true,
    headers = undefined,
    separator = ",",
    columnWidths = 12,
    padding = 1,
  } = options;

  switch (mode) {
    case SerializationMode.JSON:
      return toJSON(typeof o === "object" && o !== null ? o : { value: o }, spaces);
    case SerializationMode.CSV:
      return toCSV(
        Array.isArray(o) ? o : [typeof o === "object" && o !== null ? o : { value: o }],
        includeHeader,
        headers,
        separator,
      );
    case SerializationMode.TABLE:
      return toTable(
        Array.isArray(o) ? o : [typeof o === "object" && o !== null ? o : { value: o }],
        { includeHeader, headers, columnWidths, padding },
      );
    default:
      throw new Error(`Unsupported serialization mode: ${mode}`);
  }
}

/**
 * Checks if a string is a valid Ethereum address format.
 * @param s - The string to check.
 * @returns True if the string matches the Ethereum address pattern, false otherwise.
 */
export const isAddress = (s?: string): boolean => !!s && /^0x[a-fA-F0-9]{40}$/.test(s);

/**
 * Converts a token format to an IToken object.
 * @param t - The token as symbol, address, cli (chainId:address(:symbol(:decimals))) or TokenInfoTuple
 * @param chainId - The chain ID.
 * @returns The IToken object.
 */
export const getToken = (t: TokenInfoTuple | string, chainId = 1): IToken => {
  if (typeof t === "string") {
    if (t.includes(":")) {
      // Parse CLI token format
      const parts = t.split(":");
      if (parts.length < 2) {
        throw new Error(
          `[getToken] Invalid token format: ${t}. Expected chainId:address(:symbol(:decimals))`,
        );
      }
      chainId = Number(parts[0]);
      const address = parts[1].startsWith("0x")
        ? parts[1]
        : addresses[chainId].tokens[parts[1]]?.[0];
      const symbol = parts[2] || addresses[chainId].tokens?.[address]?.[1];
      const decimals = Number(parts[3] || 18);
      t = [address, symbol, decimals] as TokenInfoTuple;
    } else {
      // Lookup by address
      t = addresses[chainId].tokens[t];
    }
  }

  if (!t) throw new Error(`[getToken] Token not found: ${t}`);

  return {
    chainId,
    address: t[0],
    name: t[1],
    symbol: t[1],
    decimals: t[2] || 18,
  };
};

/**
 * Safely converts a value to BigInt, handling common types.
 * Returns 0n for unrecognized or invalid inputs.
 * @param value - The value to convert (string, number, boolean, bigint, or object with toString).
 * @returns The BigInt representation, or 0n if conversion fails.
 */
export const toBigInt = (value: any): bigint => {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(Math.floor(value));
    if (typeof value === "string") return BigInt(value.trim());
    if (typeof value === "boolean") return BigInt(value ? 1 : 0);
    if (value?.toString) {
      const str = value.toString().trim();
      if (str && !isNaN(Number(str))) return BigInt(str);
    }
  } catch (e) {
    console.error(`[toBigInt] Error converting value: ${value}`, e);
  }
  return 0n;
};

/**
 * Helper to get env var or null
 * @param key - The environment variable name.
 * @returns The value as a string, or null.
 */
export const envOrNull = (key: string): string | null => process.env[key] ?? null;

/**
 * Helper to parse int env var or return default
 * @param key - The environment variable name.
 * @param defaultValue - The default integer value to return on failure.
 * @returns The parsed integer value or the default value.
 */
export const envInt = (key: string, defaultValue: number): number => {
  const value = envOrNull(key);
  if (value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Retrieves an environment variable for an API root URL.
 * Ensures proper URL formatting with protocol.
 * @param key - The environment variable name.
 * @param fallbackRoot - The fallback root domain.
 * @returns The API root domain with protocol.
 */
export const envApiRoot = (key: string, fallbackRoot: string): string => {
  const value = process.env[key];
  const urlToUse = value?.trim() || fallbackRoot;
  const url =
    urlToUse.startsWith("http://") || urlToUse.startsWith("https://")
      ? urlToUse
      : `https://${urlToUse}`;
  return url.replace(/\/$/, "");
};

/**
 * Creates a new object with same keys but values derived from the keys.
 * @param o - Input object with string keys/values
 * @param fn - Optional key transform function (default: identity)
 * @example mapKToKV({foo: "x"}) // {foo: "foo"}
 */
export const mapKToKV = (
  o: Record<string, string>,
  fn: (k: string) => string = (k) => k,
): Record<string, string> => Object.fromEntries(Object.keys(o).map((k) => [k, fn(k)]));

/**
 * Removes the protocol part (http:// or https://) from a URL.
 * @param url - The URL to strip the protocol from.
 * @returns The URL without the protocol part.
 */
export const stripProtocol = (url: string): string =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * Creates a default gas estimate object with zero values.
 * Used when actual gas costs are unknown or unavailable.
 * @returns A zeroed IGasEstimate object
 */
export const emptyCostEstimate = (): ICostEstimate => ({
  gasCostUsd: 0,
  gasCostWei: 0n,
  feeCostUsd: 0,
  feeCostWei: 0n,
});

export const emptySwapEstimate = (): ISwapEstimate => ({
  input: 0,
  inputWei: 0n,
  output: 0,
  outputWei: 0n,
  slippage: 0,
  exchangeRate: 0,
});

export const emptyEstimate = (): ISwapEstimate & ICostEstimate => ({
  ...emptySwapEstimate(),
  ...emptyCostEstimate(),
});

export const notImplemented = (method: string): never => {
  throw new Error(`${method} is not implemented`);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Creates an Error with formatted message including status code and response data */
export const formatError = (msg: string, status?: number, data?: any): Error =>
  new Error(
    [
      msg,
      status && `(HTTP ${status})`,
      data &&
        (() => {
          try {
            const d =
              typeof data === "string" ? data.slice(0, 100) : JSON.stringify(data)?.slice(0, 100);
            return `: ${d}${d.length > 100 ? "..." : ""}`;
          } catch {
            return `: [${typeof data} data]`;
          }
        })(),
    ]
      .filter(Boolean)
      .join(" "),
  );

/** Interface for fetch options (extends RequestInit). */
export type FetchOptions = RequestInit;

/**
 * Fetches JSON data from a URL with error handling and type safety.
 * @param url - The URL to fetch.
 * @param options - Optional fetch options.
 * @param method - Optional HTTP method (defaults to GET).
 * @returns Promise resolving to parsed JSON data of type T.
 * @throws {Error} On fetch failure, non-OK status, or JSON parsing errors.
 */
export async function fetchJson<T = unknown>(
  url: string | URL,
  options?: FetchOptions,
  method?: string,
): Promise<T> {
  const effectiveMethod = method ?? options?.method ?? "GET";

  try {
    console.debug(`>>>req [${effectiveMethod}] ${url}`);
    const response = await fetch(url, { ...options, method: effectiveMethod });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => response.text().catch(() => "Could not read error response body"));
      throw formatError(
        `API error ${response.status} calling ${effectiveMethod} ${url}`,
        response.status,
        errorData,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error(
          `Error calling ${effectiveMethod} ${url}: ${error instanceof Error ? error.message : "Network error"}`,
        );
  }
}

/**
 * Creates a URL query string from a record of parameters.
 * Uses URLSearchParams and filters out null/undefined values.
 * Does not handle complex nested objects/arrays like the 'qs' library.
 * @param params - Object containing query parameters.
 * @returns A URL-encoded query string.
 */
export function buildQueryParams(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * Converts a WEI value (string, number, bigint, or Stringifiable object) to a string.
 * Rounds numbers before converting to BigInt.
 * @param wei - The WEI value to convert.
 * @returns The WEI value as a string.
 */
export const weiToString = (wei: string | number | bigint | Stringifiable): string => {
  if (typeof wei === "string") return wei;
  if (typeof wei === "number") return BigInt(Math.round(wei)).toString();
  return wei.toString(); // For bigint and Stringifiable objects
};

/**
 * Rounds a WEI value and returns a compact string representation using exponential notation.
 * Useful for displaying large numbers concisely.
 * @param wei - The WEI value (number, string, or BigInt).
 * @returns A compact string representation (e.g., "1.23e18").
 */
export function compactWei(wei: number | string | bigint | Stringifiable): string {
  const numWei = typeof wei === "object" ? Number(wei.toString()) : Number(wei);
  const roundedWei = Math.round(numWei / 1e4) * 1e4;
  if (!isFinite(roundedWei)) return "0";
  return roundedWei.toExponential().replace(/\.0+e/, "e");
}

/**
 * Shortens an Ethereum address for display purposes.
 * @param address - The full Ethereum address string.
 * @param start - Number of characters to show after "0x". Defaults to 4.
 * @param end - Number of characters to show at the end. Defaults to 4.
 * @param sep - Separator string between start and end parts. Defaults to ".".
 * @returns The shortened address string (e.g., "0x1234.5678").
 */
export function shortenAddress(address: string, start = 4, end = 4, sep = "."): string {
  const safeStart = Math.max(0, start);
  const safeEnd = Math.max(0, end);
  if (2 + safeStart + safeEnd >= address.length) return address;
  return address.slice(0, 2 + safeStart) + sep + address.slice(-safeEnd);
}

/**
 * Creates a compact transaction request object by removing non-essential properties.
 * @param tr - The transaction request object to compact.
 * @returns A compact transaction request object.
 */
export const compactTr = (tr: TransactionRequest): TransactionRequest => ({
  nonce: tr.nonce,
  to: tr.to,
  value: tr.value,
  data: tr.data,
});

/**
 * Creates a compact transaction request object by removing non-essential properties.
 * @param trs - The transaction request object to compact.
 * @returns A compact transaction request object.
 */
export const compactTrs = (trs: TransactionRequest[]): TransactionRequest[] => trs.map(compactTr);

/**
 * Converts BTR Swap parameters into a human-readable string for logging/debugging.
 * @param o - BTR Swap parameters.
 * @param callData - Optional transaction call data to include partially.
 * @returns A formatted string summarizing the swap details.
 */
export function paramsToString(o: IBtrSwapParams, callData?: string): string {
  const aggId = o.aggIds!.length > 2 ? `Meta:${o.aggIds!.length}` : o.aggIds!.join(",");
  return `[${aggId}] ${Number(o.inputAmountWei) / 10 ** o.input.decimals} ${o.input.symbol} (${o.input.chainId}:${shortenAddress(o.input.address!)}) → ${o.output.symbol} (${o.output.chainId}:${shortenAddress(o.output.address!)}) ${
    callData ? ` [data: ${callData.substring(0, 10)}...${callData.length}b]` : ""
  }`;
}

/**
 * Converts a transaction request with estimate into a human-readable string for logging/debugging.
 * @param tr - The transaction request with estimate object
 * @returns A formatted string summarizing the transaction details
 */
export function trToString(tr: ITransactionRequestWithEstimate): string {
  if (!tr) return "Empty transaction request";

  // Extract input/output symbols from steps if available
  const lastStep = tr.steps?.[tr.steps.length - 1];
  const output = lastStep?.output;
  const outputAmount = lastStep?.estimates?.output || "0";
  const exchangeRate = lastStep?.estimates?.exchangeRate || 0;

  return `[${tr.aggId || "???"}] router: ${shortenAddress(tr.to || "???")} → ${outputAmount} ${output?.symbol || "???"} ${output?.address || "???"} | Rate: ${Number(exchangeRate).toFixed(6)} | Gas: $${
    lastStep?.estimates?.gasCostUsd?.toFixed(3) || "0"
  } | Fee: $${lastStep?.estimates?.feeCostUsd?.toFixed(3) || "0"}${
    tr.steps?.length ? ` | Steps: ${tr.steps.length}` : ""
  }`;
}

/** Combines transaction data with swap parameters and estimates to create final request object */
export function addEstimatesToTr(
  o: Partial<ITransactionRequestWithEstimate>,
): ITransactionRequestWithEstimate {
  const { params, steps, to } = o;
  if (!params || !steps || !to) throw new Error("Missing required transaction request fields");

  const {
    input: { decimals: inputDecimals },
    output: { decimals: outputDecimals },
    inputAmountWei,
  } = params;
  const lastStep = steps[steps.length - 1];
  const inputAmountWeiBig = BigInt(inputAmountWei.toString());
  const outputAmountWeiBig = BigInt(lastStep?.estimates?.outputWei?.toString() ?? "0");

  const globalEstimates = {
    ...emptyEstimate(),
    gasCostUsd: steps.reduce((sum, s) => sum + (Number(s.estimates?.gasCostUsd) || 0), 0),
    gasCostWei: steps.reduce((sum, s) => sum + toBigInt(s.estimates?.gasCostWei || 0), 0n),
    feeCostUsd: steps.reduce((sum, s) => sum + (Number(s.estimates?.feeCostUsd) || 0), 0),
    feeCostWei: steps.reduce((sum, s) => sum + toBigInt(s.estimates?.feeCostWei || 0), 0n),
    slippage: steps.reduce((max, s) => Math.max(max, Number(s.estimates?.slippage) || 0), 0),
    input:
      inputAmountWeiBig > 0n && inputDecimals > 0
        ? Number(inputAmountWeiBig / 10n ** BigInt(Math.max(inputDecimals - 6, 0))) /
          10 ** (inputDecimals - Math.max(inputDecimals - 6, 0))
        : 0,
    inputWei: inputAmountWeiBig,
    output:
      outputAmountWeiBig > 0n && outputDecimals > 0
        ? Number(outputAmountWeiBig / 10n ** BigInt(Math.max(outputDecimals - 6, 0))) /
          10 ** (outputDecimals - Math.max(outputDecimals - 6, 0))
        : 0,
    outputWei: outputAmountWeiBig,
    exchangeRate: 0, // Initialized below
  };
  globalEstimates.exchangeRate =
    globalEstimates.input > 0 ? globalEstimates.output / globalEstimates.input : 0;

  return {
    ...o,
    approvalAddress: to as string,
    globalEstimates,
  } as ITransactionRequestWithEstimate;
}

/** Validate core swap parameters (addresses, chain IDs, amounts) */
export const validateParams = (o: IBtrSwapParams): boolean => {
  if (typeof o?.input?.address !== "string") return false;
  const valid =
    [o.input?.address, o.output?.address, o.payer].every(isAddress) &&
    !isNaN(Number(o.input.chainId)) &&
    Number(o.input.chainId) > 0 &&
    (o.output.chainId === undefined || Number(o.output.chainId) > 0);

  try {
    return valid && BigInt(o.inputAmountWei?.toString() || 0) > 0n;
  } catch {
    return false;
  }
};

/** Get the exchange rate from a transaction request with estimate */
export const getExchangeRate = (tr: ITransactionRequestWithEstimate) =>
  Number(tr.globalEstimates?.exchangeRate ?? tr.steps?.slice(-1)[0]?.estimates?.exchangeRate ?? 0);

/** Sort transaction requests by exchange rate (descending) */
export const sortTrsByRate = (
  trs: ITransactionRequestWithEstimate[],
): ITransactionRequestWithEstimate[] =>
  !trs?.length ? trs : [...trs].sort((a, b) => getExchangeRate(b) - getExchangeRate(a));

/**
 * Measures the execution time of an async function.
 * @param fn - The async function to measure.
 * @returns A tuple with [result, latencyMs].
 */
export async function withLatency<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  return [await fn(), Math.round(performance.now() - start)];
}

/**
 * Extracts performance metrics from a transaction request with estimate
 * @param tr - The transaction request with estimate
 * @returns Performance metrics object
 */
export function getTrPerformance(tr: ITransactionRequestWithEstimate): IQuotePerformance {
  const estimates = tr.globalEstimates || {
    exchangeRate: 0,
    output: 0,
    gasCostUsd: 0,
    feeCostUsd: 0,
  };

  // Extract protocols from steps
  const protocols: string[] = tr.steps
    .filter((step) => step.protocol?.name)
    .map((step) => step.protocol!.name);

  return {
    aggId: tr.aggId || "???",
    exchangeRate: Number(estimates.exchangeRate) || NaN,
    output: Number(estimates.output) || NaN,
    gasCostUsd: Number(estimates.gasCostUsd) || NaN,
    feeCostUsd: Number(estimates.feeCostUsd) || NaN,
    latencyMs: tr.latencyMs || NaN,
    steps: tr.steps?.length || NaN,
    protocols,
  };
}

export function getTrPerformanceTable(trs: ITransactionRequestWithEstimate[]): string {
  if (!trs?.length) return "No transaction requests found.";
  const table = trs.map(getTrPerformance);
  const p = <IBtrSwapParams>{ ...trs[0].params, aggIds: [<AggId>`Meta:${trs.length}`] };
  return (
    paramsToString(p) +
    "\n" +
    serialize(table, {
      mode: SerializationMode.TABLE,
      headers: {
        aggId: "Agg ID",
        exchangeRate: "Rate",
        output: "Output",
        gasCostUsd: "Gas USD",
        feeCostUsd: "Fee USD",
        latencyMs: "Latency",
        steps: "Steps",
        protocols: "Protocols",
      },
      columnWidths: [8, 8, 10, 9, 9, 9, 7, 20],
      padding: 1,
    })
  );
}

export { SerializationMode } from "@/types";
