/**
 * Code Generator for BrainForge and standard Brainfuck
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import type { MemoryManager } from "../memory/MemoryManager"
import type { StdlibManager } from "../stdlib/StdlibManager"
import type { IntermediateRepresentation } from "../../types/results"

/**
 * Generates BrainForge and standard Brainfuck code from IR
 */
export class CodeGenerator {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Memory manager */
  private memoryManager: MemoryManager

  /** Standard library manager */
  private stdlibManager: StdlibManager

  /**
   * Creates a new code generator
   *
   * @param options - Transpiler options
   * @param logger - Logger instance
   * @param memoryManager - Memory manager
   * @param stdlibManager - Standard library manager
   */
  constructor(options: TranspilerOptions, logger: Logger, memoryManager: MemoryManager, stdlibManager: StdlibManager) {
    this.options = options
    this.logger = logger
    this.memoryManager = memoryManager
    this.stdlibManager = stdlibManager
  }

  /**
   * Generates BrainForge code from IR
   *
   * @param ir - Intermediate Representation
   * @returns Generated BrainForge code
   */
  generateCode(ir: IntermediateRepresentation): string {
    this.logger.debug("Generating BrainForge code")

    let bfCode = ""

    // Add header comment
    bfCode += `// Generated by BrainForge Transpiler\n`
    bfCode += `// Source language: ${this.options.sourceLanguage}\n`
    bfCode += `// Optimization level: ${this.options.optimizationLevel}\n`
    bfCode += `// Memory model: ${this.options.memoryModel}\n\n`

    // Initialize memory if needed
    if (ir.variables.size > 0) {
      bfCode += "// Initialize memory\n"
      bfCode += "[-]".repeat(Math.max(30, this.memoryManager.getNextMemoryAddress())) + "\n\n"
    }

    // Process instructions
    for (const instruction of ir.instructions) {
      switch (instruction.type) {
        case "Comment":
          bfCode += `// ${instruction.text}\n`
          break

        case "SetValue":
          bfCode += `// Set value at address ${instruction.target}\n`
          bfCode += this.generateSetValueCode(instruction)
          break

        case "CopyValue":
          bfCode += `// Copy value from address ${instruction.source} to ${instruction.target}\n`
          bfCode += this.generateCopyValueCode(instruction)
          break

        case "Print":
          bfCode += `// Print value\n`
          bfCode += this.generatePrintCode(instruction)
          break

        case "BinaryOperation":
          bfCode += `// Binary operation: ${instruction.operator}\n`
          bfCode += this.generateBinaryOperationCode(instruction)
          break

        case "CallFunction":
          bfCode += `// Call function: ${instruction.function}\n`
          bfCode += this.generateFunctionCallCode(instruction)
          break

        case "CallMethod":
          bfCode += `// Call method: ${instruction.object}.${instruction.method}\n`
          bfCode += this.generateMethodCallCode(instruction)
          break

        case "CreateArray":
          bfCode += `// Create array with ${instruction.elements.length} elements\n`
          bfCode += this.generateCreateArrayCode(instruction)
          break

        case "CreateObject":
          bfCode += `// Create object with ${instruction.properties.length} properties\n`
          bfCode += this.generateCreateObjectCode(instruction)
          break

        case "Label":
          bfCode += `// Label: ${instruction.name}\n`
          break

        case "Jump":
          bfCode += `// Jump to ${instruction.target}\n`
          bfCode += this.generateJumpCode(instruction)
          break

        case "ConditionalJump":
          bfCode += `// Conditional jump\n`
          bfCode += this.generateConditionalJumpCode(instruction)
          break

        case "IfCondition":
          bfCode += `// If condition\n`
          bfCode += this.generateIfConditionCode(instruction)
          break

        case "Return":
          bfCode += `// Return\n`
          bfCode += this.generateReturnCode(instruction)
          break

        case "Import":
          bfCode += `// Import from ${instruction.source}\n`
          bfCode += this.generateImportCode(instruction)
          break

        case "Export":
          bfCode += `// Export ${instruction.names.join(", ")}\n`
          break

        case "UpdateVariable":
          bfCode += `// Update variable: ${instruction.operator}\n`
          bfCode += this.generateUpdateVariableCode(instruction)
          break
      }
    }

    this.logger.debug("BrainForge code generation complete")
    return bfCode
  }

