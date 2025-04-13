import { assert } from "chai";

import { addresses, MAX_SLIPPAGE_BPS } from "@/constants";
import { getAllTimedTr } from "@/index";
import {
  AggId,
  ICostEstimate,
  ISwapEstimate,
  IBtrSwapParams,
  IBtrSwapCliParams,
  IToken,
  ITransactionRequestWithEstimate,
  TokenInfoTuple,
  DisplayMode,
  SerializationMode,
} from "@/types";
import {
  getToken,
  getTrPerformanceTable,
  paramsToString,
  sleep,
  toJSON,
  trToString,
  weiToString,
} from "@/utils";

// Re-export sleep from @/utils
export { sleep };

// Common chain IDs to test across major networks
export const TESTED_CHAIN_IDS = [1, 10, 56, 137, 42161]; // Ethereum, Optimism, BNB Chain, Polygon, Arbitrum

// Flagship tokens for high liquidity tests
export const FLAGSHIP_TOKENS = ["USDC", "USDT", "WETH", "WBTC"];

/**
 * Retrieves the payer address for a specific chain
 * @param chainId - The blockchain network ID
 * @returns The chain's default impersonated payer address
 */
export const getPayer = (chainId: number) =>
  addresses[chainId].accounts?.impersonate as `0x${string}`;

/**
 * Retrieves token information and payer address for a specific chain
 * @param chainId - The blockchain network ID
 * @param symbols - Array of token symbols where symbols[0] is input token and symbols[1] is output token
 * @returns Object containing input token info, output token info, and payer address
 * @throws Error if token information or payer address is missing
 */
export function getChainTokensAndPayer(
  chainId: number,
  symbols: string[],
  payer?: `0x${string}`,
): {
  input: IToken;
  output: IToken;
  payer: `0x${string}`;
} {
  const inputTuple = addresses[chainId].tokens[symbols[0]];
  const outputTuple = addresses[chainId].tokens[symbols[1]];
  payer ||= getPayer(chainId);

  if (!inputTuple?.[2] || !outputTuple?.[2] || !payer) {
    throw new Error(`[${chainId}] Missing token info or payer`);
  }

  return {
    input: getToken(inputTuple, chainId),
    output: getToken(outputTuple, chainId),
    payer,
  };
}

/** Create test case with specified parameters or random values */
export const createTestCase = ({
  aggId,
  inputChainId,
  outputChainId,
  inputToken,
  outputToken,
  amountWei,
  onlyFlagship = false,
  isCrossChain = false,
}: {
  aggId?: AggId;
  inputChainId?: number;
  outputChainId?: number;
  inputToken?: string;
  outputToken?: string;
  amountWei?: string | number | bigint;
  onlyFlagship?: boolean;
  isCrossChain?: boolean;
} = {}): IBtrSwapParams => {
  const availableChainIds = TESTED_CHAIN_IDS.filter((id) => addresses[id]?.accounts?.impersonate);
  if (!availableChainIds.length) throw new Error("No chains with impersonate accounts available");

  const getRandomChainId = (exclude?: number) => {
    const candidates = availableChainIds.filter((id) => id !== exclude);
    const pool = candidates.length ? candidates : availableChainIds;
    return (
      pool[Math.floor(Math.random() * pool.length)] ||
      (() => {
        throw new Error("No chain IDs available");
      })()
    );
  };

  const inChain = inputChainId ?? getRandomChainId();
  const outChain = outputChainId ?? (isCrossChain ? getRandomChainId(inChain) : inChain);
  [inChain, outChain].forEach((chain) => {
    if (!addresses[chain]) throw new Error(`No address data for chain ${chain}`);
  });

  const getSymbols = (chain: number, flagship = false, exclude?: string) => {
    const tokens = Object.keys(addresses[chain].tokens || {});
    let symbols = flagship
      ? tokens.filter((t) => FLAGSHIP_TOKENS.some((ft) => t.includes(ft)))
      : tokens;
    if (flagship && !symbols.length) symbols = tokens; // Fallback to all tokens if no flagship
    symbols = exclude ? symbols.filter((s) => s !== exclude) : symbols;
    if (!symbols.length)
      throw new Error(
        `No ${flagship ? "flagship " : ""}tokens${exclude ? ` excluding ${exclude}` : ""} found for chain ${chain}`,
      );
    return symbols;
  };

  const input = getToken(
    inputToken ??
      getSymbols(inChain, onlyFlagship)[
        (Math.random() * getSymbols(inChain, onlyFlagship).length) | 0
      ],
    inChain,
  );
  const excludeOut = inChain === outChain ? input.symbol : undefined;
  const output = getToken(
    outputToken ??
      getSymbols(outChain, onlyFlagship, excludeOut)[
        (Math.random() * getSymbols(outChain, onlyFlagship, excludeOut).length) | 0
      ],
    outChain,
  );

  const amount =
    amountWei ??
    (() => {
      const { decimals } = input;
      let val = Math.random() * 2e4 + 10;
      if (["BTC", "ETH"].some((c) => input.symbol?.toUpperCase().includes(c))) val /= 4e4;
      const exp = Math.max(decimals - 8, 3);
      const scaled = BigInt(Math.round(val * 10 ** exp));
      return weiToString(scaled * 10n ** BigInt(decimals - exp));
    })();

  const payer = getPayer(inChain);

  return {
    input,
    output,
    inputAmountWei: String(amount),
    payer,
    receiver: payer,
    maxSlippage: MAX_SLIPPAGE_BPS,
    integrator: "test-suite",
    aggIds: aggId ? [aggId] : undefined,
  };
};

