/**
 * Error handler for the BrainForge transpiler
 */
import type { Logger } from "./Logger"
import type { TranspilationResult } from "../types/results"

/**
 * Error categories
 */
export enum ErrorCategory {
  PARSE_ERROR = "ParseError",
  TYPE_ERROR = "TypeError",
  MEMORY_ERROR = "MemoryError",
  RUNTIME_ERROR = "RuntimeError",
  SYNTAX_ERROR = "SyntaxError",
  REFERENCE_ERROR = "ReferenceError",
  INTERNAL_ERROR = "InternalError",
}

/**
 * Error handler for BrainForge transpiler
 */
export class ErrorHandler {
  /** Logger instance */
  private logger: Logger

  /**
   * Creates a new error handler
   *
   * @param logger - Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Creates an error result
   *
   * @param message - Error message
   * @param category - Error category
   * @returns Transpilation result with error
   */
  createError(message: string, category: ErrorCategory = ErrorCategory.INTERNAL_ERROR): TranspilationResult {
    const fullMessage = `${category}: ${message}`
    this.logger.error(fullMessage)

    return {
      success: false,
      error: fullMessage,
      warnings: [],
    }
  }

  /**
   * Handles transpilation errors
   *
   * @param error - Error object or message
   * @returns Transpilation result with error
   */
  handleTranspilationError(error: unknown): TranspilationResult {
    let errorMessage: string
    let category: ErrorCategory = ErrorCategory.INTERNAL_ERROR

    if (error instanceof Error) {
      errorMessage = error.message

      // Determine error category based on error type
      if (error instanceof SyntaxError) {
        category = ErrorCategory.SYNTAX_ERROR
      } else if (error instanceof TypeError) {
        category = ErrorCategory.TYPE_ERROR
      } else if (error instanceof ReferenceError) {
        category = ErrorCategory.REFERENCE_ERROR
      }

      // Check for custom error types
      if (error.name === "ParseError") {
        category = ErrorCategory.PARSE_ERROR
      } else if (error.name === "MemoryError") {
        category = ErrorCategory.MEMORY_ERROR
      } else if (error.name === "RuntimeError") {
        category = ErrorCategory.RUNTIME_ERROR
      }
    } else {
      errorMessage = String(error)
    }

    return this.createError(errorMessage, category)
  }

  /**
   * Creates a memory error
   *
   * @param message - Error message
   * @returns Transpilation result with memory error
   */
  createMemoryError(message: string): TranspilationResult {
    return this.createError(message, ErrorCategory.MEMORY_ERROR)
  }

  /**
   * Creates a parse error
   *
   * @param message - Error message
   * @returns Transpilation result with parse error
   */
  createParseError(message: string): TranspilationResult {
    return this.createError(message, ErrorCategory.PARSE_ERROR)
  }

  /**
   * Creates a runtime error
   *
   * @param message - Error message
   * @returns Transpilation result with runtime error
   */
  createRuntimeError(message: string): TranspilationResult {
    return this.createError(message, ErrorCategory.RUNTIME_ERROR)
  }
}

