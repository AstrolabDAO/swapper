import { AggId, TokenInfoTuple } from "@/types";

/** List of aggregators supporting custom contract calls within a swap route. */
export const aggregatorsWithContractCalls = [AggId.LIFI, AggId.SOCKET, AggId.SQUID];
/** Default list of aggregators to query when none are specified and no custom calls are needed. */
export const defaultAggregators = [
  AggId.LIFI,
  AggId.SOCKET,
  AggId.UNIZEN,
  AggId.RANGO,
  AggId.SQUID,
];

/**
 * Represents the Ethereum zero address.
 */
export const zeroAddress = "0x0000000000000000000000000000000000000000";

/**
 * Placeholder address used by many protocols to represent the native token of a chain.
 */
export const nativeTokenAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * Slippage constants for DEX aggregators
 */
export const MAX_SLIPPAGE_BPS = 500; // 5%

export type ChainAddresses = {
  accounts?: { [token: string]: string };
  tokens: { [name: string]: TokenInfoTuple }; // Use tuple type
};

export const addresses: { [chainId: number]: ChainAddresses } = {
  1: {
    // Ethereum
    accounts: {
      impersonate: "0xf977814e90da44bfa03b6295a0616a897441acec", // Binance 20
    },
    tokens: {
      // stables
      USDC: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "USDC", 6],
      USDT: ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "USDT", 6],
      frxUSD: ["0xcacd6fd266af91b8aed52accc382b4e165586e29", "frxUSD", 18],
      FRAX: ["0x853d955aCEf822Db058eb8505911ED77F175b99e", "FRAX", 18],
      sFRAX: ["0xa663b02cf0a4b149d2ad41910cb81e23e1c41c32", "sFRAX", 18],
      FDUSD: ["0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409", "FDUSD", 18],
      LUSD: ["0x5f98805A4E8be255a32880FDeC7F6728C6568bA0", "LUSD", 18],
      DAI: ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "DAI", 18],
      USDS: ["0xdC035D45d973E3EC169d2276DDab16f1e407384F", "USDS", 18],
      sUSDS: ["0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD", "sUSDS", 18],
      BUSD: ["0x4Fabb145d64652a948d72533023f6E7A623C7C53", "BUSD", 18],
      DOLA: ["0x865377367054516e17014CcdED1e7d814EDC9ce4", "DOLA", 18],
      sDOLA: ["0xb45ad160634c528Cc3D2926d9807104FA3157305", "sDOLA", 18],
      crvUSD: ["0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E", "crvUSD", 18],
      scrvUSD: ["0x0655977FEb2f289A4aB78af67BAB0d17aAb84367", "scrvUSD", 18],
      USDe: ["0x4c9EDD5852cd905f086C759E8383e09bff1E68B3", "USDe", 18],
      sUSDe: ["0x9D39A5DE30e57443BfF2A8307A4256c8797A3497", "sUSDe", 18],
      PYUSD: ["0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", "PYUSD", 18],
      USDD: ["0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6", "USDD", 18],
      TUSD: ["0x0000000000085d4780B73119b644AE5ecd22b376", "TUSD", 18],
      USDP: ["0x8E870D67F660D95d5be530380D0eC0bd388289E1", "USDP", 18],
      BUIDL: ["0x7712c34205737192402172409a8f7ccef8aa2aec", "BUIDL", 6],
      USD0: ["0x73A15FeD60Bf67631dC6cd7Bc5B6e8da8190aCF5", "USD0", 18],
      USDX: ["0xf3527ef8de265eaa3716fb312c12847bfba66cef", "USDX", 18],
      USR: ["0x66a1E37c9b0eAddca17d3662D6c05F4DECf3e110", "USR", 18],
      USDY: ["0x96F6eF951840721AdBF46Ac996b59E0235CB985C", "USDY", 18],
      RLUSD: ["0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD", "RLUSD", 18],
      USDa: ["0x8A60E489004Ca22d775C5F2c657598278d17D9c2", "USDa", 18],
      sUSDa: ["0x2b66aade1e9c062ff411bd47c44e0ad696d43bd9", "sUSDa", 18],
      deUSD: ["0x15700b564ca08d9439c58ca5053166e8317aa138", "deUSD", 18],
      sdeUSD: ["0x5c5b196abe0d54485975d1ec29617d42d9198326", "sdeUSD", 18],
      EURC: ["0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c", "EURC", 6],
      GHO: ["0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f", "GHO", 18],
      // flagships
      WETH: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "WETH", 18],
      WGAS: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "WGAS", 18],
      WBTC: ["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", "WBTC", 8],
      cbBTC: ["0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", "cbBTC", 8],
      wSOL: ["0xD31a59c85aE9D8edEFeC411D448f90841571b89c", "wSOL", 9],
      wAVAX: ["0x85f138bfEE4ef8e540890CFb48F620571d67Eda3", "wAVAX", 18],
      BNB: ["0xB8c77482e45F1F44dE1745F52C74426C631bDD52", "BNB", 18],
      ARB: ["0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1", "ARB", 18],
      POL: ["0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6", "POL", 10],
      TON: ["0x582d872a1b094fc48f5de31d3b73f2d9be47def1", "TON", 9],
      DOT: ["0x21c2c96dbfa137e23946143c71ac8330f9b44001", "POL", 10],
      MNT: ["0x3c3a81e81dc49a522a592e7622a7e711c06bf354", "MNTL", 18],
      MOVE: ["0x3073f7aaa4db83f95e9fff17424f71d4751a3073", "MOVE", 18],
      GNO: ["0x6810e776880c02933d47db1b9fc05908e5386b96", "GNO", 18],
      // staking
      stETH: ["0xae7ab96520de3a18e5e111b5eaab095312d7fe84", "stETH", 18],
      wstETH: ["0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0", "wstETH", 18],
      rETH: ["0xae78736cd615f374d3085123a210448e74fc6393", "rETH", 18],
      weETH: ["0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee", "weETH", 18],
      rsETH: ["0xa1290d69c65a6fe4df752f95823fae25cb99e5a7", "rsETH", 18],
      ezETH: ["0x2416092f143378750bb29b79ed961ab195cceea5", "ezETH", 18],
      SolvBTCBBN: ["0xd9d920aa40f578ab794426f5c90f6c731d159def", "SolvBTCBBN", 18],
      mETH: ["0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa", "mETH", 18],
      cmETH: ["0xe6829d9a7ee3040e1276fa75293bde931859e8fa", "cmETH", 18],
      osETH: ["0xf1c9acdc66974dfb6decb12aa385b9cd01190e38", "osETH", 18],
      eETH: ["0x35fa164735182de50811e8e2e824cfb9b6118ac2", "eETH", 18],
      eBTC: ["0x657e8c867d8b37dcc18fa4caead9c45eb088c642", "eBTC", 8],
      ETHx: ["0xA35b1B31Ce002FBF2058D22F30f95D405200A15b", "ETHx", 18],
      cbETH: ["0xBe9895146f7AF43049ca1c1AE358B0541Ea49704", "cbETH", 18],
      wBETH: ["0xa2e3356610840701bdf5611a53974510ae27e2e1", "wBETH", 18],
      stBTC: ["0xf6718b2701D4a6498eF77D7c152b2137Ab28b8A3", "stBTC", 18],
      OETH: ["0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3", "OETH", 18],
      rswETH: ["0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0", "rswETH", 18],
      // DEXs
      UNI: ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "UNI", 18],
      SUSHI: ["0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", "SUSHI", 18],
      CRV: ["0xD533a949740bb3306d119CC777fa900bA034cd52", "CRV", 18],
      CAKE: ["0x152649eA73beAb28c5b49B26eb48f7EAD6d4c898", "CAKE", 18],
      BAL: ["0xba100000625a3754423978a60c9317c58a424e3d", "BAL", 18],
      PENDLE: ["0x808507121b80c02388fad14726482e061b8da827", "PENDLE", 18],
    },
  },
  10: {
    // Optimism
    accounts: {
      impersonate: "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB", // Compound Vault
    },
    tokens: {
      // stables
      USDC: ["0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", "USDC", 6],
      USDCe: ["0x7F5c764cBc14f9669B88837ca1490cCa17c31607", "USDC.e", 6],
      axlUSDC: ["0xEB466342C4d449BC9f53A865D5Cb90586f405215", "axlUSDC", 6],
      USDT: ["0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", "USDT", 6],
      frxUSD: ["0x80eede496655fb9047dd39d9f418d5483ed600df", "frxUSD", 18],
      FRAX: ["0x2E3D870790dC77A83DD1d18184Acc7439A53f475", "FRAX", 18],
      LUSD: ["0xc40F949F8a4e094D1b49a23ea9241D289B7b2819", "LUSD", 18],
      DAI: ["0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", "DAI", 18],
      BUSD: ["0x9C9e5fD8bbc25984B178FdCE6117Defa39d2db39", "BUSD", 18],
      DOLA: ["0x8aE125E8653821E851F12A49F7765db9a9ce7384", "DOLA", 18],
      crvUSD: ["0xC52D7F23a2e460248Db6eE192Cb23dD12bDDCbf6", "crvUSD", 18],
      USDe: ["0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", "USDe", 18],
      sUSDe: ["0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", "sUSDe", 18],
      USDD: ["0x7113370218f31764C1B6353BDF6004d86fF6B9cc", "USDD", 18],
      TUSD: ["0xcB59a0A753fDB7491d5F3D794316F1adE197B21E", "TUSD", 18],
      sUSD: ["0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9", "sUSD", 18],
      USDplus: ["0x73cb180bf0521828d8849bc8cf2b920918e23032", "USD+", 6],
      BUIDL: ["0xa1cdab15bba75a80df4089cafba013e376957cf5", "BUIDL", 18],
      // flagships
      WETH: ["0x4200000000000000000000000000000000000006", "WETH", 18],
      WGAS: ["0x4200000000000000000000000000000000000006", "WGAS", 18],
      WBTC: ["0x68f180fcCe6836688e9084f035309E29Bf0A2095", "WBTC", 8],
      tBTC: ["0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40", "tBTC", 8],
      wSOL: ["0xba1Cf949c382A32a09A17B2AdF3587fc7fA664f1", "wSOL", 9],
      OP: ["0x4200000000000000000000000000000000000042", "OP", 18],
      WLD: ["0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1", "WLD", 18],
      // staking
      stETH: ["0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb", "stETH", 18],
      wstETH: ["0x1f32b1c2345538c0c6f582fcb022739c4a194ebb", "wstETH", 18],
      rETH: ["0x9bcef72be871e61ed4fbbc7630889bee758eb81d", "rETH", 18],
      frxETH: ["0x6806411765af15bddd26f8f544a34cc40cb9838b", "frxETH", 18],
      sfrxETH: ["0x484c2d6e3cdd945a8b2df735e079178c1036578c", "sfrxETH", 18],
      sETH: ["0xe405de8f52ba7559f9df3c368500b6e6ae6cee49", "sETH", 18],
      sBTC: ["0x298b9b95708152ff6968aafd889c6586e9169f1d", "sBTC", 18],
      cbETH: ["0xaddb6a0412de1ba0f936dcaeb8aaa24578dcf3b2", "cbETH", 18],
      // DEXs
      UNI: ["0x6fd9d7AD17242c41f7131d257212c54A0e816691", "UNI", 18],
      SUSHI: ["0x3eaEb77b03dBc0F6321AE1b72b2E9aDb0F60112B", "SUSHI", 18],
      CRV: ["0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53", "CRV", 18],
      VELO: ["0x3c8B650257cFb5f272f799F5e2b4e65093a11a05", "VELO", 18],
      VELOv2: ["0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db", "VELOv2", 18],
      BAL: ["0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921", "BAL", 18],
      PENDLE: ["0xbc7b1ff1c6989f006a1185318ed4e7b5796e66e1", "PENDLE", 18],
    },
  },
  56: {
    // BNB Chain
    accounts: {
      impersonate: "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3", // Binance 6
    },
    tokens: {
      // stables
      USDC: ["0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", "USDC", 18],
      USDT: ["0x55d398326f99059ff775485246999027b3197955", "USDT", 18],
      frxUSD: ["0x80eede496655fb9047dd39d9f418d5483ed600df", "frxUSD", 18],
      FRAX: ["0x90c97f71e18723b0cf0dfa30ee176ab653e89f40", "FRAX", 18],
      BUSD: ["0xe9e7cea3dedca5984780bafc599bd69add087d56", "BUSD", 18],
      FDUSD: ["0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409", "FDUSD", 18],
      lisUSD: ["0x0782b6d8c4551B9760e74c0545a9bCD90bdc41E5", "lisUSD", 18],
      DAI: ["0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", "DAI", 18],
      USDe: ["0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", "USDe", 18],
      sUSDe: ["0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", "sUSDe", 18],
      USD0: ["0x758a3e0b1f842c9306b783f8a4078c6c8c03a270", "USD0", 18],
      crvUSD: ["0xe2fb3F127f5450DeE44afe054385d74C392BdeF4", "crvUSD", 18],
      USDX: ["0xf3527ef8dE265eAa3716FB312c12847bFBA66Cef", "USDX", 18],
      sUSDX: ["0x7788A3538C5fc7F9c7C8A74EAC4c898fC8d87d92", "sUSDX", 18],
      TUSD: ["0x40af3827F39D0EAcBF4A168f8D4ee67c121D11c9", "TUSD", 18],
      USDD: ["0x392004BEe213F1FF580C867359C246924f21E6Ad", "USDD", 18],
      USDplus: ["0xe80772eaf6e2e18b651f160bc9158b2a5cafca65", "USD+", 6],
      MAI: ["0x3F56e0c36d275367b8C502090EDF38289b3dEa0d", "MAI", 18],
      // flagships
      WETH: ["0x2170ed0880ac9a755fd29b2688956bd959f933f8", "WETH", 18],
      XRP: ["0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe", "XRP", 18],
      DOGE: ["0xba2ae424d960c26247dd6c32edc70b295c744c43", "DOGE", 18],
      ADA: ["0x3ee2200efb3400fabb9aacf31297cbdd1d435d47", "ADA", 18],
      WBNB: ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "WBNB", 18],
      WGAS: ["0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "WGAS", 18],
      WBTC: ["0x0555e30da8f98308edb960aa94c0db47230d2b9c", "WBTC", 8],
      TON: ["0x76A797A59Ba2C17726896976B7B3747BfD1d220f", "TON", 9],
      AVAX: ["0x1ce0c2827e2ef14d5c4f29a091d735a204794041", "WBTC", 18],
      POL: ["0xcc42724c6683b7e57334c4e856f4c9965ed682bd", "POL", 10],
      DOT: ["0x7083609fce4d1d8dc0c979aab8c869ea2c873402", "DOT", 18],
      LTC: ["0x4338665cbb7b2485a8855a139b75d5e34ab0db94", "LTC", 18],
      BCH: ["0x8ff795a6f4d97e7887c79bea79aba5cc76444adf", "BCH", 18],
      BTCB: ["0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", "BTCB", 18],
      LBTC: ["0xecac9c5f704e954931349da37f60e39f515c11c1", "LBTC", 8],
      ARB: ["0xa050ffb3eeb8200eeb7f61ce34ff644420fd3522", "ARB", 18],
      OP: ["0x170C84E3b1D282f9628229836086716141995200", "OP", 18],
      // staking
      SolvBTC: ["0x4aae823a6a0b376de6a78e74ecc5b079d38cbcf7", "SolvBTC", 18],
      ezETH: ["0x2416092f143378750bb29b79ed961ab195cceea5", "ezETH", 18],
      frxETH: ["0x64048a7eecf3a2f1ba9e144aac3d7db6e58f555e", "frxETH", 18],
      SolvBTCCORE: ["0xb9f59cab0d6aa9d711ace5c3640003bc09c15faf", "SolbBTC.CORE", 18],
      // DEXs
      UNI: ["0xBf5140A22578168FD562DCcF235E5D43A02ce9B1", "UNI", 18],
      SUSHI: ["0x947950BcC74888a40Ffa2593C5798F11Fc9124C4", "SUSHI", 18],
      THE: ["0xf4c8e32eadec4bfe97e0f595add0f4450a863a11", "THE", 18],
      BSW: ["0x965f527d9159dce6288a2219db51fc6eef120dd1", "BSW", 18],
      CRV: ["0x9996D0276612d23b35f90C51EE935520B3d7355B", "CRV", 18],
      BAL: ["0xd4ed60d8368a92b5f1ca33af61ef2a94714b2d46", "BAL", 18],
      JOE: ["0x371c7ec6d8039ff7933a2aa28eb827ffe1f52f07", "JOE", 18],
      DODO: ["0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2", "DODO", 18],
      PENDLE: ["0xb3ed0a426155b79b898849803e3b36552f7ed507", "PENDLE", 18],
    },
  },
  100: {
    // Gnosis Chain
    accounts: {},
    tokens: {
      // stables
      USDT: ["0x4ecaba5870353805a9f068101a40e0f32ed605c6", "USDT", 6],
      USDCe: ["0x2a22f9c3b484c3629090feed35f17ff8f88f76f0", "USDC.e", 6],
      USDC: ["0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", "USDC", 6],
      GYD: ["0xca5d8f8a8d49439357d3cf46ca2e720702f132b8", "GYD", 18],
      sDAI: ["0xaf204776c7245bf4147c2612bf6e5972ee483701", "sDAI", 18],
      EURe: ["0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430", "EURe", 18],
      WXDAI: ["0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", "WXDAI", 18],
      WGAS: ["0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", "WGAS", 18],
      // flagships
      WBTC: ["0x8e5bbbb09ed1ebde8674cda39a0c169401db4252", "WBTC", 8],
      WETH: ["0x4537e328bf7e4efa29d05caea260d7fe26af9d74", "WETH", 18],
      GNO: ["0x9c58bacc331c9aa871afd802db6379a98e80cedb", "GNO", 18],
      // staking
      wstETH: ["0x6c76971f98945ae98dd7d4dfca8711ebea946ea6", "wstETH", 18],
      rETH: ["0xc791240d1f2def5938e2031364ff4ed887133c3d", "rETH", 18],
    },
  },
  146: {
    // Sonic
    accounts: {
      impersonate: "0xBA12222222228d8Ba445958a75a0704d566BF2C8", // Beets Vault
    },
    tokens: {
      // stables
      USDCe: ["0x29219dd400f2Bf60E5a23d13Be72B486D4038894", "USDC.e", 6],
      USDT: ["0x6047828dc181963ba44974801FF68e538dA5eaF9", "USDT", 6],
      frxUSD: ["0x80eede496655fb9047dd39d9f418d5483ed600df", "frxUSD", 18],
      scUSD: ["0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE", "scUSD", 18],
      // flagships
      wS: ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "wS", 18],
      WGAS: ["0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", "WGAS", 18],
      WETH: ["0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", "WETH", 18],
      WBTC: ["0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", "WBTC", 8],
      wSOL: ["0xba1Cf949c382A32a09A17B2AdF3587fc7fA664f1", "wSOL", 9],
      // staking
      frxETH: ["0x43eDD7f3831b08FE70B7555ddD373C8bF65a9050", "frxETH", 18],
      OS: ["0xb1e25689d55734fd3fffc939c4c3eb52dff8a794", "OS", 18],
      LBTC: ["0xecac9c5f704e954931349da37f60e39f515c11c1", "LBTC", 8],
      // DEXs
      EQUAL: ["0xddF26B42C1d903De8962d3F79a74a501420d5F19", "EQUAL", 18],
      SHADOW: ["0x3333b97138D4b086720b5aE8A7844b1345a33333", "SHADOW", 18],
      SWPx: ["0xa04bc7140c26fc9bb1f36b1a604c7a5a88fb0e70", "SWPx", 18],
      METRO: ["0x71E99522EaD5E21CF57F1f542Dc4ad2E841F7321", "METRO", 18],
      BEETS: ["0x2d0e0814e62d80056181f5cd932274405966e4f0", "BEETS", 18],
      WAGMI: ["0x0e0ce4d450c705f8a0b6dd9d5123e3df2787d16b", "WAGMI", 18],
      FIVE: ["0xb0695ce12c56aae40894235e2d1888d0b62dd110", "FIVE", 18],
      UNI: ["0x2fb960611bdc322a9a4a994252658cae9fe2eea1", "UNI", 18],
      CRV: ["0x5af79133999f7908953e94b7a5cf367740ebee35", "CRV", 18],
      PENDLE: ["0xf1eF7d2D4C0c881cd634481e0586ed5d2871A74B", "PENDLE", 18],
    },
  },
  8453: {
    // Base
    accounts: {
      impersonate: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb", // Morpho
    },
    tokens: {
      // stables
      USDC: ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", "USDC", 6],
      USDbC: ["0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", "USDbC", 6],
      USDe: ["0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", "USDe", 18],
      sUSDe: ["0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2", "sUSDe", 18],
      USDS: ["0x820c137fa70c8691f0e44dc420a5e53c168921dc", "USDS", 18],
      sUSDS: ["0x5875eee11cf8398102fdad704c9e96607675467a", "sUSDS", 18],
      DAI: ["0x50c5725949a6f0c72e6c4a641f24049a917db0cb", "DAI", 18],
      USD0: ["0x758a3e0b1f842c9306b783f8a4078c6c8c03a270", "USD0", 18],
      USDX: ["0xf3527ef8de265eaa3716fb312c12847bfba66cef", "USDX", 18],
      agEUR: ["0xa61beb4a3d02decb01039e378237032b351125b4", "agEUR", 18],
      USDplus: ["0xb79dd08ea68a908a97220c76d19a6aa9cbde4376", "USD+", 6],
      MIM: ["0x4A3A6Dd60A34bB2Aba60D73B4C88315E9CeB6A3D", "MIM", 18],
      DOLA: ["0x4621b7a9c75199271f773ebd9a499dbd165c3191", "DOLA", 18],
      USDz: ["0x04D5ddf5f3a8939889F11E97f8c4BB48317F1938", "USDz", 18],
      EURC: ["0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42", "EURC", 6],
      // flagships
      WETH: ["0x4200000000000000000000000000000000000006", "WETH", 18],
      WGAS: ["0x4200000000000000000000000000000000000006", "WGAS", 18],
      WBTC: ["0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", "WBTC", 8],
      cbBTC: ["0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", "cbBTC", 8],
      // staking
      wstETH: ["0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452", "wstETH", 18],
      weETH: ["0x04c0599ae5a44757c0af6f9ec3b93da8976c150a", "weETH", 18],
      eBTC: ["0x657e8c867d8b37dcc18fa4caead9c45eb088c642", "eBTC", 8],
      LBTC: ["0xecac9c5f704e954931349da37f60e39f515c11c1", "LBTC", 8],
      SolvBTC: ["0x3b86ad95859b6ab773f55f8d94b4b9d443ee931f", "SolvBTC", 18],
      rETH: ["0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c", "rETH", 18],
      ezETH: ["0x2416092f143378750bb29b79ed961ab195cceea5", "ezETH", 18],
      LsETH: ["0xb29749498954a3a821ec37bde86e386df3ce30b6", "LsETH", 18],
      superOETH: ["0xdbfefd2e8460a6ee4955a68582f85708baea60a3", "superOETH", 18],
      rsETH: ["0x1Bc71130A0e39942a7658878169764Bbd8A45993", "rsETH", 18],
      // DEXs
      AERO: ["0x940181a94a35a4569e4529a3cdfb74e38fd98631", "AERO", 18],
      ALB: ["0x1dd2d631c92b1acdfcdd51a0f7145a50130050c4", "ALB", 18],
      CRV: ["0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415", "CRV", 18],
      CAKE: ["0x3055913c90Fcc1A6CE9a358911721eEb942013A1", "CAKE", 18],
      PENDLE: ["0xa99f6e6785da0f5d6fb42495fe424bce029eeb3e", "PENDLE", 18],
    },
  },
  42161: {
    // Arbitrum
    accounts: {
      impersonate: "0x489ee077994B6658eAfA855C308275EAd8097C4A", // GMX Vault
    },
    tokens: {
      // stables
      USDT: ["0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", "USDT", 6],
      USDCe: ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "USDC.e", 6],
      USDC: ["0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "USDC", 6],
      frxUSD: ["0x80eede496655fb9047dd39d9f418d5483ed600df", "frxUSD", 18],
      FRAX: ["0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F", "FRAX", 18],
      USDS: ["0x6491c05a82219b8d1479057361ff1654749b876b", "USDS", 18],
      sUSDS: ["0xddb46999f8891663a8f2828d25298f70416d7610", "sUSDS", 18],
      DAI: ["0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", "DAI", 18],
      USDe: ["0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34", "USDe", 18],
      sUSDe: ["0x211cc4dd073734da055fbf44a2b4667d5e5fe5d2", "sUSDe", 18],
      TUSD: ["0x4D15a3A2286D883AF0AA1B3f21367843FAc63E07", "TUSD", 18],
      MIM: ["0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A", "MIM", 18],
      USDD: ["0x680447595e8b7b3Aa1B43beB9f6098C79ac2Ab3f", "USDD", 18],
      agEUR: ["0xFA5Ed56A203466CbBC2430a43c66b9D8723528E7", "agEUR", 18],
      MAI: ["0x3F56e0c36d275367b8C502090EDF38289b3dEa0d", "MAI", 18],
      USDX: ["0xf3527ef8de265eaa3716fb312c12847bfba66cef", "USDX", 18],
      sUSDX: ["0x7788A3538C5fc7F9c7C8A74EAC4c898fC8d87d92", "sUSDX", 18],
      USD0: ["0x35f1C5cB7Fb977E669fD244C567Da99d8a3a6850", "USD0", 18],
      USD0pp: ["0x2B65F9d2e4B84a2dF6ff0525741b75d1276a9C2F", "USD0++", 18],
      USDx: ["0xb2f30a7c980f052f02563fb518dcc39e6bf38175", "USDx", 18],
      EURC: ["0xaddfd192daa492b772ea5c180e79570dec92ff5c", "EURC", 18],
      BUIDL: ["0xa6525ae43edcd03dc08e775774dcabd3bb925872", "BUIDL", 6],
      USDY: ["0x35e050d3C0eC2d29D269a8EcEa763a183bDF9A9D", "USDY", 18],
      GHO: ["0x7dff72693f6a4149b17e7c6314655f6a9f7c8b33", "GHO", 18],
      USDL: ["0x7f850b0ab1988dd17b69ac564c1e2857949e4dee", "USDL", 18],
      DOLA: ["0x6a7661795c374c0bfc635934efaddff3a7ee23b6", "DOLA", 18],
      // flagships
      WETH: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "WETH", 18],
      WGAS: ["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "WGAS", 18],
      WBTC: ["0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", "WBTC", 8],
      ARB: ["0x912CE59144191C1204E64559FE8253a0e49E6548", "ARB", 18],
      cbBTC: ["0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", "cbBTC", 8],
      tBTC: ["0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40", "tBTC", 18],
      GNO: ["0xa0b862f60edef4452f25b4160f177db44deb6cf1", "GNO", 18],
      // staking
      wstETH: ["0x5979D7b546E38E414F7E9822514be443A4800529", "wstETH", 18],
      frxETH: ["0x178412e79c25968a32e89b11f63B33F733770c2A", "frxETH", 18],
      sfrxETH: ["0x95ab45875cffdba1e5f451b950bc2e42c0053f39", "sfrxETH", 18],
      SolvBTCENA: ["0xafafd68afe3fe65d376eec9eab1802616cfaccb8", "SolvBTC.ENA", 18],
      SolvBTC: ["0x3647c54c4c2c65bc7a2d63c0da2809b399dbbdc0", "SolvBTC", 18],
      ezETH: ["0x2416092f143378750bb29b79ed961ab195cceea5", "ezETH", 18],
      weETH: ["0x35751007a407ca6feffe80b3cb397736d2cf4dbe", "weETH", 18],
      eBTC: ["0x657e8c867d8b37dcc18fa4caead9c45eb088c642", "eBTC", 8],
      stBTC: ["0xf6718b2701d4a6498ef77d7c152b2137ab28b8a3", "stBTC", 8],
      rETH: ["0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8", "rETH", 18],
      // DEXs
      UNI: ["0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0", "UNI", 18],
      SUSHI: ["0xd4d42F0b6DEF4CE0383636770eF773390d85c61A", "SUSHI", 18],
      CRV: ["0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978", "CRV", 18],
      GMX: ["0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", "GMX", 18],
      PENDLE: ["0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8", "PENDLE", 18],
      BAL: ["0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8", "BAL", 18],
      JOE: ["0x371c7ec6d8039ff7933a2aa28eb827ffe1f52f07", "JOE", 18],
      DODO: ["0x69eb4fa4a2fbd498c257c57ea8b7655a2559a581", "DODO", 18],
      GRAIL: ["0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8", "GRAIL", 18],
      VELA: ["0x088cd8f5eF3652623c22D48b1605DCfE860Cd704", "VELA", 18],
    },
  },
};

/**
 * Index tokens by address for direct lookups
 */
Object.values(addresses).forEach((chainData) => {
  Object.entries(chainData.tokens).forEach(([_symbol, tokenInfo]) => {
    const [address] = tokenInfo;
    if (address && !chainData.tokens[address]) {
      chainData.tokens[address] = tokenInfo;
    }
  });
});
