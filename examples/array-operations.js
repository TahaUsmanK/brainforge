// Array operations example
const numbers = [1, 2, 3, 4, 5]
let sum = 0

// Calculate sum
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i]
}

console.log(`Sum: ${sum}`)

// Double each number
const doubled = numbers.map((n) => n * 2)
console.log(`Doubled: ${doubled}`)

// Filter even numbers
const evens = numbers.filter((n) => n % 2 === 0)
console.log(`Even numbers: ${evens}`)

