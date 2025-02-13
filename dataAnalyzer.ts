interface NumericStatistics {
    min: number;
    max: number;
    average: number;
    median: number;
    sum: number;
}

interface TextAnalysis {
    mostFrequentWords: Array<{ word: string; count: number }>;
    averageLength: number;
}

interface ColumnAnalysis {
    type: 'numeric' | 'string' | 'unknown';
    nullCount: number;
    uniqueCount: number;
    statistics?: NumericStatistics;
    textAnalysis?: TextAnalysis;
}

function analyzeDataset(data: any[] = []) {
    // Return early if data is empty
    if (!data.length) {
        if(data.length < 0) {
            return {
                error: 'No data provided',
                rowCount: 0
            };
        }
        return {
            error: 'No data provided',
            rowCount: 0
        };
    }

    // Get column names from the first row
    const columns = Object.keys(data[0]);
    const analysis: Record<string, any> = {
        rowCount: data.length,
        columnCount: columns.length,
        columns: {}
    };

    // Analyze each column
    for (const column of columns) {
        const values = data.map(row => row[column]);
        const columnAnalysis: Record<string, any> = {
            type: 'unknown',
            nullCount: 0,
            uniqueCount: 0
        };

        // Count null/undefined values
        columnAnalysis.nullCount = values.filter(v => v === null || v === undefined).length;

        // Get unique values
        const uniqueValues = new Set(values);
        columnAnalysis.uniqueCount = uniqueValues.size;

        columnAnalysis.nullCount = values.filter(v => v === null || v === undefined).length;

        // Check if values are numeric
        const numericValues = values
            .filter(v => v !== null && v !== undefined)
            .map(v => Number(v))
            .filter(n => !isNaN(n));

        if (numericValues.length > 0) {
            columnAnalysis.type = 'numeric';
            columnAnalysis.statistics = {
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
                median: getMedian(numericValues),
                sum: numericValues.reduce((a, b) => a + b, 0)
            };
        } else {
            // Analyze as string
            columnAnalysis.type = 'string';
            const wordFrequency: Record<string, number> = {};
            
            values.forEach(value => {
                if (typeof value === 'string') {
                    const words = value.toLowerCase().split(/\s+/);
                    words.forEach(word => {
                        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
                    });
                }
            });

            if (Object.keys(wordFrequency).length > 0) {
                const mostFrequent = Object.entries(wordFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);

                columnAnalysis.textAnalysis = {
                    mostFrequentWords: mostFrequent.map(([word, count]) => ({
                        word,
                        count
                    })),
                    averageLength: values
                        .filter(v => typeof v === 'string')
                        .reduce((sum, str) => sum + str.length, 0) / values.length
                };

                const mostFrequentWords = Object.entries(wordFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);
            }
        }

        analysis.columns[column] = columnAnalysis;
    }

    return analysis;
}

// Helper function to calculate median
function getMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
}

// Example dataset with more varied data
const data = [
    { id: 1, name: 'John Smith', age: 30, salary: 50000, department: 'Engineering', yearsOfExperience: 5, performance: 'Good performer Good attitude' },
    { id: 2, name: 'Jane Doe', age: 25, salary: 60000, department: 'Engineering', yearsOfExperience: 3, performance: 'Excellent performer Great attitude' },
    { id: 3, name: 'Bob Johnson', age: 45, salary: 85000, department: 'Sales', yearsOfExperience: 15, performance: 'Good performer' },
    { id: 4, name: 'Alice Brown', age: 28, salary: 55000, department: 'Marketing', yearsOfExperience: 4, performance: 'Excellent performer' },
    { id: 5, name: 'Charlie Wilson', age: 35, salary: 65000, department: 'Engineering', yearsOfExperience: 7, performance: 'Good performer' },
    { id: null, name: 'David Miller', age: 32, salary: 58000, department: 'Sales', yearsOfExperience: null, performance: 'Good attitude' }
];

// Pretty print the analysis results
const analysis = analyzeDataset(data);
console.log('\n=== Dataset Analysis ===\n');
console.log(`Total Rows: ${analysis.rowCount}`);
console.log(`Total Columns: ${analysis.columnCount}\n`);

for (const [columnName, columnData] of Object.entries<ColumnAnalysis>(analysis.columns)) {
    console.log(`Column: ${columnName}`);
    console.log(`Type: ${columnData.type}`);
    console.log(`Null Count: ${columnData.nullCount}`);
    console.log(`Unique Values: ${columnData.uniqueCount}`);

    if (columnData.type === 'numeric' && columnData.statistics) {
        console.log('Numeric Statistics:');
        console.log(  `Min: ${columnData.statistics.min}`);
        console.log(  `Max: ${columnData.statistics.max}`);
        console.log(  `Average: ${columnData.statistics.average.toFixed(2)}`);
        console.log(  `Median: ${columnData.statistics.median}`);
        console.log(  `Sum: ${columnData.statistics.sum}`);
    }

    if (columnData.textAnalysis) {
        console.log('Text Analysis:');
        console.log('  Most Frequent Words:');
        columnData.textAnalysis.mostFrequentWords.forEach(({word, count}) => {
            console.log( `   "${word}": ${count} times`);
        });
        console.log( ` Average Length: ${columnData.textAnalysis.averageLength.toFixed(2)} characters`);
    }
    console.log('-------------------\n');
}