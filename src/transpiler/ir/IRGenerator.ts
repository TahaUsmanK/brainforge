/**
 * Intermediate Representation (IR) Generator
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import type { MemoryManager } from "../memory/MemoryManager"
import type { StdlibManager } from "../stdlib/StdlibManager"
import type { Program } from "../../types/ast"
import type { IntermediateRepresentation } from "../../types/results"
import { NodeType, InstructionType } from "../../types/enums"

/**
 * Generates Intermediate Representation (IR) from AST
 */
export class IRGenerator {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Memory manager */
  private memoryManager: MemoryManager

  /** Standard library manager */
  private stdlibManager: StdlibManager

  /** Current function being processed */
  private currentFunction: string | null = null

  /** Label counter for generating unique labels */
  private labelCounter = 0

  /**
   * Creates a new IR generator
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
   * Generates IR from AST
   *
   * @param ast - Abstract Syntax Tree
   * @returns Intermediate Representation
   */
  generateIR(ast: Program): IntermediateRepresentation {
    this.logger.debug("Generating intermediate representation")

    // Initialize IR structure
    const ir: IntermediateRepresentation = {
      variables: new Map(),
      functions: new Map(),
      imports: new Map(),
      exports: new Set(),
      instructions: [],
    }

    // Reset state
    this.currentFunction = null
    this.labelCounter = 0

    // Process AST nodes
    this.processNodes(ast.body, ir)

    this.logger.debug("IR generation complete")
    return ir
  }

  /**
   * Processes AST nodes to generate IR
   *
   * @param nodes - AST nodes to process
   * @param ir - Intermediate Representation to update
   */
  private processNodes(nodes: any[], ir: IntermediateRepresentation): void {
    for (const node of nodes) {
      switch (node.type) {
        case NodeType.VARIABLE_DECLARATION:
          this.processVariableDeclaration(node, ir)
          break

        case NodeType.FUNCTION_DECLARATION:
          this.processFunctionDeclaration(node, ir)
          break

        case NodeType.EXPRESSION_STATEMENT:
          this.processExpressionStatement(node, ir)
          break

        case NodeType.IF_STATEMENT:
          this.processIfStatement(node, ir)
          break

        case NodeType.FOR_STATEMENT:
          this.processForStatement(node, ir)
          break

        case NodeType.RETURN_STATEMENT:
          this.processReturnStatement(node, ir)
          break

        default:
          this.logger.warn(`Unhandled node type: ${node.type}`)
          break
      }
    }
  }

  /**
   * Processes variable declarations
   *
   * @param node - Variable declaration node
   * @param ir - Intermediate Representation to update
   */
  private processVariableDeclaration(node: any, ir: IntermediateRepresentation): void {
    for (const decl of node.declarations) {
      const varName = decl.id.name
      const address = this.memoryManager.allocateMemory(varName)
      ir.variables.set(varName, { address, kind: node.kind })

      // Add initialization instruction
      if (decl.init) {
        if (decl.init.type === NodeType.LITERAL) {
          ir.instructions.push({
            type: InstructionType.SET_VALUE,
            target: address,
            value: decl.init.value,
            valueType: typeof decl.init.value,
          })
        } else if (decl.init.type === NodeType.IDENTIFIER) {
          const sourceVar = decl.init.name
          const sourceInfo = ir.variables.get(sourceVar)

          if (sourceInfo) {
            ir.instructions.push({
              type: InstructionType.COPY_VALUE,
              source: sourceInfo.address,
              target: address,
            })
          }
        } else if (decl.init.type === NodeType.BINARY_EXPRESSION) {
          this.processBinaryExpression(decl.init, ir, address)
        } else if (decl.init.type === NodeType.ARRAY_EXPRESSION) {
          this.processArrayExpression(decl.init, ir, address)
        }
      }
    }
  }

  /**
   * Processes function declarations
   *
   * @param node - Function declaration node
   * @param ir - Intermediate Representation to update
   */
  private processFunctionDeclaration(node: any, ir: IntermediateRepresentation): void {
    const funcName = node.id.name
    const params = node.params.map((p: any) => p.name)
    const funcId = ir.functions.size + 1

    ir.functions.set(funcName, {
      id: funcId,
      params,
      body: node.body.body,
      localVars: new Map(),
    })

    // Allocate memory for function reference
    const address = this.memoryManager.allocateMemory(funcName)
    ir.variables.set(funcName, { address, kind: "function" })

    ir.instructions.push({
      type: InstructionType.SET_VALUE,
      target: address,
      value: funcId,
      valueType: "function",
    })
  }

