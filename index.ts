import * as fs from 'fs';
import chalk from 'chalk';
import Table from 'cli-table3';

interface ComplexityLocation {
    line: number;
    code: string;
    depth?: number;
}

interface CodeMetrics {
    cyclomaticComplexity: {
        total: number;
        locations: ComplexityLocation[];
    };
    maxNestingDepth: {
        max: number;
        locations: ComplexityLocation[];
    };
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

function calculateCyclomaticComplexity(sourceCode: string): { total: number; locations: ComplexityLocation[] } {
    const locations: ComplexityLocation[] = [];
    const lines = sourceCode.split('\n');
    
    // Count the number of independent paths
    let complexity = 1; // Base complexity (one path)
    
    lines.forEach((line, index) => {
        // Count control flow statements that create new paths
        const controlFlowMatches = line.match(/\b(if|while|for|case|catch)\b|&&|\|\||\?/g);
        if (controlFlowMatches) {
            complexity += controlFlowMatches.length;
            locations.push({
                line: index + 1,
                code: line.trim()
            });
        }
        
        // Count each else as a new path
        if (/\belse\b/.test(line) && !/\belse\s+if\b/.test(line)) {
            complexity++;
            locations.push({
                line: index + 1,
                code: line.trim()
            });
        }
    });
    
    return { total: complexity, locations };
}

function calculateMaxNestingDepth(lines: string[]): { max: number; locations: ComplexityLocation[] } {
    let maxDepth = 0;
    let currentDepth = 0;
    const locations: ComplexityLocation[] = [];
    const stack: { line: number; code: string }[] = [];
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Check for control structures that can be nested
        if (/\b(if|for|while|switch|do)\b.*{/.test(trimmedLine) || 
            /\belse\b.*{/.test(trimmedLine)) {
            currentDepth++;
            stack.push({ line: index + 1, code: trimmedLine });
            
            if (currentDepth > maxDepth) {
                maxDepth = currentDepth;
                // Clear previous max depth locations if we found a deeper nesting
                locations.length = 0;
                // Add the entire stack to show the nesting hierarchy
                locations.push(...stack.map((item, depth) => ({
                    line: item.line,
                    code: item.code,
                    depth: depth + 1
                })));
            }
        }
        
        // Count closing braces to decrease depth
        const closeBraces = (trimmedLine.match(/}/g) || []).length;
        for (let i = 0; i < closeBraces; i++) {
            currentDepth = Math.max(0, currentDepth - 1);
            if (stack.length > 0) {
                stack.pop();
            }
        }
    });
    
    return {
        max: maxDepth,
        locations: locations
    };
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

    // Cyclomatic Complexity
    console.log(chalk.yellow.bold('Cyclomatic Complexity:'), metrics.cyclomaticComplexity.total);
    if (metrics.cyclomaticComplexity.locations.length > 0) {
        const complexityTable = new Table({
            head: [
                chalk.green('Line'),
                chalk.green('Code')
            ],
            colWidths: [8, 72]
        });

        metrics.cyclomaticComplexity.locations.forEach(loc => {
            complexityTable.push([
                loc.line,
                loc.code
            ]);
        });
        console.log(chalk.yellow('\nComplexity Points:'));
        console.log(complexityTable.toString());
    }

    // Maximum Nesting Depth
    console.log(chalk.yellow.bold('\nMaximum Nesting Depth:'), metrics.maxNestingDepth.max);
    if (metrics.maxNestingDepth.locations.length > 0) {
        const depthTable = new Table({
            head: [
                chalk.green('Line'),
                chalk.green('Depth'),
                chalk.green('Code')
            ],
            colWidths: [8, 8, 64]
        });

        metrics.maxNestingDepth.locations.forEach(loc => {
            depthTable.push([
                loc.line,
                loc.depth,
                loc.code
            ]);
        });
        console.log(chalk.yellow('\nDeepest Nesting Locations:'));
        console.log(depthTable.toString());
    }

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

