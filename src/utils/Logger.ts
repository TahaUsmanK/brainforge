/**
 * Logger utility for the BrainForge transpiler
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string): void
  info(message: string): void
  warn(message: string): void
  error(message: string): void
  log(level: LogLevel | string, message: string): void
}

/**
 * Default logger implementation
 */
export class Logger implements ILogger {
  private level: LogLevel
  private customLogger?: any

  /**
   * Creates a new logger
   *
   * @param level - Minimum log level to display
   * @param customLogger - Custom logger implementation (optional)
   */
  constructor(level: LogLevel = LogLevel.INFO, customLogger?: any) {
    this.level = level
    this.customLogger = customLogger
  }

  /**
   * Logs a debug message
   *
   * @param message - Message to log
   */
  debug(message: string): void {
    this.log(LogLevel.DEBUG, message)
  }

  /**
   * Logs an info message
   *
   * @param message - Message to log
   */
  info(message: string): void {
    this.log(LogLevel.INFO, message)
  }

  /**
   * Logs a warning message
   *
   * @param message - Message to log
   */
  warn(message: string): void {
    this.log(LogLevel.WARN, message)
  }

  /**
   * Logs an error message
   *
   * @param message - Message to log
   */
  error(message: string): void {
    this.log(LogLevel.ERROR, message)
  }

  /**
   * Logs a message with the specified level
   *
   * @param level - Log level or type
   * @param message - Message to log
   */
  log(level: LogLevel | string, message: string): void {
    // Skip logging if level is below threshold
    if (typeof level === "number" && level < this.level) {
      return
    }

    // Use custom logger if provided
    if (this.customLogger) {
      if (typeof this.customLogger.log === "function") {
        this.customLogger.log(level, message)
        return
      }
    }

    // Default logging to console
    const timestamp = new Date().toISOString()
    let logMethod: "log" | "info" | "warn" | "error" = "log"
    let prefix = "[BrainForge]"

    if (typeof level === "number") {
      switch (level) {
        case LogLevel.DEBUG:
          prefix = "[BrainForge:DEBUG]"
          break
        case LogLevel.INFO:
          prefix = "[BrainForge:INFO]"
          logMethod = "info"
          break
        case LogLevel.WARN:
          prefix = "[BrainForge:WARN]"
          logMethod = "warn"
          break
        case LogLevel.ERROR:
          prefix = "[BrainForge:ERROR]"
          logMethod = "error"
          break
      }
    } else {
      prefix = `[BrainForge:${level}]`
      if (level === "error") logMethod = "error"
      else if (level === "warn") logMethod = "warn"
      else if (level === "info") logMethod = "info"
    }

    console[logMethod](`${prefix} ${timestamp} - ${message}`)
  }

  /**
   * Sets the minimum log level
   *
   * @param level - New minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Sets a custom logger implementation
   *
   * @param logger - Custom logger implementation
   */
  setCustomLogger(logger: any): void {
    this.customLogger = logger
  }
}

