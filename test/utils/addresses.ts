import { networkBySlug } from "@astrolabs/hardhat";

export type ChainAddresses = {
  accounts?: { [token: string]: string },
  tokens: { [name: string]: string }
};

export const addresses = {
  250: {
    accounts: {
      impersonate: "0x65bab4f268286b9005d6053a177948dddc29bad3",
    },
    tokens: {
      FRAX: "0xdc301622e621166BD8E82f2cA0A26c13Ad0BE355",
      WBTC: "0x321162Cd933E2Be498Cd2267a90534A804051b11",
      WETH: "0x74b23882a30290451a17c44f4f05243b6b58c76d",
      FUSDT: "0x049d68029688eabf473097a2fc38ef61633a3c7a",
      LZUSDC: "0x28a92dde19D9989F39A49905d7C9C2FAc7799bDf",
      AXLUSDC: "0x1b6382dbdea11d97f24495c9a90b7c88469134a4",
      STFTM: "0x69c744D3444202d35a2783929a0F930f2FBB05ad",
      MIM: "0x82f0B8B456c1A451378467398982d4834b6829c1",
      MAI: "0xfB98B335551a418cD0737375a2ea0ded62Ea213b",
      // wallet containning lzusdc+wftm+wbtc+weth
      WFTM: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
      WGAS: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
    }
  },
  10: {
    tokens: {
      USDC: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC Optimism
      DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI Optimism
      SYN: "0x5A5fFf6F753d7C11A56A52FE47a177a87e431655",
      VELO: "0x3c8B650257cFb5f272f799F5e2b4e65093a11a05",
      WETH: "0x4200000000000000000000000000000000000006",
      WGAS: "0x4200000000000000000000000000000000000006",
    }
  },
  42161: {
    accounts: {
      impersonate: "0x489ee077994B6658eAfA855C308275EAd8097C4A"
    },
    tokens: {
      ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      USDCE: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      TUSD: "0x4D15a3A2286D883AF0AA1B3f21367843FAc63E07",
      // SUSD: "0xA970AF1a584579B618be4d69aD6F73459D112F95", // no liqudity
      FRAX: "0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F",
      MIM: "0xFEa7a6a0B346362BF88A9e4A88416B77a57D6c2A",
      USDD: "0x680447595e8b7b3Aa1B43beB9f6098C79ac2Ab3f",
      AGEUR: "0xFA5Ed56A203466CbBC2430a43c66b9D8723528E7",
      WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
      LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
      SUSHI: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",
      CRV: "0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978",
      COMP: "0x354A6dA3fcde098F8389cad84b0182725c6C91dE",
      WSTETH: "0x0fBcbaEA96Ce0cF7Ee00A8c19c3ab6f5Dc8E1921",
      FRXETH: "0x178412e79c25968a32e89b11f63B33F733770c2A",
      GMX: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a",
      FXS: "0x9d2F299715D94d8A7E6F5eaa8E654E8c74a988A7",
      STG: "0x6694340fc020c5E6B96567843da2df01b2CE1eb6",
      // AXL: "0x23ee2343B892b1BB63503a4FAbc840E0e2C6810f", // no liquidity
      ACX: "0x53691596d1BCe8CEa565b84d4915e69e03d9C99d",
      PENDLE: "0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8",
      RDNT: "0x3082CC23568eA640225c2467653dB90e9250AaA0",
      KNC: "0xe4DDDfe67E7164b0FE14E218d80dC4C08eDC01cB",
      BAL: "0x040d1EdC9569d4Bab2D15287Dc5A4F10F56a56B8",
      AURA: "0x1509706a6c66CA549ff0cB464de88231DDBe213B",
      JOE: "0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07",
      JONES: "0x10393c20975cF177a3513071bC110f7962CD67da",
      HOP: "0xc5102fE9359FD9a28f877a67E36B0F050d81a3CC",
      LYRA: "0x079504b86d38119F859c4194765029F692b7B7aa",
      LODE: "0xF19547f9ED24aA66b03c3a552D181Ae334FBb8DB",
      DODO: "0x69Eb4FA4a2fbd498C257C57Ea8b7655a2559A581",
      GNS: "0x18c11FD286C5EC11c3b683Caa813B77f5163A122",
      GRAIL: "0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8",
      VELA: "0x088cd8f5eF3652623c22D48b1605DCfE860Cd704",
      WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      WGAS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    }
  },
} as { [chainId: number]: ChainAddresses };

// addresses[42161] == byNetwork("arbitrum-mainnet-one")
export const byNetwork = (id: string|number) =>
  addresses[id as number] ?? addresses[networkBySlug[id].id];

export default addresses;
