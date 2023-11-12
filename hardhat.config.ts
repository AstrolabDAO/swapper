// TODO: update to ethers v6+@nomicfoundation once tenderly supports it
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

import { config, } from "@astrolabs/hardhat/dist/hardhat.config";

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
    tests: "./test/integration"
};

export default config;
