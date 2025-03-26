/**
 * Standard Library Manager for BrainForge transpiler
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import type { MemoryManager } from "../memory/MemoryManager"

/**
 * Standard library function
 */
interface StdlibFunction {
  /** Function ID */
  id: number

  /** Function implementation */
  code: (...args: any[]) => string

  /** Function description */
  description: string
}

/**
 * Manages the standard library for the BrainForge transpiler
 */
export class StdlibManager {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Memory manager */
  private memoryManager: MemoryManager

  /** Standard library functions */
  private stdlib: Map<string, StdlibFunction> = new Map()

  /** Next function ID */
  private nextFunctionId = 1

  /**
   * Creates a new standard library manager
   *
   * @param options - Transpiler options
   * @param logger - Logger instance
   * @param memoryManager - Memory manager
   */
  constructor(options: TranspilerOptions, logger: Logger, memoryManager: MemoryManager) {
    this.options = options
    this.logger = logger
    this.memoryManager = memoryManager

    if (this.options.includeStdlib) {
      this.initializeStdlib()
    }
  }

  /**
   * Initializes the standard library with common functions
   */
  private initializeStdlib(): void {
    this.logger.debug("Initializing standard library")

    // Console functions
    this.stdlib.set("console.log", this.generateConsoleLog())
    this.stdlib.set("console.error", this.generateConsoleError())

    // Math functions
    this.stdlib.set("Math.abs", this.generateMathAbs())
    this.stdlib.set("Math.min", this.generateMathMin())
    this.stdlib.set("Math.max", this.generateMathMax())
    this.stdlib.set("Math.floor", this.generateMathFloor())
    this.stdlib.set("Math.ceil", this.generateMathCeil())
    this.stdlib.set("Math.random", this.generateMathRandom())

    // String functions
    this.stdlib.set("String.fromCharCode", this.generateStringFromCharCode())
    this.stdlib.set("String.prototype.charAt", this.generateStringCharAt())
    this.stdlib.set("String.prototype.length", this.generateStringLength())

    // Array functions
    this.stdlib.set("Array.isArray", this.generateArrayIsArray())
    this.stdlib.set("Array.prototype.push", this.generateArrayPush())
    this.stdlib.set("Array.prototype.pop", this.generateArrayPop())
    this.stdlib.set("Array.prototype.length", this.generateArrayLength())

    // Object functions
    this.stdlib.set("Object.keys", this.generateObjectKeys())
    this.stdlib.set("Object.values", this.generateObjectValues())

    // Type conversion
    this.stdlib.set("Number", this.generateNumberConversion())
    this.stdlib.set("Boolean", this.generateBooleanConversion())
    this.stdlib.set("String", this.generateStringConversion())

    this.logger.debug(`Standard library initialized with ${this.stdlib.size} functions`)
  }

  /**
   * Gets a standard library function
   *
   * @param name - Function name
   * @returns Standard library function or undefined if not found
   */
  getFunction(name: string): StdlibFunction | undefined {
    return this.stdlib.get(name)
  }

  /**
   * Gets a standard library method
   *
   * @param name - Method name (object.method)
   * @returns Standard library function or undefined if not found
   */
  getMethod(name: string): StdlibFunction | undefined {
    return this.stdlib.get(name)
  }

