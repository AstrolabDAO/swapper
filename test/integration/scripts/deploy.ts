import { config, deploy, deployAll, changeNetwork } from "@astrolabs/hardhat";

async function main() {
  await deployAll({
    name: "Swapper",
    contract: "Swapper",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
