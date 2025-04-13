import { getChainTokensAndPayer, runSwapTests } from "../utils";

import { MAX_SLIPPAGE_BPS } from "@/constants";
import { aggregatorById } from "@/index";
import { AggId, IBtrSwapParams, IToken } from "@/types";

// Simplified test function for monochain swaps
export const simpleMonoTests = (
  aggIds: AggId | AggId[],
  chainIds: number[],
  tokens: string[],
  amounts: number[],
  payer?: `0x${string}`,
) => {
  const aggIdArray = Array.isArray(aggIds) ? aggIds : [aggIds];
  const aggregatorIds = aggIdArray.map((id) => aggregatorById[id].id);
  const integratorId = aggregatorById[aggIdArray[0]].integrator;

  return async function () {
    for (const chainId of chainIds) {
      const testCases = amounts.map((amount) => {
        let input: IToken;
        let output: IToken;
        ({ input, output, payer } = getChainTokensAndPayer(chainId, tokens, payer));
        return {
          aggIds: aggregatorIds,
          input,
          output,
          inputAmountWei: amount * 10 ** input.decimals!,
          payer,
          receiver: payer,
          maxSlippage: MAX_SLIPPAGE_BPS,
          integrator: integratorId,
        } as IBtrSwapParams;
      });

      console.log(`Running tests for ${aggIdArray.join(", ")} on chain ${chainId}...`);
      await runSwapTests(testCases, `${aggIdArray.join(", ")} on chain ${chainId}`);
    }
  };
};