  /**
   * Generates BrainForge code for setting a value
   *
   * @param instruction - SetValue instruction
   * @returns Generated BrainForge code
   */
  private generateSetValueCode(instruction: any): string {
    let code = ""

    // Move to target address
    code += ">".repeat(instruction.target)

    // Clear cell
    code += "[-]"

    // Set value
    if (instruction.value !== undefined && instruction.value !== null) {
      if (typeof instruction.value === "number") {
        // For numbers, add the value (capped at 255 for 8-bit cells)
        const value = Math.min(Math.abs(instruction.value) % 256, 255)
        code += "+".repeat(value)

        // Handle negative numbers
        if (instruction.value < 0) {
          code += "~" // BrainForge extension for negation
        }
      } else if (typeof instruction.value === "string") {
        // For strings, set the first character's ASCII value
        if (instruction.value.length > 0) {
          const charCode = instruction.value.charCodeAt(0)
          code += "+".repeat(Math.min(charCode, 255))
        }
      } else if (typeof instruction.value === "boolean") {
        // For booleans, set 1 for true, 0 for false
        if (instruction.value) {
          code += "+"
        }
      }
    }

    // Move back to start
    code += "<".repeat(instruction.target)

    return code + "\n"
  }

  /**
   * Generates BrainForge code for copying a value
   *
   * @param instruction - CopyValue instruction
   * @returns Generated BrainForge code
   */
  private generateCopyValueCode(instruction: any): string {
    let code = ""

    // Move to source address
    code += ">".repeat(instruction.source)

    // Copy value to a temporary location
    code += "[->+<]"

    // Move to target address
    code += "<".repeat(instruction.source)
    code += ">".repeat(instruction.target)

    // Clear target cell
    code += "[-]"

    // Move back to temporary location and copy to target
    code += "<".repeat(instruction.target)
    code += ">".repeat(instruction.source + 1)
    code += "[->+<]"

    // Move back to start
    code += "<".repeat(instruction.source + 1)

    return code + "\n"
  }

  /**
   * Generates BrainForge code for printing a value
   *
   * @param instruction - Print instruction
   * @returns Generated BrainForge code
   */
  private generatePrintCode(instruction: any): string {
    let code = ""

    if (instruction.sourceType === "Variable" && instruction.source !== undefined) {
      // Move to source address
      code += ">".repeat(instruction.source)

      // Output value
      code += "."

      // Move back to start
      code += "<".repeat(instruction.source)
    } else if (instruction.sourceType === "Literal" && instruction.value !== undefined) {
      // For literal values
      if (typeof instruction.value === "number") {
        // Convert number to ASCII and print
        const charCode = Math.min(instruction.value, 255)
        code += "[-]" + "+".repeat(charCode) + ".[-]"
      } else if (typeof instruction.value === "string") {
        // Print each character
        for (let i = 0; i < instruction.value.length; i++) {
          const charCode = instruction.value.charCodeAt(i)
          code += "[-]" + "+".repeat(Math.min(charCode, 255)) + "."
        }
        code += "[-]"
      } else if (typeof instruction.value === "boolean") {
        // Print 1 for true, 0 for false
        code += "[-]"
        if (instruction.value) {
          code += "+"
        }
        code += ".[-]"
      }
    }

    return code + "\n"
  }

