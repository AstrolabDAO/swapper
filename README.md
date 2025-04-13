<div align="center">
  <img border-radius="25px" max-height="250px" src="./banner.png" />
  <h1>BTR Swap</h1>
  <p>
    <strong>Cross-chain swap aggregation SDK</strong>
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@btr-supply/swap"><img alt="NPM Package" src="https://img.shields.io/npm/v/@btr-supply/swap.svg?style=flat-square&logo=npm&logoColor=white&labelColor=d42b26&color=black" width="auto" height="22" style="border-radius:6px; border:1px solid #eee;"/></a>
    <!-- <a href="https://btr.supply/docs"><img alt="Docs" src="https://img.shields.io/badge/Docs-212121?style=flat-square&logo=readthedocs&logoColor=white" width="auto" height="22" style="border-radius:6px; border:1px solid #eee;"/></a> -->
    <a href="https://opensource.org/licenses/MIT"><img alt="License" src="https://img.shields.io/badge/license-MIT-000000?style=flat-square&logo=open-source-initiative&logoColor=white&labelColor=4c9c3d" width="auto" height="22" style="border-radius:6px; border:1px solid #eee;"/></a>
    <a href="https://twitter.com/BTRSupply"><img alt="X (Twitter)" src="https://img.shields.io/badge/@BTRSupply-000000?style=flat-square&logo=x&logoColor=white" width="auto" height="22" style="border-radius:6px; border:1px solid #eee;"/></a>
    <a href="https://t.me/BTRSupply"><img alt="Telegram" src="https://img.shields.io/badge/Telegram-24b3e3?style=flat-square&logo=telegram&logoColor=white" width="auto" height="22" style="border-radius:6px; border:1px solid #eee;"/></a></p>
</div>

