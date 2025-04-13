# BTR Swap CLI

Command-line interface for the BTR Swap SDK.

## Installation

```bash
npm install -g @btr-supply/swap-cli
```

## Usage

```bash
btr-swap quote [options]
```

### Options

```
--input <token>            Required. Input token details <chainId:address:symbol:decimals>
--input-amount <amount>    Required. Amount in wei (e.g., 1000000000000000000 or 1e18).
--output <token>           Required. Output token details <chainId:address:symbol:decimals>
--payer <address>          Required. Payer address.
--receiver <address>       Optional. Receiver address. Defaults to payer address.
--max-slippage <bps>       Maximum slippage tolerance in basis points (e.g., 50 for 0.5%, default: 500).
--aggregators <ids>        Comma-separated aggregator IDs (e.g. LIFI,UNIZEN).
                          Defaults to LIFI,SOCKET,UNIZEN,RANGO,SQUID.
--api-keys <json>          JSON string for multiple API keys: '{"RANGO":"key1","SOCKET":"key2",...}'.
--referrer-codes <json>    JSON string for referrer codes/addresses: '{"RANGO":"ref1","ONE_INCH":123,...}'.
--integrator-ids <json>    JSON string for per-aggregator integrator IDs: '{"LIFI":"custom-id-1","SQUID":"custom-id-2"}'.
--fees-bps <json>          JSON string for integrator fee basis points: '{"LIFI":20,"SOCKET":30}'.
--display <modes>          Comma-separated display modes: ALL,BEST,ALL_COMPACT,BEST_COMPACT,RANK.
--serialization <mode>     Serialization mode: JSON,CSV,TABLE.
--env-file <path>          Path to custom .env file to load environment variables from.
-h, --help                 Display this help message.
```

### Examples

Same-chain ETH -> DAI on Ethereum via 1inch:
```bash
btr-swap quote \
  --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \
  --output 1:0x6B175474E89094C44Da98b954EedeAC495271d0F:DAI:18 \
  --input-amount 1e18 \
  --payer 0xYourAddressHere \
  --aggregators LIFI
```

Cross-chain ETH (Eth) -> DAI (Optimism) via LiFi & Squid with a custom .env file:
```bash
btr-swap quote \
  --input 1:0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE:ETH:18 \
  --output 10:0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1:DAI:18 \
  --input-amount 1e18 \
  --payer 0xYourAddressHere \
  --aggregators LIFI,SQUID \
  --serialization TABLE \
  --display RANK,ALL_COMPACT \
  --env-file ./custom.env
```

Using API keys and integrator IDs:
```bash
btr-swap quote \
  --input 137:0x...:ETH:18 \
  --output 1:0x...:DAI:18 \
  --input-amount 5e17 \
  --payer 0x... \
  --aggregators RANGO,LIFI \
  --integrator-ids '{"LIFI":"integrator-id"}' \
  --api-keys '{"RANGO":"api-key"}' \
  --serialization TABLE
```

## Environment Variables

You can use a `.env` file in the current directory or specify a custom `.env` file with the `--env-file` option.

## License

MIT
