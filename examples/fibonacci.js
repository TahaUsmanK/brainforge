// Fibonacci sequence generator
function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// Calculate and print Fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(`Fibonacci(${i}) = ${fibonacci(i)}`)
}

