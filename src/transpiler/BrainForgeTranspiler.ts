/**
 * Main BrainForge transpiler class
 */
import type { TranspilerOptions } from "../types/options"
import { MemoryModel, OptimizationLevel } from "../types/enums"
import type { TranspilationResult } from "../types/results"
import { Logger, LogLevel } from "../utils/Logger"
import { Parser } from "./parser/Parser"
import { IRGenerator } from "./ir/IRGenerator"
import { Optimizer } from "./optimizer/Optimizer"
import { CodeGenerator } from "./codegen/CodeGenerator"
import { StdlibManager } from "./stdlib/StdlibManager"
import { MemoryManager } from "./memory/MemoryManager"
import { ErrorHandler } from "../utils/ErrorHandler"

/**
 * Default transpiler options
 */
const DEFAULT_OPTIONS: TranspilerOptions = {
  sourceLanguage: "javascript",
  optimizationLevel: OptimizationLevel.BALANCED,
  memoryModel: MemoryModel.DYNAMIC,
  includeStdlib: true,
  targetCellSize: 32,
  debug: false,
  preserveComments: false,
  allowExtensions: true,
  maxRecursionDepth: 100,
  memorySize: 65536,
  logLevel: LogLevel.INFO,
  safeMode: true,
  nullSafeChecks: true,
  garbageCollection: true,
  gcThreshold: 0.75,
}

/**
 * Main BrainForge transpiler class
 */
export class BrainForgeTranspiler {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Error handler */
  private errorHandler: ErrorHandler

  /** Parser instance */
  private parser: Parser

  /** IR generator instance */
  private irGenerator: IRGenerator

  /** Optimizer instance */
  private optimizer: Optimizer

  /** Code generator instance */
  private codeGenerator: CodeGenerator

  /** Standard library manager */
  private stdlibManager: StdlibManager

  /** Memory manager */
  private memoryManager: MemoryManager

  /** Version information */
  private static readonly VERSION = "1.1.0"

