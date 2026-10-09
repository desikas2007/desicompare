export interface AppConfig {
  nodeEnv: string;
  port: number;
  frontendUrl: string;
  globalPrefix: string;
  mongodbUri: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  cookie: {
    name: string;
    secret: string;
  };
  auth: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    enabled: boolean;
  };
  providerIntegrationMode: 'demo' | 'live';
  rateLimit: {
    ttl: number;
    limit: number;
  };
  logLevel: string;
}

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export default (): AppConfig => {
  const emailHost = process.env.EMAIL_HOST ?? '';
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: toInt(process.env.PORT, 4000),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api/v1',
    mongodbUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/foodcompare',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      accessTtl: process.env.ACCESS_TOKEN_TTL ?? '15m',
      refreshTtl: process.env.REFRESH_TOKEN_TTL ?? '30d',
    },
    cookie: {
      name: process.env.AUTH_COOKIE_NAME ?? 'fc_refresh',
      secret: process.env.COOKIE_SECRET ?? '',
    },
    auth: {
      allowRegistration: toBool(process.env.ALLOW_REGISTRATION, true),
      requireEmailVerification: toBool(process.env.REQUIRE_EMAIL_VERIFICATION, false),
    },
    email: {
      host: emailHost,
      port: toInt(process.env.EMAIL_PORT, 587),
      user: process.env.EMAIL_USER ?? '',
      password: process.env.EMAIL_PASSWORD ?? '',
      from: process.env.EMAIL_FROM ?? 'FoodCompare <no-reply@foodcompare.local>',
      enabled: emailHost.trim().length > 0,
    },
    providerIntegrationMode:
      (process.env.PROVIDER_INTEGRATION_MODE as 'demo' | 'live') === 'live' ? 'live' : 'demo',
    rateLimit: {
      ttl: toInt(process.env.RATE_LIMIT_TTL, 60) * 1000,
      limit: toInt(process.env.RATE_LIMIT_LIMIT, 120),
    },
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
};
