import { expect } from "chai";

import {
  mockLifiTr,
  mockRangoTr,
  mockSquidTr,
  mockUnizenTr,
  mockSocketTr,
  mockQuotePerformance,
} from "../mocks";
import { buildCliCommand, getPayer } from "../utils";

import { AggId, DisplayMode } from "@/types";
import {
  stripProtocol,
  buildQueryParams,
  withLatency,
  getToken,
  serialize,
  getTrPerformanceTable,
  SerializationMode,
  sortTrsByRate,
} from "@/utils";

describe("Utils", () => {
  describe("stripProtocol", () => {
    it("should remove http:// from URLs", () => {
      expect(stripProtocol("http://example.com")).to.equal("example.com");
    });

    it("should remove https:// from URLs", () => {
      expect(stripProtocol("https://api.example.org")).to.equal("api.example.org");
    });

    it("should remove trailing slashes", () => {
      expect(stripProtocol("https://example.com/")).to.equal("example.com");
    });

    it("should handle URLs without protocol", () => {
      expect(stripProtocol("example.com")).to.equal("example.com");
    });

    it("should handle URLs with paths and query parameters", () => {
      expect(stripProtocol("https://api.example.com/v1/endpoint?param=value")).to.equal(
        "api.example.com/v1/endpoint?param=value",
      );
    });
  });

  describe("buildQueryParams", () => {
    it("should build query string from simple parameters", () => {
      const params = {
        param1: "value1",
        param2: "value2",
      };
      expect(buildQueryParams(params)).to.equal("param1=value1&param2=value2");
    });

    it("should URL-encode parameter values", () => {
      const params = {
        param: "value with spaces",
        special: "a&b=c",
      };
      expect(buildQueryParams(params)).to.equal("param=value+with+spaces&special=a%26b%3Dc");
    });

    it("should filter out null and undefined values", () => {
      const params = {
        param1: "value1",
        param2: null,
        param3: undefined,
        param4: "value4",
      };
      expect(buildQueryParams(params)).to.equal("param1=value1&param4=value4");
    });

    it("should convert numbers and booleans to strings", () => {
      const params = {
        num: 123,
        bool: true,
      };
      expect(buildQueryParams(params)).to.equal("num=123&bool=true");
    });

    it("should handle empty objects", () => {
      expect(buildQueryParams({})).to.equal("");
    });
  });

  describe("withLatency", () => {
    it("should return result and latency for async function", async () => {
      const asyncFn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "result";
      };

      const [result, latency] = await withLatency(asyncFn);
      expect(result).to.equal("result");
      expect(latency).to.be.a("number");
      expect(latency).to.be.greaterThan(0);
    });

    it("should work with immediately resolving functions", async () => {
      const [result, latency] = await withLatency(async () => "quick result");
      expect(result).to.equal("quick result");
      expect(latency).to.be.a("number");
    });

    it("should propagate errors from the async function", async () => {
      const errorFn = async () => {
        throw new Error("Test error");
      };

      try {
        await withLatency(errorFn);
        expect.fail("withLatency should have thrown an error");
      } catch (error: any) {
        expect(error).to.be.an("error");
        expect(error.message).to.equal("Test error");
      }
    });
  });

  describe("buildCliCommand", () => {
    it("should generate correct basic CLI command", () => {
      const params = {
        executable: "btr-swap",
        input: getToken("USDC", 1),
        output: getToken("WETH", 1),
        inputAmountWei: "1000000000", // 1000 USDC
        payer: getPayer(1),
        aggIds: [AggId.LIFI, AggId.RANGO, AggId.SQUID],
      };

      const command = buildCliCommand(params);

      // Check for the presence of required components (case-insensitive)
      expect(command.toLowerCase()).to.include("btr-swap");
      expect(command.toLowerCase()).to.include(
        "--input 1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48:usdc:6".toLowerCase(),
      );
      expect(command.toLowerCase()).to.include(
        "--output 1:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2:weth:18".toLowerCase(),
      );
      expect(command).to.include("--input-amount 1000000000");
      expect(command).to.include("--payer " + getPayer(1));
      expect(command.toLowerCase()).to.include("--aggregators lifi,rango,squid".toLowerCase());
    });

    it("should include display modes and serialization mode", () => {
      const params = {
        executable: "btr-swap",
        input: getToken("USDC", 1),
        output: getToken("WETH", 1),
        inputAmountWei: "1000000000",
        payer: getPayer(1),
        aggIds: [AggId.LIFI],
        displayModes: [DisplayMode.BEST_COMPACT, DisplayMode.RANK],
        serializationMode: SerializationMode.JSON,
      };

      const command = buildCliCommand(params);

      expect(command.toLowerCase()).to.include("--display-modes best_compact,rank".toLowerCase());
      expect(command.toLowerCase()).to.include("--serialization-mode json".toLowerCase());
    });

    it("should handle optional flags and parameters", () => {
      const params = {
        executable: "./btr-swap-dev",
        input: getToken("WETH", 1),
        output: getToken("DAI", 1),
        inputAmountWei: "1000000000000000000", // 1 WETH
        payer: getPayer(1),
        aggIds: [AggId.LIFI],
        apiKeys: { lifi: "test-key" },
        referrerCodes: { unizen: "ref-code" },
      };

      const command = buildCliCommand(params);

      expect(command).to.include("./btr-swap-dev");
      expect(command).to.include('--api-keys {"lifi":"test-key"}');
      expect(command).to.include('--referrer-codes {"unizen":"ref-code"}');
    });
  });

  describe("Serialization", () => {
    it("should serialize to JSON correctly", () => {
      const json = serialize(mockLifiTr, { mode: SerializationMode.JSON });
      expect(json)
        .to.be.a("string")
        .and.include(
          `  "steps": [
    {
      "type": "SWAP",
      "estimates": {
        "output": 1000,
        "exchangeRate": 1,
        "gasCostUsd": 10,
        "feeCostUsd": 1,
        "gasCostWei": "100000",
        "feeCostWei": "10000",
        "outputWei": "1000000000000000000000"
      },
      "protocol": {
        "id": "uniswap",
        "name": "Uniswap"
      }`,
        )
        .and.include(
          `  "globalEstimates": {
    "input": 1,
    "inputWei": "1000000000000000000",
    "output": 1000,
    "outputWei": "1000000000000000000000",
    "slippage": 0.01,
    "exchangeRate": 1,
    "gasCostUsd": 10,
    "gasCostWei": "100000",
    "feeCostUsd": 1,
    "feeCostWei": "10000"
  },
  "latencyMs": 100,
  "aggId": "LIFI"`,
        );
    });

    it("should serialize to CSV correctly", () => {
      const csvDefault = serialize([mockQuotePerformance], { mode: SerializationMode.CSV });
      expect(csvDefault)
        .to.be.a("string")
        .and.include(
          `aggId,exchangeRate,output,gasCostUsd,feeCostUsd,latencyMs,steps,protocols
LIFI,1,1000,10,1,100,1,Uniswap`,
        );

      const headers = {
        aggId: "Agg ID",
        exchangeRate: "Rate",
        output: "Output",
        gasCostUsd: "Gas USD",
        feeCostUsd: "Fee USD",
        latencyMs: "Latency (ms)",
        steps: "Steps",
        protocols: "Protocols",
      };
      const csvMapped = serialize([mockQuotePerformance], {
        mode: SerializationMode.CSV,
        separator: "|",
        headers,
      });
      expect(csvMapped)
        .to.be.a("string")
        .and.include(
          `Agg ID|Rate|Output|Gas USD|Fee USD|Latency (ms)|Steps|Protocols
LIFI|1|1000|10|1|100|1|Uniswap`,
        )
        .and.not.include("exchangeRate");
    });

    it("should serialize to Table correctly", () => {
      const tableDefault = serialize([mockQuotePerformance], { mode: SerializationMode.TABLE });
      expect(tableDefault)
        .to.be.a("string")
        .and.include(
          `────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
│ aggId      │ exchangeR… │ output     │ gasCostUsd │ feeCostUsd │ latencyMs  │ steps      │ protocols  │
├────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┼────────────┤
│ LIFI       │ 1          │ 1000       │ 10         │ 1          │ 100        │ 1          │ Uniswap    │
└────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┴────────────┘`,
        );

      const headers = { aggId: "Aggregator", output: "Amount Out", latencyMs: "Latency (ms)" };
      const tableMapped = serialize([mockQuotePerformance], {
        mode: SerializationMode.TABLE,
        headers,
        columnWidths: [12, 12, 14],
      });
      expect(tableMapped)
        .to.be.a("string")
        .and.include(
          `────────────┬────────────┬──────────────┐
│ Aggregator │ Amount Out │ Latency (ms) │
├────────────┼────────────┼──────────────┤
│ LIFI       │ 1000       │ 100          │
└────────────┴────────────┴──────────────┘`,
        )
        .and.not.include("exchangeRate");
    });

    it("should generate performance table", () => {
      const table = getTrPerformanceTable(
        sortTrsByRate([mockLifiTr, mockRangoTr, mockSquidTr, mockUnizenTr, mockSocketTr]),
      );
      expect(table)
        .to.be.a("string")
        .and.include(
          `────────┬────────┬──────────┬─────────┬─────────┬─────────┬───────┬────────────────────┐
│ Agg ID │ Rate   │ Output   │ Gas USD │ Fee USD │ Latency │ Steps │ Protocols          │
├────────┼────────┼──────────┼─────────┼─────────┼─────────┼───────┼────────────────────┤
│ UNIZEN │ 1.010  │ 1010     │ 15      │ NaN     │ 80      │ 1     │ Curve              │
│ LIFI   │ 1      │ 1000     │ 10      │ 1       │ 100     │ 1     │ Uniswap            │
│ SOCKET │ 0.995  │ 995      │ 9       │ 1.500   │ 120     │ 1     │ Sushiswap          │
│ RANGO  │ 0.990  │ 990      │ 12      │ 0.500   │ 150     │ 1     │ 1inch              │
│ SQUID  │ 0.980  │ 980      │ 8       │ 2       │ 200     │ 1     │ Balancer           │
└────────┴────────┴──────────┴─────────┴─────────┴─────────┴───────┴────────────────────┘`,
        );
    });
  });
});
