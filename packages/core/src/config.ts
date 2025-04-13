// src/config.ts
// Centralized configuration values using interfaces

import { AggId as Id } from "@/types";
import { envOrNull, envInt, envApiRoot } from "@/utils";

/**
 * Interface for an aggregator's configuration.
 */
export interface AggregatorConfig {
  apiRoot: string;
  apiKey: string | null;
  integrator: string;
  referrer: string | number | null;
  feeBps: number;
}

/**
 * Creates a configuration object for a specific aggregator based on environment variables.
 */
const createConfig = (
  aggId: Id,
  fallbackApiRoot: string,
  apiKeyDefault: string | null = null,
  integratorDefault: string | null = null,
  referrerDefault: string | number | null = null,
  feeBpsDefault: number = 0,
): AggregatorConfig => {
  const apiRoot = envApiRoot(`${aggId}_API_BASE_URL`, fallbackApiRoot);
  const apiKey = envOrNull(`${aggId}_API_KEY`) || apiKeyDefault;
  const integrator = envOrNull(`${aggId}_INTEGRATOR`) || integratorDefault || "astrolab";
  const referrer = envOrNull(`${aggId}_REFERRER`) || referrerDefault;
  const feeBps = envInt(`${aggId}_FEE_BPS`, feeBpsDefault);
  return { apiRoot, apiKey, integrator, referrer, feeBps };
};

/**
 * Main configuration object holding config objects for each supported aggregator.
 */
const c: Record<Id, AggregatorConfig> = {} as Record<Id, AggregatorConfig>;

// Configuration for each aggregator - [id, apiRoot]
type ConfigTuple = readonly [id: Id, apiRoot: string, feeBps?: number];

const configs: ConfigTuple[] = [
  // Meta-Aggregators
  [Id.LIFI, "li.quest/v1"],
  [Id.SOCKET, "api.socket.tech/v2"],
  [Id.SQUID, "v2.api.squidrouter.com/v2"],
  [Id.RANGO, "api.rango.exchange/basic"],
  [Id.UNIZEN, "api.unizen.io"],
  [Id.ROCKETX, "api.rocketx.exchange/v1"],

  // Passive Liquidity Aggregators
  [Id.ONE_INCH, "api.1inch.dev/swap/v6.0"],
  [Id.ZERO_X, "api.0x.org"],
  [Id.PARASWAP, "api.paraswap.io"],
  [Id.ODOS, "api.odos.xyz"],
  [Id.KYBERSWAP, "aggregator-api.kyberswap.com"],
  [Id.OPENOCEAN, "ethapi.openocean.finance/v2"],
  [Id.FIREBIRD, "router.firebird.finance/aggregator/v2"],
  [Id.BEBOP, "api.bebop.xyz"],

  // JIT / Intent-Based / RFQ
  [Id.DEBRIDGE, "api.debridge.io"],
  [Id.COWSWAP, "api.cow.fi"],
  [Id.HASHFLOW, "api.hashflow.com"],
  [Id.AIRSWAP, "api.airswap.io"],
  [Id.ONE_INCH_FUSION, "api.1inch.dev/swap/v6.0"],
  [Id.PARASWAP_DELTA, "api.paraswap.io"],
  [Id.UNIZEN_GASLESS, "api.zcx.com/trade/v1"],
];

// Initialize all configurations
configs.forEach(([id, apiRoot, feeBps]) => {
  c[id] = createConfig(id, apiRoot, null, null, null, feeBps);
});

export default c;
