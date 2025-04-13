import { simpleMonoTests } from "./base.test";

import { AggId } from "@/types";

const aggregators = [AggId.UNIZEN, AggId.SOCKET]; // [AggId.LIFI, AggId.RANGO, AggId.UNIZEN, AggId.SOCKET, AggId.SQUID];
const chainIds = [56]; // [1, 10, 56, 8453, 42161];
const amountsUSDC = [1000, 100000];
const amountsWETH = [1, 100];
const payer = <`0x${string}` | undefined>process.env.TEST_PAYER; // if undefined, impersonate from @/constants will be used

describe("Simple Monochain Tests: Stable Swaps", () => {
  it("USDC -> USDT", simpleMonoTests(aggregators, chainIds, ["USDC", "USDT"], amountsUSDC, payer));
});

// describe("Simple Monochain Tests: Stable/Volatile Swaps", () => {
//   it(
//     "USDC -> WETH",
//     simpleMonoTests(testAggregators, chainIds, ["USDC", "WETH"], amountsUSDC, payer),
//   );
// });

describe("Simple Monochain Tests: Volatile Swaps", () => {
  it("WETH -> WBTC", simpleMonoTests(aggregators, chainIds, ["WETH", "WBTC"], amountsWETH, payer));
});
