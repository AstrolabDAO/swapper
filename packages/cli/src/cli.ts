#!/usr/bin/env node

/**
 * BTR Swap CLI tool
 *
 * Provides a command-line interface for interacting with the BTR Swap SDK.
 * Compatible with Node and Bun.
 * Allows users to fetch quotes from various DEX aggregators with simple commands.
 * Supports both same-chain and cross-chain swaps with customizable parameters.
 */

import * as fs from "fs";
import * as path from "path";

import { config as loadDotenv } from "dotenv";

// Import from the core package
import {
  compactTrs,
  getAllTimedTr,
  getToken,
  getTrPerformance,
  getTrPerformanceTable,
  serialize,
  defaultAggregators,
  MAX_SLIPPAGE_BPS,
  config,
  AggId,
  DisplayMode,
  SerializationMode,
  IBtrSwapCliParams,
} from "@btr-supply/swap";

const HELP_MESSAGE = `
BTR Swap CLI - Get quotes from BTR Swap SDK

Usage:
  btr-swap quote [options]

Options:
  --input <token>            Required. Input token details <chainId:address:symbol:decimals>
  --input-amount <amount>    Required. Amount in wei (e.g., 1000000000000000000 or 1e18).
  --output <token>           Required. Output token details <chainId:address:symbol:decimals>
  --payer <address>          Required. Payer address.
  --receiver <address>       Optional. Receiver address. Defaults to payer address.
  --max-slippage <bps>       Maximum slippage tolerance in basis points (e.g., 50 for 0.5%, default: ${MAX_SLIPPAGE_BPS}).
  --aggregators <ids>        Comma-separated aggregator IDs (e.g. ${AggId.LIFI},${AggId.UNIZEN}).
                             Defaults to ${defaultAggregators.join(",")}.
  --api-keys <json>          JSON string for multiple API keys: '{"${AggId.RANGO}":"key1","${AggId.SOCKET}":"key2",...}'.
  --referrer-codes <json>    JSON string for referrer codes/addresses: '{"${AggId.RANGO}":"ref1","${AggId.ONE_INCH}":123,...}'.
  --integrator-ids <json>    JSON string for per-aggregator integrator IDs: '{"${AggId.LIFI}":"custom-id-1","${AggId.SQUID}":"custom-id-2"}'.
  --fees-bps <json>          JSON string for integrator fee basis points: '{"${AggId.LIFI}":20,"${AggId.SOCKET}":30}'.
  --display <modes>          Comma-separated display modes: ${Object.values(DisplayMode).join(",")}.
  --serialization <mode>     Serialization mode: ${Object.values(SerializationMode).join(",")}.
  --env-file <path>          Path to custom .env file to load environment variables from.
  -h, --help                 Display this help message.

Examples:
  # Same-chain ETH -> DAI on Ethereum via 1inch
  btr-swap quote \\
    --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \\
    --output 1:0x6B175474E89094C44Da98b954EedeAC495271d0F:DAI:18 \\
    --input-amount 1e18 \\
    --payer 0xYourAddressHere \\
    --aggregators ${AggId.LIFI}

  # Cross-chain ETH (Eth) -> DAI (Optimism) via LiFi & Squid with a custom .env file
  btr-swap quote \\
    --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \\
    --output 10:0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1:DAI:18 \\
    --input-amount 1e18 \\
    --payer 0xYourAddressHere \\
    --aggregators ${AggId.LIFI},${AggId.SQUID} \\
    --serialization ${SerializationMode.TABLE} \\
    --display ${DisplayMode.RANK},${DisplayMode.ALL_COMPACT} \\
    --env-file ./custom.env

  # Specify Li.Fi aggregator ID and Rango API key
  btr-swap quote \\
    --input 137:0x...:ETH:18 \\
    --output 1:0x...:DAI:18 \\
    --input-amount 5e17 \\
    --payer 0x... \\
    --aggregators ${AggId.RANGO},${AggId.LIFI} \\
    --integrator-ids '{"${AggId.LIFI}":"integrator-id"}' \\
    --api-keys '{"${AggId.RANGO}":"api-key"}' \\
    --serialization ${SerializationMode.TABLE}
`;

