import {
  ISocketQuote,
  ISocketRoute,
  ISocketStatusData,
  ISocketSwapData,
  ISocketToken,
} from "./types";

import { BaseAggregator } from "@/abstract";
import {
  AggId,
  IBtrSwapParams,
  ICostEstimate,
  IProtocol,
  IStatusParams,
  IStatusResponse,
  ISwapStep,
  IToken,
  ITransactionRequestWithEstimate,
  OpStatus,
  ProtocolType,
  StepType,
} from "@/types";
import {
  addEstimatesToTr,
  buildQueryParams,
  emptyCostEstimate,
  emptyEstimate,
  fetchJson,
  formatError,
  mapKToKV,
} from "@/utils";

/**
 * Socket Aggregator Implementation.
 * @see https://docs.socket.tech/eip7683#architecture
 */
export class Socket extends BaseAggregator {
  constructor() {
    super(AggId.SOCKET);
    this.routerByChainId = {
      1: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Ethereum
      10: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Optimism
      56: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // BNB Chain
      100: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Gnosis Chain
      137: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Polygon
      324: "0xaDdE7028e7ec226777e5dea5D53F6457C21ec7D6", // zkSync Era
      1101: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Polygon zkEVM
      8453: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Base
      59144: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Linea
      42161: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Arbitrum
      43114: "0x3a23F943181408EAC424116Af7b7790c94Cb97a5", // Avalanche
    };
    this.aliasByChainId = mapKToKV(this.routerByChainId);
    this.approvalAddressByChainId = this.routerByChainId;
  }

