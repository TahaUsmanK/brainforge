/**
 * Parser for converting source code to an Abstract Syntax Tree (AST)
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import { NodeType } from "../../types/enums"
import type { Program, Statement, Expression } from "../../types/ast"

/**
 * Parser for converting source code to an Abstract Syntax Tree (AST)
 */
export class Parser {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Warnings generated during parsing */
  private warnings: string[] = []

  /** Current AST node ID counter */
  private nodeId = 0

  /**
   * Creates a new parser
   *
   * @param options - Transpiler options
   * @param logger - Logger instance
   */
  constructor(options: TranspilerOptions, logger: Logger) {
    this.options = options
    this.logger = logger
  }

  /**
   * Parses source code into an AST
   *
   * @param sourceCode - Source code to parse
   * @returns Abstract Syntax Tree
   */
  parse(sourceCode: string): Program {
    this.logger.debug("Parsing source code")
    this.warnings = []
    this.nodeId = 0

    try {
      // In a real implementation, we would use a proper JavaScript parser
      // For now, we'll implement a basic parser for simple JavaScript code

      // Create a basic AST structure
      const ast: Program = {
        type: NodeType.PROGRAM,
        body: [],
        sourceType: "script",
      }

      // Split code into lines for simplified parsing
      const lines = sourceCode.split("\n")
      let lineIndex = 0

      while (lineIndex < lines.length) {
        const line = lines[lineIndex].trim()
        lineIndex++

        // Skip empty lines and comments
        if (!line || line.startsWith("//")) {
          continue
        }

        // Variable declarations
        if (line.match(/^(var|let|const)\s+/)) {
          const declarationMatch = line.match(/^(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+?);?$/)
          if (declarationMatch) {
            const [, kind, name, init] = declarationMatch
            ast.body.push({
              type: NodeType.VARIABLE_DECLARATION,
              kind: kind as "var" | "let" | "const",
              declarations: [
                {
                  type: "VariableDeclarator",
                  id: { type: NodeType.IDENTIFIER, name },
                  init: this.parseExpression(init),
                },
              ],
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse variable declaration: ${line}`)
          }
        }
        // Console.log statements
        else if (line.match(/^console\.log\(/)) {
          const logMatch = line.match(/^console\.log$$(.*)$$;?$/)
          if (logMatch) {
            const args = this.parseArguments(logMatch[1])
            ast.body.push({
              type: NodeType.EXPRESSION_STATEMENT,
              expression: {
                type: NodeType.CALL_EXPRESSION,
                callee: {
                  type: NodeType.MEMBER_EXPRESSION,
                  object: { type: NodeType.IDENTIFIER, name: "console" },
                  property: { type: NodeType.IDENTIFIER, name: "log" },
                  computed: false,
                },
                arguments: args,
              },
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse console.log statement: ${line}`)
          }
        }
        // Assignment expressions
        else if (line.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=/)) {
          const assignmentMatch = line.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+?);?$/)
          if (assignmentMatch) {
            const [, name, value] = assignmentMatch
            ast.body.push({
              type: NodeType.EXPRESSION_STATEMENT,
              expression: {
                type: NodeType.ASSIGNMENT_EXPRESSION,
                operator: "=",
                left: { type: NodeType.IDENTIFIER, name },
                right: this.parseExpression(value),
              },
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse assignment: ${line}`)
          }
        }
        // Function declarations
        else if (line.match(/^function\s+/)) {
          const funcMatch = line.match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*$$(.*?)$$\s*\{/)
          if (funcMatch) {
            const [, name, params] = funcMatch
            const paramList = params
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)

            // Find the function body
            let braceCount = 1
            const bodyLines = []

            while (lineIndex < lines.length && braceCount > 0) {
              const bodyLine = lines[lineIndex]
              lineIndex++

              braceCount += (bodyLine.match(/\{/g) || []).length
              braceCount -= (bodyLine.match(/\}/g) || []).length

              if (braceCount > 0) {
                bodyLines.push(bodyLine)
              }
            }

            // Parse the function body
            const functionBody = this.parseBlock(bodyLines.join("\n"))

            ast.body.push({
              type: NodeType.FUNCTION_DECLARATION,
              id: { type: NodeType.IDENTIFIER, name },
              params: paramList.map((param) => ({ type: NodeType.IDENTIFIER, name: param })),
              body: {
                type: NodeType.BLOCK_STATEMENT,
                body: functionBody,
              },
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse function declaration: ${line}`)
          }
        }
        // If statements
        else if (line.match(/^if\s*\(/)) {
          const ifMatch = line.match(/^if\s*$$(.*?)$$\s*\{/)
          if (ifMatch) {
            const [, condition] = ifMatch

            // Find the if body
            let braceCount = 1
            const bodyLines = []

            while (lineIndex < lines.length && braceCount > 0) {
              const bodyLine = lines[lineIndex]
              lineIndex++

              braceCount += (bodyLine.match(/\{/g) || []).length
              braceCount -= (bodyLine.match(/\}/g) || []).length

              if (braceCount > 0) {
                bodyLines.push(bodyLine)
              }
            }

            // Check for else
            let elseBody = null
            if (lineIndex < lines.length && lines[lineIndex].trim().startsWith("else")) {
              lineIndex++

              if (lines[lineIndex - 1].trim().match(/else\s*\{/)) {
                braceCount = 1
                const elseBodyLines = []

                while (lineIndex < lines.length && braceCount > 0) {
                  const bodyLine = lines[lineIndex]
                  lineIndex++

                  braceCount += (bodyLine.match(/\{/g) || []).length
                  braceCount -= (bodyLine.match(/\}/g) || []).length

                  if (braceCount > 0) {
                    elseBodyLines.push(bodyLine)
                  }
                }

                elseBody = {
                  type: NodeType.BLOCK_STATEMENT,
                  body: this.parseBlock(elseBodyLines.join("\n")),
                }
              }
            }

            // Parse the if body
            const ifBody = this.parseBlock(bodyLines.join("\n"))

            ast.body.push({
              type: NodeType.IF_STATEMENT,
              test: this.parseExpression(condition),
              consequent: {
                type: NodeType.BLOCK_STATEMENT,
                body: ifBody,
              },
              alternate: elseBody,
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse if statement: ${line}`)
          }
        }
        // For loops
        else if (line.match(/^for\s*\(/)) {
          const forMatch = line.match(/^for\s*$$(.*?);(.*?);(.*?)$$\s*\{/)
          if (forMatch) {
            const [, init, test, update] = forMatch

            // Find the loop body
            let braceCount = 1
            const bodyLines = []

            while (lineIndex < lines.length && braceCount > 0) {
              const bodyLine = lines[lineIndex]
              lineIndex++

              braceCount += (bodyLine.match(/\{/g) || []).length
              braceCount -= (bodyLine.match(/\}/g) || []).length

              if (braceCount > 0) {
                bodyLines.push(bodyLine)
              }
            }

            // Parse the loop body
            const loopBody = this.parseBlock(bodyLines.join("\n"))

            // Parse initialization
            let initialization = null
            if (init.trim()) {
              if (init.trim().match(/^(var|let|const)\s+/)) {
                const initMatch = init.trim().match(/^(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/)
                if (initMatch) {
                  const [, kind, name, value] = initMatch
                  initialization = {
                    type: NodeType.VARIABLE_DECLARATION,
                    kind: kind as "var" | "let" | "const",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: { type: NodeType.IDENTIFIER, name },
                        init: this.parseExpression(value),
                      },
                    ],
                  }
                }
              } else {
                const assignMatch = init.trim().match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(.+)$/)
                if (assignMatch) {
                  const [, name, value] = assignMatch
                  initialization = {
                    type: NodeType.EXPRESSION_STATEMENT,
                    expression: {
                      type: NodeType.ASSIGNMENT_EXPRESSION,
                      operator: "=",
                      left: { type: NodeType.IDENTIFIER, name },
                      right: this.parseExpression(value),
                    },
                  }
                }
              }
            }

            // Parse test condition
            const testCondition = test.trim() ? this.parseExpression(test.trim()) : null

            // Parse update expression
            let updateExpression = null
            if (update.trim()) {
              const updateMatch = update.trim().match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)([+-]{2}|[+\-*/]=.+)$/)
              if (updateMatch) {
                const [, name, operator] = updateMatch
                if (operator === "++" || operator === "--") {
                  updateExpression = {
                    type: NodeType.UPDATE_EXPRESSION,
                    operator,
                    argument: { type: NodeType.IDENTIFIER, name },
                    prefix: false,
                  }
                } else {
                  const assignOp = operator.substring(0, 2)
                  const value = operator.substring(2)
                  updateExpression = {
                    type: NodeType.ASSIGNMENT_EXPRESSION,
                    operator: assignOp,
                    left: { type: NodeType.IDENTIFIER, name },
                    right: this.parseExpression(value),
                  }
                }
              }
            }

            ast.body.push({
              type: NodeType.FOR_STATEMENT,
              init: initialization,
              test: testCondition,
              update: updateExpression,
              body: {
                type: NodeType.BLOCK_STATEMENT,
                body: loopBody,
              },
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse for loop: ${line}`)
          }
        }
        // Function calls
        else if (line.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\(/)) {
          const callMatch = line.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)$$(.*)$$;?$/)
          if (callMatch) {
            const [, name, argsStr] = callMatch
            const args = this.parseArguments(argsStr)

            ast.body.push({
              type: NodeType.EXPRESSION_STATEMENT,
              expression: {
                type: NodeType.CALL_EXPRESSION,
                callee: { type: NodeType.IDENTIFIER, name },
                arguments: args,
              },
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse function call: ${line}`)
          }
        }
        // Return statements
        else if (line.match(/^return\s/)) {
          const returnMatch = line.match(/^return\s+(.+?);?$/)
          if (returnMatch) {
            const [, value] = returnMatch
            ast.body.push({
              type: NodeType.RETURN_STATEMENT,
              argument: this.parseExpression(value),
            } as Statement)
          } else if (line.match(/^return;?$/)) {
            ast.body.push({
              type: NodeType.RETURN_STATEMENT,
              argument: null,
            } as Statement)
          } else {
            this.warnings.push(`Failed to parse return statement: ${line}`)
          }
        }
        // Other statement types would be handled here...
        else {
          this.warnings.push(`Unsupported syntax: ${line}`)
        }
      }

      this.logger.debug("Parsing completed successfully")
      return ast
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`Parsing error: ${errorMessage}`)
      throw new Error(`Parsing error: ${errorMessage}`)
    }
  }

  /**
   * Parses function arguments
   *
   * @param argsStr - Arguments string
   * @returns Array of argument expressions
   */
  private parseArguments(argsStr: string): Expression[] {
    if (!argsStr.trim()) {
      return []
    }

    // Handle string literals with commas inside them
    const args: Expression[] = []
    let currentArg = ""
    let inString = false
    let stringChar = ""

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i]

      if ((char === '"' || char === "'") && (i === 0 || argsStr[i - 1] !== "\\")) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (char === stringChar) {
          inString = false
        }
        currentArg += char
      } else if (char === "," && !inString) {
        args.push(this.parseExpression(currentArg.trim()))
        currentArg = ""
      } else {
        currentArg += char
      }
    }

    if (currentArg.trim()) {
      args.push(this.parseExpression(currentArg.trim()))
    }

    return args
  }

  /**
   * Parses a block of code
   *
   * @param code - Block of code to parse
   * @returns Array of statements
   */
  private parseBlock(code: string): Statement[] {
    // Use the main parse method to parse the block
    const blockProgram = this.parse(code)
    return blockProgram.body as Statement[]
  }

  /**
   * Parses an expression
   *
   * @param expr - Expression string to parse
   * @returns Expression AST node
   */
  private parseExpression(expr: string): Expression {
    if (!expr) {
      return { type: NodeType.LITERAL, value: null } as Expression
    }

    expr = expr.trim()

    // String literal
    if (/^["'].*["']$/.test(expr)) {
      const value = expr.substring(1, expr.length - 1)
      return { type: NodeType.LITERAL, value } as Expression
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return { type: NodeType.LITERAL, value: Number.parseFloat(expr) } as Expression
    }

    // Boolean literal
    if (expr === "true" || expr === "false") {
      return { type: NodeType.LITERAL, value: expr === "true" } as Expression
    }

    // Null literal
    if (expr === "null") {
      return { type: NodeType.LITERAL, value: null } as Expression
    }

    // Binary expressions
    const binaryOpMatch = expr.match(/^(.+?)\s*([+\-*/%<>=!&|]+)\s*(.+)$/)
    if (binaryOpMatch) {
      const [, left, operator, right] = binaryOpMatch

      // Handle comparison operators
      if (
        operator === "===" ||
        operator === "!==" ||
        operator === "==" ||
        operator === "!=" ||
        operator === "<" ||
        operator === ">" ||
        operator === "<=" ||
        operator === ">="
      ) {
        return {
          type: NodeType.BINARY_EXPRESSION,
          operator,
          left: this.parseExpression(left),
          right: this.parseExpression(right),
        } as Expression
      }

      // Handle arithmetic operators
      if (operator === "+" || operator === "-" || operator === "*" || operator === "/" || operator === "%") {
        return {
          type: NodeType.BINARY_EXPRESSION,
          operator,
          left: this.parseExpression(left),
          right: this.parseExpression(right),
        } as Expression
      }

      // Handle logical operators
      if (operator === "&&" || operator === "||") {
        return {
          type: NodeType.LOGICAL_EXPRESSION,
          operator,
          left: this.parseExpression(left),
          right: this.parseExpression(right),
        } as Expression
      }
    }

    // Function calls
    const callMatch = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)$$(.*)$$$/)
    if (callMatch) {
      const [, name, argsStr] = callMatch
      const args = this.parseArguments(argsStr)

      return {
        type: NodeType.CALL_EXPRESSION,
        callee: { type: NodeType.IDENTIFIER, name },
        arguments: args,
      } as Expression
    }

    // Member expressions (e.g., obj.prop)
    const memberMatch = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)\.([$a-zA-Z_][$a-zA-Z0-9_]*)$/)
    if (memberMatch) {
      const [, object, property] = memberMatch
      return {
        type: NodeType.MEMBER_EXPRESSION,
        object: { type: NodeType.IDENTIFIER, name: object },
        property: { type: NodeType.IDENTIFIER, name: property },
        computed: false,
      } as Expression
    }

    // Array expressions
    if (expr.startsWith("[") && expr.endsWith("]")) {
      const elementsStr = expr.substring(1, expr.length - 1)
      const elements = this.parseArguments(elementsStr)

      return {
        type: NodeType.ARRAY_EXPRESSION,
        elements,
      } as Expression
    }

    // Default to identifier
    return { type: NodeType.IDENTIFIER, name: expr } as Expression
  }

  /**
   * Gets warnings generated during parsing
   *
   * @returns Array of warning messages
   */
  getWarnings(): string[] {
    return [...this.warnings]
  }

  /**
   * Updates parser options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options
  }
}