/** Error handler for CLI operations */
const handleError = (message: string, details?: any) => {
  console.error(`❌ ${message}`);
  if (details) console.error(details);
  process.exit(1);
};

/**
 * Parses command-line arguments into a key-value object.
 * Handles basic flags (--key value), boolean flags (--flag), and multi-value flags (--key val1,val2).
 * Very basic parser, assumes "--key" is followed by a value unless it's the last arg or followed by another "--key".
 */
function parseArgs(args: string[]): { [key: string]: string | string[] | boolean } {
  const parsedArgs: { [key: string]: string | string[] | boolean } = {};
  let currentKey: string | null = null;
  const multiValueKeys = ["aggregators", "display"];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      currentKey = arg.substring(2);
      parsedArgs[currentKey] = true;
    } else if (arg === "-h") {
      parsedArgs["help"] = true;
      currentKey = null;
    } else if (currentKey !== null) {
      if (multiValueKeys.includes(currentKey)) {
        parsedArgs[currentKey] = arg
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      } else {
        parsedArgs[currentKey] = arg;
      }
      currentKey = null;
    } else if (!parsedArgs["_command"]) {
      parsedArgs["_command"] = arg;
    }
  }
  return parsedArgs;
}

/** Helper to parse, validate, and deduplicate enum-based CLI arguments. */
function parseAndValidateEnumArg<T extends string>(
  argValue: string | string[] | boolean | undefined,
  validValues: Set<T>,
  argName: string,
  allowMultiple: boolean,
  defaultValue?: T | T[],
): T | T[] {
  let values: T[] = [];

  if (argValue === true) {
    // Handle case where flag is present but has no value (e.g., --display)
    // This shouldn't happen with current flags but guards against it.
    handleError(`Missing value for --${argName}.`);
  } else if (typeof argValue === "string") {
    values = (allowMultiple ? argValue.split(",").map((v) => v.trim()) : [argValue.trim()]) as T[];
  } else if (allowMultiple && Array.isArray(argValue)) {
    // Already split by parseArgs
    values = argValue as T[];
  }

  // Use default if no value was provided or parsed
  if (values.length === 0) {
    if (defaultValue !== undefined) {
      return defaultValue;
    } else if (allowMultiple) {
      return []; // Return empty array if no default and multiple allowed
    } else {
      // This case implies a required arg without a default wasn't provided,
      // but that's handled by the requiredArgs check later.
      // However, if called directly for an optional non-multi arg, handle it.
      return undefined as any; // Or handle as error if appropriate contextually
    }
  }

  // Deduplicate if multiple values are allowed
  if (allowMultiple) {
    values = [...new Set(values)];
  }

  // Validate against enum values
  const invalidValues = values.filter((v) => !validValues.has(v));
  if (invalidValues.length > 0) {
    handleError(
      `Invalid value(s) for --${argName}: ${invalidValues.join(", ")}`,
      `Valid options are: ${[...validValues].join(", ")}`,
    );
  }

  // Return single value or array based on allowMultiple
  return allowMultiple ? values : values[0];
}

/** Parse JSON config options with error handling */
function parseJsonConfig(argName: string, argValue: any): { [key: string]: any } | undefined {
  if (!argValue) return undefined;
  try {
    const parsed = JSON.parse(argValue as string);
    if (typeof parsed !== "object" || parsed === null) {
      handleError(`Invalid JSON format for --${argName}: Must be a JSON object.`);
    }
    return parsed;
  } catch (e: any) {
    handleError(`Invalid JSON format for --${argName}: ${e.message}`);
    return undefined; // Never reached due to process.exit() in handleError
  }
}

