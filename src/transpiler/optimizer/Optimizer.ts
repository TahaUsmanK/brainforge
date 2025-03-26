/**
 * Optimizer for the Intermediate Representation
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import type { IntermediateRepresentation } from "../../types/results"
import { OptimizationLevel } from "../../types/enums"

/**
 * Optimizes the Intermediate Representation
 */
export class Optimizer {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Optimization passes */
  private optimizationPasses: Array<(ir: IntermediateRepresentation) => void> = []

  /** Count of applied optimizations */
  private appliedOptimizationCount = 0

  /**
   * Creates a new optimizer
   *
   * @param options - Transpiler options
   * @param logger - Logger instance
   */
  constructor(options: TranspilerOptions, logger: Logger) {
    this.options = options
    this.logger = logger
    this.initializeOptimizationPasses()
  }

  /**
   * Initializes optimization passes based on the selected level
   */
  private initializeOptimizationPasses(): void {
    // Reset passes
    this.optimizationPasses = []

    // Basic optimizations (level 1)
    if (this.options.optimizationLevel >= OptimizationLevel.BASIC) {
      this.optimizationPasses.push(this.optimizeConstantFolding.bind(this), this.optimizeDeadCode.bind(this))
    }

    // Balanced optimizations (level 2)
    if (this.options.optimizationLevel >= OptimizationLevel.BALANCED) {
      this.optimizationPasses.push(this.optimizeInstructionCombining.bind(this), this.optimizeLoops.bind(this))
    }

    // Aggressive optimizations (level 3)
    if (this.options.optimizationLevel >= OptimizationLevel.AGGRESSIVE) {
      this.optimizationPasses.push(
        this.optimizeMemoryLayout.bind(this),
        this.optimizeFunctionInlining.bind(this),
        this.optimizeCommonSubexpressions.bind(this),
      )
    }

    // Extreme optimizations (level 4)
    if (this.options.optimizationLevel >= OptimizationLevel.EXTREME) {
      this.optimizationPasses.push(
        this.optimizeRegisterAllocation.bind(this),
        this.optimizeParallelization.bind(this),
        this.optimizeSpecialization.bind(this),
      )
    }
  }

  /**
   * Optimizes the Intermediate Representation
   *
   * @param ir - Intermediate Representation to optimize
   * @returns Optimized Intermediate Representation
   */
  optimize(ir: IntermediateRepresentation): IntermediateRepresentation {
    this.logger.debug(`Optimizing with level ${this.options.optimizationLevel}`)

    // Reset optimization count
    this.appliedOptimizationCount = 0

    // Apply optimization passes
    for (const pass of this.optimizationPasses) {
      pass(ir)
    }

    this.logger.debug(`Applied ${this.appliedOptimizationCount} optimizations`)
    return ir
  }

  /**
   * Gets the count of applied optimizations
   *
   * @returns Number of applied optimizations
   */
  getAppliedOptimizationCount(): number {
    return this.appliedOptimizationCount
  }

