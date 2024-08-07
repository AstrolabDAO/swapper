// TODO: update to ethers v6+@nomicfoundation once tenderly supports it
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

import { config } from "@astrolabs/hardhat/dist/hardhat.config";

config.solidity!.compilers = [
  {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
        details: {
          peephole: true,
          jumpdestRemover: true,
          orderLiterals: true,
          deduplicate: true,
          cse: true,
          constantOptimizer: true,
          yul: true,
          yulDetails: {
            stackAllocation: false,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: false,
      evmVersion: `paris`
    },
  },
];

config.paths = {
  // registry
  interfaces: "../registry/interfaces",
  abis: "../registry/abis",
  registry: "../registry",
  // tmp build files
  artifacts: "./artifacts",
  cache: "./cache",
  // local sources
  sources: "./contracts",
  tests: "./test/integration",
} as any;

export default config;