  /**
   * Generates BrainForge code for binary operations
   *
   * @param instruction - BinaryOperation instruction
   * @returns Generated BrainForge code
   */
  private generateBinaryOperationCode(instruction: any): string {
    let code = ""

    // Load left operand
    if (instruction.leftAddress !== undefined) {
      // Left operand is a variable
      code += ">".repeat(instruction.leftAddress)
      code += "[->+<]"
      code += "<".repeat(instruction.leftAddress)
      code += ">"
    } else if (instruction.leftValue !== undefined) {
      // Left operand is a literal
      code += "[-]"
      if (typeof instruction.leftValue === "number") {
        code += "+".repeat(Math.min(Math.abs(instruction.leftValue) % 256, 255))
        if (instruction.leftValue < 0) {
          code += "~" // Negate
        }
      } else if (typeof instruction.leftValue === "boolean") {
        if (instruction.leftValue) {
          code += "+"
        }
      }
    }

    // Perform operation
    switch (instruction.operator) {
      case "+":
        // Addition
        if (instruction.rightAddress !== undefined) {
          // Right operand is a variable
          code += ">".repeat(instruction.rightAddress)
          code += "[->+<]"
          code += "<".repeat(instruction.rightAddress)
          code += ">"
        } else if (instruction.rightValue !== undefined) {
          // Right operand is a literal
          if (typeof instruction.rightValue === "number") {
            code += "+".repeat(Math.min(Math.abs(instruction.rightValue) % 256, 255))
            if (instruction.rightValue < 0) {
              code += "~" // Negate
            }
          } else if (typeof instruction.rightValue === "boolean") {
            if (instruction.rightValue) {
              code += "+"
            }
          }
        }
        break

      case "-":
        // Subtraction
        if (instruction.rightAddress !== undefined) {
          // Right operand is a variable
          code += ">".repeat(instruction.rightAddress)
          code += "[->-<]"
          code += "<".repeat(instruction.rightAddress)
          code += ">"
        } else if (instruction.rightValue !== undefined) {
          // Right operand is a literal
          if (typeof instruction.rightValue === "number") {
            code += "-".repeat(Math.min(Math.abs(instruction.rightValue) % 256, 255))
            if (instruction.rightValue < 0) {
              code += "~" // Negate
            }
          } else if (typeof instruction.rightValue === "boolean") {
            if (instruction.rightValue) {
              code += "-"
            }
          }
        }
        break

      case "*":
        // Multiplication (simplified)
        if (instruction.rightAddress !== undefined) {
          // Right operand is a variable
          code += ">".repeat(instruction.rightAddress)
          code += "[<[->+>+<<]>>[-<<+>>]<-]"
          code += "<".repeat(instruction.rightAddress)
          code += ">"
        } else if (instruction.rightValue !== undefined) {
          // Right operand is a literal
          if (typeof instruction.rightValue === "number") {
            const value = Math.min(Math.abs(instruction.rightValue) % 256, 255)
            code += `[->+>+<<]>>[-<<+>>]<<[->${"+".repeat(value)}<]`
            if (instruction.rightValue < 0) {
              code += "~" // Negate
            }
          }
        }
        break

      // Other operations would be implemented here...
    }

    // Move result to target address
    code += ">".repeat(instruction.result)
    code += "[-]"
    code += "<".repeat(instruction.result)
    code += "[->+<]"

    // Move back to start
    code += "<"

    return code + "\n"
  }

  /**
   * Generates BrainForge code for function calls
   *
   * @param instruction - CallFunction instruction
   * @returns Generated BrainForge code
   */
  private generateFunctionCallCode(instruction: any): string {
    let code = ""

    // Check if it's a standard library function
    const stdlibFunc = this.stdlibManager.getFunction(instruction.function)

    if (stdlibFunc) {
      // Process arguments
      const args = instruction.arguments
        .map((arg: any) => {
          if (arg.type === "Literal") {
            return arg.value
          } else if (arg.type === "Variable") {
            return arg.name
          }
          return null
        })
        .filter((arg: any) => arg !== null)

      // Call standard library function
      code += stdlibFunc.code(...args)

      // Store result if needed
      if (instruction.result !== undefined) {
        code += ">".repeat(instruction.result)
        code += "[-]"
        code += "<".repeat(instruction.result)
        code += "[->+<]"
      }
    } else {
      // Custom function call
      code += `// Function call implementation for ${instruction.function}\n`

      // In a real implementation, this would:
      // 1. Save current state
      // 2. Push arguments to the stack
      // 3. Jump to function code
      // 4. Execute function
      // 5. Return and restore state

      // For demonstration, we'll use the BrainForge extension for function calls
      code += `#${instruction.function}`
    }

    return code + "\n"
  }

  /**
   * Generates BrainForge code for method calls
   *
   * @param instruction - CallMethod instruction
   * @returns Generated BrainForge code
   */
  private generateMethodCallCode(instruction: any): string {
    let code = ""

    // Check if it's a standard library method
    const methodKey = `${instruction.object}.${instruction.method}`
    const stdlibMethod = this.stdlibManager.getMethod(methodKey)

    if (stdlibMethod) {
      // Process arguments
      const args = instruction.arguments
        .map((arg: any) => {
          if (arg.type === "Literal") {
            return arg.value
          } else if (arg.type === "Variable") {
            return arg.name
          }
          return null
        })
        .filter((arg: any) => arg !== null)

      // Call standard library method
      code += stdlibMethod.code(...args)

      // Store result if needed
      if (instruction.result !== undefined) {
        code += ">".repeat(instruction.result)
        code += "[-]"
        code += "<".repeat(instruction.result)
        code += "[->+<]"
      }
    } else {
      // Custom method call
      code += `// Method call implementation for ${instruction.object}.${instruction.method}\n`

      // For demonstration, we'll use the BrainForge extension for method calls
      code += `#${instruction.object}.${instruction.method}`
    }

    return code + "\n"
  }