/**
 * Generate multiple test cases based on configuration
 */
export const generateTestCases = async (
  options: {
    aggId?: AggId;
    count?: number;
    onlyFlagship?: boolean;
    isCrossChain?: boolean;
  } = {},
): Promise<IBtrSwapParams[]> => {
  const count = options.count || 2;
  const cases: IBtrSwapParams[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const testCase = createTestCase({
        aggId: options.aggId,
        onlyFlagship: options.onlyFlagship,
        isCrossChain: options.isCrossChain,
      });
      cases.push(testCase);
      console.log(`Fuzz #${i}: ${paramsToString(testCase)}`);
    } catch (error: any) {
      console.error(`Error creating test case #${i}: ${error.message}`);
    }
  }

  return cases;
};

/**
 * Generate test cases for common testing scenarios
 */
export const generateFuzzCategories = async (
  aggId?: AggId,
  count = 2,
): Promise<{
  flagshipMonochain: IBtrSwapParams[];
  anyMonochain: IBtrSwapParams[];
  flagshipCrosschain: IBtrSwapParams[];
  anyCrosschain: IBtrSwapParams[];
}> => {
  return {
    flagshipMonochain: await generateTestCases({
      aggId,
      count,
      onlyFlagship: true,
      isCrossChain: false,
    }),
    anyMonochain: await generateTestCases({
      aggId,
      count,
      onlyFlagship: false,
      isCrossChain: false,
    }),
    flagshipCrosschain: await generateTestCases({
      aggId,
      count,
      onlyFlagship: true,
      isCrossChain: true,
    }),
    anyCrosschain: await generateTestCases({
      aggId,
      count,
      onlyFlagship: false,
      isCrossChain: true,
    }),
  };
};

/**
 * Get transaction requests for a set of test cases
 */
export const getTrForCases = async (
  cases: IBtrSwapParams[],
): Promise<(ITransactionRequestWithEstimate | undefined)[]> => {
  const results: (ITransactionRequestWithEstimate | undefined)[] = [];
  for (const params of cases) {
    const trs = await getAllTimedTr(params);
    const bestTr = trs && trs.length > 0 ? trs[0] : undefined;
    console.log(paramsToString(params));
    console.log(bestTr ? `  → ${trToString(bestTr)}` : "  → No quote available");
    results.push(bestTr);
  }
  return results;
};

/**
 * Validates that a transaction request contains valid estimates, etc.
 */
export function isTrValid(tr: ITransactionRequestWithEstimate): boolean {
  return (
    !!tr &&
    !!tr.to &&
    !!tr.steps?.length &&
    !!tr.steps[0].estimates &&
    !!tr.steps[0].estimates.output &&
    !!tr.steps[0].estimates.outputWei &&
    !!tr.steps[0].estimates.exchangeRate &&
    !!tr.globalEstimates
  );
}

