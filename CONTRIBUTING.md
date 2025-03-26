# Contributing to BrainForge

Thank you for considering contributing to BrainForge! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template to create a new issue
- Include detailed steps to reproduce the bug
- Include any relevant code snippets or error messages

### Suggesting Enhancements

- Check if the enhancement has already been suggested in the Issues section
- Use the feature request template to create a new issue
- Clearly describe the enhancement and its benefits
- Include examples of how the enhancement would be used

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Project Structure

- `src/` - Source code
  - `cli/` - Command-line interface
  - `transpiler/` - Core transpiler components
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `examples/` - Example code
- `dist/` - Compiled output (generated)

## Coding Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation for changes
- Keep pull requests focused on a single change
- Write clear commit messages

## Testing

- Run tests with `npm test`
- Ensure all tests pass before submitting a pull request
- Add new tests for new features or bug fixes

## Documentation

- Update the README.md for user-facing changes
- Add JSDoc comments for new functions and classes
- Update examples if necessary

Thank you for contributing to BrainForge!