  /**
   * Generates BrainForge code for creating arrays
   *
   * @param instruction - CreateArray instruction
   * @returns Generated BrainForge code
   */
  private generateCreateArrayCode(instruction: any): string {
    let code = ""

    // Move to result address
    code += ">".repeat(instruction.result)

    // Clear cell and set array length
    code += "[-]" + "+".repeat(instruction.elements.length)

    // Initialize array elements
    for (const element of instruction.elements) {
      code += ">"
      code += "[-]"

      if (element.type === "Literal") {
        if (typeof element.value === "number") {
          code += "+".repeat(Math.min(Math.abs(element.value) % 256, 255))
          if (element.value < 0) {
            code += "~" // Negate
          }
        } else if (typeof element.value === "boolean") {
          if (element.value) {
            code += "+"
          }
        } else if (typeof element.value === "string" && element.value.length > 0) {
          code += "+".repeat(element.value.charCodeAt(0))
        }
      } else if (element.type === "Variable") {
        // Copy value from variable
        code += "<".repeat(instruction.result + 1)
        code += ">".repeat(element.address)
        code += "[->+<]"
        code += "<".repeat(element.address)
        code += ">".repeat(instruction.result + 1)
      }
    }

    // Move back to start
    code += "<".repeat(instruction.result + instruction.elements.length)

    return code + "\n"
  }

  /**
   * Generates BrainForge code for creating objects
   *
   * @param instruction - CreateObject instruction
   * @returns Generated BrainForge code
   */
  private generateCreateObjectCode(instruction: any): string {
    let code = ""

    // Move to result address
    code += ">".repeat(instruction.result)

    // Clear cell and set object property count
    code += "[-]" + "+".repeat(instruction.properties.length)

    // Initialize object properties
    for (const prop of instruction.properties) {
      code += ">"

      // Store property key hash
      const keyHash = this.hashString(prop.key) % 256
      code += "[-]" + "+".repeat(keyHash)

      // Store property value
      code += ">"
      code += "[-]"

      if (prop.value.type === "Literal") {
        if (typeof prop.value.value === "number") {
          code += "+".repeat(Math.min(Math.abs(prop.value.value) % 256, 255))
          if (prop.value.value < 0) {
            code += "~" // Negate
          }
        } else if (typeof prop.value.value === "boolean") {
          if (prop.value.value) {
            code += "+"
          }
        } else if (typeof prop.value.value === "string" && prop.value.value.length > 0) {
          code += "+".repeat(prop.value.value.charCodeAt(0))
        }
      } else if (prop.value.type === "Variable") {
        // Copy value from variable
        code += "<".repeat(instruction.result + 2)
        code += ">".repeat(prop.value.address)
        code += "[->+<]"
        code += "<".repeat(prop.value.address)
        code += ">".repeat(instruction.result + 2)
      }
    }

    // Move back to start
    code += "<".repeat(instruction.result + instruction.properties.length * 2)

    return code + "\n"
  }

  /**
   * Generates a hash for a string (for object property lookup)
   *
   * @param str - String to hash
   * @returns Hash value
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0 // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Generates BrainForge code for jumps
   *
   * @param instruction - Jump instruction
   * @returns Generated BrainForge code
   */
  private generateJumpCode(instruction: any): string {
    // In BrainForge, we'll use the @ extension for jumps
    return `@${instruction.target}\n`
  }

  /**
   * Generates BrainForge code for conditional jumps
   *
   * @param instruction - ConditionalJump instruction
   * @returns Generated BrainForge code
   */
  private generateConditionalJumpCode(instruction: any): string {
    let code = ""

    // Load test condition
    if (instruction.testAddress !== undefined) {
      // Test is a variable
      code += ">".repeat(instruction.testAddress)
    } else if (instruction.testValue !== undefined) {
      // Test is a literal
      code += "[-]"
      if (typeof instruction.testValue === "boolean") {
        if (instruction.testValue) {
          code += "+"
        }
      } else if (typeof instruction.testValue === "number") {
        if (instruction.testValue !== 0) {
          code += "+"
        }
      }
    }

    // Conditional jump
    code += "["
    code += `@${instruction.trueTarget}`
    code += "]"

    // Jump to false target if condition is false
    code += `@${instruction.falseTarget}`

    // Move back to start if needed
    if (instruction.testAddress !== undefined) {
      code += "<".repeat(instruction.testAddress)
    }

    return code + "\n"
  }

