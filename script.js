import { createTranspiler, MemoryModel, OptimizationLevel } from 'brainforge';
const transpiler = createTranspiler({
  sourceLanguage: 'javascript',
  optimizationLevel: OptimizationLevel.BALANCED,
  memoryModel: MemoryModel.DYNAMIC,
  debug: true,
});

const result = transpiler.transpile(`
    function hello() {
      console.log("Hello, BrainForge!");
    }
    hello();
  `);

console.log(result);
