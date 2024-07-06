import * as dotenv from "dotenv";
import { expect } from "chai";

dotenv.config({ override: true });

import { AggregatorId, ISwapperParams } from "../../src/types";
import { getTransactionRequestByAggregatorCases } from "../utils/cases";
import { getTransactionRequest as lifiTxRequest } from "../../src/LiFi";
import { getTransactionRequest as squidTxRequest } from "../../src/Squid";
import { getTransactionRequest as unizenTxRequest } from "../../src/Unizen";

const swapperParams: ISwapperParams = {
  // op:usdc -> arb:dai
  inputChainId: 10,
  input: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  outputChainId: 42161,
  output: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  amountWei: "1000000000",
  payer: '0xC373f2C4efFD31626c79eFCd891aA7759cF61886',
  maxSlippage: 100,
}

describe("swapper.client.test", function () {
  this.beforeAll(async function () {
    console.log(`env: ${JSON.stringify(process.env)}`);
  });

  this.beforeEach(async function () {
    console.log("beforeEach");
  });

 describe("Get Quote", function () {
    it("Squid", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.SQUID)))
        expect(tr?.data).to.be.a("string");
    });
    it("Li.Fi", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.LIFI)))
        expect(tr?.data).to.be.a("string");
    });
    it("Socket", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.SOCKET)))
        expect(tr?.data).to.be.a("string");
    });
    it("1inch", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.ONE_INCH)))
        expect(tr?.data).to.be.a("string");
    });
    it("0x", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.ZERO_X)))
        expect(tr?.data).to.be.a("string");
    });
    it("Unizen", async function () {
      for (const tr of (await getTransactionRequestByAggregatorCases(AggregatorId.UNIZEN)))
        expect(tr?.data).to.be.a("string");
    });
  })
});

describe("swapper.client.test.estimate", function () {

  describe("Get Quote", function () {
    it("Squid", async function () {
      const tr = await squidTxRequest(swapperParams);
      expect(tr?.data).to.be.a("string");
    });
    it("Li.Fi", async function () {
      const tr = await lifiTxRequest(swapperParams);
      expect(tr?.data).to.be.a("string");
    });
    it("Unizen", async function () {
      const tr = await unizenTxRequest(swapperParams);
      expect(tr?.data).to.be.a("string");
    });
  })
});