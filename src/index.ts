/**
 * BrainForge Transpiler
 *
 * A comprehensive transpiler from JavaScript to an enhanced Brainfuck variant
 * that maintains the iconic syntax while adding powerful features.
 *
 * @module BrainForge
 * @version 1.0.0
 * @license MIT
 */

import { TranspilerOptions } from "./types/options"
import { BrainForgeTranspiler } from "./transpiler/BrainForgeTranspiler"
import { MemoryModel, OptimizationLevel } from "./types/enums"

// Re-export types and enums for external use
export { TranspilerOptions, MemoryModel, OptimizationLevel }
export { TranspilationResult } from "./types/results"
export { ASTNode, Program, Expression, Statement } from "./types/ast"

/**
 * Creates a new BrainForge transpiler instance with the specified options
 *
 * @param options - Configuration options for the transpiler
 * @returns A configured BrainForge transpiler instance
 *
 * @example
 * ```typescript
 * import { createTranspiler, MemoryModel, OptimizationLevel } from 'brainforge';
 *
 * const transpiler = createTranspiler({
 *   sourceLanguage: 'javascript',
 *   optimizationLevel: OptimizationLevel.BALANCED,
 *   memoryModel: MemoryModel.DYNAMIC,
 *   debug: true
 * });
 *
 * const result = transpiler.transpile(`
 *   function hello() {
 *     console.log("Hello, BrainForge!");
 *   }
 *   hello();
 * `);
 *
 * console.log(result.bfCode);
 * ```
 */
export function createTranspiler(options?: Partial<TranspilerOptions>): BrainForgeTranspiler {
  return new BrainForgeTranspiler(options)
}

/**
 * Convenience function to transpile code with default options
 *
 * @param sourceCode - The source code to transpile
 * @param options - Optional configuration options
 * @returns The transpilation result
 *
 * @example
 * ```typescript
 * import { transpile } from 'brainforge';
 *
 * const result = transpile(`console.log("Hello, World!");`);
 * console.log(result.bfCode);
 * ```
 */
export function transpile(sourceCode: string, options?: Partial<TranspilerOptions>) {
  const transpiler = new BrainForgeTranspiler(options)
  return transpiler.transpile(sourceCode)
}

// Export default instance with reasonable defaults
export default createTranspiler({
  sourceLanguage: "javascript",
  optimizationLevel: OptimizationLevel.BALANCED,
  memoryModel: MemoryModel.DYNAMIC,
  includeStdlib: true,
  debug: false,
})

