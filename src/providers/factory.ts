/**
 * Provider Factory
 * Creates and manages provider instances based on configuration
 */

import { IProvider, IProviderConfig, ProviderType } from './interfaces';
import { FirebaseProvider } from './firebase';
import { CloudflareProvider } from './cloudflare';
// import { AWSProvider } from './aws';
// import { AzureProvider } from './azure';

export class ProviderFactory {
  private static instances: Map<string, IProvider> = new Map();
  private static defaultProvider: ProviderType = 'firebase';

  /**
   * Create or retrieve a provider instance
   */
  static create(type?: ProviderType, config?: IProviderConfig): IProvider {
    const providerType = type || this.getDefaultProvider();
    const key = `${providerType}-${JSON.stringify(config || {})}`;

    // Return cached instance if exists
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    // Create new instance based on type
    let provider: IProvider;

    switch (providerType) {
      case 'firebase':
        provider = new FirebaseProvider(config);
        break;

      case 'cloudflare':
        provider = new CloudflareProvider(config);
        break;

      // case 'aws':
      //   provider = new AWSProvider(config);
      //   break;

      // case 'azure':
      //   provider = new AzureProvider(config);
      //   break;

      default:
        throw new Error(`Unsupported provider type: ${providerType}`);
    }

    // Cache the instance
    this.instances.set(key, provider);
    return provider;
  }

  /**
   * Get the default provider type from environment
   */
  static getDefaultProvider(): ProviderType {
    const envProvider = process.env.CLOUD_PROVIDER || process.env.PROVIDER_TYPE;

    if (envProvider && this.isValidProvider(envProvider)) {
      return envProvider as ProviderType;
    }

    return this.defaultProvider;
  }

  /**
   * Set the default provider type
   */
  static setDefaultProvider(type: ProviderType): void {
    if (!this.isValidProvider(type)) {
      throw new Error(`Invalid provider type: ${type}`);
    }
    this.defaultProvider = type;
  }

  /**
   * Check if a provider type is valid
   */
  static isValidProvider(type: string): boolean {
    const validTypes: ProviderType[] = ['firebase', 'cloudflare', 'aws', 'azure', 'supabase', 'custom'];
    return validTypes.includes(type as ProviderType);
  }

  /**
   * Clear cached instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get all cached instances
   */
  static getCachedInstances(): Map<string, IProvider> {
    return new Map(this.instances);
  }

  /**
   * Create a multi-provider instance that can switch between providers
   */
  static createMultiProvider(providers: Record<string, ProviderType>): IMultiProvider {
    return new MultiProvider(providers);
  }
}

/**
 * Multi-Provider allows using different providers for different services
 */
export class MultiProvider implements IProvider {
  name = 'multi';
  private providers: Record<string, IProvider> = {};

  constructor(config: Record<string, ProviderType>) {
    // Initialize providers for each service
    for (const [service, type] of Object.entries(config)) {
      this.providers[service] = ProviderFactory.create(type);
    }
  }

  get auth() {
    return this.providers.auth?.auth || this.providers.default?.auth;
  }

  get database() {
    return this.providers.database?.database || this.providers.default?.database;
  }

  get storage() {
    return this.providers.storage?.storage || this.providers.default?.storage;
  }

  get realtime() {
    return this.providers.realtime?.realtime || this.providers.default?.realtime;
  }

  get functions() {
    return this.providers.functions?.functions || this.providers.default?.functions;
  }

  get analytics() {
    return this.providers.analytics?.analytics || this.providers.default?.analytics;
  }

  get messaging() {
    return this.providers.messaging?.messaging || this.providers.default?.messaging;
  }

  get config() {
    return this.providers.config?.config || this.providers.default?.config;
  }
}

/**
 * Provider Registry for custom providers
 */
export class ProviderRegistry {
  private static customProviders: Map<string, new (config?: IProviderConfig) => IProvider> = new Map();

  /**
   * Register a custom provider
   */
  static register(name: string, providerClass: new (config?: IProviderConfig) => IProvider): void {
    this.customProviders.set(name, providerClass);
  }

  /**
   * Get a custom provider class
   */
  static get(name: string): (new (config?: IProviderConfig) => IProvider) | undefined {
    return this.customProviders.get(name);
  }

  /**
   * Check if a custom provider is registered
   */
  static has(name: string): boolean {
    return this.customProviders.has(name);
  }

  /**
   * Remove a custom provider
   */
  static unregister(name: string): void {
    this.customProviders.delete(name);
  }

  /**
   * Get all registered custom providers
   */
  static getAllProviders(): string[] {
    return Array.from(this.customProviders.keys());
  }
}

/**
 * Provider Configuration Helper
 */
export class ProviderConfig {
  /**
   * Load provider configuration from environment
   */
  static fromEnv(): IProviderConfig {
    return {
      type: (process.env.CLOUD_PROVIDER || 'firebase') as ProviderType,
      credentials: this.loadCredentials(),
      region: process.env.CLOUD_REGION,
      endpoint: process.env.CLOUD_ENDPOINT,
      options: this.loadOptions()
    };
  }

  /**
   * Load credentials from environment
   */
  private static loadCredentials(): any {
    const provider = process.env.CLOUD_PROVIDER || 'firebase';

    switch (provider) {
      case 'firebase':
        return {
          projectId: process.env.FIREBASE_PROJECT_ID,
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
          measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };

      case 'cloudflare':
        return {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
          apiToken: process.env.CLOUDFLARE_API_TOKEN,
          workerId: process.env.CLOUDFLARE_WORKER_ID,
          kvNamespace: process.env.CLOUDFLARE_KV_NAMESPACE,
          r2Bucket: process.env.CLOUDFLARE_R2_BUCKET
        };

      case 'aws':
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
          region: process.env.AWS_REGION || 'us-east-1'
        };

      case 'azure':
        return {
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID
        };

      default:
        return {};
    }
  }

  /**
   * Load additional options from environment
   */
  private static loadOptions(): Record<string, any> {
    const options: Record<string, any> = {};

    // Add any provider-specific options
    if (process.env.ENABLE_OFFLINE_MODE === 'true') {
      options.offline = true;
    }

    if (process.env.USE_EMULATORS === 'true') {
      options.useEmulators = true;
    }

    if (process.env.DEBUG_MODE === 'true') {
      options.debug = true;
    }

    return options;
  }

  /**
   * Validate provider configuration
   */
  static validate(config: IProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Provider type is required');
    }

    if (!ProviderFactory.isValidProvider(config.type)) {
      errors.push(`Invalid provider type: ${config.type}`);
    }

    // Provider-specific validation
    switch (config.type) {
      case 'firebase':
        if (!config.credentials?.projectId) {
          errors.push('Firebase project ID is required');
        }
        break;

      case 'cloudflare':
        if (!config.credentials?.accountId) {
          errors.push('Cloudflare account ID is required');
        }
        break;

      case 'aws':
        if (!config.credentials?.accessKeyId || !config.credentials?.secretAccessKey) {
          errors.push('AWS credentials are required');
        }
        break;

      case 'azure':
        if (!config.credentials?.tenantId || !config.credentials?.clientId) {
          errors.push('Azure credentials are required');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance for convenience
export const provider = ProviderFactory.create();

// Export convenience functions
export function getProvider(type?: ProviderType): IProvider {
  return ProviderFactory.create(type);
}

export function setDefaultProvider(type: ProviderType): void {
  ProviderFactory.setDefaultProvider(type);
}

export function createMultiProvider(config: Record<string, ProviderType>): MultiProvider {
  return ProviderFactory.createMultiProvider(config);
}