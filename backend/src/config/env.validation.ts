/**
 * Validates required environment configuration at startup and returns an
 * actionable list of problems so operators can fix them quickly.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const env = config as NodeJS.ProcessEnv;
  const errors: string[] = [];
  const isProd = env.NODE_ENV === 'production';

  const require = (key: string, { min = 1, inProdOnly = true } = {}): void => {
    const value = env[key];
    const missing = !value || value.trim().length < min;
    if ((inProdOnly && isProd && missing) || (!inProdOnly && missing)) {
      errors.push(`- ${key} must be set${min > 1 ? ` and at least ${min} characters` : ''}`);
    }
  };

  require('MONGODB_URI', { inProdOnly: true });
  require('JWT_ACCESS_SECRET', { min: 32, inProdOnly: true });
  require('JWT_REFRESH_SECRET', { min: 32, inProdOnly: true });
  require('COOKIE_SECRET', { min: 32, inProdOnly: true });

  if (isProd) {
    if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      errors.push('- JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
    }
    if (!env.FRONTEND_URL) {
      errors.push('- FRONTEND_URL must be set in production');
    }
  }

  if (env.PROVIDER_INTEGRATION_MODE && !['demo', 'live'].includes(env.PROVIDER_INTEGRATION_MODE)) {
    errors.push('- PROVIDER_INTEGRATION_MODE must be either "demo" or "live"');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  if (!isProd) {
    const insecureDefaults: string[] = [];
    if (!env.JWT_ACCESS_SECRET) insecureDefaults.push('JWT_ACCESS_SECRET');
    if (!env.JWT_REFRESH_SECRET) insecureDefaults.push('JWT_REFRESH_SECRET');
    if (!env.COOKIE_SECRET) insecureDefaults.push('COOKIE_SECRET');
    if (insecureDefaults.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[FoodCompare] Using development fallback secrets for: ${insecureDefaults.join(
          ', ',
        )}. Set these in your .env for anything beyond local development.`,
      );
    }
  }

  return config;
}
