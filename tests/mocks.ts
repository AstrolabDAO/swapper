import { AggId, StepType, ITransactionRequestWithEstimate } from "@/types";
import { getToken } from "@/utils";

export const mockLifiTr: ITransactionRequestWithEstimate = {
  params: {
    input: getToken("WETH", 1),
    output: getToken("DAI", 1),
    inputAmountWei: "1000000000000000000",
    aggIds: [AggId.LIFI],
    payer: "0x789",
  },
  steps: [
    {
      type: StepType.SWAP,
      estimates: {
        output: 1000,
        exchangeRate: 1,
        gasCostUsd: 10,
        feeCostUsd: 1,
        gasCostWei: 100000n,
        feeCostWei: 10000n,
        outputWei: 1000000000000000000000n,
      },
      protocol: { id: "uniswap", name: "Uniswap" },
      input: getToken("WETH", 1),
      output: getToken("DAI", 1),
    },
  ],
  globalEstimates: {
    input: 1,
    inputWei: 1000000000000000000n,
    output: 1000,
    outputWei: 1000000000000000000000n,
    slippage: 0.01,
    exchangeRate: 1,
    gasCostUsd: 10,
    gasCostWei: 100000n,
    feeCostUsd: 1,
    feeCostWei: 10000n,
  },
  latencyMs: 100,
  aggId: AggId.LIFI,
  to: "0xrouterLifi",
  from: "0x789",
  data: "0xcalldataLifi",
  value: "0",
  chainId: 1,
};

export const mockRangoTr: ITransactionRequestWithEstimate = {
  ...mockLifiTr,
  aggId: AggId.RANGO,
  params: { ...mockLifiTr.params, aggIds: [AggId.RANGO] },
  globalEstimates: {
    ...mockLifiTr.globalEstimates,
    output: 990,
    outputWei: 990000000000000000000n,
    exchangeRate: 0.99,
    gasCostUsd: 12,
    feeCostUsd: 0.5,
    gasCostWei: 120000n,
    feeCostWei: 5000n,
  },
  latencyMs: 150,
  to: "0xrouterRango",
  data: "0xcalldataRango",
  steps: [
    {
      ...mockLifiTr.steps[0],
      protocol: { id: "1inch", name: "1inch" },
      estimates: {
        ...mockLifiTr.steps[0].estimates!,
        output: 990,
        outputWei: 990000000000000000000n,
        exchangeRate: 0.99,
        gasCostUsd: 12,
        feeCostUsd: 0.5,
        gasCostWei: 120000n,
        feeCostWei: 5000n,
      },
    },
  ],
};

export const mockSquidTr: ITransactionRequestWithEstimate = {
  ...mockLifiTr,
  aggId: AggId.SQUID,
  params: { ...mockLifiTr.params, aggIds: [AggId.SQUID] },
  globalEstimates: {
    ...mockLifiTr.globalEstimates,
    output: 980,
    outputWei: 980000000000000000000n,
    exchangeRate: 0.98,
    gasCostUsd: 8,
    feeCostUsd: 2,
    gasCostWei: 80000n,
    feeCostWei: 20000n,
  },
  latencyMs: 200,
  to: "0xrouterSquid",
  data: "0xcalldataSquid",
  steps: [
    {
      ...mockLifiTr.steps[0],
      protocol: { id: "balancer", name: "Balancer" },
      estimates: {
        ...mockLifiTr.steps[0].estimates!,
        output: 980,
        outputWei: 980000000000000000000n,
        exchangeRate: 0.98,
        gasCostUsd: 8,
        feeCostUsd: 2,
        gasCostWei: 80000n,
        feeCostWei: 20000n,
      },
    },
  ],
};

export const mockUnizenTr: ITransactionRequestWithEstimate = {
  ...mockLifiTr,
  aggId: AggId.UNIZEN,
  params: { ...mockLifiTr.params, aggIds: [AggId.UNIZEN] },
  globalEstimates: {
    ...mockLifiTr.globalEstimates,
    output: 1010,
    outputWei: 1010000000000000000000n,
    exchangeRate: 1.01,
    gasCostUsd: 15,
    feeCostUsd: 0,
    gasCostWei: 150000n,
    feeCostWei: 0n,
  },
  latencyMs: 80,
  to: "0xrouterUnizen",
  data: "0xcalldataUnizen",
  steps: [
    {
      ...mockLifiTr.steps[0],
      protocol: { id: "curve", name: "Curve" },
      estimates: {
        ...mockLifiTr.steps[0].estimates!,
        output: 1010,
        outputWei: 1010000000000000000000n,
        exchangeRate: 1.01,
        gasCostUsd: 15,
        feeCostUsd: 0,
        gasCostWei: 150000n,
        feeCostWei: 0n,
      },
    },
  ],
};

export const mockSocketTr: ITransactionRequestWithEstimate = {
  ...mockLifiTr,
  aggId: AggId.SOCKET,
  params: { ...mockLifiTr.params, aggIds: [AggId.SOCKET] },
  globalEstimates: {
    ...mockLifiTr.globalEstimates,
    output: 995,
    outputWei: 995000000000000000000n,
    exchangeRate: 0.995,
    gasCostUsd: 9,
    feeCostUsd: 1.5,
    gasCostWei: 90000n,
    feeCostWei: 15000n,
  },
  latencyMs: 120,
  to: "0xrouterSocket",
  data: "0xcalldataSocket",
  steps: [
    {
      ...mockLifiTr.steps[0],
      protocol: { id: "sushiswap", name: "Sushiswap" },
      estimates: {
        ...mockLifiTr.steps[0].estimates!,
        output: 995,
        outputWei: 995000000000000000000n,
        exchangeRate: 0.995,
        gasCostUsd: 9,
        feeCostUsd: 1.5,
        gasCostWei: 90000n,
        feeCostWei: 15000n,
      },
    },
  ],
};

export const mockQuotePerformance = {
  aggId: "LIFI",
  exchangeRate: 1,
  output: 1000,
  gasCostUsd: 10,
  feeCostUsd: 1,
  latencyMs: 100,
  steps: 1,
  protocols: ["Uniswap"],
};