/** Apply config overrides from JSON arguments */
function applyConfigOverrides(
  apiKeys?: Record<string, string>,
  referrer?: Record<string, string | number>, // Allow numbers based on help text
  integrators?: Record<string, string>,
  feesBps?: Record<string, number>,
) {
  if (!apiKeys && !referrer && !integrators && !feesBps) return;

  Object.keys(config).forEach((aggId) => {
    const agg = aggId as AggId;
    if (apiKeys?.[agg]) config[agg].apiKey = apiKeys[agg];
    if (referrer?.[agg] !== undefined) config[agg].referrer = referrer[agg]; // Allow string or number
    if (integrators?.[agg]) config[agg].integrator = integrators[agg];
    if (feesBps?.[agg] !== undefined) {
      const fee = Number(feesBps[agg]); // Ensure it's treated as a number
      if (!isNaN(fee)) {
        config[agg].feeBps = fee;
      } else {
        console.warn(
          `⚠️ Invalid non-numeric value for --fees-bps for ${agg}: ${feesBps[agg]}. Skipping.`,
        );
      }
    }
  });
}

/** Display output for a specific mode and format */
function displayOutput(mode: DisplayMode, trs: any[], serializationMode: SerializationMode): void {
  console.log(`\n📊 Display Mode: ${mode}`);

  const compactedTrs = mode.includes("COMPACT") ? compactTrs(trs) : trs;

  switch (mode) {
    case DisplayMode.BEST:
    case DisplayMode.BEST_COMPACT:
      console.log(serialize(compactedTrs[0], { mode: serializationMode }));
      break;
    case DisplayMode.ALL:
    case DisplayMode.ALL_COMPACT:
      console.log(serialize(compactedTrs, { mode: serializationMode }));
      break;
    case DisplayMode.RANK:
      if (serializationMode === SerializationMode.TABLE) {
        console.log(getTrPerformanceTable(trs));
      } else {
        console.log(serialize(trs.map(getTrPerformance), { mode: serializationMode }));
      }
      break;
  }
}

/**
 * Main function to run the BTR Swap CLI.
 * Parses arguments, validates input, calls the BTR Swap SDK, and prints the results.
 */
