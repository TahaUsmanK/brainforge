#!/usr/bin/env node
/**
 * BrainForge CLI
 *
 * Command-line interface for the BrainForge transpiler
 */
import fs from "fs"
import { program } from "commander"
import { createTranspiler, MemoryModel, OptimizationLevel } from "../index"
import { LogLevel } from "../utils/Logger"

const version = "1.0.0"
// Define the CLI program
program.name("brainforge").description("BrainForge - JavaScript to Enhanced Brainfuck Transpiler").version(version)

// Add transpile command
program
  .command("transpile <file>")
  .description("Transpile a JavaScript file to BrainForge code")
  .option("-o, --output <file>", "Output file (default: stdout)")
  .option("-s, --source-language <language>", "Source language (default: javascript)")
  .option("-O, --optimization-level <level>", "Optimization level (0-4, default: 2)")
  .option("-m, --memory-model <model>", "Memory model (static, dynamic, hybrid, segmented, default: dynamic)")
  .option("-c, --cell-size <bits>", "Cell size in bits (8, 16, 32, default: 32)")
  .option("--no-stdlib", "Disable standard library")
  .option("--no-extensions", "Disable BrainForge extensions (output standard Brainfuck)")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --debug", "Enable debug mode")
  .action((file, options) => {
    try {
      // Read input file
      const sourceCode = fs.readFileSync(file, "utf-8")

      // Create transpiler with options
      const transpiler = createTranspiler({
        sourceLanguage: options.sourceLanguage || "javascript",
        optimizationLevel: (options.optimizationLevel as OptimizationLevel) || OptimizationLevel.BALANCED,
        memoryModel: (options.memoryModel as MemoryModel) || MemoryModel.DYNAMIC,
        targetCellSize: Number.parseInt(options.cellSize) || 32,
        includeStdlib: options.stdlib !== false,
        allowExtensions: options.extensions !== false,
        debug: options.debug || false,
        logLevel: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
      })

      // Transpile code
      const result = transpiler.transpile(sourceCode)

      if (result.success) {
        const outputCode = options.extensions !== false ? result.bfCode : result.standardBf

        // Output result
        if (options.output) {
          fs.writeFileSync(options.output, outputCode!)
          console.log(`Transpiled code written to ${options.output}`)
        } else {
          console.log(outputCode)
        }

        // Print statistics
        if (options.verbose || options.debug) {
          console.log("\nTranspilation Statistics:")
          console.log(`- Parse time: ${result.stats?.parseTime}ms`)
          console.log(`- IR generation time: ${result.stats?.irGenTime}ms`)
          console.log(`- Optimization time: ${result.stats?.optimizeTime}ms`)
          console.log(`- Code generation time: ${result.stats?.codeGenTime}ms`)
          console.log(`- Total time: ${result.stats?.totalTime}ms`)
          console.log(`- AST node count: ${result.stats?.astNodeCount}`)
          console.log(`- IR instruction count: ${result.stats?.irInstructionCount}`)
          console.log(`- Variable count: ${result.stats?.variableCount}`)
          console.log(`- Function count: ${result.stats?.functionCount}`)
          console.log(`- Optimization count: ${result.stats?.optimizationCount}`)
          console.log(`- BrainForge code size: ${result.stats?.bfCodeSize} bytes`)
          console.log(`- Standard Brainfuck code size: ${result.stats?.standardBfCodeSize} bytes`)
          console.log(`- Compression ratio: ${result.stats?.compressionRatio.toFixed(2)}`)
        }
      } else {
        console.error(`Error: ${result.error}`)
        process.exit(1)
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

// Add run command
program
  .command("run <file>")
  .description("Run a BrainForge or Brainfuck file")
  .option("-i, --input <string>", "Input for the program")
  .option("-m, --memory-size <size>", "Memory size in cells (default: 65536)")
  .option("-v, --verbose", "Enable verbose logging")
  .action((file, options) => {
    try {
      // Read input file
      const bfCode = fs.readFileSync(file, "utf-8")

      // Create transpiler with options
      const transpiler = createTranspiler({
        memorySize: Number.parseInt(options.memorySize) || 65536,
        logLevel: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
      })

      // Execute code
      const output = transpiler.executeCode(bfCode)

      // Output result
      console.log(output)
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

// Parse command-line arguments
program.parse(process.argv)

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

