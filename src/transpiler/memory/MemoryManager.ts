/**
 * Memory Manager for BrainForge transpiler
 */
import type { TranspilerOptions } from "../../types/options"
import type { Logger } from "../../utils/Logger"
import { MemoryModel } from "../../types/enums"

/**
 * Memory allocation record
 */
interface MemoryAllocation {
  address: number
  size: number
  isActive: boolean
  lastAccessed: number
  scope: string
  references: number
}

/**
 * Manages memory allocation and layout for the BrainForge transpiler
 */
export class MemoryManager {
  /** Transpiler options */
  private options: TranspilerOptions

  /** Logger instance */
  private logger: Logger

  /** Memory map (variable name to allocation details) */
  private memoryMap: Map<string, MemoryAllocation> = new Map()

  /** Next available memory address */
  private nextMemoryAddress = 0

  /** Memory segments for segmented memory model */
  private memorySegments: Array<{ start: number; end: number; name: string }> = []

  /** Start of heap (dynamic memory) */
  private heapStart = 1024

  /** Start of stack */
  private stackStart = 0

  /** Start of global variables */
  private globalStart = 512

  /** Current execution scope */
  private currentScope = "global"

  /** Scope stack for tracking nested scopes */
  private scopeStack: string[] = ["global"]

  /** Memory usage statistics */
  private memoryStats = {
    totalAllocated: 0,
    activeAllocations: 0,
    peakUsage: 0,
    gcRuns: 0,
    gcFreed: 0,
  }

  /** GC threshold (percentage of memory) */
  private gcThreshold = 0.75

  /** Last GC run timestamp */
  private lastGcRun = 0

  /**
   * Creates a new memory manager
   *
   * @param options - Transpiler options
   * @param logger - Logger instance
   */
  constructor(options: TranspilerOptions, logger: Logger) {
    this.options = options
    this.logger = logger
    this.initializeMemoryModel()
  }

  /**
   * Initializes the memory model based on the selected option
   */
  private initializeMemoryModel(): void {
    this.logger.debug(`Initializing ${this.options.memoryModel} memory model`)

    // Reset memory state
    this.memoryMap.clear()
    this.memorySegments = []
    this.currentScope = "global"
    this.scopeStack = ["global"]
    this.memoryStats = {
      totalAllocated: 0,
      activeAllocations: 0,
      peakUsage: 0,
      gcRuns: 0,
      gcFreed: 0,
    }

    switch (this.options.memoryModel) {
      case MemoryModel.STATIC:
        // Static memory model - fixed memory layout
        this.nextMemoryAddress = 0
        break

      case MemoryModel.DYNAMIC:
        // Dynamic memory model - memory allocated as needed
        this.nextMemoryAddress = 0
        break

      case MemoryModel.HYBRID:
        // Hybrid memory model - combines static and dynamic approaches
        this.nextMemoryAddress = 0
        break

      case MemoryModel.SEGMENTED:
        // Segmented memory model - memory divided into segments
        this.initializeSegmentedMemory()
        break
    }
  }

  /**
   * Initializes segmented memory model
   */
  private initializeSegmentedMemory(): void {
    // Define memory segments
    this.memorySegments = [
      { start: 0, end: 511, name: "stack" },
      { start: 512, end: 1023, name: "globals" },
      { start: 1024, end: this.options.memorySize - 1, name: "heap" },
    ]

    // Set initial pointers
    this.stackStart = 0
    this.globalStart = 512
    this.heapStart = 1024
    this.nextMemoryAddress = this.globalStart
  }

  /**
   * Enters a new scope
   *
   * @param scopeName - Name of the scope (e.g., function name)
   */
  enterScope(scopeName: string): void {
    const fullScopeName = `${this.currentScope}.${scopeName}`
    this.scopeStack.push(fullScopeName)
    this.currentScope = fullScopeName
    this.logger.debug(`Entered scope: ${fullScopeName}`)
  }

  /**
   * Exits the current scope and performs cleanup
   */
  exitScope(): void {
    if (this.scopeStack.length <= 1) {
      this.logger.warn("Attempted to exit global scope")
      return
    }

    const oldScope = this.currentScope
    this.scopeStack.pop()
    this.currentScope = this.scopeStack[this.scopeStack.length - 1]

    // Clean up variables in the exited scope
    this.cleanupScope(oldScope)

    this.logger.debug(`Exited scope: ${oldScope}, current scope: ${this.currentScope}`)
  }

