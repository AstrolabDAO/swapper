import addresses from "./addresses";
import { ISwapperParams, AggregatorId, ITransactionRequestWithEstimate } from "../../src/types";
import { getTransactionRequest, swapperParamsToString } from "../../src/";
import { TransactionRequest, ethers, network, weiToString } from "@astrolabs/hardhat";

const rndToken = (chainId: number) => {
  const inputs = Object.keys(addresses[chainId].tokens);
  return addresses[chainId].tokens[Object.keys(addresses[chainId].tokens)[Math.round(Math.random() * inputs.length)]];
}

export const fuzzCases = async (count=6, inputChainId=network.config.chainId as number, crossChain=false): Promise<ISwapperParams[]> => {
  const cases: ISwapperParams[] = [];
  const chains = Object.keys(addresses).map(Number);
  const inputs = Object.keys(addresses[inputChainId].tokens);

  for (let i = 0; i < count; i++) {
    // random outputChainId if crossChain
    const outputChainId = crossChain ? chains[Math.round(Math.random() * chains.length)] : inputChainId;
    // random input/output token
    let [input, output] = [inputChainId, outputChainId].map((chainId) => rndToken(chainId));
    while (input === output)
      output = rndToken(outputChainId);
    const testPayer = addresses[inputChainId].accounts!.impersonate;
    const c: ISwapperParams = { inputChainId, outputChainId, input, output, amountWei: 0, payer: "", testPayer };
    const contracts = await Promise.all(
      [input, output].map((addr) => ethers.getContractAt("IERC20Metadata", addr)));
    const symbols = (await Promise.all(contracts.map((c) => c.symbol()))).map((s) => s.toUpperCase());
    const decimals = await Promise.all(contracts.map((c) => c.decimals()));
    let amount = Math.round(Math.random() * 20_000_000) / 1_000 + 10;
    // reduce high value token amounts (BTC, eth..) or swaps will fail
    if (["BTC", "ETH"].some((s) => symbols.includes(s)))
      amount /= 4e4;
    const roundExp = Math.max(decimals[0] - 8, 3);
    c.amountWei = weiToString(
      BigInt(Math.round(amount * 10 ** roundExp)) * BigInt(10 ** (decimals[0] - roundExp)));
    cases.push(c);
    console.log(`Fuzz #${i}: ${swapperParamsToString(c)}`);
    // throttle .25sec to avoid rpc rate limit
    if (i != count - 1)
      await setTimeout(() => {}, 250);
  }
  return cases;
};

export const cases = (): ISwapperParams[] => {
  const cases: ISwapperParams[] = [];
  for (const aggregatorId of [...Object.values(AggregatorId), undefined]) {
    cases.push(
      ...[
        {
          aggregatorId, // if undefined, it will use [socket, squid, lifi]
          inputChainId: 250,
          input: addresses[250].tokens.LZUSDC,
          output: addresses[250].tokens.AXLUSDC,
          amountWei: 100 * 1e6,
          testPayer: addresses[250].accounts!.impersonate,
          payer: "",
        },
        {
          aggregatorId,
          inputChainId: 250,
          input: addresses[250].tokens.AXLUSDC,
          output: addresses[250].tokens.MIM,
          amountWei: 100 * 1e6,
          testPayer: addresses[250].accounts!.impersonate,
          payer: "",
        },
        {
          aggregatorId,
          inputChainId: 250,
          input: addresses[250].tokens.FRAX,
          output: addresses[250].tokens.MIM,
          amountWei: 100 * 1e18, // string to prevent overflow
          testPayer: addresses[250].accounts!.impersonate,
          payer: "",
        },
        {
          aggregatorId,
          inputChainId: 42161, // Arbitrum One
          input: addresses[42161].tokens.DAI,
          output: addresses[42161].tokens.USDCE,
          amountWei: 100 * 1e18, // string to prevent overflow
          testPayer: addresses[42161].accounts!.impersonate,
          payer: "",
        },
      ],
    );
  }
  return cases;
};

// if id == undefined, we aggregate [socket, squid, lifi]
export const filterCases = (id?: AggregatorId) =>
  cases().filter((p) => p.aggregatorId === id);

export const getCallDataForCases = async (
  cases: ISwapperParams[],
): Promise<(string|undefined)[]> => {
  return (await getTransactionRequestForCases(cases)).map(
    (tr) => tr?.data?.toString() ?? undefined,
  );
};

export const getTransactionRequestForCases = async (
  cases: ISwapperParams[],
): Promise<(ITransactionRequestWithEstimate|undefined)[]> => {
  const results: (ITransactionRequestWithEstimate|undefined)[] = [];
  for (const params of cases) {
    // throttle 3sec
    await new Promise((resolve) => setTimeout(resolve, 3000)).then(async () => {
      const tr = await getTransactionRequest(params);
      console.log(swapperParamsToString(params, tr?.data?.toString() ?? undefined));
      results.push(tr);
    });
  }
  return results;
};

export const getCallDataByAggregatorCases = async (
  id: AggregatorId,
): Promise<(string|undefined)[]> =>
  await getCallDataForCases(filterCases(id));

export const getTransactionRequestByAggregatorCases = async (
  id: AggregatorId,
): Promise<(TransactionRequest|undefined)[]> =>
  await getTransactionRequestForCases(filterCases(id));
