export type ServerConfig = {
  host: string;
  port: number;
  draftSelectionTimeoutMs: number;
  roundSelectionTimeoutMs: number;
  reconnectTimeoutMs: number;
};

type Environment = Record<string, string | undefined>;

function integerInRange(
  environment: Environment,
  name: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = environment[name];
  if (raw === undefined || raw === '') return fallback;

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer`);
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }

  return value;
}

export function loadServerConfig(environment: Environment = process.env): ServerConfig {
  return {
    host: environment.SERVER_HOST || '127.0.0.1',
    port: integerInRange(environment, 'SERVER_PORT', 2567, 1, 65_535),
    draftSelectionTimeoutMs: integerInRange(
      environment,
      'DRAFT_SELECTION_TIMEOUT_MS',
      5_000,
      1_000,
      30_000,
    ),
    roundSelectionTimeoutMs: integerInRange(
      environment,
      'ROUND_SELECTION_TIMEOUT_MS',
      15_000,
      5_000,
      120_000,
    ),
    reconnectTimeoutMs: integerInRange(
      environment,
      'RECONNECT_TIMEOUT_MS',
      25_000,
      20_000,
      30_000,
    ),
  };
}
