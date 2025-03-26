/**
 * Result types for the transpilation process
 */
import type { Program } from "./ast"

/**
 * Result of the transpilation process
 */
export interface TranspilationResult {
  /** Whether the transpilation was successful */
  success: boolean

  /** Abstract Syntax Tree (if successful) */
  ast?: Program

  /** Intermediate Representation (if successful) */
  ir?: IntermediateRepresentation

  /** Generated BrainForge code (if successful) */
  bfCode?: string

  /** Generated standard Brainfuck code (if successful) */
  standardBf?: string

  /** Error message (if unsuccessful) */
  error?: string

  /** Warnings generated during transpilation */
  warnings?: string[]

  /** Statistics about the transpilation process */
  stats?: TranspilationStats
}

/**
 * Intermediate Representation (IR) of the program
 */
export interface IntermediateRepresentation {
  /** Variables in the program */
  variables: Map<string, VariableInfo>

  /** Functions in the program */
  functions: Map<string, FunctionInfo>

  /** Imported modules */
  imports: Map<string, ImportInfo[]>

  /** Exported identifiers */
  exports: Set<string>

  /** Instructions in the IR */
  instructions: Instruction[]
}

/**
 * Information about a variable
 */
export interface VariableInfo {
  /** Memory address of the variable */
  address: number

  /** Variable kind (var, let, const) */
  kind: string

  /** Variable size in memory cells */
  size?: number

  /** Source module (for imports) */
  source?: string
}

/**
 * Information about a function
 */
export interface FunctionInfo {
  /** Function ID */
  id: number

  /** Function parameters */
  params: string[]

  /** Function body */
  body: any[]

  /** Local variables */
  localVars: Map<string, VariableInfo>

  /** Whether it's a class constructor */
  isClass?: boolean

  /** Class methods (for classes) */
  methods?: Map<string, FunctionInfo>

  /** Class properties (for classes) */
  properties?: Map<string, any>
}

/**
 * Information about an import
 */
export interface ImportInfo {
  /** Imported name */
  name: string

  /** Local name */
  local: string
}

/**
 * Instruction in the IR
 */
export interface Instruction {
  /** Instruction type */
  type: string

  /** Additional properties based on instruction type */
  [key: string]: any
}

/**
 * Statistics about the transpilation process
 */
export interface TranspilationStats {
  /** Time taken for parsing (ms) */
  parseTime: number

  /** Time taken for IR generation (ms) */
  irGenTime: number

  /** Time taken for optimization (ms) */
  optimizeTime: number

  /** Time taken for code generation (ms) */
  codeGenTime: number

  /** Total transpilation time (ms) */
  totalTime: number

  /** Number of AST nodes */
  astNodeCount: number

  /** Number of IR instructions */
  irInstructionCount: number

  /** Number of variables */
  variableCount: number

  /** Number of functions */
  functionCount: number

  /** Number of optimizations applied */
  optimizationCount: number

  /** Size of generated BrainForge code (bytes) */
  bfCodeSize: number

  /** Size of generated standard Brainfuck code (bytes) */
  standardBfCodeSize: number

  /** Compression ratio (source code size / BF code size) */
  compressionRatio: number
}

