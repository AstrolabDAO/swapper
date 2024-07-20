import { deployAll, getRegistryLatest, getSalts } from "@astrolabs/hardhat";

let [protocolAddr, salts] = [getRegistryLatest(), getSalts()];

async function main() {
  await deployAll({
    name: "Swapper",
    contract: "Swapper",
    verify: true,
    useCreate3: true,
    create3Salt: salts.Swapper, // used only if not already deployed
    args: [protocolAddr.DAOCouncil, false, false, true],
    // overrides: { gasLimit: 3_500_000 }, // required for gnosis-chain (wrong rpc estimate)
    address: protocolAddr.Swapper, // use if already deployed (eg. to verify)
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