async function runCli() {
  const args = parseArgs(process.argv.slice(2));

  // Show help if requested or if the command isn't 'quote'
  if (args.help || args["_command"] !== "quote") {
    console.log(HELP_MESSAGE);
    process.exit(0);
  }

  // Load environment variables from .env file
  // First try the default .env in the current directory
  loadDotenv();

  // Then override with custom .env file if provided
  if (args["env-file"]) {
    const envPath = args["env-file"] as string;
    if (!fs.existsSync(envPath)) {
      handleError(`The specified .env file does not exist: ${envPath}`);
    }

    const customEnvResult = loadDotenv({ path: path.resolve(envPath), override: true });
    if (customEnvResult.error) {
      handleError(`Error loading custom .env file: ${customEnvResult.error.message}`);
    } else {
      console.log(`Loaded environment variables from: ${envPath}`);
    }
  }

  // Check required arguments
  const requiredArgs = ["input", "output", "input-amount", "payer"];
  const missingArgs = requiredArgs.filter((key) => !args[key]);
  if (missingArgs.length > 0) {
    handleError(`Missing required arguments: ${missingArgs.join(", ")}`, HELP_MESSAGE);
  }

  try {
    // Parse token information
    const inputToken = getToken(args["input"] as string);
    const outputToken = getToken(args["output"] as string);
    if (!inputToken) {
      handleError("Failed to parse --input token.");
    }
    if (!outputToken) {
      handleError("Failed to parse --output token.");
    }

    // Parse configuration overrides
    const configOverrides = {
      apiKeys: parseJsonConfig("api-keys", args["api-keys"]),
      referrer: parseJsonConfig("referrer-codes", args["referrer-codes"]),
      integrators: parseJsonConfig("integrator-ids", args["integrator-ids"]),
      feesBps: parseJsonConfig("fees-bps", args["fees-bps"]),
    };

    // Apply configuration overrides
    applyConfigOverrides(
      configOverrides.apiKeys,
      configOverrides.referrer,
      configOverrides.integrators,
      configOverrides.feesBps,
    );

    // Parse amount with scientific notation support
    let amountWei: bigint;
    try {
      const numericAmount = Number(args["input-amount"] as string);
      if (isNaN(numericAmount) || numericAmount < 0) {
        handleError("Invalid --input-amount: Must be a non-negative number.");
      }
      amountWei = BigInt(numericAmount.toLocaleString("fullwide", { useGrouping: false }));
    } catch (e: any) {
      handleError(`Error parsing --input-amount: ${e.message}`);
      amountWei = 0n; // Satisfies compiler, unreachable due to handleError
    }

    // Parse and validate enum-based arguments
    const validAggIds = new Set(Object.values(AggId));
    const aggregators = parseAndValidateEnumArg<AggId>(
      args.aggregators,
      validAggIds,
      "aggregators",
      true,
      defaultAggregators,
    ) as AggId[];

    const validDisplayModes = new Set(Object.values(DisplayMode));
    const displayModes = parseAndValidateEnumArg<DisplayMode>(
      args.display,
      validDisplayModes,
      "display",
      true,
      [DisplayMode.ALL],
    ) as DisplayMode[];

    const validSerializationModes = new Set(Object.values(SerializationMode));
    const serializationMode = parseAndValidateEnumArg<SerializationMode>(
      args.serialization,
      validSerializationModes,
      "serialization",
      false,
      SerializationMode.JSON,
    ) as SerializationMode;

    // Validate max slippage
    let maxSlippageBps = MAX_SLIPPAGE_BPS;
    if (args["max-slippage"]) {
      const parsedSlippage = parseInt(args["max-slippage"] as string, 10);
      if (isNaN(parsedSlippage) || parsedSlippage < 0 || !Number.isInteger(parsedSlippage)) {
        handleError(
          `Invalid --max-slippage value: ${args["max-slippage"]}. Must be a non-negative integer.`,
        );
      }
      maxSlippageBps = parsedSlippage;
    }

    // Determine receiver address
    const payerAddress = args.payer as string;
    const receiverAddress = args.receiver ? (args.receiver as string) : payerAddress;

    // Build params for swap
    const params: IBtrSwapCliParams = {
      input: inputToken!, // Known to be valid due to check above
      output: outputToken!, // Known to be valid due to check above
      inputAmountWei: amountWei,
      payer: payerAddress,
      receiver: receiverAddress, // Use determined receiver
      maxSlippage: maxSlippageBps, // Use validated slippage
      aggIds: aggregators,
      apiKeys: configOverrides.apiKeys,
      integratorIds: configOverrides.integrators,
      referrerCodes: configOverrides.referrer,
      feesBps: configOverrides.feesBps,
      displayModes: displayModes,
      serializationMode: serializationMode,
    };

    // Log parameters
    console.log(`⏳ Fetching quote(s) with parameters:`);
    console.log(JSON.stringify(params, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
    console.log("...");

    // Fetch quotes
    const trs = await getAllTimedTr(params);
    if (!trs?.length) {
      handleError("No route found for the given parameters.");
    }

    // Display results for each requested mode (we know trs exists at this point)
    displayModes.forEach((mode) => displayOutput(mode, trs!, serializationMode));
  } catch (error: any) {
    console.error("❌ An error occurred:");
    if (error.response?.data) {
      console.error("API Error:", JSON.stringify(error.response.data, null, 2));
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown error:", error);
    }
    // Log parsed args (safe since secrets are in apiKeys object)
    console.error(
      "Parsed Arguments Used:",
      JSON.stringify(
        args,
        (key, value) =>
          ["api-keys", "referrer-codes", "integrator-ids", "fees-bps"].includes(key) && value
            ? "[REDACTED]"
            : value,
        2,
      ),
    );
    process.exit(1);
  }
}

// Execute the CLI
runCli();
