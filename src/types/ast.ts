/**
 * Abstract Syntax Tree (AST) type definitions
 */
import type { NodeType } from "./enums"

/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
  /** Type of the AST node */
  type: NodeType

  /** Source location information (optional) */
  loc?: SourceLocation
}

/**
 * Source location information for AST nodes
 */
export interface SourceLocation {
  /** Start position in the source code */
  start: Position

  /** End position in the source code */
  end: Position

  /** Source file information */
  source?: string
}

/**
 * Position in the source code
 */
export interface Position {
  /** Line number (1-based) */
  line: number

  /** Column number (0-based) */
  column: number
}

/**
 * Program node - the root of the AST
 */
export interface Program extends ASTNode {
  type: NodeType.PROGRAM

  /** Program body containing statements */
  body: Statement[]

  /** Source type (script or module) */
  sourceType: "script" | "module"
}

/**
 * Base interface for all statement nodes
 */
export interface Statement extends ASTNode {
  // Common properties for all statements
}

/**
 * Block statement containing multiple statements
 */
export interface BlockStatement extends Statement {
  type: NodeType.BLOCK_STATEMENT

  /** Statements in the block */
  body: Statement[]
}

/**
 * Variable declaration statement
 */
export interface VariableDeclaration extends Statement {
  type: NodeType.VARIABLE_DECLARATION

  /** Variable declaration kind (var, let, const) */
  kind: "var" | "let" | "const"

  /** Variable declarators */
  declarations: VariableDeclarator[]
}

/**
 * Variable declarator (part of variable declaration)
 */
export interface VariableDeclarator {
  /** Variable identifier */
  id: Identifier

  /** Initial value (optional) */
  init: Expression | null
}

/**
 * Function declaration statement
 */
export interface FunctionDeclaration extends Statement {
  type: NodeType.FUNCTION_DECLARATION

  /** Function name */
  id: Identifier

  /** Function parameters */
  params: Identifier[]

  /** Function body */
  body: BlockStatement
}

/**
 * Class declaration statement
 */
export interface ClassDeclaration extends Statement {
  type: NodeType.CLASS_DECLARATION

  /** Class name */
  id: Identifier

  /** Class body */
  body: ClassBody
}

/**
 * Class body containing methods and properties
 */
export interface ClassBody {
  /** Class methods and properties */
  body: ClassMember[]
}

/**
 * Class member (method or property)
 */
export interface ClassMember {
  /** Member type */
  type: string

  /** Member key (name) */
  key: Identifier

  /** Whether the member is static */
  static: boolean
}

/**
 * Expression statement
 */
export interface ExpressionStatement extends Statement {
  type: NodeType.EXPRESSION_STATEMENT

  /** Expression */
  expression: Expression
}

/**
 * If statement
 */
export interface IfStatement extends Statement {
  type: NodeType.IF_STATEMENT

  /** Test condition */
  test: Expression

  /** Consequent block (if condition is true) */
  consequent: Statement

  /** Alternate block (if condition is false) - optional */
  alternate: Statement | null
}

/**
 * For statement
 */
export interface ForStatement extends Statement {
  type: NodeType.FOR_STATEMENT

  /** Initialization expression */
  init: VariableDeclaration | Expression | null

  /** Test condition */
  test: Expression | null

  /** Update expression */
  update: Expression | null

  /** Loop body */
  body: Statement
}

/**
 * While statement
 */
export interface WhileStatement extends Statement {
  type: NodeType.WHILE_STATEMENT

  /** Test condition */
  test: Expression

  /** Loop body */
  body: Statement
}

/**
 * Return statement
 */
export interface ReturnStatement extends Statement {
  type: NodeType.RETURN_STATEMENT

  /** Return value (optional) */
  argument: Expression | null
}

/**
 * Import declaration
 */
export interface ImportDeclaration extends Statement {
  type: NodeType.IMPORT_DECLARATION

  /** Import specifiers */
  specifiers: ImportSpecifier[]

  /** Source module */
  source: Literal
}

/**
 * Import specifier
 */
export interface ImportSpecifier {
  /** Type of import specifier */
  type: "ImportSpecifier" | "ImportDefaultSpecifier" | "ImportNamespaceSpecifier"

  /** Imported identifier */
  imported?: Identifier

  /** Local identifier */
  local: Identifier
}

/**
 * Export declaration
 */
export interface ExportDeclaration extends Statement {
  type: NodeType.EXPORT_DECLARATION

  /** Exported declaration */
  declaration: Statement | null

  /** Export specifiers */
  specifiers: ExportSpecifier[]

  /** Source module (for re-exports) */
  source: Literal | null
}

/**
 * Export specifier
 */
export interface ExportSpecifier {
  /** Exported identifier */
  exported: Identifier

  /** Local identifier */
  local: Identifier
}

/**
 * Base interface for all expression nodes
 */
export interface Expression extends ASTNode {
  // Common properties for all expressions
}

/**
 * Identifier expression
 */
export interface Identifier extends Expression {
  type: NodeType.IDENTIFIER

  /** Identifier name */
  name: string
}

/**
 * Literal expression
 */
export interface Literal extends Expression {
  type: NodeType.LITERAL

  /** Literal value */
  value: string | number | boolean | null | RegExp

  /** Raw source code representation */
  raw?: string
}

/**
 * Binary expression
 */
export interface BinaryExpression extends Expression {
  type: NodeType.BINARY_EXPRESSION

  /** Operator */
  operator: string

  /** Left operand */
  left: Expression

  /** Right operand */
  right: Expression
}

/**
 * Call expression
 */
export interface CallExpression extends Expression {
  type: NodeType.CALL_EXPRESSION

  /** Callee (function being called) */
  callee: Expression

  /** Arguments */
  arguments: Expression[]
}

/**
 * Member expression (property access)
 */
export interface MemberExpression extends Expression {
  type: NodeType.MEMBER_EXPRESSION

  /** Object being accessed */
  object: Expression

  /** Property being accessed */
  property: Expression

  /** Whether the property is computed (obj[prop] vs obj.prop) */
  computed: boolean
}

/**
 * Assignment expression
 */
export interface AssignmentExpression extends Expression {
  type: NodeType.ASSIGNMENT_EXPRESSION

  /** Assignment operator */
  operator: string

  /** Left-hand side (target) */
  left: Expression

  /** Right-hand side (value) */
  right: Expression
}

/**
 * Array expression
 */
export interface ArrayExpression extends Expression {
  type: NodeType.ARRAY_EXPRESSION

  /** Array elements */
  elements: (Expression | null)[]
}

/**
 * Object expression
 */
export interface ObjectExpression extends Expression {
  type: NodeType.OBJECT_EXPRESSION

  /** Object properties */
  properties: Property[]
}

/**
 * Object property
 */
export interface Property {
  /** Property key */
  key: Expression

  /** Property value */
  value: Expression

  /** Property kind (init, get, set) */
  kind: "init" | "get" | "set"

  /** Whether the key is computed */
  computed: boolean

  /** Whether it's a shorthand property */
  shorthand: boolean
}

