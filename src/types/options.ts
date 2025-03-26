/**
 * Configuration options for the BrainForge transpiler
 */
import type { MemoryModel, OptimizationLevel } from "./enums"
import type { LogLevel } from "../utils/Logger"

/**
 * Configuration options for the BrainForge transpiler
 */
export interface TranspilerOptions {
  /**
   * Source language to transpile from
   * @default 'javascript'
   */
  sourceLanguage: string

  /**
   * Optimization level for the generated code
   * @default OptimizationLevel.BALANCED
   */
  optimizationLevel: OptimizationLevel

  /**
   * Memory model to use for allocation
   * @default MemoryModel.DYNAMIC
   */
  memoryModel: MemoryModel

  /**
   * Whether to include the standard library
   * @default true
   */
  includeStdlib: boolean

  /**
   * Target cell size in bits (8, 16, or 32)
   * @default 32
   */
  targetCellSize: number

  /**
   * Enable debug mode for verbose logging
   * @default false
   */
  debug: boolean

  /**
   * Preserve comments in the generated code
   * @default false
   */
  preserveComments: boolean

  /**
   * Allow BrainForge extensions beyond standard Brainfuck
   * @default true
   */
  allowExtensions: boolean

  /**
   * Maximum recursion depth for function calls
   * @default 100
   */
  maxRecursionDepth: number

  /**
   * Memory size in cells
   * @default 65536
   */
  memorySize: number

  /**
   * Minimum log level to display
   * @default LogLevel.INFO
   */
  logLevel: LogLevel

  /**
   * Custom logger implementation
   * @default undefined
   */
  logger?: any

  /**
   * Enable safe mode with additional runtime checks
   * @default true
   */
  safeMode?: boolean

  /**
   * Enable null safety checks
   * @default true
   */
  nullSafeChecks?: boolean

  /**
   * Enable automatic garbage collection
   * @default true
   */
  garbageCollection?: boolean

  /**
   * Garbage collection threshold (percentage of memory)
   * @default 0.75
   */
  gcThreshold?: number
}

