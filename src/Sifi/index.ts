import { ITransactionRequestWithEstimate } from "../types";
import qs from "qs";
import { ISwapperParams, validateQuoteParams } from "../types";

// Sifi specific types
interface IQuote {
  // NOTE: No fields have been added since these are never accessed
}

interface IQuoteParams {
  fromChain: number;
  fromToken: string;
  toChain?: number;
  toToken: string;
  fromAmount: string;
  disablePermit?: number;
}

const ROUTER_ADDRESS = "0x65c49E9996A877d062085B71E1460fFBe3C4c5Aa";
const apiRoot = "https://api.sifi.org/v1/";

export const routerByChainId: { [id: number]: string } = {
  1: ROUTER_ADDRESS,
  10: ROUTER_ADDRESS,
  56: ROUTER_ADDRESS,
  137: ROUTER_ADDRESS,
  8453: ROUTER_ADDRESS,
  42161: ROUTER_ADDRESS,
  43114: ROUTER_ADDRESS,
};

const convertParams = (o: ISwapperParams): IQuoteParams => ({
  fromChain: o.inputChainId,
  fromToken: o.input,
  toChain: o.outputChainId,
  toToken: o.output,
  fromAmount: o.amountWei.toString(),
  disablePermit: 1,
});

export async function getQuote(o: ISwapperParams): Promise<IQuote|undefined> {
  if (!routerByChainId[o.inputChainId]) return undefined;
  // NOTE: Required for validateQuoteParams
  o.payer = o.payer || o.testPayer!;
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  try {
    const url = `${apiRoot}quote?${qs.stringify(params)}`;
    const res = await fetch(url);
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    return await res.json();
  } catch (e) {
    console.error(`getQuote failed: ${e}`);
  }
}

// NOTE: Expects referrer to be an EVM address
export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  const quote = await getQuote(o);
  if (!quote) return undefined;
  const params = {
    quote,
    toAddress: o.receiver ?? o.payer ?? o.testPayer,
    fromAddress: o.payer ?? o.testPayer,
    partner: o.referrer
  };
  try {
    const res = await fetch(
      `${apiRoot}swap`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      },
    );
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText} - ${await res.text?.()}`);
    const swap = await res.json();
    return {
      ...swap.tx,
      estimatedGas: swap.tx.gasLimit,
    };
  } catch (e) {
    console.error(`getTransactionRequest failed: ${e}`);
  }
}
