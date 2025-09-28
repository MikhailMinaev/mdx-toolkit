import * as vscode from 'vscode';

export class MDXFormatter implements vscode.DocumentFormattingEditProvider {
    
    async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        
        const config = vscode.workspace.getConfiguration('mdxToolkit.formatter');
        
        if (!config.get('enable', true)) {
            return [];
        }

        try {
            const text = document.getText();
            const formattedText = await this.formatMDX(text, options);

            if (text === formattedText) {
                return [];
            }

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );

            return [vscode.TextEdit.replace(fullRange, formattedText)];
            
        } catch (error: unknown) {
            console.error('MDX Formatter error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`MDX Formatter Error: ${errorMessage}`);
            return [];
        }
    }

    private async formatMDX(content: string, options: vscode.FormattingOptions): Promise<string> {
        const lines = content.split('\n');
        const indentSize = options.tabSize || 4;
        const useSpaces = options.insertSpaces !== false;
        const indent = useSpaces ? ' '.repeat(indentSize) : '\t';
        
        const result: string[] = [];
        let jsxDepth = 0;
        let inCodeBlock = false;
        let inFrontmatter = false;
        let inTable = false;
        let codeLanguage = '';
        let codeBlockContent: string[] = [];
        let tableContent: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Handle empty lines
            if (!trimmed) {
                if (inCodeBlock) {
                    codeBlockContent.push('');
                } else if (inTable) {
                    // Empty line ends table
                    inTable = false;
                    const formattedTable = this.formatMarkdownTable(tableContent, jsxDepth, indent);
                    result.push(...formattedTable);
                    tableContent = [];
                    result.push('');
                } else {
                    result.push('');
                }
                continue;
            }
            
            // Handle frontmatter
            if (i === 0 && trimmed === '---') {
                inFrontmatter = true;
                result.push(line);
                continue;
            }
            
            if (inFrontmatter && trimmed === '---') {
                inFrontmatter = false;
                result.push(line);
                continue;
            }
            
            if (inFrontmatter) {
                result.push(line);
                continue;
            }
            
            // Handle code blocks
            if (trimmed.startsWith('```')) {
                // End table if we were in one
                if (inTable) {
                    inTable = false;
                    const formattedTable = this.formatMarkdownTable(tableContent, jsxDepth, indent);
                    result.push(...formattedTable);
                    tableContent = [];
                }
                
                if (!inCodeBlock) {
                    // Start code block
                    inCodeBlock = true;
                    codeLanguage = trimmed.replace('```', '').trim();
                    codeBlockContent = [];
                } else {
                    // End code block
                    inCodeBlock = false;
                    
                    // Add opening tag
                    result.push(indent.repeat(jsxDepth) + '```' + codeLanguage);
                    
                    // Format code block content
                    if (codeLanguage === 'json' && codeBlockContent.length > 0) {
                        const formattedJson = this.formatJSONBlock(codeBlockContent.join('\n'), jsxDepth + 1, indent);
                        result.push(...formattedJson.split('\n'));
                    } else {
                        // Non-JSON content - add with indentation
                        codeBlockContent.forEach(codeLine => {
                            result.push(indent.repeat(jsxDepth) + codeLine);
                        });
                    }
                    
                    // Add closing tag
                    result.push(indent.repeat(jsxDepth) + '```');
                    
                    codeBlockContent = [];
                    codeLanguage = '';
                }
                continue;
            }
            
            if (inCodeBlock) {
                codeBlockContent.push(trimmed);
                continue;
            }
            
            // Handle markdown tables
            if (this.isMarkdownTableRow(trimmed)) {
                if (!inTable) {
                    inTable = true;
                    tableContent = [];
                }
                tableContent.push(trimmed);
                continue;
            } else if (inTable) {
                // End table and process current line
                inTable = false;
                const formattedTable = this.formatMarkdownTable(tableContent, jsxDepth, indent);
                result.push(...formattedTable);
                tableContent = [];
            }
            
            // Handle JSX tags
            if (trimmed.startsWith('<')) {
                if (trimmed.startsWith('</')) {
                    // Closing tag
                    jsxDepth = Math.max(0, jsxDepth - 1);
                    result.push(indent.repeat(jsxDepth) + trimmed);
                } else if (trimmed.endsWith('/>')) {
                    // Self-closing tag
                    result.push(indent.repeat(jsxDepth) + trimmed);
                } else {
                    // Opening tag
                    result.push(indent.repeat(jsxDepth) + trimmed);
                    jsxDepth++;
                }
                continue;
            }
            
            // Handle import/export
            if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
                result.push(trimmed);
                continue;
            }
            
            // Handle regular content
            if (jsxDepth > 0) {
                result.push(indent.repeat(jsxDepth) + trimmed);
            } else {
                result.push(trimmed);
            }
        }
        
        // Handle table at end of file
        if (inTable && tableContent.length > 0) {
            const formattedTable = this.formatMarkdownTable(tableContent, jsxDepth, indent);
            result.push(...formattedTable);
        }
        
        return result.join('\n');
    }

    private isMarkdownTableRow(line: string): boolean {
        const trimmed = line.trim();
        
        // Table data row (contains |)
        if (trimmed.includes('|') && trimmed.length > 1) {
            return true;
        }
        
        // Separator row (only :, -, | and spaces)
        if (/^[\s\|:\-]+$/.test(trimmed) && trimmed.includes('|')) {
            return true;
        }
        
        return false;
    }

    private formatMarkdownTable(tableRows: string[], baseIndent: number, indentString: string): string[] {
        if (tableRows.length === 0) {
            return [];
        }
        
        const parsedTable = this.parseMarkdownTable(tableRows);
        if (!parsedTable) {
            return tableRows.map(row => indentString.repeat(baseIndent) + row);
        }
        
        const { headers, separator, rows } = parsedTable;
        
        // Calculate max width for each column
        const columnWidths: number[] = [];
        
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            let maxWidth = headers[colIndex].length;
            
            for (const row of rows) {
                if (row[colIndex] && row[colIndex].length > maxWidth) {
                    maxWidth = row[colIndex].length;
                }
            }
            
            columnWidths[colIndex] = Math.max(maxWidth, 3);
        }
        
        // Format table rows
        const result: string[] = [];
        const baseIndentStr = indentString.repeat(baseIndent);
        
        // Headers
        const formattedHeaders = this.formatTableRow(headers, columnWidths);
        result.push(baseIndentStr + formattedHeaders);
        
        // Separator
        const formattedSeparator = this.formatTableSeparator(separator, columnWidths);
        result.push(baseIndentStr + formattedSeparator);
        
        // Data rows
        for (const row of rows) {
            const formattedRow = this.formatTableRow(row, columnWidths);
            result.push(baseIndentStr + formattedRow);
        }
        
        return result;
    }

    private parseMarkdownTable(tableRows: string[]): {
        headers: string[];
        separator: string[];
        rows: string[][];
    } | null {
        if (tableRows.length < 2) {
            return null;
        }
        
        const headerRow = tableRows[0].trim();
        const headers = this.parseTableRow(headerRow);
        
        if (headers.length === 0) {
            return null;
        }
        
        const separatorRow = tableRows[1].trim();
        const separator = this.parseTableRow(separatorRow);
        
        if (separator.length !== headers.length) {
            return null;
        }
        
        const rows: string[][] = [];
        for (let i = 2; i < tableRows.length; i++) {
            const row = this.parseTableRow(tableRows[i].trim());
            if (row.length > 0) {
                while (row.length < headers.length) {
                    row.push('');
                }
                rows.push(row);
            }
        }
        
        return { headers, separator, rows };
    }

    private parseTableRow(rowString: string): string[] {
        let cleanRow = rowString.replace(/^\|/, '').replace(/\|$/, '');
        const cells = cleanRow.split('|').map(cell => cell.trim());
        return cells;
    }

    private formatTableRow(cells: string[], columnWidths: number[]): string {
        const paddedCells = cells.map((cell, index) => {
            const width = columnWidths[index] || 3;
            return cell.padEnd(width);
        });
        
        return '| ' + paddedCells.join(' | ') + ' |';
    }

    private formatTableSeparator(separatorCells: string[], columnWidths: number[]): string {
        const formattedCells = separatorCells.map((cell, index) => {
            const width = columnWidths[index] || 3;
            const trimmed = cell.trim();
            
            if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
                // Center alignment
                return ':' + '-'.repeat(Math.max(1, width - 2)) + ':';
            } else if (trimmed.endsWith(':')) {
                // Right alignment
                return '-'.repeat(Math.max(1, width - 1)) + ':';
            } else {
                // Left alignment (default)
                return '-'.repeat(width);
            }
        });
        
        return '| ' + formattedCells.join(' | ') + ' |';
    }

    private formatJSONBlock(jsonContent: string, baseIndent: number, indentString: string): string {
        try {
            // Try to parse entire JSON
            const parsed = JSON.parse(jsonContent);
            const formatted = JSON.stringify(parsed, null, indentString.length);
            
            // Add base indentation to each line
            const lines = formatted.split('\n');
            const indentedLines = lines.map(line => {
                if (line.trim()) {
                    return indentString.repeat(baseIndent) + line;
                }
                return '';
            });
            
            return indentedLines.join('\n');
            
        } catch (error) {
            // If JSON parsing fails, format line by line
            const lines = jsonContent.split('\n');
            const result: string[] = [];
            let currentIndent = baseIndent;
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                
                // Decrease indent for closing brackets
                if (trimmed === '}' || trimmed === ']') {
                    currentIndent = Math.max(baseIndent, currentIndent - 1);
                }
                
                result.push(indentString.repeat(currentIndent) + trimmed);
                
                // Increase indent for opening brackets
                if (trimmed === '{' || trimmed === '[' || trimmed.endsWith('{') || trimmed.endsWith('[')) {
                    currentIndent++;
                }
            }
            
            return result.join('\n');
        }
    }
}