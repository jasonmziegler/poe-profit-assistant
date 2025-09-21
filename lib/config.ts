// Environment variable validation and configuration
export interface AppConfig {
  appName: string;
  apiUrl: string;
  encryptionKey: string;
  logLevel: string;
  databasePath: string;
  poeSessionId?: string;
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

function getConfig(): AppConfig {
  const config: AppConfig = {
    appName: validateEnvVar('NEXT_PUBLIC_APP_NAME', process.env.NEXT_PUBLIC_APP_NAME),
    apiUrl: validateEnvVar('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
    encryptionKey: validateEnvVar('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY),
    logLevel: process.env.LOG_LEVEL || 'info',
    databasePath: process.env.DATABASE_PATH || './data/database.sqlite',
    poeSessionId: process.env.POE_SESSION_ID,
  };

  // Validate encryption key length
  if (config.encryptionKey.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  return config;
}

export const config = getConfig();