  /**
   * Generates BrainForge code for console.log
   *
   * @returns Standard library function
   */
  private generateConsoleLog(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // If value is a string literal, output each character
        if (typeof value === "string") {
          let code = ""
          for (let i = 0; i < value.length; i++) {
            code += `[-]${"+".repeat(value.charCodeAt(i))}.`
          }
          return code
        }

        // If value is a variable, output its value
        const address = this.getVariableAddress(value)
        return `${address}.`
      },
      description: "Outputs values to the console",
    }
  }

  /**
   * Generates BrainForge code for console.error
   *
   * @returns Standard library function
   */
  private generateConsoleError(): StdlibFunction {
    // Similar to console.log but with error indicator
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // Output "ERROR: " prefix
        let code = ""
        const errorPrefix = "ERROR: "
        for (let i = 0; i < errorPrefix.length; i++) {
          code += `[-]${"+".repeat(errorPrefix.charCodeAt(i))}.`
        }

        // Then output the value
        if (typeof value === "string") {
          for (let i = 0; i < value.length; i++) {
            code += `[-]${"+".repeat(value.charCodeAt(i))}.`
          }
        } else {
          const address = this.getVariableAddress(value)
          code += `${address}.`
        }

        return code
      },
      description: "Outputs error messages to the console",
    }
  }

  /**
   * Generates BrainForge code for Math.abs
   *
   * @returns Standard library function
   */
  private generateMathAbs(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // If value is negative, negate it
        const address = this.getVariableAddress(value)
        return `${address}[->+<]>[[->+<]>-]<`
      },
      description: "Returns the absolute value of a number",
    }
  }

  /**
   * Generates BrainForge code for Math.min
   *
   * @returns Standard library function
   */
  private generateMathMin(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (a: any, b: any) => {
        // Compare a and b, return the smaller one
        const addressA = this.getVariableAddress(a)
        const addressB = this.getVariableAddress(b)
        return `${addressA}[${addressB}>[-<->]<[>]<[<]>]`
      },
      description: "Returns the smaller of two numbers",
    }
  }

  /**
   * Generates BrainForge code for Math.max
   *
   * @returns Standard library function
   */
  private generateMathMax(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (a: any, b: any) => {
        // Compare a and b, return the larger one
        const addressA = this.getVariableAddress(a)
        const addressB = this.getVariableAddress(b)
        return `${addressA}[${addressB}>[-<+>]<[>]<[<]>]`
      },
      description: "Returns the larger of two numbers",
    }
  }

  /**
   * Generates BrainForge code for Math.floor
   *
   * @returns Standard library function
   */
  private generateMathFloor(): StdlibFunction {
    // For integer values, floor is a no-op
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        const address = this.getVariableAddress(value)
        return address
      },
      description: "Returns the largest integer less than or equal to a number",
    }
  }

  /**
   * Generates BrainForge code for Math.ceil
   *
   * @returns Standard library function
   */
  private generateMathCeil(): StdlibFunction {
    // For integer values, ceil is a no-op
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        const address = this.getVariableAddress(value)
        return address
      },
      description: "Returns the smallest integer greater than or equal to a number",
    }
  }

  /**
   * Generates BrainForge code for Math.random
   *
   * @returns Standard library function
   */
  private generateMathRandom(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: () => {
        // Simple pseudo-random number generator
        return `[-]${"+".repeat(42)}[>++++++<-]>[<++++>-]<[>++++<-]>[<++>-]<.`
      },
      description: "Returns a pseudo-random number between 0 and 1",
    }
  }

  /**
   * Generates BrainForge code for String.fromCharCode
   *
   * @returns Standard library function
   */
  private generateStringFromCharCode(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (charCode: any) => {
        // Convert character code to character
        if (typeof charCode === "number") {
          return `[-]${"+".repeat(charCode)}.`
        }
        const address = this.getVariableAddress(charCode)
        return `${address}.`
      },
      description: "Returns a string created from the specified character code",
    }
  }

  /**
   * Generates BrainForge code for String.prototype.charAt
   *
   * @returns Standard library function
   */
  private generateStringCharAt(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (str: any, index: any) => {
        // Get character at index
        let indexValue = 0
        if (typeof index === "number") {
          indexValue = index
        }

        const address = this.getVariableAddress(str)
        return `${address}>${">".repeat(indexValue)}<.`
      },
      description: "Returns the character at the specified index",
    }
  }

  /**
   * Generates BrainForge code for String.prototype.length
   *
   * @returns Standard library function
   */
  private generateStringLength(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (str: any) => {
        // Count characters until null terminator
        const address = this.getVariableAddress(str)
        return `${address}[>]<[<]>`
      },
      description: "Returns the length of a string",
    }
  }

  /**
   * Generates BrainForge code for Array.isArray
   *
   * @returns Standard library function
   */
  private generateArrayIsArray(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // Check if value is an array (has array marker)
        const address = this.getVariableAddress(value)
        return `${address}[-]>[-]<`
      },
      description: "Determines whether the passed value is an Array",
    }
  }

  /**
   * Generates BrainForge code for Array.prototype.push
   *
   * @returns Standard library function
   */
  private generateArrayPush(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (array: any, value: any) => {
        // Add element to end of array
        const arrayAddress = this.getVariableAddress(array)
        const valueCode = this.getVariableValue(value)
        return `${arrayAddress}[>]>[-]${valueCode}<[<]`
      },
      description: "Adds one or more elements to the end of an array",
    }
  }

  /**
   * Generates BrainForge code for Array.prototype.pop
   *
   * @returns Standard library function
   */
  private generateArrayPop(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (array: any) => {
        // Remove last element from array
        const arrayAddress = this.getVariableAddress(array)
        return `${arrayAddress}[>]<[[-]<]`
      },
      description: "Removes the last element from an array",
    }
  }

  /**
   * Generates BrainForge code for Array.prototype.length
   *
   * @returns Standard library function
   */
  private generateArrayLength(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (array: any) => {
        // Get array length
        const arrayAddress = this.getVariableAddress(array)
        return `${arrayAddress}`
      },
      description: "Returns the number of elements in an array",
    }
  }

  /**
   * Generates BrainForge code for Object.keys
   *
   * @returns Standard library function
   */
  private generateObjectKeys(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (obj: any) => {
        // Create array of object keys
        const objAddress = this.getVariableAddress(obj)
        return `${objAddress}>[[>]<[<]>>[>]]`
      },
      description: "Returns an array of a given object's property names",
    }
  }

  /**
   * Generates BrainForge code for Object.values
   *
   * @returns Standard library function
   */
  private generateObjectValues(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (obj: any) => {
        // Create array of object values
        const objAddress = this.getVariableAddress(obj)
        return `${objAddress}>[[>]<[<]>>>[>]]`
      },
      description: "Returns an array of a given object's property values",
    }
  }

  /**
   * Generates BrainForge code for Number conversion
   *
   * @returns Standard library function
   */
  private generateNumberConversion(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // Convert value to number
        if (typeof value === "string") {
          // Parse string to number (simplified)
          const address = this.getVariableAddress(value)
          return `${address}[>++++++[-<-------->]<-]`
        }
        const address = this.getVariableAddress(value)
        return address
      },
      description: "Converts a value to a number",
    }
  }

  /**
   * Generates BrainForge code for Boolean conversion
   *
   * @returns Standard library function
   */
  private generateBooleanConversion(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // Convert value to boolean
        const address = this.getVariableAddress(value)
        return `${address}[[-]>+<]>`
      },
      description: "Converts a value to a boolean",
    }
  }

  /**
   * Generates BrainForge code for String conversion
   *
   * @returns Standard library function
   */
  private generateStringConversion(): StdlibFunction {
    return {
      id: this.nextFunctionId++,
      code: (value: any) => {
        // Convert value to string
        if (typeof value === "number") {
          // Convert number to ASCII digits (simplified)
          let code = ""
          const strValue = value.toString()
          for (let i = 0; i < strValue.length; i++) {
            code += `[-]${"+".repeat(strValue.charCodeAt(i))}>`
          }
          code += "[-]" // Null terminator
          return code
        }
        const address = this.getVariableAddress(value)
        return address
      },
      description: "Converts a value to a string",
    }
  }

  /**
   * Helper method to get the memory address for a variable
   *
   * @param variable - Variable name or value
   * @returns BrainForge code to access the variable
   */
  private getVariableAddress(variable: any): string {
    if (typeof variable === "string") {
      // Look up variable in memory map
      const address = this.memoryManager.getMemoryAddress(variable)
      if (address !== undefined) {
        return `${">".repeat(address)}`
      }

      // Variable not found, allocate new memory
      const newAddress = this.memoryManager.allocateMemory(variable, 1)
      return `${">".repeat(newAddress)}`
    }

    // For literals, return a temporary address
    return `[-]`
  }

  /**
   * Helper method to get the value of a variable or literal
   *
   * @param value - Variable name or literal value
   * @returns BrainForge code to set the value
   */
  private getVariableValue(value: any): string {
    if (typeof value === "number") {
      return `${"+".repeat(value % 256)}`
    } else if (typeof value === "string" && this.memoryManager.getMemoryAddress(value) !== undefined) {
      // Copy value from variable
      const address = this.memoryManager.getMemoryAddress(value)!
      return `${">".repeat(address)}[-<+>]<`
    } else if (typeof value === "string") {
      // String literal
      let code = ""
      for (let i = 0; i < value.length; i++) {
        code += `[-]${"+".repeat(value.charCodeAt(i))}>`
      }
      code += "[-]<" // Null terminator
      return code
    } else if (typeof value === "boolean") {
      return value ? "+" : ""
    }

    // Default
    return ""
  }

  /**
   * Updates standard library manager options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options

    // Reinitialize standard library if needed
    if (this.options.includeStdlib && this.stdlib.size === 0) {
      this.initializeStdlib()
    }
  }
}