  /**
   * Creates a new BrainForge transpiler
   *
   * @param options - Transpiler options
   */
  constructor(options?: Partial<TranspilerOptions>) {
    // Merge default options with provided options
    this.options = { ...DEFAULT_OPTIONS, ...options }

    // Initialize logger
    this.logger = new Logger(this.options.debug ? LogLevel.DEBUG : this.options.logLevel, this.options.logger)

    // Initialize error handler
    this.errorHandler = new ErrorHandler(this.logger)

    try {
      // Initialize memory manager
      this.memoryManager = new MemoryManager(this.options, this.logger)

      // Initialize standard library manager
      this.stdlibManager = new StdlibManager(this.options, this.logger, this.memoryManager)

      // Initialize parser
      this.parser = new Parser(this.options, this.logger)

      // Initialize IR generator
      this.irGenerator = new IRGenerator(this.options, this.logger, this.memoryManager, this.stdlibManager)

      // Initialize optimizer
      this.optimizer = new Optimizer(this.options, this.logger)

      // Initialize code generator
      this.codeGenerator = new CodeGenerator(this.options, this.logger, this.memoryManager, this.stdlibManager)

      this.logger.debug("BrainForge transpiler initialized")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to initialize BrainForge transpiler: ${errorMessage}`)
      throw new Error(`Initialization failed: ${errorMessage}`)
    }
  }

  /**
   * Gets the BrainForge version
   *
   * @returns Version string
   */
  static getVersion(): string {
    return BrainForgeTranspiler.VERSION
  }

  /**
   * Transpiles source code to BrainForge code
   *
   * @param sourceCode - Source code to transpile
   * @returns Transpilation result
   */
  transpile(sourceCode: string): TranspilationResult {
    if (!sourceCode || typeof sourceCode !== "string") {
      return this.errorHandler.createError("Invalid source code: must be a non-empty string")
    }

    this.logger.info("Starting transpilation process")

    const startTime = Date.now()
    let parseTime = 0
    let irGenTime = 0
    let optimizeTime = 0
    let codeGenTime = 0

    try {
      // Parse source code to AST
      const parseStartTime = Date.now()
      const ast = this.parser.parse(sourceCode)
      parseTime = Date.now() - parseStartTime
      this.logger.debug(`Parsing completed in ${parseTime}ms`)

      if (!ast) {
        return this.errorHandler.createError("Parsing failed: null AST returned")
      }

      // Generate intermediate representation
      const irGenStartTime = Date.now()
      const ir = this.irGenerator.generateIR(ast)
      irGenTime = Date.now() - irGenStartTime
      this.logger.debug(`IR generation completed in ${irGenTime}ms`)

      if (!ir) {
        return this.errorHandler.createError("IR generation failed: null IR returned")
      }

      // Optimize the IR
      const optimizeStartTime = Date.now()
      const optimizedIr = this.optimizer.optimize(ir)
      optimizeTime = Date.now() - optimizeStartTime
      this.logger.debug(`Optimization completed in ${optimizeTime}ms`)

      if (!optimizedIr) {
        return this.errorHandler.createError("Optimization failed: null IR returned")
      }

      // Generate BrainForge code
      const codeGenStartTime = Date.now()
      const bfCode = this.codeGenerator.generateCode(optimizedIr)

      if (!bfCode) {
        return this.errorHandler.createError("Code generation failed: null code returned")
      }

      // Convert to standard Brainfuck if needed
      const standardBf = this.options.allowExtensions ? this.codeGenerator.convertToStandardBrainfuck(bfCode) : bfCode

      codeGenTime = Date.now() - codeGenStartTime
      this.logger.debug(`Code generation completed in ${codeGenTime}ms`)

      const totalTime = Date.now() - startTime
      this.logger.info(`Transpilation completed successfully in ${totalTime}ms`)

      // Clean up memory if garbage collection is enabled
      if (this.options.garbageCollection) {
        this.memoryManager.runGarbageCollection()
      }

      // Prepare statistics
      const stats = {
        parseTime,
        irGenTime,
        optimizeTime,
        codeGenTime,
        totalTime,
        astNodeCount: this.countASTNodes(ast),
        irInstructionCount: optimizedIr.instructions.length,
        variableCount: optimizedIr.variables.size,
        functionCount: optimizedIr.functions.size,
        optimizationCount: this.optimizer.getAppliedOptimizationCount(),
        bfCodeSize: bfCode.length,
        standardBfCodeSize: standardBf.length,
        compressionRatio: sourceCode.length / bfCode.length,
        memoryStats: this.memoryManager.getMemoryStats(),
      }

      return {
        success: true,
        ast,
        ir: optimizedIr,
        bfCode,
        standardBf,
        stats,
        warnings: this.parser.getWarnings(),
      }
    } catch (error) {
      return this.errorHandler.handleTranspilationError(error)
    }
  }

  /**
   * Counts the number of nodes in the AST
   *
   * @param ast - Abstract Syntax Tree
   * @returns Number of nodes
   */
  private countASTNodes(ast: any): number {
    if (!ast) return 0

    let count = 1 // Count the node itself

    // Recursively count child nodes
    for (const key in ast) {
      if (ast.hasOwnProperty(key) && typeof ast[key] === "object" && ast[key] !== null) {
        if (Array.isArray(ast[key])) {
          for (const item of ast[key]) {
            if (typeof item === "object" && item !== null) {
              count += this.countASTNodes(item)
            }
          }
        } else {
          count += this.countASTNodes(ast[key])
        }
      }
    }

    return count
  }

  /**
   * Executes BrainForge code and returns the output
   *
   * @param bfCode - BrainForge code to execute
   * @param input - Optional input string for the program
   * @returns Execution output
   */
  executeCode(bfCode: string, input = ""): string {
    if (!bfCode || typeof bfCode !== "string") {
      return "Error: Invalid BrainForge code"
    }

    this.logger.info("Executing BrainForge code")

    const startTime = Date.now()

    try {
      // Convert to standard Brainfuck for execution if needed
      const executableCode = this.options.allowExtensions
        ? this.codeGenerator.convertToStandardBrainfuck(bfCode)
        : bfCode

      // Enhanced Brainfuck interpreter
      const memory = new Uint8Array(this.options.memorySize)
      let pointer = 0
      let output = ""
      let instructionPointer = 0
      let operationCount = 0
      const maxOperations = 100000000 // Prevent infinite loops
      let inputIndex = 0

      // Find matching brackets for faster execution
      const bracketMap = new Map<number, number>()
      const stack: number[] = []

      for (let i = 0; i < executableCode.length; i++) {
        if (executableCode[i] === "[") {
          stack.push(i)
        } else if (executableCode[i] === "]") {
          if (stack.length === 0) {
            throw new Error(`Unmatched closing bracket at position ${i}`)
          }
          const openBracket = stack.pop()!
          bracketMap.set(openBracket, i)
          bracketMap.set(i, openBracket)
        }
      }

      if (stack.length !== 0) {
        throw new Error(`Unmatched opening bracket at position ${stack[0]}`)
      }

      // Execute the code
      while (instructionPointer < executableCode.length && operationCount < maxOperations) {
        const instruction = executableCode[instructionPointer]

        switch (instruction) {
          case ">":
            pointer = (pointer + 1) % memory.length
            break
          case "<":
            pointer = (pointer - 1 + memory.length) % memory.length
            break
          case "+":
            memory[pointer] = (memory[pointer] + 1) % 256
            break
          case "-":
            memory[pointer] = (memory[pointer] - 1 + 256) % 256
            break
          case ".":
            output += String.fromCharCode(memory[pointer])
            break
          case ",":
            // Read from input if available, otherwise set to 0
            if (inputIndex < input.length) {
              memory[pointer] = input.charCodeAt(inputIndex++)
            } else {
              memory[pointer] = 0
            }
            break
          case "[":
            if (memory[pointer] === 0) {
              instructionPointer = bracketMap.get(instructionPointer)!
            }
            break
          case "]":
            if (memory[pointer] !== 0) {
              instructionPointer = bracketMap.get(instructionPointer)!
            }
            break
        }

        instructionPointer++
        operationCount++

        // Safety check for pointer bounds
        if (pointer < 0 || pointer >= memory.length) {
          throw new Error(`Memory pointer out of bounds: ${pointer}`)
        }
      }

      if (operationCount >= maxOperations) {
        output += "\n[Execution halted: maximum operation count reached]"
      }

      // Add memory dump for debugging
      output += "\n\nMemory cells after execution: ["
      for (let i = 0; i < Math.min(20, memory.length); i++) {
        output += memory[i]
        if (i < Math.min(19, memory.length - 1)) output += ", "
      }
      output += "...]"
      output += `\nTotal operations executed: ${operationCount}\n`

      // Add execution statistics
      output += `\nExecution Statistics:\n`
      output += `- Memory cells used: ${this.countUsedCells(memory)}\n`
      output += `- Execution time: ${Date.now() - startTime}ms\n`
      output += `- Instructions executed: ${operationCount}\n`

      this.logger.info("Execution completed successfully")
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Execution failed: ${errorMessage}`)
      return `Error during execution: ${errorMessage}`
    }
  }

  /**
   * Counts the number of non-zero cells in memory
   *
   * @param memory - Memory array
   * @returns Count of used cells
   */
  private countUsedCells(memory: Uint8Array): number {
    let count = 0
    for (let i = 0; i < memory.length; i++) {
      if (memory[i] !== 0) count++
    }
    return count
  }

  /**
   * Gets the current transpiler options
   *
   * @returns Current options
   */
  getOptions(): TranspilerOptions {
    return { ...this.options }
  }

  /**
   * Updates transpiler options
   *
   * @param options - New options to apply
   */
  updateOptions(options: Partial<TranspilerOptions>): void {
    this.options = { ...this.options, ...options }

    // Update logger level if debug option changed
    if (options.debug !== undefined) {
      this.logger.setLevel(options.debug ? LogLevel.DEBUG : this.options.logLevel)
    } else if (options.logLevel !== undefined) {
      this.logger.setLevel(options.logLevel)
    }

    // Update custom logger if provided
    if (options.logger !== undefined) {
      this.logger.setCustomLogger(options.logger)
    }

    // Reinitialize components with new options
    this.memoryManager.updateOptions(this.options)
    this.stdlibManager.updateOptions(this.options)
    this.parser.updateOptions(this.options)
    this.irGenerator.updateOptions(this.options)
    this.optimizer.updateOptions(this.options)
    this.codeGenerator.updateOptions(this.options)

    this.logger.debug("Transpiler options updated")
  }
}

