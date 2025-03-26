/**
 * Enumerations used throughout the BrainForge transpiler
 */

/**
 * Memory management strategies
 */
export enum MemoryModel {
  /**
   * Static memory allocation - fixed memory layout
   */
  STATIC = "static",

  /**
   * Dynamic memory allocation - memory allocated as needed
   */
  DYNAMIC = "dynamic",

  /**
   * Hybrid memory allocation - combines static and dynamic approaches
   */
  HYBRID = "hybrid",

  /**
   * Segmented memory allocation - memory divided into segments for different purposes
   */
  SEGMENTED = "segmented",
}

/**
 * Optimization levels for code generation
 */
export enum OptimizationLevel {
  /**
   * No optimizations
   */
  NONE = "0",

  /**
   * Basic optimizations (constant folding, dead code elimination)
   */
  BASIC = "1",

  /**
   * Balanced optimizations (basic + instruction combining, loop optimizations)
   */
  BALANCED = "2",

  /**
   * Aggressive optimizations (balanced + memory layout, function inlining, CSE)
   */
  AGGRESSIVE = "3",

  /**
   * Extreme optimizations (aggressive + register allocation, parallelization, specialization)
   */
  EXTREME = "4",
}

/**
 * Node types for the Abstract Syntax Tree
 */
export enum NodeType {
  // Program structure
  PROGRAM = "Program",
  BLOCK_STATEMENT = "BlockStatement",

  // Declarations
  VARIABLE_DECLARATION = "VariableDeclaration",
  FUNCTION_DECLARATION = "FunctionDeclaration",
  CLASS_DECLARATION = "ClassDeclaration",

  // Statements
  EXPRESSION_STATEMENT = "ExpressionStatement",
  IF_STATEMENT = "IfStatement",
  FOR_STATEMENT = "ForStatement",
  WHILE_STATEMENT = "WhileStatement",
  RETURN_STATEMENT = "ReturnStatement",

  // Expressions
  IDENTIFIER = "Identifier",
  LITERAL = "Literal",
  BINARY_EXPRESSION = "BinaryExpression",
  CALL_EXPRESSION = "CallExpression",
  MEMBER_EXPRESSION = "MemberExpression",
  ASSIGNMENT_EXPRESSION = "AssignmentExpression",
  ARRAY_EXPRESSION = "ArrayExpression",
  OBJECT_EXPRESSION = "ObjectExpression",

  // Modules
  IMPORT_DECLARATION = "ImportDeclaration",
  EXPORT_DECLARATION = "ExportDeclaration",
}

/**
 * Instruction types for the Intermediate Representation
 */
export enum InstructionType {
  // Memory operations
  SET_VALUE = "SetValue",
  COPY_VALUE = "CopyValue",

  // Control flow
  LABEL = "Label",
  JUMP = "Jump",
  CONDITIONAL_JUMP = "ConditionalJump",
  IF_CONDITION = "IfCondition",

  // Function operations
  CALL_FUNCTION = "CallFunction",
  CALL_METHOD = "CallMethod",
  RETURN = "Return",

  // Data structure operations
  CREATE_ARRAY = "CreateArray",
  CREATE_OBJECT = "CreateObject",

  // Expressions
  BINARY_OPERATION = "BinaryOperation",

  // I/O operations
  PRINT = "Print",
  INPUT = "Input",

  // Module operations
  IMPORT = "Import",
  EXPORT = "Export",

  // Miscellaneous
  COMMENT = "Comment",
  UPDATE_VARIABLE = "UpdateVariable",
}

/**
 * BrainForge command types with detailed descriptions
 */
export enum CommandType {
  // Core Brainfuck commands
  MOVE_RIGHT = ">", // Move pointer right
  MOVE_LEFT = "<", // Move pointer left
  INCREMENT = "+", // Increment current cell
  DECREMENT = "-", // Decrement current cell
  OUTPUT = ".", // Output current cell as ASCII
  INPUT = ",", // Input ASCII value to current cell
  LOOP_START = "[", // Start loop if current cell is non-zero
  LOOP_END = "]", // End loop if current cell is zero

  // Extended BrainForge commands
  MEMORY_MANAGEMENT = "@", // Memory management operations (allocation, deallocation)
  VARIABLE_ACCESS = "$", // Variable access and scoping
  FUNCTION_CALL = "#", // Function call with parameters
  IMPORT = "&", // Import modules and libraries
  TYPE_CONVERSION = "!", // Type conversion and checking
  CONDITIONAL = "?", // Conditional execution (if/else)
  ARRAY_OBJECT_ACCESS = ":", // Array and object property access
  STATEMENT_SEPARATOR = ";", // Statement separator
  BITWISE_OPERATION = "~", // Bitwise operations
  STRING_LITERAL = "`", // String literal handling

  // New BrainForge commands for advanced features
  GUI_ELEMENT = "%", // GUI element creation and manipulation
  EVENT_HANDLER = "^", // Event handling for GUI and I/O
  THREAD_CONTROL = "*", // Thread creation and synchronization
  NETWORK_IO = "=", // Network I/O operations
  FILE_IO = "/", // File I/O operations
  EXCEPTION_TRY = "{", // Try block for exception handling
  EXCEPTION_CATCH = "}", // Catch block for exception handling
  GARBAGE_COLLECT = "\\", // Explicit garbage collection
  DEBUG_BREAK = "'", // Debugger breakpoint
  COMMENT_MARKER = '"', // Inline comment marker
}

