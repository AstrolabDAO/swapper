import { deployAll } from "@astrolabs/hardhat";
import { getProtocolAddresses, getSalts } from "../test/utils/addresses";

let protocolAddr = getProtocolAddresses();
let salts = getSalts();

async function main() {
  await deployAll({
    name: "Swapper",
    contract: "Swapper",
    verify: true,
    useCreate3: true,
    create3Salt: salts.Swapper, // used only if not already deployed
    args: [protocolAddr.DAOCouncil, false, false, true],
    // overrides: {
    //   gasLimit: 2_500_000,
    // },
    // deployed: true,
    // address: "0x00004E6c833C7A39FDcf037A634a23C6134CAAA0", // use if already deployed to verify
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
