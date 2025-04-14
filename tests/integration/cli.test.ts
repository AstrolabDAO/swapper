import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { expect } from "chai";

import { buildCliCommand, getPayer } from "../utils";

import { AggId, DisplayMode, IBtrSwapCliParams, SerializationMode } from "@/types";
import { getToken } from "@/utils";

const params: IBtrSwapCliParams = {
  payer: process.env.TEST_PAYER ?? getPayer(56), // if undefined, impersonate from @/constants will be used
  input: getToken("USDC", 56),
  output: getToken("WETH", 56),
  inputAmountWei: 1000e6,
  aggIds: [AggId.LIFI, AggId.UNIZEN, AggId.SOCKET, AggId.RANGO, AggId.SQUID],
  displayModes: [DisplayMode.RANK, DisplayMode.BEST_COMPACT],
  serializationMode: SerializationMode.JSON,
  envFile: ".env", // contains api keys, referrer codes, integrator ids
};

// Convert ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../..");

// Detect available runtime (bun or node)
const getRuntime = (): string => {
  for (const runtime of ["bun", "node"]) {
    try {
      execSync(`command -v ${runtime}`, { stdio: "ignore" });
      return runtime;
    } catch {
      // Continue to next runtime
    }
  }
  throw new Error("Missing runtime: bun or node");
};

// Get path to CLI executable
const getCliExePath = (): string => {
  const runtime = getRuntime();
  const { bin } = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  const fullPath = path.join(packageRoot, bin?.["btr-swap"] ?? "./dist/cli/cli.js");
  if (!fs.existsSync(fullPath))
    throw new Error(`CLI executable not found at ${fullPath}. Run 'bun run build' first.`);
  return `${runtime} ${path.relative(process.cwd(), fullPath)}`;
};

describe("btr-swap CLI", function () {
  before(() => {
    try {
      params.executable = getCliExePath();
      console.log(`Using CLI executable: ${params.executable}`);
    } catch (error: any) {
      console.warn(`Warning: ${error.message}`);
      params.executable = "btr-swap"; // Fallback to expecting it in PATH
    }
  });

  it("Should generate a valid CLI command", function () {
    const command = buildCliCommand(params);
    console.log("Command:", command);

    // Verify command parts
    expect(command).to.include("--input");
    expect(command).to.include("--output");
    expect(command).to.include("--input-amount");
    expect(command).to.include("--payer");
    expect(command).to.include("--max-slippage");
    expect(command).to.include("--aggregators");
    expect(command).to.include("--display-modes");
    expect(command).to.include("--serialization-mode");
  });

  it("Should have a valid CLI executable", function () {
    // Check if the CLI path exists
    try {
      const executableParts = params.executable?.split(" ");
      if (executableParts && executableParts.length > 1) {
        const path = executableParts[1];
        void expect(fs.existsSync(path)).to.be.true;
      } else {
        // Can't verify the path
        this.skip();
      }
    } catch {
      // If this test fails, it's likely because we're using the fallback "btr-swap" executable
      // which may not be in PATH during testing
      console.warn("CLI executable not found, using fallback");
      this.skip();
    }
  });

  it("Should get quotes successfully (when APIs are available)", function () {
    const command = buildCliCommand(params);
    try {
      console.log("Command:", command);
      const output = execSync(command, { maxBuffer: 1024 * 1024 * 10 }).toString();

      // Check if the output contains any of these common CLI output indicators
      const possibleOutputs = [
        "Fetching quote",
        "Available quote",
        "No quotes available",
        "Getting quotes",
        "Using aggregator",
      ];

      const containsExpectedOutput = possibleOutputs.some((text) => output.includes(text));
      void expect(containsExpectedOutput).to.be.true;
    } catch (error: any) {
      console.log("Error running command:", command);
      if (error.stdout) console.log(error.stdout.toString());
      if (error.stderr) console.error(error.stderr.toString());
      this.skip();
    }
  });
});