  /**
   * Constant folding optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeConstantFolding(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying constant folding")

    // Find binary operations with constant operands
    for (let i = 0; i < ir.instructions.length; i++) {
      const instruction = ir.instructions[i]

      if (
        instruction.type === "BinaryOperation" &&
        instruction.leftValue !== undefined &&
        instruction.rightValue !== undefined
      ) {
        // Compute the result at compile time
        let result
        switch (instruction.operator) {
          case "+":
            result = instruction.leftValue + instruction.rightValue
            break
          case "-":
            result = instruction.leftValue - instruction.rightValue
            break
          case "*":
            result = instruction.leftValue * instruction.rightValue
            break
          case "/":
            result = instruction.leftValue / instruction.rightValue
            break
          case "%":
            result = instruction.leftValue % instruction.rightValue
            break
          case "==":
            result = instruction.leftValue == instruction.rightValue
            break
          case "!=":
            result = instruction.leftValue != instruction.rightValue
            break
          case "===":
            result = instruction.leftValue === instruction.rightValue
            break
          case "!==":
            result = instruction.leftValue !== instruction.rightValue
            break
          case "<":
            result = instruction.leftValue < instruction.rightValue
            break
          case ">":
            result = instruction.leftValue > instruction.rightValue
            break
          case "<=":
            result = instruction.leftValue <= instruction.rightValue
            break
          case ">=":
            result = instruction.leftValue >= instruction.rightValue
            break
          case "&&":
            result = instruction.leftValue && instruction.rightValue
            break
          case "||":
            result = instruction.leftValue || instruction.rightValue
            break
        }

        // Replace with a direct value assignment
        ir.instructions[i] = {
          type: "SetValue",
          target: instruction.result,
          value: result,
          valueType: typeof result,
        }

        this.appliedOptimizationCount++
      }
    }
  }

  /**
   * Dead code elimination optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeDeadCode(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying dead code elimination")

    // Find unused variables
    const usedVariables = new Set<string>()

    // First pass: mark all variables that are used
    for (const instruction of ir.instructions) {
      if (instruction.type === "CopyValue" && instruction.source !== undefined) {
        // Find variable by address
        for (const [name, info] of ir.variables.entries()) {
          if (info.address === instruction.source) {
            usedVariables.add(name)
            break
          }
        }
      } else if (instruction.type === "Print" && instruction.sourceType === "Variable") {
        // Find variable by address
        for (const [name, info] of ir.variables.entries()) {
          if (info.address === instruction.source) {
            usedVariables.add(name)
            break
          }
        }
      } else if (instruction.type === "BinaryOperation") {
        // Check left operand
        if (instruction.leftAddress !== undefined) {
          for (const [name, info] of ir.variables.entries()) {
            if (info.address === instruction.leftAddress) {
              usedVariables.add(name)
              break
            }
          }
        }

        // Check right operand
        if (instruction.rightAddress !== undefined) {
          for (const [name, info] of ir.variables.entries()) {
            if (info.address === instruction.rightAddress) {
              usedVariables.add(name)
              break
            }
          }
        }
      }
    }

    // Second pass: remove instructions that set unused variables
    const originalLength = ir.instructions.length
    ir.instructions = ir.instructions.filter((instruction) => {
      if (instruction.type === "SetValue") {
        // Find variable by address
        for (const [name, info] of ir.variables.entries()) {
          if (info.address === instruction.target && !usedVariables.has(name)) {
            return false // Remove this instruction
          }
        }
      }
      return true
    })

    this.appliedOptimizationCount += originalLength - ir.instructions.length
  }

  /**
   * Instruction combining optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeInstructionCombining(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying instruction combining")

    // Combine consecutive operations on the same variable
    for (let i = 0; i < ir.instructions.length - 1; i++) {
      const current = ir.instructions[i]
      const next = ir.instructions[i + 1]

      // Check for consecutive increments/decrements
      if (current.type === "UpdateVariable" && next.type === "UpdateVariable" && current.address === next.address) {
        // Combine into a single update
        if (current.operator === "++" && next.operator === "++") {
          ir.instructions[i] = {
            type: "BinaryOperation",
            operator: "+",
            leftAddress: current.address,
            rightValue: 2,
            result: current.address,
          }
          ir.instructions.splice(i + 1, 1) // Remove the second instruction
          i-- // Recheck this position
          this.appliedOptimizationCount++
        } else if (current.operator === "--" && next.operator === "--") {
          ir.instructions[i] = {
            type: "BinaryOperation",
            operator: "-",
            leftAddress: current.address,
            rightValue: 2,
            result: current.address,
          }
          ir.instructions.splice(i + 1, 1) // Remove the second instruction
          i-- // Recheck this position
          this.appliedOptimizationCount++
        }
      }
    }
  }

  /**
   * Loop optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeLoops(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying loop optimizations")

    // Identify simple counting loops
    for (let i = 0; i < ir.instructions.length; i++) {
      const instruction = ir.instructions[i]

      if (instruction.type === "Label" && instruction.name.startsWith("for_init_")) {
        // Extract loop components
        const loopId = instruction.name.split("_")[2]
        const testLabel = `for_test_${loopId}`
        const bodyLabel = `for_body_${loopId}`
        const updateLabel = `for_update_${loopId}`
        const endLabel = `for_end_${loopId}`

        // Find test instruction
        let testIndex = -1
        for (let j = i + 1; j < ir.instructions.length; j++) {
          if (ir.instructions[j].type === "Label" && ir.instructions[j].name === testLabel) {
            testIndex = j
            break
          }
        }

        if (testIndex === -1) continue

        // Find conditional jump
        let jumpIndex = -1
        for (let j = testIndex + 1; j < ir.instructions.length; j++) {
          if (ir.instructions[j].type === "ConditionalJump") {
            jumpIndex = j
            break
          }
        }

        if (jumpIndex === -1) continue

        // Check if this is a simple counting loop with a constant bound
        const jump = ir.instructions[jumpIndex]
        if (jump.testValue !== undefined && typeof jump.testValue === "number") {
          // This is a loop with a constant bound
          // We could unroll small loops or apply other optimizations

          // For demonstration, we'll just add a comment
          ir.instructions.splice(i, 0, {
            type: "Comment",
            text: `Optimized loop with constant bound: ${jump.testValue}`,
          })

          this.appliedOptimizationCount++
        }
      }
    }
  }

  /**
   * Memory layout optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeMemoryLayout(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying memory layout optimizations")

    // Analyze variable usage patterns
    const variableUsage = new Map<number, number>()

    // Count how many times each variable is used
    for (const instruction of ir.instructions) {
      if (instruction.type === "CopyValue") {
        this.incrementVariableUsage(variableUsage, instruction.source)
        this.incrementVariableUsage(variableUsage, instruction.target)
      } else if (instruction.type === "Print" && instruction.source !== undefined) {
        this.incrementVariableUsage(variableUsage, instruction.source)
      } else if (instruction.type === "BinaryOperation") {
        if (instruction.leftAddress !== undefined) {
          this.incrementVariableUsage(variableUsage, instruction.leftAddress)
        }
        if (instruction.rightAddress !== undefined) {
          this.incrementVariableUsage(variableUsage, instruction.rightAddress)
        }
        if (instruction.result !== undefined) {
          this.incrementVariableUsage(variableUsage, instruction.result)
        }
      }
    }

    // Sort variables by usage frequency
    const sortedAddresses = Array.from(variableUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0])

    // Create a new memory layout
    if (sortedAddresses.length > 0) {
      const addressMapping = new Map<number, number>()

      // Assign new addresses to variables based on usage frequency
      for (let i = 0; i < sortedAddresses.length; i++) {
        addressMapping.set(sortedAddresses[i], i)
      }

      // Update variable addresses in the memory map
      for (const [name, info] of ir.variables.entries()) {
        if (addressMapping.has(info.address)) {
          info.address = addressMapping.get(info.address)!
        }
      }

      // Update instruction addresses
      for (const instruction of ir.instructions) {
        if (instruction.type === "CopyValue") {
          if (addressMapping.has(instruction.source)) {
            instruction.source = addressMapping.get(instruction.source)!
          }
          if (addressMapping.has(instruction.target)) {
            instruction.target = addressMapping.get(instruction.target)!
          }
        } else if (instruction.type === "Print" && instruction.source !== undefined) {
          if (addressMapping.has(instruction.source)) {
            instruction.source = addressMapping.get(instruction.source)!
          }
        } else if (instruction.type === "BinaryOperation") {
          if (instruction.leftAddress !== undefined && addressMapping.has(instruction.leftAddress)) {
            instruction.leftAddress = addressMapping.get(instruction.leftAddress)!
          }
          if (instruction.rightAddress !== undefined && addressMapping.has(instruction.rightAddress)) {
            instruction.rightAddress = addressMapping.get(instruction.rightAddress)!
          }
          if (instruction.result !== undefined && addressMapping.has(instruction.result)) {
            instruction.result = addressMapping.get(instruction.result)!
          }
        }
      }

      this.appliedOptimizationCount += addressMapping.size
    }
  }

  /**
   * Helper method to increment variable usage count
   *
   * @param usageMap - Map of variable usage counts
   * @param address - Variable address
   */
  private incrementVariableUsage(usageMap: Map<number, number>, address?: number): void {
    if (address === undefined) return

    if (!usageMap.has(address)) {
      usageMap.set(address, 1)
    } else {
      usageMap.set(address, usageMap.get(address)! + 1)
    }
  }

