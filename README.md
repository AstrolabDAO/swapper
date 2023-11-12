<div align="center">
  <img border-radius="25px" max-height="250px" src="./swapper.png" />
  <h1>Swapper</h1>
  <p>
    <strong>by <a href="https://astrolab.fi">Astrolab<a></strong>
  </p>
  <p>
    <!-- <a href="https://github.com/AstrolabFinance/swapper/actions"><img alt="Build Status" src="https://github.com/AstrolabFinance/swapper/actions/workflows/tests.yaml/badge.svg" /></a> -->
    <a href="https://opensource.org/licenses/MIT"><img alt="License" src="https://img.shields.io/github/license/AstrolabFinance/swapper?color=3AB2FF" /></a>
    <a href="https://discord.gg/PtAkTCwueu"><img alt="Discord Chat" src="https://img.shields.io/discord/984518964371673140"/></a>
    <a href="https://docs.astrolab.fi"><img alt="Astrolab Docs" src="https://img.shields.io/badge/astrolab_docs-F9C3B3" /></a>
  </p>
</div>

Swapper is Astrolab's liquidity meta-aggregator, powering all of its monochain and cross-chain swaps.
It blends liquidity and bridge aggregators.
The DEX meta-aggregation was inspired by [LlamaSwap](https://swap.defillama.com/)'s work [available here](https://github.com/LlamaSwap/), supercharged with cross-chain capacity.

## ⚠️ Disclaimer
Astrolab DAO and its core team members will not be held accountable for losses related to the deployment and use of this repository's codebase.
As per the [licence](./LICENCE) states, the code is provided as-is and is under active development. The codebase, documentation, and other aspects of the project may be subject to changes and improvements over time.

## Supported Aggregators
Don't hesitate to reach out or submit pull requests with missing aggregators adapters.

### Bridges+Liquidity
- [Li.Fi](https://li.fi/) `stable` `tested`
- [Squid Router](https://www.squidrouter.com/) `stable` `tested`
- [Socket](https://socket.tech/) `stable` `tested`

### Liquidity
- [1inch](https://1inch.io/) `stable` `tested`
- [0x](https://0x.org/) `stable` `tested`
- [KyberSwap](https://kyberswap.com/) `stable` `tested`
- [ParaSwap](https://www.paraswap.io/) `untested`

### To be implemented
- [CowSwap](https://swap.cow.fi/)
- [OpenOcean](https://openocean.finance/)
- [DeBridge's DLN](https://app.dln.trade/)

## Features

### Swapper SDK

The Swapper SDK facilitates `TransactionRequests` and raw `CallData` construction for every aggregator, in a unified way.
The querying uses a generic `ISwapperParams` object [as seen here](https://github.com/AstrolabFinance/swapper/blob/main/src/index.ts).

The SDK can be used off-chain via ethers or viem, the generated callData can be used with any provider implementation or directly on-chain by passing the callData to the Swapper.sol contract on the desired chain.

### ethers examples

```typescript
import { AggregatorId, ISwapperParams } from "@astrolab/swapper/types";
import { getCallData, getTransactionRequest, swapperParamsToString } from "@astrolab/swapper";
import { TransactionRequest } from "ethers";

const _1inchSwap: ISwapperParams = {
  aggregatorId: AggregatorId.ONE_INCH,
  inputChainId: 250, // fantom->fantom
  input: addresses[250].tokens.LZUSDC,
  output: addresses[250].tokens.AXLUSDC,
  amountWei: 100 * 1e6, // $100
  payer: `0xPaYeR`
};

const lifiSwap: ISwapperParams = {
  aggregatorId: AggregatorId.LIFI,
  inputChainId: 250, // from fantom
  input: addresses[250].tokens.LZUSDC, // USDC-e
  outputChainId: 10 // to optimism
  output: addresses[42161].tokens.LZUSDC, // USDC-e
  amountWei: 100 * 1e6, // $100
  payer: `0xPaYeR`
};

// fetch the transaction request object from both aggregators
// NB: this transaction request object can then be used with ethers.sendTransaction
// eg. ethers.sendTransaction(tr)
async function getTransactionRequests(): TransactionRequest[] {
  return await Promise.all([_1inchSwap, lifiSwap]
    .map(s => getTransactionRequest(s)));
}

// fetch only the callData from both aggregators
// NB: this callData should be passed to the smart contract .call() directly
// this assumes that the caller already knows the aggregator contract (available in tr.to)
async function getTransactionRequests(): TransactionRequest[] {
  return await Promise.all([_1inchSwap, lifiSwap]
    .map(s => getCallData(s)));
}

```

#### Aggregator Clients

- [Li.Fi](https://github.com/AstrolabFinance/swapper/blob/main/src/LiFi/index.ts)
- [Squid Router](https://github.com/AstrolabFinance/swapper/blob/main/src/Squid/index.ts)
- [Socket](https://github.com/AstrolabFinance/swapper/blob/main/src/Socket/index.ts)
- [1inch](https://github.com/AstrolabFinance/swapper/blob/main/src/OneInch/index.ts)
- [0x](https://github.com/AstrolabFinance/swapper/blob/main/src/ZeroX/index.ts)
- [KyberSwap](https://github.com/AstrolabFinance/swapper/blob/main/src/KyberSwap/index.ts)
- [ParaSwap](https://github.com/AstrolabFinance/swapper/blob/main/src/ParaSwap/index.ts)

### Swapper Contract

The [Swapper contract](https://github.com/AstrolabFinance/swapper/blob/main/contracts/Swapper.sol) is a proxy that allows generic callData to be executed on the requested aggregator's contract, available from `transactionRequest.to`.
It adds a layer of security between the client who swap and the target aggregation router.
A Swapper instance can:
- whitelist callers
- whitelist input tokens
- whitelist output tokens
- whitelist router

It also enforces slippage/price impact protection, making the use of external `callData` inherently safer.

## Usage

To start using Swapper, you can clone the repository and install the necessary dependencies.
```bash
git clone https://github.com/AstrolabFinance/swapper
cd swapper
```

### Installation

```bash
yarn install
```

### Unit Testing (client only)
This only tests the client functions (typescript SDK).

```bash
yarn test-unit
```

### Integration Testing
This tests the client functions (typescript SDK) + the contract execution by forking with hardhat and deploying Swapper.sol locally, then passing callData to it.

```bash
yarn test-integration
```

### Pruning
Cleans hardhat and typescript compilation caches, artifacts and dist folders.

```bash
yarn clean
```

## Contributing
Contributions are welcome! Feel free to open an issue or create a pull request if you have any improvements or suggestions.
