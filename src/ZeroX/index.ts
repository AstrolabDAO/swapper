import qs from "qs";
import { ISwapperParams, ITransactionRequestWithEstimate, validateQuoteParams } from "../types";

// 0x specific types
export interface IQuoteParams {
  sellToken: string;
  buyToken: string;
  sellAmount: number|string;
  slippagePercentage: number|string;
  takerAddress: string;
  skipValidation: boolean;
}

export interface IPriceData {
  price: number;
  gasPrice: number;
  gas: number;
  sellAmount: number;
  buyAmount: number;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
}

export interface IQuoteData {
  sellAmount: number;
  grossSellAmount: number;
  buyAmount: number;
  grossBuyAmount: number;
  price: number;
  grossPrice: number;
  guaranteedPrice: number;
  to: string;
  data: string; // <-- callData
  value: string;
  gas: number;
  gasPrice: number;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
}

// cf. https://github.com/0xProject/protocol/blob/development/docs/basics/addresses.rst
export const routerByChainId: { [id: number]: string } = {
  1: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  10: "0xdef1abe32c034e558cdd535791643c58a13acc10",
  56: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  137: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  250: "0xdef189deaef76e379df891899eb5a00a94cbc250",
  8217: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  8453: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  42161: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  42220: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  43114: "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
};

// 0x network url slugs
export const networkPrefixNetworkId: { [key: string]: string } = {
  1: "",
  10: "optimism.",
  56: "bsc.",
  137: "polygon.",
  250: "fantom.",
  8453: "base.",
  4220: "celo.",
  43114: "avalanche",
  42161: "arbitrum",
};

const apiKey = process.env?.ZERO_X_API_KEY;
const getApiRoot = (networkId: number, matcha = false) =>
  matcha
    ? `https://matcha.xyz/api`
    : `https://${networkPrefixNetworkId[networkId]}api.0x.org/swap/v1`;

export const convertParams = (o: ISwapperParams): IQuoteParams => ({
  sellToken: o.input,
  buyToken: o.output,
  sellAmount: o.amountWei.toString(),
  slippagePercentage: o.maxSlippage! / 10_000,
  takerAddress: o.receiver ?? o.payer,
  skipValidation: true,
});

export async function getTransactionRequest(o: ISwapperParams, matcha = false): Promise<ITransactionRequestWithEstimate|undefined> {
  const quote = await getQuote(o, matcha);
  if (!quote?.data) throw new Error("missing quote.data");
  return {
    gasLimit: quote.gas * 2,
    // gasPrice: quote.gasPrice,
    from: o.payer,
    to: quote.to,
    data: quote.data,
    value: quote.value,
  }
}

// cf. https://0x.org/docs/0x-swap-api/api-references/get-swap-v1-quote
export async function getQuote(
  o: ISwapperParams,
  matcha = false,
): Promise<IQuoteData> {
  if (!apiKey && !matcha) throw new Error("missing env.ZERO_X_API_KEY");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  const res = matcha
    ? await fetch(
        `${getApiRoot(o.inputChainId, matcha)}?chainId=${
          o.inputChainId
        }&resource=quote&params=${encodeURIComponent(JSON.stringify(params))}`,
      )
    : await fetch(
        `${getApiRoot(o.inputChainId)}/quote?${qs.stringify(params)}`,
        { headers: { "0x-api-key": apiKey! } },
      );
  return await res.json();
}
