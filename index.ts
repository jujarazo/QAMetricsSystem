import * as fs from 'fs';
import chalk from 'chalk';
import Table from 'cli-table3';

interface CodeMetrics {
    cyclomaticComplexity: number;
    maxNestingDepth: number;
    duplicatedCodeBlocks: Array<{
        code: string;
        occurrences: number;
        locations: Array<{ line: number }>
    }>;
    documentationCoverage: {
        totalComplexLines: number;
        documentedComplexLines: number;
        percentage: number;
    };
}

export function analyzeCode(sourceCode: string): CodeMetrics {
    const lines = sourceCode.split('\n');
    const metrics: CodeMetrics = {
        cyclomaticComplexity: calculateCyclomaticComplexity(sourceCode),
        maxNestingDepth: calculateMaxNestingDepth(lines),
        duplicatedCodeBlocks: findDuplicatedCode(lines),
        documentationCoverage: analyzeDocumentation(lines)
    };
    
    return metrics;
}

function calculateCyclomaticComplexity(sourceCode: string): number {
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
        /\bif\b/g,
        /\belse\s+if\b/g,
        /\bwhile\b/g,
        /\bfor\b/g,
        /\bcase\b/g,
        /\bcatch\b/g,
        /\b&&\b/g,
        /\b\|\|\b/g,
        /\?/g // Ternary operators
    ];
    
    decisionPatterns.forEach(pattern => {
        const matches = sourceCode.match(pattern);
        if (matches) {
            complexity += matches.length;
        }
    });
    
    return complexity;
}

function calculateMaxNestingDepth(lines: string[]): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const line of lines) {
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        
        currentDepth += openBraces - closeBraces;
        maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    return maxDepth;
}

function findDuplicatedCode(
    lines: string[]
  ): Array<{ code: string; occurrences: number; locations: Array<{ line: number }> }> {
    const duplicates: Map<string, number[]> = new Map();
    const minLineLength = 3; // Minimum length to consider
  
    // Regular expression to match lines that are only trivial punctuation such as "});"
    const trivialRegex = /^[\)\}\;]+$/;
  
    // Iterate through each line
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
  
      // Skip lines that don't meet the minimum length or are trivial
      if (trimmedLine.length < minLineLength || trivialRegex.test(trimmedLine)) continue;
  
      if (!duplicates.has(trimmedLine)) {
        duplicates.set(trimmedLine, []);
      }
      duplicates.get(trimmedLine)!.push(i + 1); // Record the 1-based line number
    }
  
    // Return only lines that occur more than once
    return Array.from(duplicates.entries())
      .filter(([_, locations]) => locations.length > 1)
      .map(([code, locations]) => ({
        code,
        occurrences: locations.length,
        locations: locations.map((line) => ({ line })),
      }));
}
  

function analyzeDocumentation(lines: string[]): {
    totalComplexLines: number;
    documentedComplexLines: number;
    percentage: number;
} {
    let totalComplexLines = 0;
    let documentedComplexLines = 0;
    let lastLineWasComment = false;
    
    const complexPatterns = [
        /function\s+\w+/,
        /class\s+\w+/,
        /interface\s+\w+/,
        /\bif\b/,
        /\bfor\b/,
        /\bwhile\b/,
        /\bswitch\b/
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if line is a comment
        const isComment = line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
        
        // Check if line contains complex code
        const isComplex = complexPatterns.some(pattern => pattern.test(line));
        
        if (isComplex) {
            totalComplexLines++;
            if (lastLineWasComment) {
                documentedComplexLines++;
            }
        }
        
        lastLineWasComment = isComment;
    }
    
    const percentage = totalComplexLines === 0 ? 
        100 : 
        (documentedComplexLines / totalComplexLines) * 100;
    
    return {
        totalComplexLines,
        documentedComplexLines,
        percentage
    };
}

function displayMetrics(metrics: CodeMetrics) {
    console.log('\n' + chalk.blue.bold('=== Code Analysis Results ===') + '\n');

    // Complexity metrics
    console.log(chalk.yellow('Cyclomatic Complexity:'), metrics.cyclomaticComplexity);
    console.log(chalk.yellow('Maximum Nesting Depth:'), metrics.maxNestingDepth);

    // Documentation coverage
    const coverageTable = new Table({
        head: [
            chalk.green('Documentation Metrics'),
            chalk.green('Value')
        ]
    });

    coverageTable.push(
        ['Total Complex Lines', metrics.documentationCoverage.totalComplexLines],
        ['Documented Complex Lines', metrics.documentationCoverage.documentedComplexLines],
        ['Coverage Percentage', `${metrics.documentationCoverage.percentage.toFixed(2)}%`]
    );

    console.log(coverageTable.toString());

    // Duplicated code blocks
    if (metrics.duplicatedCodeBlocks.length > 0) {
        console.log('\n' + chalk.red.bold('Duplicated Code Blocks:'));
        
        metrics.duplicatedCodeBlocks.forEach((block, index) => {
            const duplicateTable = new Table({
                head: [
                    chalk.yellow(`Duplicate Block #${index + 1}`),
                    chalk.yellow(`${block.occurrences} occurrences`)
                ]
            });

            // Show the actual duplicated code and where it appears
            duplicateTable.push(
                ['Original Code', block.code.trim()],
                ['Duplicated At', block.locations.map(loc => {
                    // Get the actual code at each location
                    const lines = sourceCode.split('\n');
                    const duplicateCode = lines[loc.line - 1].trim();
                    return `Line ${loc.line}: ${duplicateCode}`;
                }).join('\n')]
            );

            console.log(duplicateTable.toString());
            
            // Verify the duplication
            const isDuplication = block.locations.every(loc => {
                const lines = sourceCode.split('\n');
                const duplicateCode = lines[loc.line - 1].trim();
                return duplicateCode === block.code.trim();
            });

            if (!isDuplication) {
                console.log(chalk.yellow('Warning: Some locations may not be exact duplicates'));
            }
        });
    }
}

//Example usage:
const sourceCode = fs.readFileSync('dataAnalyzer.ts', 'utf-8');
const metrics = analyzeCode(sourceCode);
console.log(metrics);
displayMetrics(metrics);

