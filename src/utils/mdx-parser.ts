export interface MDXBlock {
    type: 'frontmatter' | 'markdown' | 'jsx' | 'import' | 'export';
    content: string;
    startLine: number;
    endLine: number;
}

export class MDXParser {
    static parse(content: string): MDXBlock[] {
        const lines = content.split('\n');
        const blocks: MDXBlock[] = [];
        let currentBlock: Partial<MDXBlock> | null = null;
        let inFrontmatter = false;
        let inCodeBlock = false;
        let codeBlockFence = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Handle frontmatter
            if (i === 0 && trimmedLine === '---') {
                inFrontmatter = true;
                currentBlock = {
                    type: 'frontmatter',
                    content: line + '\n',
                    startLine: i
                };
                continue;
            }

            if (inFrontmatter && trimmedLine === '---') {
                inFrontmatter = false;
                if (currentBlock) {
                    currentBlock.content += line;
                    currentBlock.endLine = i;
                    blocks.push(currentBlock as MDXBlock);
                    currentBlock = null;
                }
                continue;
            }

            if (inFrontmatter) {
                if (currentBlock) {
                    currentBlock.content += line + '\n';
                }
                continue;
            }

            // Handle code blocks
            if (trimmedLine.startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeBlockFence = '```';
                } else if (trimmedLine === codeBlockFence) {
                    inCodeBlock = false;
                    codeBlockFence = '';
                }
            }

            // Handle JSX/React components (not in code block)
            if (!inCodeBlock && (
                trimmedLine.startsWith('import ') ||
                trimmedLine.startsWith('export ') ||
                this.isJSXLine(line)
            )) {
                const blockType = trimmedLine.startsWith('import ') ? 'import' :
                                trimmedLine.startsWith('export ') ? 'export' : 'jsx';
                
                if (!currentBlock || currentBlock.type !== blockType) {
                    if (currentBlock) {
                        currentBlock.endLine = i - 1;
                        blocks.push(currentBlock as MDXBlock);
                    }
                    currentBlock = {
                        type: blockType,
                        content: line + '\n',
                        startLine: i
                    };
                } else {
                    currentBlock.content += line + '\n';
                }
            } else {
                // Markdown block
                if (!currentBlock || currentBlock.type !== 'markdown') {
                    if (currentBlock) {
                        currentBlock.endLine = i - 1;
                        blocks.push(currentBlock as MDXBlock);
                    }
                    currentBlock = {
                        type: 'markdown',
                        content: line + '\n',
                        startLine: i
                    };
                } else {
                    currentBlock.content += line + '\n';
                }
            }
        }

        if (currentBlock) {
            currentBlock.endLine = lines.length - 1;
            blocks.push(currentBlock as MDXBlock);
        }

        return blocks;
    }

    private static isJSXLine(line: string): boolean {
        const trimmed = line.trim();
        return /^<[A-Z]/.test(trimmed) || // React component
               /<\/[A-Z]/.test(trimmed) || // Closing tag
               /^\{.*\}$/.test(trimmed) || // JSX expression
               trimmed.includes('={') ||   // JSX props
               /^<[a-z]+.*\/>$/.test(trimmed); // Self-closing HTML/JSX
    }
}