import { config, deploy, deployAll, changeNetwork } from "@astrolabs/hardhat";

async function main() {
  // await changeNetwork("fantom-tenderly");
  await deployAll({ name: "swapper-tenderly", contract: "Swapper" });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
