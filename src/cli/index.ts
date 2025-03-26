#!/usr/bin/env node
/**
 * BrainForge CLI
 *
 * Command-line interface for the BrainForge transpiler
 */
import fs from "fs"
import path from "path"
import { program } from "commander"
import { createTranspiler, MemoryModel, OptimizationLevel } from "../index"
import { LogLevel } from "../utils/Logger"
import { GuiManager, type GuiElementType, type GuiEventType } from "../gui/GuiManager"

// Get version from package.json
const packageJsonPath = path.join(__dirname, "../../package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
const version = packageJson.version || "1.1.0"

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
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`)
        process.exit(1)
      }

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
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`)
        process.exit(1)
      }

      // Read input file
      const bfCode = fs.readFileSync(file, "utf-8")

      // Create transpiler with options
      const transpiler = createTranspiler({
        memorySize: Number.parseInt(options.memorySize) || 65536,
        logLevel: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
      })

      // Execute code
      const output = transpiler.executeCode(bfCode, options.input || "")

      // Output result
      console.log(output)
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

// Add GUI command
program
  .command("gui <file>")
  .description("Run a BrainForge GUI application")
  .option("-v, --verbose", "Enable verbose logging")
  .option("-d, --debug", "Enable debug mode")
  .action((file, options) => {
    try {
      // Check if file exists
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`)
        process.exit(1)
      }

      // Read input file
      const bfCode = fs.readFileSync(file, "utf-8")

      // Create transpiler with options
      const transpiler = createTranspiler({
        logLevel: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
        debug: options.debug || false,
      })

      console.log("Starting BrainForge GUI application...")
      console.log("Note: GUI functionality requires a compatible environment.")
      console.log("Parsing GUI commands from BrainForge code...")

      // Parse GUI commands from BrainForge code
      const guiManager = parseGuiCommands(bfCode, transpiler.getOptions().logger)

      // In a real implementation, this would launch a GUI window
      // For now, we'll just print the GUI elements
      console.log("\nGUI Application Structure:")
      console.log("==========================")

      const elements = guiManager.getElements()
      console.log(`Window Title: ${guiManager.getWindowTitle()}`)
      console.log(`Window Size: ${guiManager.getWindowWidth()}x${guiManager.getWindowHeight()}`)
      console.log(`Total Elements: ${elements.size}`)

      console.log("\nElements:")
      for (const [id, props] of elements.entries()) {
        console.log(
          `- ${props.type} (${id}): ${props.text || ""} [${props.x},${props.y},${props.width},${props.height}]`,
        )
      }

      console.log("\nEvent Handlers:")
      for (const [elementId, handlers] of guiManager.getEventHandlers().entries()) {
        for (const handler of handlers) {
          console.log(`- ${elementId}: ${handler.eventType} event`)
        }
      }

      console.log(
        "\nTo run this GUI application with a proper GUI renderer, please use a compatible BrainForge GUI runtime.",
      )
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

// Add interactive command
program
  .command("interactive")
  .alias("repl")
  .description("Start an interactive BrainForge session")
  .option("-v, --verbose", "Enable verbose logging")
  .action((options) => {
    console.log("BrainForge Interactive Mode")
    console.log("Type BrainForge code directly. Use .exit to quit, .help for help.")
    console.log("-----------------------------------------------------")

    const readline = require("readline")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "brainforge> ",
    })

    // Create transpiler
    const transpiler = createTranspiler({
      logLevel: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
    })

    let code = ""

    rl.prompt()

    rl.on("line", (line: string) => {
      if (line.trim() === ".exit") {
        rl.close()
        return
      }

      if (line.trim() === ".help") {
        console.log("Commands:")
        console.log("  .exit - Exit interactive mode")
        console.log("  .help - Show this help")
        console.log("  .run  - Execute the current code")
        console.log("  .clear - Clear the current code")
        console.log("  .show - Show the current code")
        rl.prompt()
        return
      }

      if (line.trim() === ".run") {
        if (code.trim()) {
          try {
            const output = transpiler.executeCode(code)
            console.log("\nOutput:")
            console.log(output)
          } catch (error) {
            console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
          }
        } else {
          console.log("No code to execute.")
        }
        rl.prompt()
        return
      }

      if (line.trim() === ".clear") {
        code = ""
        console.log("Code cleared.")
        rl.prompt()
        return
      }

      if (line.trim() === ".show") {
        console.log("\nCurrent code:")
        console.log(code || "(empty)")
        rl.prompt()
        return
      }

      // Add the line to the code
      code += line + "\n"
      rl.prompt()
    })

    rl.on("close", () => {
      console.log("Exiting BrainForge interactive mode.")
      process.exit(0)
    })
  })

// Parse command-line arguments
program.parse(process.argv)

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}

/**
 * Parses GUI commands from BrainForge code
 *
 * @param code - BrainForge code
 * @param logger - Logger instance
 * @returns GUI manager
 */
function parseGuiCommands(code: string, logger: any): GuiManager {
  const guiManager = new GuiManager(logger)

  // Parse window command
  const windowMatch = code.match(/%window\s+"([^"]+)"\s+(\d+)\s+(\d+)/)
  if (windowMatch) {
    guiManager.setWindowTitle(windowMatch[1])
    guiManager.setWindowDimensions(Number.parseInt(windowMatch[2]), Number.parseInt(windowMatch[3]))
  }

  // Parse element commands
  const elementRegex = /%(\w+)\s+"([^"]+)"\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+"([^"]*)")?(?:\s+(\w+))?/g
  let match
  while ((match = elementRegex.exec(code)) !== null) {
    const type = match[1] as GuiElementType
    const id = match[2]
    const x = Number.parseInt(match[3])
    const y = Number.parseInt(match[4])
    const width = Number.parseInt(match[5])
    const height = Number.parseInt(match[6])
    const text = match[7] || ""
    const value = match[8] || undefined

    guiManager.createElement({
      id,
      type,
      x,
      y,
      width,
      height,
      text,
      value,
    })
  }

  // Parse event handlers
  const handlerRegex = /\^([^\s]+)\s+(\w+)\s+\{([^}]*)\}/g
  while ((match = handlerRegex.exec(code)) !== null) {
    const elementId = match[1]
    const eventType = match[2] as GuiEventType
    const handlerCode = match[3]

    guiManager.addEventHandler(elementId, eventType, handlerCode)
  }

  return guiManager
}

