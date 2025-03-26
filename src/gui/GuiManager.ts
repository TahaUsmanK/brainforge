/**
 * GUI Manager for BrainForge applications
 */
import type { Logger } from "../utils/Logger"

/**
 * GUI element types
 */
export enum GuiElementType {
  WINDOW = "window",
  BUTTON = "button",
  LABEL = "label",
  TEXTBOX = "textbox",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  LISTBOX = "listbox",
  PROGRESSBAR = "progressbar",
  IMAGE = "image",
  CANVAS = "canvas",
}

/**
 * GUI element properties
 */
export interface GuiElementProps {
  id: string
  type: GuiElementType
  x: number
  y: number
  width: number
  height: number
  text?: string
  value?: any
  visible?: boolean
  enabled?: boolean
  [key: string]: any
}

/**
 * GUI event types
 */
export enum GuiEventType {
  CLICK = "click",
  CHANGE = "change",
  FOCUS = "focus",
  BLUR = "blur",
  KEYPRESS = "keypress",
  MOUSEMOVE = "mousemove",
}

/**
 * GUI event handler
 */
export interface GuiEventHandler {
  elementId: string
  eventType: GuiEventType
  handlerCode: string
}

/**
 * GUI Manager for BrainForge applications
 */
export class GuiManager {
  /** Logger instance */
  private logger: Logger

  /** GUI elements */
  private elements: Map<string, GuiElementProps> = new Map()

  /** Event handlers */
  private eventHandlers: Map<string, GuiEventHandler[]> = new Map()

  /** Current window title */
  private windowTitle = "BrainForge Application"

  /** Window dimensions */
  private windowWidth = 800
  private windowHeight = 600

  /**
   * Creates a new GUI manager
   *
   * @param logger - Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger
    this.logger.debug("GUI Manager initialized")
  }

  /**
   * Creates a new GUI element
   *
   * @param props - Element properties
   * @returns Element ID
   */
  createElement(props: GuiElementProps): string {
    if (!props.id) {
      props.id = `element_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }

    // Set default properties
    props.visible = props.visible !== undefined ? props.visible : true
    props.enabled = props.enabled !== undefined ? props.enabled : true

    this.elements.set(props.id, props)
    this.logger.debug(`Created GUI element: ${props.type} with ID ${props.id}`)

    return props.id
  }

  /**
   * Updates an existing GUI element
   *
   * @param id - Element ID
   * @param props - Updated properties
   * @returns True if update was successful
   */
  updateElement(id: string, props: Partial<GuiElementProps>): boolean {
    if (!this.elements.has(id)) {
      this.logger.warn(`Attempted to update non-existent GUI element: ${id}`)
      return false
    }

    const element = this.elements.get(id)!
    this.elements.set(id, { ...element, ...props })
    this.logger.debug(`Updated GUI element: ${id}`)

    return true
  }

  /**
   * Removes a GUI element
   *
   * @param id - Element ID
   * @returns True if removal was successful
   */
  removeElement(id: string): boolean {
    if (!this.elements.has(id)) {
      this.logger.warn(`Attempted to remove non-existent GUI element: ${id}`)
      return false
    }

    this.elements.delete(id)

    // Remove associated event handlers
    if (this.eventHandlers.has(id)) {
      this.eventHandlers.delete(id)
    }

    this.logger.debug(`Removed GUI element: ${id}`)
    return true
  }

  /**
   * Adds an event handler to a GUI element
   *
   * @param elementId - Element ID
   * @param eventType - Event type
   * @param handlerCode - BrainForge code for the handler
   * @returns True if handler was added successfully
   */
  addEventHandler(elementId: string, eventType: GuiEventType, handlerCode: string): boolean {
    if (!this.elements.has(elementId)) {
      this.logger.warn(`Attempted to add event handler to non-existent GUI element: ${elementId}`)
      return false
    }

    const handler: GuiEventHandler = {
      elementId,
      eventType,
      handlerCode,
    }

    if (!this.eventHandlers.has(elementId)) {
      this.eventHandlers.set(elementId, [])
    }

    this.eventHandlers.get(elementId)!.push(handler)
    this.logger.debug(`Added ${eventType} handler to element ${elementId}`)

    return true
  }

  /**
   * Sets the window title
   *
   * @param title - Window title
   */
  setWindowTitle(title: string): void {
    this.windowTitle = title
    this.logger.debug(`Set window title to: ${title}`)
  }

  /**
   * Sets the window dimensions
   *
   * @param width - Window width
   * @param height - Window height
   */
  setWindowDimensions(width: number, height: number): void {
    this.windowWidth = width
    this.windowHeight = height
    this.logger.debug(`Set window dimensions to: ${width}x${height}`)
  }

  /**
   * Generates BrainForge code for the GUI
   *
   * @returns BrainForge code for the GUI
   */
  generateGuiCode(): string {
    let code = `// BrainForge GUI Application: ${this.windowTitle}\n`
    code += `// Window dimensions: ${this.windowWidth}x${this.windowHeight}\n\n`

    // Initialize window
    code += `%window "${this.windowTitle}" ${this.windowWidth} ${this.windowHeight}\n\n`

    // Create elements
    for (const [id, props] of this.elements.entries()) {
      code += this.generateElementCode(props)
    }

    // Add event handlers
    for (const [elementId, handlers] of this.eventHandlers.entries()) {
      for (const handler of handlers) {
        code += `^${elementId} ${handler.eventType} {\n${handler.handlerCode}\n}\n\n`
      }
    }

    return code
  }

  /**
   * Generates BrainForge code for a GUI element
   *
   * @param props - Element properties
   * @returns BrainForge code for the element
   */
  private generateElementCode(props: GuiElementProps): string {
    let code = `%${props.type} "${props.id}" ${props.x} ${props.y} ${props.width} ${props.height}`

    if (props.text) {
      code += ` "${props.text}"`
    }

    if (props.value !== undefined) {
      code += ` ${props.value}`
    }

    if (!props.visible) {
      code += " hidden"
    }

    if (!props.enabled) {
      code += " disabled"
    }

    code += "\n"
    return code
  }

  /**
   * Gets all GUI elements
   *
   * @returns Map of GUI elements
   */
  getElements(): Map<string, GuiElementProps> {
    return new Map(this.elements)
  }

  /**
   * Gets all event handlers
   *
   * @returns Map of event handlers
   */
  getEventHandlers(): Map<string, GuiEventHandler[]> {
    return new Map(this.eventHandlers)
  }

  /**
   * Resets the GUI manager
   */
  reset(): void {
    this.elements.clear()
    this.eventHandlers.clear()
    this.windowTitle = "BrainForge Application"
    this.windowWidth = 800
    this.windowHeight = 600
    this.logger.debug("GUI Manager reset")
  }
}