  /**
   * Generates BrainForge code for if conditions
   *
   * @param instruction - IfCondition instruction
   * @returns Generated BrainForge code
   */
  private generateIfConditionCode(instruction: any): string {
    let code = ""

    // Load test condition
    if (instruction.testAddress !== undefined) {
      // Test is a variable
      code += ">".repeat(instruction.testAddress)
    } else if (instruction.testValue !== undefined) {
      // Test is a literal
      code += "[-]"
      if (typeof instruction.testValue === "boolean") {
        if (instruction.testValue) {
          code += "+"
        }
      } else if (typeof instruction.testValue === "number") {
        if (instruction.testValue !== 0) {
          code += "+"
        }
      }
    }

    // If condition
    code += "["
    code += `@${instruction.thenLabel}`
    code += "]"

    // Jump to else branch if condition is false
    code += `@${instruction.elseLabel}`

    // Move back to start if needed
    if (instruction.testAddress !== undefined) {
      code += "<".repeat(instruction.testAddress)
    }

    return code + "\n"
  }

  /**
   * Generates BrainForge code for return statements
   *
   * @param instruction - Return instruction
   * @returns Generated BrainForge code
   */
  private generateReturnCode(instruction: any): string {
    let code = ""

    // Load return value
    if (instruction.address !== undefined) {
      // Return value is a variable
      code += ">".repeat(instruction.address)
      code += "[->+<]"
      code += "<".repeat(instruction.address)
      code += ">"
    } else if (instruction.value !== undefined) {
      // Return value is a literal
      code += "[-]"
      if (typeof instruction.value === "number") {
        code += "+".repeat(Math.min(Math.abs(instruction.value) % 256, 255))
        if (instruction.value < 0) {
          code += "~" // Negate
        }
      } else if (typeof instruction.value === "boolean") {
        if (instruction.value) {
          code += "+"
        }
      } else if (typeof instruction.value === "string" && instruction.value.length > 0) {
        code += "+".repeat(instruction.value.charCodeAt(0))
      }
    }

    // Return instruction (BrainForge extension)
    code += "!"

    return code + "\n"
  }

  /**
   * Generates BrainForge code for import statements
   *
   * @param instruction - Import instruction
   * @returns Generated BrainForge code
   */
  private generateImportCode(instruction: any): string {
    // In BrainForge, we'll use the & extension for imports
    return `&${instruction.source}\n`
  }

  /**
   * Generates BrainForge code for variable updates
   *
   * @param instruction - UpdateVariable instruction
   * @returns Generated BrainForge code
   */
  private generateUpdateVariableCode(instruction: any): string {
    let code = ""

    // Move to variable address
    code += ">".repeat(instruction.address)

    // Update value
    if (instruction.operator === "++") {
      code += "+"
    } else if (instruction.operator === "--") {
      code += "-"
    }

    // Move back to start
    code += "<".repeat(instruction.address)

    return code + "\n"
  }

  /**
   * Converts BrainForge code to standard Brainfuck
   *
   * @param bfCode - BrainForge code to convert
   * @returns Standard Brainfuck code
   */
  convertToStandardBrainfuck(bfCode: string): string {
    this.logger.debug("Converting BrainForge to standard Brainfuck")

    // Remove comments
    let code = bfCode.replace(/\/\/.*$/gm, "")

    // Replace BrainForge extensions with standard Brainfuck equivalents

    // Replace @ (memory management) with equivalent operations
    code = code.replace(/@/g, "")

    // Replace $ (variable access) with equivalent operations
    code = code.replace(/\$/g, "")

    // Replace # (function call) with equivalent operations
    code = code.replace(/#/g, "")

    // Replace & (import) with equivalent operations
    code = code.replace(/&/g, "")

    // Replace ! (type conversion) with equivalent operations
    code = code.replace(/!/g, "")

    // Replace ? (conditional) with equivalent operations
    code = code.replace(/\?/g, "")

    // Replace : (array/object access) with equivalent operations
    code = code.replace(/:/g, "")

    // Replace ; (statement separator) with equivalent operations
    code = code.replace(/;/g, "")

    // Replace ~ (bitwise operation) with equivalent operations
    code = code.replace(/~/g, "[-]+++++++++[->+++++++++<]>.")

    // Replace ` (string/template literal) with equivalent operations
    code = code.replace(/`/g, "")

    // Remove all non-Brainfuck characters
    code = code.replace(/[^+\-[\]<>.,]/g, "")

    this.logger.debug("Conversion to standard Brainfuck complete")
    return code
  }

  /**
   * Updates code generator options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options
  }
}

