/** Represents a token within the Socket API context. */
export interface ISocketToken {
  name: string;
  address: string;
  icon: string;
  decimals: number | string;
  symbol: string;
  chainId: string;
  logoURI: string;
  chainAgnosticId: string;
}

/** Details about the refuel option (receiving gas on destination). */
export interface ISocketRefuel {
  fromAmount: string;
  toAmount: string | number;
  gasFees: {
    gasLimit: number;
    feesInUsd: number;
    asset: ISocketToken;
    gasAmount: string;
  };
  recipient: string;
  serviceTime: number;
  fromAsset: ISocketToken;
  toAsset: ISocketToken;
  fromChainId: number;
  toChainId: number;
}

export interface ISocketIntegratorFee {
  amount: string;
  asset: ISocketToken;
}

/** Represents a route from the Socket API. */
export interface ISocketRoute {
  routeId: string;
  isOnlySwapRoute: boolean;
  fromAmount: string | number;
  toAmount: string | number;
  usedBridgeNames: string[];
  minimumGasBalances: string;
  chainGasBalances: any;
  totalUserTx: number;
  sender: string;
  recipient: string;
  totalGasFeesInUsd: string;
  userTxs: ISocketUserTx[];
  integratorFee: ISocketIntegratorFee;
  fromAsset: ISocketToken;
  fromChainId: number;
  toAsset: ISocketToken;
  toChainId: number;
  routePath: string;
  refuel: ISocketRefuel;
  bridgeRouteErrors: Record<string, any>;
}

/** Protocol information for a user transaction. */
export interface ISocketProtocol {
  name: string;
  displayName: string;
  icon: string;
}

/** Gas fee information for a user transaction. */
export interface ISocketGasFees {
  gasAmount: string;
  gasLimit: number;
  feesInUsd: number;
  asset: ISocketToken;
}

/** Represents a user transaction from the Socket API. */
export interface ISocketUserTx {
  userTxType: string;
  txType: string;
  chainId: number;
  fromAsset: ISocketToken;
  fromAmount: string;
  toAsset: ISocketToken;
  toAmount: string;
  minAmountOut: string;
  stepCount: number;
  routePath: string;
  sender: string;
  recipient: string;
  protocol: ISocketProtocol;
  approvalData: {
    minimumApprovalAmount: string;
    approvalTokenAddress: string;
    allowanceTarget: string;
    owner: string;
  } | null;
  steps: ISocketSwapStep[] | null;
  serviceTime: number;
  maxServiceTime: number;
  gasFees: ISocketGasFees;
  swapSlippage: number;
}

export interface ISocketSwapStep {
  type: string;
  bridgeSlippage: number;
  swapSlippage: number;
  minAmountOut: string;
  protocol: any;
  protocolFees: any;
  gasFees: any;
  recipient: string;
}

/** Parameters for requesting a quote from the Socket API. */
export interface ISocketQuoteParams {
  fromChainId: string;
  toChainId: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  recipient?: string;
  includeDexes?: string[];
  excludeDexes?: string[];
  includeBridges?: string[];
  excludeBridges?: string[];
  singleTxOnly?: boolean;
  uniqueRoutesPerBridge?: boolean;
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
  integrator?: string;
}

/** Response structure for the Socket quote endpoint. */
export interface ISocketQuote {
  routes: ISocketRoute[];
  fromChainId: number;
  toChainId: number;
  fromAsset: ISocketToken;
  toAsset: ISocketToken;
  refuel: ISocketRefuel;
}

/** Data structure required for executing a Socket swap transaction. */
export interface ISocketSwapData {
  userTxType: string;
  txTarget: string;
  chainId: string;
  txData: string;
  txType: string;
  value: string;
  totalUserTx: number;
  approvalData?: {
    minimumApprovalAmount: string;
    approvalTokenAddress: string;
    allowanceTarget: string;
    owner: string;
  };
}

/** Data structure for the Socket transaction status endpoint. */
export interface ISocketStatusData {
  sourceTx: string;
  sourceTxStatus: string;
  destinationTransactionHash?: string;
}
