/**
 * Enhanced Logger for RapidTriageME
 * Provides structured logging with different levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export class Logger {
  private logLevel: LogLevel;
  private serviceName: string;
  private environment: string;

  constructor(environment: string, logLevelStr: string = 'info') {
    this.environment = environment;
    this.serviceName = 'RapidTriageME';
    this.logLevel = this.parseLogLevel(logLevelStr);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLog(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const log = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...(data && { data })
    };
    return JSON.stringify(log);
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatLog('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatLog('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog('WARN', message, data));
    }
  }

  error(message: string, error?: Error | any, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = {
        ...data,
        error: {
          message: error?.message || String(error),
          stack: error?.stack,
          name: error?.name
        }
      };
      console.error(this.formatLog('ERROR', message, errorData));
    }
  }

  fatal(message: string, error?: Error | any, data?: any): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const errorData = {
        ...data,
        error: {
          message: error?.message || String(error),
          stack: error?.stack,
          name: error?.name
        }
      };
      console.error(this.formatLog('FATAL', message, errorData));
    }
  }

  // Log API request details
  logRequest(request: Request, response: Response, duration: number): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // Safely extract headers for Cloudflare Workers environment
      const headerObj: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        // Don't log sensitive headers
        if (!key.toLowerCase().includes('authorization') && 
            !key.toLowerCase().includes('cookie')) {
          headerObj[key] = value;
        }
      });
      
      const log = {
        method: request.method,
        url: request.url,
        status: response.status,
        duration: `${duration}ms`,
        headers: headerObj,
        userAgent: request.headers.get('user-agent'),
        contentType: request.headers.get('content-type')
      };
      this.info('API Request', log);
    }
  }
}