  private getHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(this.apiKey && { "API-KEY": this.apiKey }),
  });

  private apiRequest = async <T = any>(
    endpoint: string,
    params?: Record<string, any>,
    method: "GET" | "POST" = "GET",
    body?: any,
  ): Promise<T> => {
    const url = new URL(`${this.baseApiUrl}/${endpoint}`);
    if (method === "GET" && params) {
      url.search = buildQueryParams(
        Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined)),
      );
    }
    return fetchJson<T>(url, {
      method,
      headers: this.getHeaders(),
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
    });
  };

  private processCostEstimate = (route: ISocketRoute): ICostEstimate => {
    const costs = emptyCostEstimate();
    costs.feeCostWei = BigInt(route.integratorFee.amount);

    route.userTxs?.forEach((tx) => {
      if (tx.gasFees?.feesInUsd) {
        costs.gasCostUsd += tx.gasFees.feesInUsd;
      }
      if (tx.gasFees?.gasAmount) {
        try {
          costs.gasCostWei += BigInt(tx.gasFees.gasAmount);
        } catch {}
      }
    });

    return costs;
  };

  protected convertParams = (
    p: IBtrSwapParams,
  ): Record<string, string | number | boolean | undefined> => {
    const result: Record<string, string | number | boolean | undefined> = {
      fromChainId: p.input.chainId.toString(),
      toChainId: (p.output.chainId ?? p.input.chainId).toString(),
      fromTokenAddress: p.input.address,
      toTokenAddress: p.output.address,
      fromAmount: p.inputAmountWei.toString(),
      userAddress: p.payer,
      recipient: p.receiver ?? p.payer,
      uniqueRoutesPerBridge: true,
      sort: "output",
      integrator: p.integrator || this.integrator,
    };

    if (p.maxSlippage) {
      const slippagePercent = Math.min(p.maxSlippage / 100, 50);
      result.defaultSwapSlippage = slippagePercent;
    }

    return result;
  };

  private parseSocketToken = (token: ISocketToken): IToken => ({
    chainId: Number(token.chainId),
    address: token.address,
    name: token.name,
    decimals: typeof token.decimals === "string" ? parseInt(token.decimals) : token.decimals,
    symbol: token.symbol,
    logo: token.logoURI,
    priceUsd: token.chainAgnosticId?.toString(),
  });

  private parseSteps = (route: ISocketRoute): ISwapStep[] => {
    if (!route.userTxs?.length) return [];

    return route.userTxs.map((tx) => {
      const protocol = tx.protocol || {};
      let stepType: StepType;
      switch (tx.userTxType?.toUpperCase()) {
        case "FUND-SWAP-XCALL":
        case "SWAP-XCALL":
          stepType = StepType.CROSS_CHAIN_SWAP;
          break;
        case "SWAP":
        case "DEX-SWAP":
          stepType = StepType.SWAP;
          break;
        case "BRIDGE":
        case "XCALL":
          stepType = StepType.BRIDGE;
          break;
        default:
          stepType = StepType.TRANSFER;
      }
      const inputAmount = Number(tx.fromAmount) / 10 ** Number(tx.fromAsset.decimals);
      const outputAmount = Number(tx.toAmount) / 10 ** Number(tx.toAsset.decimals);
      return {
        id: route.routeId,
        type: stepType,
        description: protocol.displayName || tx.userTxType || "",
        input: this.parseSocketToken(tx.fromAsset),
        output: this.parseSocketToken(tx.toAsset),
        inputChainId: tx.chainId,
        outputChainId: tx.chainId,
        payer: "",
        receiver: "",
        protocol: {
          name: protocol.displayName || "",
          id: protocol.name || "",
          logo: protocol.icon || "",
          type: stepType === StepType.SWAP ? ProtocolType.DEX : ProtocolType.BRIDGE,
        } as IProtocol,
        estimates: {
          ...emptyEstimate(),
          input: inputAmount,
          inputWei: tx.fromAmount,
          output: outputAmount,
          outputWei: tx.toAmount,
          exchangeRate: outputAmount / inputAmount,
          gasCostUsd: tx.gasFees?.feesInUsd || 0,
          gasCostWei: tx.gasFees?.gasAmount ? BigInt(tx.gasFees.gasAmount) : BigInt(0),
        },
      };
    });
  };

  public async getQuote(p: IBtrSwapParams): Promise<ISocketQuote | undefined> {
    p = this.overloadParams(p);
    try {
      const response = await this.apiRequest<{ result: ISocketQuote }>(
        "quote",
        this.convertParams(p),
      );
      if (!response.result?.routes?.[0]) {
        throw formatError("Failed to fetch a valid quote from Socket", 400, response);
      }
      return response.result;
    } catch (error) {
      this.handleError(error, "[Socket] getQuote");
      return undefined;
    }
  }

  public async getTransactionRequest(
    p: IBtrSwapParams,
  ): Promise<ITransactionRequestWithEstimate | undefined> {
    p = this.overloadParams(p);
    try {
      const quote = await this.getQuote(p);
      if (!quote?.routes?.[0]) {
        throw formatError("Failed to get a valid quote", 400, { quote });
      }

      const { result: swapData } = await this.apiRequest<{ result: ISocketSwapData }>(
        "build-tx",
        undefined,
        "POST",
        { route: quote.routes[0] },
      );

      if (swapData.txType !== "eth_sendTransaction") {
        throw formatError("Socket build-tx unsupported txType", 400, { swapData });
      }
      if (!swapData?.txTarget || !swapData?.txData) {
        throw formatError("Socket build-tx response missing target or data", 400, { swapData });
      }

      const steps = this.parseSteps(quote.routes[0]);
      const costEstimate = this.processCostEstimate(quote.routes[0]);
      // TODO: breakdown the cost estimate into steps if possible
      steps[0].estimates = {
        ...steps[0].estimates,
        ...costEstimate,
      };
      return addEstimatesToTr({
        to: swapData.txTarget,
        data: swapData.txData,
        value: swapData.value ? BigInt(swapData.value) : 0n,
        from: p.payer,
        chainId: Number(p.input.chainId),
        params: p,
        steps,
      });
    } catch (error) {
      this.handleError(error, "[Socket] getTransactionRequest");
      return undefined;
    }
  }

  private parseTransactionStatus = (status: ISocketStatusData): IStatusResponse => ({
    id: status.sourceTx || status.destinationTransactionHash || "",
    status:
      {
        PENDING: OpStatus.PENDING,
        CONFIRMED: OpStatus.DONE,
        FAILED: OpStatus.FAILED,
        NOT_FOUND: OpStatus.NOT_FOUND,
      }[status?.sourceTxStatus?.toUpperCase()] || OpStatus.PENDING,
    txHash: status.sourceTx,
    receivingTx: status.destinationTransactionHash,
    sendingTx: status.sourceTx,
    substatus: status.sourceTxStatus,
    substatusMessage: "",
  });

  public async getStatus(p: IStatusParams): Promise<IStatusResponse | undefined> {
    try {
      if (!p.txHash || p.inputChainId === undefined || p.outputChainId === undefined) {
        throw new Error(
          "Missing required params for Socket getStatus (txHash, fromChainId, toChainId)",
        );
      }

      const fromChainNum = parseInt(p.inputChainId.toString(), 10);
      const toChainNum = parseInt(p.outputChainId.toString(), 10);

      if (!this.isChainSupported(fromChainNum)) {
        throw new Error(`fromChainId ${p.inputChainId} is invalid or not supported by Socket`);
      }
      if (!this.isChainSupported(toChainNum)) {
        throw new Error(`toChainId ${p.outputChainId} is invalid or not supported by Socket`);
      }

      const statusRes = await this.apiRequest<{
        result?: ISocketStatusData;
        error?: { message: string };
      }>("status", {
        transactionHash: p.txHash,
        fromChainId: p.inputChainId.toString(),
        toChainId: p.outputChainId.toString(),
      });

      if (!statusRes.result) {
        if (statusRes.error?.message?.toLowerCase().includes("not found")) {
          return { id: p.txHash || "", status: OpStatus.NOT_FOUND };
        }
        throw formatError("Failed to fetch status from Socket or invalid data", 500, statusRes);
      }

      return this.parseTransactionStatus(statusRes.result);
    } catch (error) {
      this.handleError(error, "[Socket] getStatus");
      return undefined;
    }
  }
}

export const socketAggregator = new Socket();
