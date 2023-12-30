import { deployAll } from "@astrolabs/hardhat";

async function main() {
  await deployAll({
    name: "Swapper",
    contract: "Swapper",
    verify: true,
    address: "0xdfe11C1bEB360820a6Aa9aDa899243dE459b3894"
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
