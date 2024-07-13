import qs from "qs";
import { addEstimatesToTransactionRequest } from "../";
import { ISwapperParams, ITransactionRequestWithEstimate, validateQuoteParams } from "../types";

// Socket specific types

interface IToken {
  name: string;
  address: string;
  icon: string;
  decimals: number|string;
  symbol: string;
  chainId: string;
  logoURI: string;
  chainAgnosticId: string;
}

interface IRefuel {
  fromAmount: string;
  toAmount: string|number;
  gasFees: {
    gasLimit: number;
    feesInUsd: number;
    asset: IToken;
    gasAmount: string;
  };
  recipient: string;
  serviceTime: number;
  fromAsset: IToken;
  toAsset: IToken;
  fromChainId: number;
  toChainId: number;
}

// passed to /build-tx's body
interface IRoute {
  routeId: string;
  isOnlySwapRoute: boolean;
  fromAmount: string|number;
  toAmount: string|number;
  usedBridgeNames: string[];
  minimumGasBalances: string;  // Assuming this is a string, adjust as necessary
  chainGasBalances: any;  // Deprecated, type not provided
  totalUserTx: number;
  sender: string;
  recipient: string;
  totalGasFeesInUsd: string;
  userTxs: IUserTx[];
  fromAsset: IToken;
  fromChainId: number;
  toAsset: IToken;
  toChainId: number;
  routePath: string;
  refuel: IRefuel;  // Assuming there's a RefuelObject interface
  bridgeRouteErrors: Record<string, any>;
}

interface IUserTx {
  userTxType: string;  // Values on Types page
  txType: string;  // Values on Types page
  chainId: number;
  fromAsset: IToken;
  fromAmount: string;
  toAsset: IToken;
  toAmount: string;
  stepCount: number;
  routePath: string;
  sender: string;
  approvalData: string | null;
  steps: IStep[] | null;  // Not returned when there's only one step
  serviceTime: number;
  maxServiceTime: number;
}

interface IStep {
  type: string;  // Values in Types page
  bridgeSlippage: number;
  swapSlippage: number;
  minAmountOut: string;
  protocol: any;
  protocolFees: any;
  gasFees: any;
  recipient: string;
}

interface IQuoteParams {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  recipient?: string;
  includeDexes?: string[];
  excludeDexes?: string[];
  includeBridges?: string[];
  excludeBridges?: string[];
  singleTxOnly: boolean;
  uniqueRoutesPerBridge: boolean;
  disableSwapping?: boolean;
  sort?: "output" | "gas" | "time";
  maxUserTxs?: number;
  bridgeWithGas?: boolean;
  bridgeWithInsurance?: boolean;
  isContractCall?: boolean;
  destinationPayload?: string;
  destinationGasLimit?: number;
  defaultBridgeSlippage?: number;
  defaultSwapSlippage?: number;
  feePercent?: number;
  feeTakerAddress?: string;
}

interface IQuote {
  routes: IRoute[];
  fromChainId: number;
  toChainId: number;
  fromAsset: IToken;
  toAsset: IToken;
  refuel: IRefuel;
}

interface ISwapData {
  userTxType: string;
  txTarget: string;
  chainId: string;
  txData: string;
  txType: string;
  value: string;
  totalUserTx: number;
  approvalData: {
    minimumApprovalAmount: string;
    approvalTokenAddress: string;
    allowanceTarget: string;
    owner: string;
  };
}

interface IStatusParams {
  transactionHash: string;
  fromChainId: string;
  toChainId: string;
  bridgeName?: string;
  isBridgeProtectionTx?: boolean;
}

interface IStatusData {
  sourceTx: string;
  sourceTxStatus: string;
  destinationTransactionHash: string;
  destinationTxStatus: string;
  fromChainId: number;
  toChainId: number;
}

const apiRoot = "https://api.socket.tech/v2";
const apiKey = process.env?.SOCKET_API_KEY;

