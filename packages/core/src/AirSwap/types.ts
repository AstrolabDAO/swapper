/** Parameters for the AirSwap `getSignerSideOrder` RPC method. */
export interface IAirSwapOrderParams {
  signerToken: string;
  senderWallet: string;
  senderToken: string;
  senderAmount: string;
  swapContract: string;
}

/** Structure of the order object received from the AirSwap server. */
export interface IAirSwapServerOrder {
  nonce: string;
  expiry: string;
  signerWallet: string;
  signerToken: string;
  signerAmount: string;
  senderWallet: string;
  senderToken: string;
  senderAmount: string;
  v: string;
  r: string;
  s: string;
  chainId: string;
  swapContract: string;
}

/** Standard JSON-RPC Error object structure. */
interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown; // Use unknown for better type safety than any
}

/** Result structure from an AirSwap JSON-RPC call (e.g., `getSignerSideOrder`). */
export interface IAirSwapRpcResult {
  jsonrpc: string;
  id: string;
  result?: IAirSwapServerOrder;
  error?: JsonRpcError; // Use the defined interface instead of any
}

export {};