  /**
   * Cleans up variables in a specific scope
   *
   * @param scope - Scope to clean up
   */
  private cleanupScope(scope: string): void {
    let freedCount = 0

    for (const [identifier, allocation] of this.memoryMap.entries()) {
      if (allocation.scope === scope) {
        allocation.isActive = false
        freedCount++
        this.memoryStats.activeAllocations--
      }
    }

    if (freedCount > 0) {
      this.logger.debug(`Cleaned up ${freedCount} allocations from scope: ${scope}`)
    }

    // Run garbage collection if needed
    if (this.shouldRunGc()) {
      this.runGarbageCollection()
    }
  }

  /**
   * Determines if garbage collection should run
   */
  private shouldRunGc(): boolean {
    const memoryUsageRatio = this.memoryStats.totalAllocated / this.options.memorySize
    const timeSinceLastGc = Date.now() - this.lastGcRun

    return memoryUsageRatio > this.gcThreshold || timeSinceLastGc > 10000
  }

  /**
   * Runs the garbage collector
   */
  runGarbageCollection(): void {
    this.logger.debug("Running garbage collection")
    this.lastGcRun = Date.now()

    const inactiveAllocations: string[] = []

    // Mark phase: identify inactive allocations
    for (const [identifier, allocation] of this.memoryMap.entries()) {
      if (!allocation.isActive || allocation.references <= 0) {
        inactiveAllocations.push(identifier)
      }
    }

    // Sweep phase: remove inactive allocations
    for (const identifier of inactiveAllocations) {
      const allocation = this.memoryMap.get(identifier)
      if (allocation) {
        this.memoryStats.totalAllocated -= allocation.size
        this.memoryStats.gcFreed += allocation.size
        this.memoryMap.delete(identifier)
      }
    }

    this.memoryStats.gcRuns++

    this.logger.debug(
      `Garbage collection complete: freed ${inactiveAllocations.length} allocations (${this.memoryStats.gcFreed} cells)`,
    )

    // Compact memory if using dynamic or hybrid model
    if (this.options.memoryModel === MemoryModel.DYNAMIC || this.options.memoryModel === MemoryModel.HYBRID) {
      this.compactMemory()
    }
  }

  /**
   * Compacts memory by reorganizing allocations
   */
  private compactMemory(): void {
    this.logger.debug("Compacting memory")

    // Sort active allocations by address
    const activeAllocations = Array.from(this.memoryMap.entries())
      .filter(([_, allocation]) => allocation.isActive)
      .sort((a, b) => a[1].address - b[1].address)

    if (activeAllocations.length === 0) {
      this.nextMemoryAddress = this.options.memoryModel === MemoryModel.SEGMENTED ? this.globalStart : 0
      return
    }

    // Compact allocations
    let currentAddress = this.options.memoryModel === MemoryModel.SEGMENTED ? this.globalStart : 0

    for (const [identifier, allocation] of activeAllocations) {
      if (allocation.address !== currentAddress) {
        // Generate code to move data from old address to new address
        this.logger.debug(`Moving ${identifier} from address ${allocation.address} to ${currentAddress}`)
        allocation.address = currentAddress
      }
      currentAddress += allocation.size
    }

    this.nextMemoryAddress = currentAddress
    this.logger.debug(`Memory compaction complete, next address: ${this.nextMemoryAddress}`)
  }