BTR Swap is a liquidity meta-aggregator powering monochain and cross-chain swaps, blending liquidity and bridge aggregators. Inspired by [LlamaSwap](https://github.com/LlamaSwap/), server-side friendly and cross-chain capable.

[ESM compliant](https://nodejs.org/api/esm.html), feather light, BTR Swap can be embedded in any front-end or back-end application through:

- **SDK**: For Node.js, Bun, Deno back-ends and browser front-ends, whether your app uses [Ethers](https://docs.ethers.org/) or [Viem](https://viem.sh/)
- **CLI**: Quick integration with any existing back-end or scripts

## ⚠️ Disclaimer

This aggregator is under active development and not a commercial product.
BTR and its team members are not liable for any losses from using this codebase. The code is provided as-is and underlying APIs may change.

We welcome issues for bugs or feature requests, and pull requests to improve the package.

## Features

- **Unified Interface:** Single API for monochain and cross-chain swaps
- **Any Chain, Any Token:** Aggregates liquidity and bridges for token swaps across any supported chains and tokens
- **Best Route Selection:** Finds optimal quotes across multiple aggregators
- **Zero Dependencies:** Lightweight implementation for any environment
- **Type Safety:** Comprehensive TypeScript support
- **Multi-Platform:** Works in Node.js, Bun, Deno and browsers

## Supported Aggregators

### Meta-Aggregators (cross-chain capable)

- [Li.Fi](https://li.fi/) `stable` `tested`
- [Squid Router](https://www.squidrouter.com/) `stable` `tested`
- [Socket](https://socket.tech/) `stable` `tested`
- [Rango](https://rango.exchange/) `stable` `tested`
- [Unizen](https://unizen.io/) `stable` `tested`
- [RocketX](https://www.rocketx.exchange/) `planned`

### Passive Liquidity Aggregators

- [1inch](https://1inch.io/) `stable` `tested`
- [0x](https://0x.org/) `stable` `tested`
- [ParaSwap](https://www.paraswap.io/) `stable` `tested`
- [Odos](https://odos.xyz/) `stable` `tested`
- [KyberSwap](https://kyberswap.com/) `stable` `tested`
- [OpenOcean](https://openocean.finance/) `stable` `tested`
- [Firebird](https://firebird.finance/) `stable` `tested`

### JIT / Intent-Based / RFQ

> Offer MEV protection, gasless swaps, and off-chain liquidity with specific handling requirements

- [CowSwap](https://swap.cow.fi/) `planned`
- [Hashflow](https://www.hashflow.com/) `planned`
- [1inch Fusion](https://fusion.1inch.io/) `planned`
- [ParaSwap Delta](https://www.paraswap.io/) `planned`
- [Bebop](https://bebop.xyz/) `planned`
- [DeBridge](https://debridge.finance/) `planned`
- [AirSwap](https://www.airswap.io/) `disabled`

## Installation

### SDK Installation

For integrating into JavaScript/TypeScript applications:

```bash
# npm
npm install @btr-supply/swap

# yarn
yarn add @btr-supply/swap

# bun
bun add @btr-supply/swap
```

### CLI Installation (Optional)

For command-line usage:

```bash
# Global installation
npm install -g @btr-supply/swap-cli

# Or via npx without installing
npx @btr-supply/swap-cli quote --help
```

## Usage

### SDK Usage (Node.js, Bun, Deno)

```typescript
import { getBestTransactionRequest, AggId } from "@btr-supply/swap";

async function fetchSwapQuote() {
  const params = {
    input: {
      chainId: 1, // Ethereum
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
      symbol: "ETH",
      decimals: 18,
      name: "Ethereum",
    },
    output: {
      chainId: 10, // Optimism (for cross-chain)
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
      symbol: "DAI",
      decimals: 18,
      name: "Dai Stablecoin",
    },
    inputAmountWei: BigInt("1000000000000000000"), // 1 ETH
    payer: "0xYourWalletAddress",
    maxSlippage: 50, // 0.5%
    aggIds: [AggId.LIFI, AggId.SQUID], // Optional: specify aggregators
  };

  const quote = await getBestTransactionRequest(params);
  // Use quote with your provider: provider.sendTransaction(quote);
}
```

### Front-end Integration

```typescript
import { getBestTransactionRequest, AggId } from "@btr-supply/swap";

// In a React component
async function handleSwap() {
  try {
    setLoading(true);

    const params = {
      input: {
        chainId: 1,
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
        symbol: "ETH",
        decimals: 18,
        name: "Ethereum",
      },
      output: {
        chainId: 1,
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        symbol: "DAI",
        decimals: 18,
        name: "Dai Stablecoin",
      },
      inputAmountWei: BigInt(amount),
      payer: address,
      maxSlippage: 30, // 0.3%
    };

    const quote = await getBestTransactionRequest(params);

    // Send via ethers, web3.js, viem, or wagmi
    const tx = await walletClient.sendTransaction(quote);
  } catch (error) {
    console.error("Swap failed:", error);
  } finally {
    setLoading(false);
  }
}
```

### CLI Usage

```bash
# Basic same-chain swap (ETH -> DAI on Ethereum)
btr-swap quote \
  --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \
  --output 1:0x6B175474E89094C44Da98b954EedeAC495271d0F:DAI:18 \
  --input-amount 1e18 \
  --payer 0xYourWalletAddress \
  --aggregators LIFI

# Cross-chain swap (ETH on Ethereum -> DAI on Optimism)
btr-swap quote \
  --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \
  --output 10:0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1:DAI:18 \
  --input-amount 1e18 \
  --payer 0xYourWalletAddress \
  --aggregators LIFI,SQUID \
  --serialization TABLE \
  --display RANK,ALL_COMPACT \
  --env-file ./custom.env

# Specify integrator IDs and API keys
btr-swap quote \
  --input 137:0x...:MATIC:18 \
  --output 1:0x...:DAI:18 \
  --input-amount 5e17 \
  --payer 0x... \
  --aggregators RANGO,LIFI \
  --integrator-ids '{"LIFI":"integrator-id"}' \
  --api-keys '{"RANGO":"api-key"}' \
  --serialization TABLE

# Get help
btr-swap quote --help
```

CLI Parameters:

- `--input <chainId:address:symbol:decimals>` - Input token information
- `--output <chainId:address:symbol:decimals>` - Output token information
- `--input-amount <amount>` - Amount in wei (supports scientific notation)
- `--payer <address>` - Sender wallet address
- `--receiver <address>` - Receiver address (defaults to payer)
- `--max-slippage <bps>` - Maximum slippage in basis points (default: 50 for 0.5%)
- `--aggregators <ids>` - Comma-separated aggregator IDs
- `--api-keys <json>` - JSON string of API keys by aggregator
- `--referrer-codes <json>` - JSON string of referrer codes by aggregator
- `--integrator-ids <json>` - JSON string of integrator IDs by aggregator
- `--fees-bps <json>` - JSON string of fee basis points by aggregator
- `--display <modes>` - Output display modes (ALL, BEST, ALL_COMPACT, BEST_COMPACT, RANK)
- `--serialization <mode>` - Output format (JSON, CSV, TABLE)
- `--env-file <path>` - Custom .env file path

## Development & Testing

```bash
# Clone and setup
git clone https://github.com/BTRSupply/btr-swap.git && cd btr-swap
bun install

# Development tasks
bun run lint       # Check code style
bun run lint:fix   # Fix code style
bun run typecheck  # Verify types
bun run build      # Build all packages
bun run test       # Run all tests
```

## Build and Publish Process

The project uses a monorepo structure with the following packages:

- `@btr-supply/swap` - Core SDK (packages/core)
- `@btr-supply/swap-cli` - CLI tool (packages/cli)

```bash
# Build all packages
bun run build       # Builds both SDK and CLI

# Pre-commit checks
bun run pre-commit  # Runs prettier, eslint, build, version sync, and unit tests

# Publish packages
bun run publish:packages  # Publish stable version (runs pre-commit first)
bun run publish:next      # Publish with 'next' tag (runs pre-commit first)

# Install CLI globally from local build
bun run install:cli
```

The pre-commit process ensures:

1. Code formatting (Prettier)
2. Code linting (ESLint)
3. Clean and fresh builds
4. Version synchronization across packages
5. Unit tests pass

This process is automatically executed by:

- Git pre-commit hooks (via Husky)
- Publishing commands

## About

BTR Swap enhances the [AstrolabDAO/swapper](https://github.com/AstrolabDAO/swapper) codebase with:

- Extended aggregator support
- Advanced API keys management
- Optimized performance
- Enhanced error handling
- Enhanced logging
- BTR Swap CLI for easy server-side and script integration

## License

[MIT](LICENSE)
