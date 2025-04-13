import { JITAggregator } from "@/abstract";
import { AggId } from "@/types";
import { mapKToKV } from "@/utils";

/**
 * Hashflow Aggregator Implementation.
 * @see https://github.com/LlamaSwap/interface/blob/master/src/components/Aggregator/adapters/hashflow/index.ts
 * @see https://docs.hashflow.com/hashflow/taker/getting-started-api-v3
 */
export class Hashflow extends JITAggregator {
  constructor() {
    super(AggId.HASHFLOW);
    this.routerByChainId = {
      1: "0xF6a94dfD0E6ea9ddFdFfE4762Ad4236576136613",
      10: "0xb3999F658C0391d94A37f7FF328F3feC942BcADC",
      56: "0x0ACFFB0fb2cddd9BD35d03d359F3D899E32FACc9",
      137: "0x72550597dc0b2e0beC24e116ADd353599Eff2E35",
      42161: "0x1F772fA3Bc263160ea09bB16CE1A6B8Fc0Fab36a",
      43114: "0x64D2f9F44FE26C157d552aE7EAa613Ca6587B59e",
    };
    this.aliasByChainId = mapKToKV(this.routerByChainId);
    this.approvalAddressByChainId = this.routerByChainId;
  }
}

export const hashflowAggregator = new Hashflow();