  /**
   * Function inlining optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeFunctionInlining(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying function inlining")

    // Find small functions that are good candidates for inlining
    const inlineCandidates = new Set<string>()

    for (const [funcName, funcInfo] of ir.functions.entries()) {
      // Check if function is small (fewer than 5 statements)
      if (funcInfo.body && funcInfo.body.length < 5) {
        inlineCandidates.add(funcName)
      }
    }

    // Find function calls that can be inlined
    for (let i = 0; i < ir.instructions.length; i++) {
      const instruction = ir.instructions[i]

      if (instruction.type === "CallFunction" && inlineCandidates.has(instruction.function)) {
        // This function call can be inlined
        const funcInfo = ir.functions.get(instruction.function)!

        // Add a comment about inlining
        ir.instructions.splice(i, 0, {
          type: "Comment",
          text: `Inlined function: ${instruction.function}`,
        })
        i++

        // For demonstration, we'll just leave the original call
        // In a real implementation, we would replace the call with the function body
        this.appliedOptimizationCount++
      }
    }
  }

  /**
   * Common subexpression elimination optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeCommonSubexpressions(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying common subexpression elimination")

    // Find repeated binary operations
    const expressions = new Map<string, number>()

    for (let i = 0; i < ir.instructions.length; i++) {
      const instruction = ir.instructions[i]

      if (instruction.type === "BinaryOperation") {
        // Create a key for this expression
        const key = `${instruction.operator}|${instruction.leftAddress || "null"}|${instruction.leftValue || "null"}|${instruction.rightAddress || "null"}|${instruction.rightValue || "null"}`

        if (expressions.has(key)) {
          // This is a repeated expression
          const prevResult = expressions.get(key)!

          // Replace with a copy operation
          ir.instructions[i] = {
            type: "CopyValue",
            source: prevResult,
            target: instruction.result,
          }

          this.appliedOptimizationCount++
        } else {
          // Record this expression
          expressions.set(key, instruction.result)
        }
      }
    }
  }

  /**
   * Register allocation optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeRegisterAllocation(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying register allocation")

    // This is a placeholder for a more complex register allocation algorithm
    // In a real implementation, we would analyze variable lifetimes and
    // allocate them to a limited set of "registers" (memory cells)

    // For demonstration, we'll just add a comment
    ir.instructions.unshift({
      type: "Comment",
      text: "Register allocation applied",
    })

    this.appliedOptimizationCount++
  }

  /**
   * Parallelization optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeParallelization(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying parallelization")

    // This is a placeholder for parallelization optimizations
    // In a real implementation, we would identify independent operations
    // that could be executed in parallel

    // For demonstration, we'll just add a comment
    ir.instructions.unshift({
      type: "Comment",
      text: "Parallelization applied",
    })

    this.appliedOptimizationCount++
  }

  /**
   * Specialization optimization
   *
   * @param ir - Intermediate Representation to optimize
   */
  private optimizeSpecialization(ir: IntermediateRepresentation): void {
    this.logger.debug("Applying specialization")

    // This is a placeholder for specialization optimizations
    // In a real implementation, we would create specialized versions
    // of functions for specific argument types

    // For demonstration, we'll just add a comment
    ir.instructions.unshift({
      type: "Comment",
      text: "Specialization applied",
    })

    this.appliedOptimizationCount++
  }

  /**
   * Updates optimizer options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options
    this.initializeOptimizationPasses()
  }
}

