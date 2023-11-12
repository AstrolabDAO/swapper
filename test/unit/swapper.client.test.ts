import * as dotenv from "dotenv";
dotenv.config({ override: true });

import { AggregatorId } from "../../src/types";
import { expect } from "chai";
import { getTransactionRequestByAggregatorCases } from "../utils/cases";


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
  })
});