export const convertParams = (o: ISwapperParams): IQuoteParams => ({
  fromChainId: o.inputChainId,
  toChainId: o.outputChainId ?? o.inputChainId,
  fromTokenAddress: o.input,
  toTokenAddress: o.output,
  fromAmount: o.amountWei.toString(),
  userAddress: o.testPayer ?? o.payer,
  recipient: o.receiver ?? o.payer,
  // includeDexes: o.includeDexes,
  // excludeDexes: o.excludeDexes,
  // includeBridges: o.includeBridges,
  // excludeBridges: o.excludeBridges,
  singleTxOnly: true,
  uniqueRoutesPerBridge: true,
  disableSwapping: false,
  sort: "output", // output == cheapest route (max output)
  maxUserTxs: 14,
  bridgeWithGas: false, // send gas to the other side with tx
  bridgeWithInsurance: false,
  isContractCall: true,
  // destinationPayload: "",
  // destinationGasLimit: 0,
  defaultBridgeSlippage: Math.min(Math.round(o.maxSlippage! / 100), 1), // in % (eg. .1 = .1%),
  defaultSwapSlippage: Math.min(Math.round(o.maxSlippage! / 100), 1), // in % (eg. .1 = .1%),
  // defaultSwapSlippage: 100,
  // feePercent: 0,
  // feeTakerAddress: "",
});

export const routerByChainId: { [id: number]: string } = {
  1: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  10: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  56: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  100: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  122: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  137: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  250: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  324: "0xaDdE7028e7ec226777e5dea5D53F6457C21ec7D6",
  1101: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  8453: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  59144: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  42161: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  42220: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  43114: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
  1313161554: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5",
};

// NB: inspired by official docs https://docs.socket.tech/socket-api/v2/guides/socket-api-ethers.js-examples/single-tx-example
export async function getTransactionRequest(o: ISwapperParams): Promise<ITransactionRequestWithEstimate|undefined> {
  if (!apiKey) throw new Error("missing env.SOCKET_API_KEY");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  try {
    const quote = await getQuote(o);
    if (!quote) return;
    const res = await fetch(`${apiRoot}/build-tx`,
    {
      method: "POST",
      headers: {
        "API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route: quote.routes[0] }),
    });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText}`);
    const swapData = (await res.json())?.result as ISwapData;
    const tr: ITransactionRequestWithEstimate = {
      to: swapData.txTarget,
      data: swapData.txData,
      value: swapData.value,
      from: o.payer,
    };
    return addEstimatesToTransactionRequest({
      tr,
      gasEstimate: {
        totalGasCostUsd: 0,
        totalGasCostWei: "0",
        totalFeeCostUsd: 0, // TODO: reduce steps[].protocolFees
        totalFeeCostWei: "0", // same
      },
      inputAmountWei: BigInt(o.amountWei as string),
      outputAmountWei: BigInt(quote!.routes[0].toAmount),
      inputDecimals: Number(quote!.fromAsset.decimals),
      outputDecimals: Number(quote!.toAsset.decimals),
      approvalAddress: swapData.txTarget
    });
  } catch (e) {
    throw new Error(`getTransactionRequest failed: ${e}`);
  }
}

// cf. https://apidocs.li.fi/reference/get_quote
// Get a quote for your desired transfer
export async function getQuote(o: ISwapperParams): Promise<IQuote|undefined> {
  if (!apiKey) throw new Error("missing env.SOCKET_API_KEY");
  if (!validateQuoteParams(o)) throw new Error("invalid input");
  const params = convertParams(o);
  const url = `${apiRoot}/quote?${qs.stringify(params)}`;
  try {
    const res = await fetch(url,
      { headers: { "API-KEY": apiKey } });
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText}`);
    return (await res.json())?.result;
  } catch (e) {
    throw new Error(`getQuote failed: ${e}`);
  }
}

// Check the status of your cross-chain transfers
// while (result.status !== "DONE" && result.status !== "FAILED")
//   result = await getStatus(quote.tool, fromChain, toChain, tx.hash);
export async function getStatus(o: IStatusParams): Promise<IStatusData|undefined> {
  if (!apiKey) throw new Error("missing env.SOCKET_API_KEY");
  try {
    const res = await fetch(`${apiRoot}/status?${qs.stringify(o)}`,
      { headers: { "API-KEY": apiKey }});
    if (res.status >= 400)
      throw new Error(`${res.status}: ${res.statusText}`);
    return (await res.json()).result;
  } catch (e) {
    throw new Error(`getStatus failed: ${e}`);
  }
}