  /**
   * Processes expression statements
   *
   * @param node - Expression statement node
   * @param ir - Intermediate Representation to update
   */
  private processExpressionStatement(node: any, ir: IntermediateRepresentation): void {
    const expr = node.expression

    if (expr.type === NodeType.CALL_EXPRESSION) {
      this.processCallExpression(expr, ir)
    } else if (expr.type === NodeType.ASSIGNMENT_EXPRESSION) {
      this.processAssignmentExpression(expr, ir)
    } else if (expr.type === NodeType.UPDATE_EXPRESSION) {
      this.processUpdateExpression(expr, ir)
    }
  }

  /**
   * Processes if statements
   *
   * @param node - If statement node
   * @param ir - Intermediate Representation to update
   */
  private processIfStatement(node: any, ir: IntermediateRepresentation): void {
    // Generate unique labels for the if statement
    const thenLabel = `if_then_${this.labelCounter}`
    const elseLabel = `if_else_${this.labelCounter}`
    const endLabel = `if_end_${this.labelCounter}`
    this.labelCounter++

    // Process the test condition
    const testResult = this.processExpression(node.test, ir)

    // Add conditional jump
    ir.instructions.push({
      type: InstructionType.IF_CONDITION,
      testAddress: testResult.address,
      testValue: testResult.value,
      thenLabel,
      elseLabel: node.alternate ? elseLabel : endLabel,
    })

    // Add then label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: thenLabel,
    })

    // Process then block
    if (node.consequent.type === NodeType.BLOCK_STATEMENT) {
      this.processNodes(node.consequent.body, ir)
    } else {
      this.processNodes([node.consequent], ir)
    }

    // Jump to end after then block
    if (node.alternate) {
      ir.instructions.push({
        type: InstructionType.JUMP,
        target: endLabel,
      })
    }

    // Add else label and process else block if it exists
    if (node.alternate) {
      ir.instructions.push({
        type: InstructionType.LABEL,
        name: elseLabel,
      })

      if (node.alternate.type === NodeType.BLOCK_STATEMENT) {
        this.processNodes(node.alternate.body, ir)
      } else {
        this.processNodes([node.alternate], ir)
      }
    }

    // Add end label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: endLabel,
    })
  }

  /**
   * Processes for statements
   *
   * @param node - For statement node
   * @param ir - Intermediate Representation to update
   */
  private processForStatement(node: any, ir: IntermediateRepresentation): void {
    // Generate unique labels for the for loop
    const initLabel = `for_init_${this.labelCounter}`
    const testLabel = `for_test_${this.labelCounter}`
    const bodyLabel = `for_body_${this.labelCounter}`
    const updateLabel = `for_update_${this.labelCounter}`
    const endLabel = `for_end_${this.labelCounter}`
    this.labelCounter++

    // Add initialization label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: initLabel,
    })

    // Process initialization
    if (node.init) {
      if (node.init.type === NodeType.VARIABLE_DECLARATION) {
        this.processVariableDeclaration(node.init, ir)
      } else if (node.init.type === NodeType.EXPRESSION_STATEMENT) {
        this.processExpressionStatement(node.init, ir)
      } else if (node.init.type === NodeType.ASSIGNMENT_EXPRESSION) {
        this.processAssignmentExpression(node.init, ir)
      }
    }

    // Add test label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: testLabel,
    })

   
    // Process body
    if (node.body.type === NodeType.BLOCK_STATEMENT) {
      this.processNodes(node.body.body, ir)
    } else {
      this.processNodes([node.body], ir)
    }

    // Add update label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: updateLabel,
    })

    // Process update
    if (node.update) {
      if (node.update.type === NodeType.UPDATE_EXPRESSION) {
        this.processUpdateExpression(node.update, ir)
      } else if (node.update.type === NodeType.ASSIGNMENT_EXPRESSION) {
        this.processAssignmentExpression(node.update, ir)
      }
    }

    // Jump back to test
    ir.instructions.push({
      type: InstructionType.JUMP,
      target: testLabel,
    })

    // Add end label
    ir.instructions.push({
      type: InstructionType.LABEL,
      name: endLabel,
    })
  }

  /**
   * Processes return statements
   *
   * @param node - Return statement node
   * @param ir - Intermediate Representation to update
   */
  private processReturnStatement(node: any, ir: IntermediateRepresentation): void {
    if (node.argument) {
      const result = this.processExpression(node.argument, ir)
      ir.instructions.push({
        type: InstructionType.RETURN,
        address: result.address,
        value: result.value,
      })
    } else {
      ir.instructions.push({
        type: InstructionType.RETURN,
      })
    }
  }

  /**
   * Processes call expressions
   *
   * @param node - Call expression node
   * @param ir - Intermediate Representation to update
   * @param resultAddress - Address to store the result (optional)
   */
  private processCallExpression(node: any, ir: IntermediateRepresentation, resultAddress?: number): void {
    const args: any[] = []

    // Process arguments
    for (const arg of node.arguments) {
      if (arg.type === NodeType.LITERAL) {
        args.push({
          type: "Literal",
          value: arg.value,
        })
      } else if (arg.type === NodeType.IDENTIFIER) {
        const varInfo = ir.variables.get(arg.name)
        if (varInfo) {
          args.push({
            type: "Variable",
            name: arg.name,
            address: varInfo.address,
          })
        } else {
          args.push({
            type: "Unknown",
            name: arg.name,
          })
        }
      } else if (arg.type === NodeType.BINARY_EXPRESSION) {
        const result = this.processBinaryExpression(arg, ir)
        args.push({
          type: "Variable",
          name: `temp_${this.labelCounter++}`,
          address: result,
        })
      }
    }

    // Handle different types of call expressions
    if (node.callee.type === NodeType.IDENTIFIER) {
      // Direct function call
      const funcName = node.callee.name

      ir.instructions.push({
        type: InstructionType.CALL_FUNCTION,
        function: funcName,
        arguments: args,
        result: resultAddress,
      })
    } else if (node.callee.type === NodeType.MEMBER_EXPRESSION) {
      // Method call or property access
      const object = node.callee.object.name
      const property = node.callee.property.name

      // Special handling for console.log
      if (object === "console" && property === "log") {
        ir.instructions.push({
          type: "ConsoleLog",
          args: args,
        })
      } else {
        ir.instructions.push({
          type: InstructionType.CALL_METHOD,
          object,
          method: property,
          arguments: args,
          result: resultAddress,
        })
      }
    }
  }

  /**
   * Processes assignment expressions
   *
   * @param node - Assignment expression node
   * @param ir - Intermediate Representation to update
   */
  private processAssignmentExpression(node: any, ir: IntermediateRepresentation): void {
    const leftName = node.left.name
    let targetAddress

    // Check if variable exists
    if (ir.variables.has(leftName)) {
      targetAddress = ir.variables.get(leftName)!.address
    } else {
      // Implicitly declare variable
      targetAddress = this.memoryManager.allocateMemory(leftName)
      ir.variables.set(leftName, { address: targetAddress, kind: "var" })
    }

    // Process right side
    if (node.right.type === NodeType.LITERAL) {
      ir.instructions.push({
        type: InstructionType.SET_VALUE,
        target: targetAddress,
        value: node.right.value,
        valueType: typeof node.right.value,
      })
    } else if (node.right.type === NodeType.IDENTIFIER) {
      const rightName = node.right.name
      if (ir.variables.has(rightName)) {
        const sourceAddress = ir.variables.get(rightName)!.address
        ir.instructions.push({
          type: InstructionType.COPY_VALUE,
          source: sourceAddress,
          target: targetAddress,
        })
      }
    } else if (node.right.type === NodeType.CALL_EXPRESSION) {
      this.processCallExpression(node.right, ir, targetAddress)
    } else if (node.right.type === NodeType.BINARY_EXPRESSION) {
      this.processBinaryExpression(node.right, ir, targetAddress)
    } else if (node.right.type === NodeType.ARRAY_EXPRESSION) {
      this.processArrayExpression(node.right, ir, targetAddress)
    }
  }

  /**
   * Processes update expressions
   *
   * @param node - Update expression node
   * @param ir - Intermediate Representation to update
   */
  private processUpdateExpression(node: any, ir: IntermediateRepresentation): void {
    const argName = node.argument.name

    if (ir.variables.has(argName)) {
      const address = ir.variables.get(argName)!.address

      ir.instructions.push({
        type: InstructionType.UPDATE_VARIABLE,
        address,
        operator: node.operator,
      })
    }
  }

  /**
   * Processes binary expressions
   *
   * @param node - Binary expression node
   * @param ir - Intermediate Representation to update
   * @param resultAddress - Address to store the result (optional)
   * @returns Address of the result
   */
  private processBinaryExpression(node: any, ir: IntermediateRepresentation, resultAddress?: number): number {
    let leftAddress, leftValue
    let rightAddress, rightValue

    // Process left operand
    if (node.left.type === NodeType.IDENTIFIER) {
      const leftName = node.left.name
      if (ir.variables.has(leftName)) {
        leftAddress = ir.variables.get(leftName)!.address
      }
    } else if (node.left.type === NodeType.LITERAL) {
      leftValue = node.left.value
    } else if (node.left.type === NodeType.BINARY_EXPRESSION) {
      leftAddress = this.processBinaryExpression(node.left, ir)
    }

    // Process right operand
    if (node.right.type === NodeType.IDENTIFIER) {
      const rightName = node.right.name
      if (ir.variables.has(rightName)) {
        rightAddress = ir.variables.get(rightName)!.address
      }
    } else if (node.right.type === NodeType.LITERAL) {
      rightValue = node.right.value
    } else if (node.right.type === NodeType.BINARY_EXPRESSION) {
      rightAddress = this.processBinaryExpression(node.right, ir)
    }

    // Allocate memory for result if not provided
    if (resultAddress === undefined) {
      resultAddress = this.memoryManager.allocateMemory(`temp_${this.labelCounter++}`)
    }

    // Add binary operation instruction
    ir.instructions.push({
      type: InstructionType.BINARY_OPERATION,
      operator: node.operator,
      leftAddress,
      leftValue,
      rightAddress,
      rightValue,
      result: resultAddress,
    })

    return resultAddress
  }

  /**
   * Processes array expressions
   *
   * @param node - Array expression node
   * @param ir - Intermediate Representation to update
   * @param resultAddress - Address to store the result (optional)
   * @returns Address of the result
   */
  private processArrayExpression(node: any, ir: IntermediateRepresentation, resultAddress?: number): number {
    const elements = []

    // Process array elements
    for (const element of node.elements) {
      if (element === null) {
        elements.push({ type: "Literal", value: null })
      } else if (element.type === NodeType.LITERAL) {
        elements.push({ type: "Literal", value: element.value })
      } else if (element.type === NodeType.IDENTIFIER) {
        const varInfo = ir.variables.get(element.name)
        if (varInfo) {
          elements.push({ type: "Variable", name: element.name, address: varInfo.address })
        } else {
          elements.push({ type: "Unknown", name: element.name })
        }
      } else if (element.type === NodeType.BINARY_EXPRESSION) {
        const address = this.processBinaryExpression(element, ir)
        elements.push({ type: "Variable", name: `temp_${this.labelCounter - 1}`, address })
      }
    }

    // Allocate memory for result if not provided
    if (resultAddress === undefined) {
      resultAddress = this.memoryManager.allocateMemory(`array_${this.labelCounter++}`)
    }

    // Add create array instruction
    ir.instructions.push({
      type: InstructionType.CREATE_ARRAY,
      elements,
      result: resultAddress,
    })

    return resultAddress
  }

  /**
   * Processes an expression and returns its result
   *
   * @param node - Expression node
   * @param ir - Intermediate Representation to update
   * @returns Result of the expression
   */
  private processExpression(node: any, ir: IntermediateRepresentation): { address?: number; value?: any } {
    if (node.type === NodeType.LITERAL) {
      return { value: node.value }
    } else if (node.type === NodeType.IDENTIFIER) {
      const varInfo = ir.variables.get(node.name)
      if (varInfo) {
        return { address: varInfo.address }
      }
      return {}
    } else if (node.type === NodeType.BINARY_EXPRESSION) {
      const address = this.processBinaryExpression(node, ir)
      return { address }
    } else if (node.type === NodeType.LOGICAL_EXPRESSION) {
      // For simplicity, treat logical expressions similar to binary expressions
      const address = this.processBinaryExpression(node, ir)
      return { address }
    }

    return {}
  }

  /**
   * Updates IR generator options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options
  }
}