  /**
   * Allocates memory for a variable or function
   *
   * @param identifier - Variable or function name
   * @param size - Size in memory cells
   * @returns Allocated memory address
   */
  allocateMemory(identifier: string, size = 1): number {
    // Check if already allocated and active
    if (this.memoryMap.has(identifier)) {
      const allocation = this.memoryMap.get(identifier)!
      if (allocation.isActive) {
        allocation.lastAccessed = Date.now()
        return allocation.address
      }
    }

    let address: number

    switch (this.options.memoryModel) {
      case MemoryModel.STATIC:
      case MemoryModel.DYNAMIC:
        // Simple sequential allocation
        address = this.nextMemoryAddress
        this.nextMemoryAddress += size
        break

      case MemoryModel.HYBRID:
        // Allocate based on size
        if (size <= 2) {
          // Small variables go in the first segment
          address = this.nextMemoryAddress
          this.nextMemoryAddress += size
        } else {
          // Larger variables go in the heap
          address = this.heapStart
          this.heapStart += size
        }
        break

      case MemoryModel.SEGMENTED:
        // Allocate in the appropriate segment
        if (this.currentScope === "global") {
          address = this.nextMemoryAddress
          this.nextMemoryAddress += size
        } else {
          // Function-local variables go on the stack
          address = this.stackStart
          this.stackStart += size
        }

        // If we've exceeded the globals segment, move to the heap
        if (this.nextMemoryAddress >= this.heapStart) {
          address = this.heapStart
          this.heapStart += size
        }
        break

      default:
        // Default to simple allocation
        address = this.nextMemoryAddress
        this.nextMemoryAddress += size
    }

    // Check if we're about to exceed memory size
    if (address + size > this.options.memorySize) {
      // Try garbage collection first
      this.runGarbageCollection()

      // If still not enough space, throw error
      if (this.nextMemoryAddress + size > this.options.memorySize) {
        throw new Error(`Memory allocation failed: Out of memory when allocating ${size} cells for "${identifier}"`)
      }
    }

    // Store in memory map
    const allocation: MemoryAllocation = {
      address,
      size,
      isActive: true,
      lastAccessed: Date.now(),
      scope: this.currentScope,
      references: 1,
    }

    this.memoryMap.set(identifier, allocation)

    // Update memory stats
    this.memoryStats.totalAllocated += size
    this.memoryStats.activeAllocations++
    this.memoryStats.peakUsage = Math.max(this.memoryStats.peakUsage, this.memoryStats.totalAllocated)

    this.logger.debug(
      `Allocated ${size} cell(s) at address ${address} for "${identifier}" in scope ${this.currentScope}`,
    )

    // Run garbage collection if needed
    if (this.shouldRunGc()) {
      this.runGarbageCollection()
    }

    return address
  }

  /**
   * Deallocates memory for a variable
   *
   * @param identifier - Variable name
   * @returns True if deallocation was successful
   */
  deallocateMemory(identifier: string): boolean {
    if (!this.memoryMap.has(identifier)) {
      this.logger.warn(`Attempted to deallocate non-existent variable: ${identifier}`)
      return false
    }

    const allocation = this.memoryMap.get(identifier)!

    // Decrease reference count
    allocation.references--

    // If no more references, mark as inactive
    if (allocation.references <= 0) {
      allocation.isActive = false
      this.memoryStats.activeAllocations--
      this.logger.debug(`Deallocated memory for "${identifier}" at address ${allocation.address}`)
    }

    return true
  }

  /**
   * Adds a reference to a variable
   *
   * @param identifier - Variable name
   */
  addReference(identifier: string): void {
    if (this.memoryMap.has(identifier)) {
      const allocation = this.memoryMap.get(identifier)!
      allocation.references++
      allocation.lastAccessed = Date.now()
    }
  }

  /**
   * Gets the memory address for a variable
   *
   * @param identifier - Variable name
   * @returns Memory address or undefined if not found
   */
  getMemoryAddress(identifier: string): number | undefined {
    const info = this.memoryMap.get(identifier)

    if (info && info.isActive) {
      info.lastAccessed = Date.now()
      return info.address
    }

    return undefined
  }

  /**
   * Gets the next available memory address
   *
   * @returns Next memory address
   */
  getNextMemoryAddress(): number {
    return this.nextMemoryAddress
  }

  /**
   * Gets the memory map
   *
   * @returns Memory map
   */
  getMemoryMap(): Map<string, MemoryAllocation> {
    return new Map(this.memoryMap)
  }

  /**
   * Gets memory usage statistics
   *
   * @returns Memory statistics
   */
  getMemoryStats(): any {
    return { ...this.memoryStats }
  }

  /**
   * Checks if memory address is valid and within bounds
   *
   * @param address - Memory address to check
   * @returns True if address is valid
   */
  isValidAddress(address: number): boolean {
    return address >= 0 && address < this.options.memorySize
  }

  /**
   * Resets the memory manager
   */
  reset(): void {
    this.memoryMap.clear()
    this.initializeMemoryModel()
  }

  /**
   * Updates memory manager options
   *
   * @param options - New options to apply
   */
  updateOptions(options: TranspilerOptions): void {
    this.options = options
    this.initializeMemoryModel()
  }
}

