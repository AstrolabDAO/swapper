import { TESTED_CHAIN_IDS, generateFuzzCategories, runSwapTests } from "../utils";

import { AggId } from "@/types";

const aggregators = [AggId.LIFI, AggId.SOCKET, AggId.SQUID, AggId.RANGO, AggId.UNIZEN];
const MAX_TEST_CASES = 5; // to avoid overloading the APIs

describe("Meta-Aggregator Fuzzing Tests", () => {
  TESTED_CHAIN_IDS.forEach((_chainId) => {
    // Process aggregators sequentially to avoid overloading APIs
    for (const aggId of aggregators) {
      describe(`Aggregator: ${aggId}`, function () {
        const testCategories = [
          ["Flagship Monochain", "flagshipMonochain"],
          ["Any Monochain", "anyMonochain"],
          ["Flagship Crosschain", "flagshipCrosschain"],
          ["Any Crosschain", "anyCrosschain"],
        ];

        testCategories.forEach(([name, key]) => {
          it(`Processing ${name.toLowerCase()} swaps`, async function () {
            const testCases = await generateFuzzCategories(aggId, MAX_TEST_CASES);
            await runSwapTests(testCases[key as keyof typeof testCases], name);
          });
        });
      });
    }
  });
});
