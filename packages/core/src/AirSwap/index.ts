import { JITAggregator } from "@/abstract";
import { AggId } from "@/types";

/**
 * AirSwap Aggregator Implementation.
 * @see https://github.com/airswap/airswap-about
 * @see https://about.airswap.io/technology/protocols
 * @see https://github.com/LlamaSwap/interface/blob/master/src/components/Aggregator/adapters/airswap.ts
 */
export class AirSwap extends JITAggregator {
  constructor() {
    super(AggId.AIRSWAP);
    // No central baseApiUrl for AirSwap
    this.routerByChainId = {
      1: "0x522D6F36c95A1b6509A14272C17747BbB582F2A6",
      56: "0x132F13C3896eAB218762B9e46F55C9c478905849",
      137: "0x6713C23261c8A9B7D84Dd6114E78d9a7B9863C1a",
      43114: "0xEc08261ac8b3D2164d236bD499def9f82ba9d13F",
    };
    this.aliasByChainId = {
      1: "0x8F9DA6d38939411340b19401E8c54Ea1f51B8f95",
      56: "0x9F11691FA842856E44586380b27Ac331ab7De93d",
      137: "0x9F11691FA842856E44586380b27Ac331ab7De93d",
      43114: "0xE40feb39fcb941A633deC965Abc9921b3FE962b2",
    };
    this.approvalAddressByChainId = this.routerByChainId;
  }
}

export const airswapAggregator = new AirSwap();
