# Code Analysis Tool (ANIBAL ABRIME LAS VACANTES DE MODELADO!!!!!!)

Herramienta hecha en TS para analizar las metricas de codigo: Cyclomatic complexity, nesting depth, duplication, and documentation coverage.

## Features

### 1. Cyclomatic Complexity Analysis
Mide el numero de caminos linealmente independientes a traves del codigo analizando las sentencias de control.

```typescript
// Example of complexity points detected:
if (condition) {        // +1 complexity
    while (test) {      // +1 complexity
        if (x && y) {   // +2 complexity (if and &&)
            // ...
        }
    }
}
```

### 2. Maximum Nesting Depth
Traquea y reporta el nivel de anidamiento mas profundo de las estructuras de control (if, for, while, etc).

```typescript
if (x) {           // depth 1
    for (y) {      // depth 2
        while (z) { // depth 3 - Maximum depth in this example
            // ...
        }
    }
}
```

### 3. Duplicated Code Detection
Identifica bloques de codigo repetidos en el archivo.

```typescript
// Will detect duplicates like:
function example1() {
    const result = someValue + 1;
    console.log(result);
}

function example2() {
    const result = someValue + 1;  // Duplicate detected
    console.log(result);           // Duplicate detected
}
```

### 4. Documentation Coverage
Analiza la cobertura de documentacion para secciones de codigo complejas como funciones, clases, y estructuras de control.

## Usage

```typescript
import { analyzeCode } from './index';
import * as fs from 'fs';

// Read source file
const sourceCode = fs.readFileSync('path/to/file.ts', 'utf-8');

// Analyze the code
const metrics = analyzeCode(sourceCode);

// Display the results
console.log(`Cyclomatic Complexity: ${metrics.cyclomaticComplexity.total}`);
console.log(`Maximum Nesting Depth: ${metrics.maxNestingDepth.max}`);
console.log(`Documentation Coverage: ${metrics.documentationCoverage.percentage}%`);
```

## Output Example

```
=== Code Analysis Results ===

Cyclomatic Complexity: 12
Complexity Points:
┌──────┬────────────────────────┐
│ Line │ Code                   │
├──────┼────────────────────────┤
│ 23   │ if (condition)         │
│ 45   │ while (test)          │
└──────┴────────────────────────┘

Maximum Nesting Depth: 3
Deepest Nesting Locations:
┌──────┬───────┬────────────────┐
│ Line │ Depth │ Code           │
├──────┼───────┼────────────────┤
│ 12   │ 1     │ if (x) {       │
│ 13   │ 2     │ for (y) {      │
│ 14   │ 3     │ while (z) {    │
└──────┴───────┴────────────────┘
```

## Installation

```bash
npm install
```
or
```bash
yarn add
```
or
```bash
pnpm install
```
or
```bash
bun install
```