export function assertNonNullEstimatesOutput(estimates: ISwapEstimate & ICostEstimate) {
  assert(
    Number(estimates.output) > 0 &&
      BigInt(estimates.outputWei!) > 0n &&
      Number(estimates.exchangeRate) > 0,
    "Should have non-null output and outputWei",
  );
}

/**
 * Assert that a transaction request matches the expected structure and has valid estimates
 */
export function assertTr(tr: ITransactionRequestWithEstimate | undefined, log = true) {
  // Validate transaction request structure
  assert(tr?.to && tr.data, "Transaction request should have 'to' and 'data'");
  assert(tr.from === tr.params.payer, "Transaction 'from' should match payer");
  assert(tr.globalEstimates, "Should have global estimates");
  assertNonNullEstimatesOutput(tr.globalEstimates!);
  assert(tr.steps?.[0]?.estimates, "Should have at least one step with estimates");
  assertNonNullEstimatesOutput(tr.steps[0]!.estimates!);

  // Log transaction details if requested
  if (log) {
    console.log(`>>>rfq ${paramsToString(tr.params)}`);
    console.log(`<<<res ${trToString(tr)}`);
  }
}

/**
 * Common test runner for swap tests
 */
export async function runSwapTests(
  testCases: IBtrSwapParams[],
  testType: string,
  throttleDelayMs = 3000,
  validateResult = true,
): Promise<void> {
  // Process one test case at a time to ensure proper throttling
  for (let i = 0; i < testCases.length; i++) {
    if (i > 0) await sleep(throttleDelayMs);

    const testCase = testCases[i];
    const testInfo = paramsToString(testCase);
    console.log(`${testType}: ${testInfo}`);

    try {
      const allTrs = await getAllTimedTr(testCase);

      if (!allTrs || allTrs.length === 0) {
        console.error(`❌ ${testInfo}: No transaction requests found`);
        throw new Error("No transaction requests found");
      }

      console.log(getTrPerformanceTable(allTrs)); // table of all transaction requests
      console.log(toJSON(allTrs[0]!)); // detailed request and estimates for the best route

      // Validate the best transaction request if required
      if (validateResult && allTrs.length > 0) assertTr(allTrs[0], false);
      console.log(`✅ ${testInfo}`);
    } catch (error) {
      console.error(`❌ ${testInfo}:`, error);
      throw error; // Rethrow to fail the test
    }
  }
}

/**
 * Format a token for CLI usage in the format: chainId:address:symbol:decimals
 * @param chainId The chain ID
 * @param token The token symbol to lookup in constants
 * @returns Formatted token string for CLI
 */
export const formatCliToken = (t: IToken | TokenInfoTuple | string, chainId = 1): string => {
  if (typeof t === "string" || Array.isArray(t)) {
    t = getToken(t, chainId);
  }
  if (!t) throw new Error(`[formatCliToken] Token not found: ${t}`);
  return `${t.chainId}:${t.address}:${t.symbol}:${t.decimals || 18}`;
};

/** Build CLI command string from options */
export const buildCliCommand = (p: IBtrSwapCliParams): string => {
  const {
    executable = "btr-swap",
    maxSlippage = MAX_SLIPPAGE_BPS,
    displayModes = [DisplayMode.RANK, DisplayMode.BEST_COMPACT],
    serializationMode = SerializationMode.JSON,
  } = p;

  const flags = [
    p.apiKeys && `--api-keys ${JSON.stringify(p.apiKeys)}`,
    p.referrerCodes && `--referrer-codes ${JSON.stringify(p.referrerCodes)}`,
    p.integratorIds && `--integrator-ids ${JSON.stringify(p.integratorIds)}`,
    p.feesBps && `--fees-bps ${JSON.stringify(p.feesBps)}`,
  ]
    .filter(Boolean)
    .join(" ");

  return `${executable} \
--input ${formatCliToken(p.input)} --output ${formatCliToken(p.output)} \
--input-amount ${p.inputAmountWei} --payer ${p.payer} --max-slippage ${maxSlippage} \
--aggregators ${p.aggIds?.join(",")} --display-modes ${displayModes.join(",")} \
--serialization-mode ${serializationMode.toLowerCase()}${flags ? " " + flags : ""}`;
};
