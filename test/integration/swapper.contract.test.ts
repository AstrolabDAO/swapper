import { BigNumber, Contract, Signer } from "ethers";
import { MaxUint256 } from "@ethersproject/constants";
import { assert } from "chai";
import { weiToString } from "@astrolabs/hardhat";

import * as dotenv from "dotenv";
dotenv.config({ override: true });

import { ethers, network, setBalances, TransactionRequest, deploy, getDeployer, config, changeNetwork } from "@astrolabs/hardhat";
import { getTransactionRequest, swapperParamsToString } from "../../src/";
import addresses, { ChainAddresses } from "../utils/addresses";
import { cases, filterCases, fuzzCases } from "../utils/cases";
import { AggregatorId, ISwapperParams } from "../../src/types";
import { HttpNetworkConfig, Network } from "hardhat/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let networkSlug = "tenderly";
let maxTopup = BigNumber.from(weiToString(5*1e18));
let blockNumber: number;
let a: ChainAddresses;
let swapper: Contract;
let deployer: Signer & { address: string };
let provider = ethers.provider;

async function ensureWhitelisted(swapper: Contract, addresses: string[]) {
  const whitelistPromises = addresses.map(async (addr) => {
    const isWhitelisted = await swapper.isWhitelisted(addr);
    if (!isWhitelisted) {
      console.log(`whitelisting ${addr}`);
      await swapper.addToWhitelist(addr);
      assert(await swapper.isWhitelisted(addr), `Address ${addr} could not be whitelisted`);
    }
  });

  await Promise.all(whitelistPromises);
}

async function _swap(o: ISwapperParams) {

  if (o.inputChainId != network.config.chainId) {
    if (network.name.includes("tenderly")) {
      console.warn(`Skipping case as not on current network: ${network.name}`);
      return;
    } else {
      console.warn(`Case requires hardhat network change to ${network.name}`);
    }
  }

  o.payer ||= deployer!.address;
  o.amountWei = BigNumber.from(weiToString(o.amountWei));
  o.inputChainId ??= network.config.chainId!;

  let input: Contract;
  const nativeBalance = await provider.getBalance(o.payer);

  if (!o.input) {
    o.input = a.tokens.WGAS;
    input = await ethers.getContractAt("IWETH9", o.input);
    const symbol = await input.symbol();
    if (["ETH", "BTC"].some(s => symbol.includes(s))) {
      // limit the size of a swap to 10 ETH/BTC
      if (o.amountWei.gt(maxTopup))
        o.amountWei = BigNumber.from(maxTopup);
    }
    assert(nativeBalance.gt(o.amountWei));
    const wrappedBalanceBefore = await input.balanceOf(o.payer);
    await input.deposit({ value: o.amountWei });
    const wrapped = (await input.balanceOf(o.payer)).sub(wrappedBalanceBefore);
    console.log(`wrapped ${wrapped} ${o.input}`);
    assert(wrapped.eq(o.amountWei));
  } else {
    input = await ethers.getContractAt("IERC20Metadata", o.input);
  }

  console.log(swapperParamsToString(o));

  let inputBalance = await input.balanceOf(o.payer);

  if (inputBalance.lt(o.amountWei)) {
    console.log(`payer ${o.payer} has not enough balance of ${o.inputChainId}:${o.input}, swapping from gasToken to ${o.input}`);
    await _swap({
      payer: o.payer,
      inputChainId: o.inputChainId,
      output: o.input,
      amountWei: weiToString(nativeBalance.sub(BigInt(1e20).toString())),
    } as ISwapperParams);
    inputBalance = await input.balanceOf(o.payer);
  }

  const output = await ethers.getContractAt("IERC20Metadata", o.output);
  const outputBalanceBeforeSwap = await output.balanceOf(o.payer);
  await input.approve(swapper.target, MaxUint256.toString());
  const tr: TransactionRequest = (await getTransactionRequest(o)) as TransactionRequest;
  assert(!!tr?.data && !!tr?.from);
  console.log(`using request: ${JSON.stringify(tr, null, 2)}`);
  await ensureWhitelisted(swapper, [tr.from, tr.to!, o.input, o.output]);
  const ok = await swapper.swap(
    input.target ?? input.address,
    output.target ?? output.address,
    o.amountWei.toString(),
    "1",
    tr.to,
    tr.data,
    { gasLimit: Math.max(Number(tr.gasLimit ?? 0), 10_000_000) }
    );
  console.log(`received response: ${JSON.stringify(ok, null, 2)}`);
  assert(!!ok);
  const received = (await output.balanceOf(o.payer)).sub(outputBalanceBeforeSwap);
  console.log(`received ${received} ${o.output}`);
  assert(received.gt(1));
}

describe("swapper.contract.test", function () {
  this.beforeAll(async function () {
    // await resetNetwork(network, 250); // fantom
    // this.snapshotId = await this.provider.send("evm_snapshot", []);
    a = addresses[config.networks[networkSlug].chainId!];
    blockNumber = await provider.getBlockNumber();
    deployer = await getDeployer() as any;
    swapper = await deploy({ contract: "Swapper", verify: true });
    console.log(
      `Connected to ${network.name} (id ${network.config.chainId}), block ${blockNumber}`,
    );
  });

  this.beforeEach(async function () {
    if (network.name.includes("tenderly")) {
      const addresses = (await ethers.getSigners()).map((s: SignerWithAddress) => s.address);
      const result = await setBalances(weiToString(1e23), ...addresses);
    } else if (network.name.includes("hardhat")) {
      await changeNetwork(networkSlug);
    }
  });

  describe(`Fuzzy monochain meta-swapping (automated best route)`, async function () {
    let cases: ISwapperParams[] = [];
    // beforeEach(async function () { await changeNetwork(networkSlug); });
    before(async function () {
      cases = await fuzzCases();
    });
    // Placeholder test to ensure 'before' hook runs before 'it' blocks
    it('Multiple cases', async function () {
      if (cases.length == 0)
        throw new Error("No test cases loaded");
      for (const c of cases) {
        await _swap(c);
      }
    });
  });

  // describe(`Fuzzy crosschain meta-swapping (automated best route)`, async function () {
  //   for (const c of await fuzzCases(6, network.config.chainId, true)) {
  //     it(`Case: ${swapperParamsToString(c)}`, async function () {
  //       await _swap(c);
  //     });
  //   }
  // }

  describe(`Meta-swapping (automated best route)`, function () {
    // beforeEach(async function () { await changeNetwork(networkSlug); });
    for (const c of filterCases(undefined)) {
      it(`Case: ${swapperParamsToString(c)}`, async function () {
        await _swap(c);
      });
    }
  });

  for (const aggregatorId of [AggregatorId.SQUID, AggregatorId.LIFI, AggregatorId.SOCKET]) {
    describe(`Swapping with ${aggregatorId}`, function () {
      const cases = filterCases(aggregatorId);
      for (const c of cases) {
        it(`${swapperParamsToString(c)}`, async function () {
          await _swap(c);
        });
      }
    });
  }
});
