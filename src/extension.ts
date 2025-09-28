import * as vscode from 'vscode';
import { MDXFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
    console.log('MDX Toolkit: Activating extension');
    
    const formatter = new MDXFormatter();

    // Register formatting provider for MDX files
    const disposable = vscode.languages.registerDocumentFormattingEditProvider(
        [
            { scheme: 'file', language: 'mdx' },
            { scheme: 'untitled', language: 'mdx' },
            { pattern: '**/*.mdx' }
        ],
        formatter
    );

    // Register manual format command
    const formatCommand = vscode.commands.registerCommand('mdxToolkit.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        
        // Force call our formatter
        const edits = await formatter.provideDocumentFormattingEdits(
            editor.document,
            {
                tabSize: 4,
                insertSpaces: true
            },
            new vscode.CancellationTokenSource().token
        );
        
        if (edits.length > 0) {
            const edit = new vscode.WorkspaceEdit();
            edit.set(editor.document.uri, edits);
            await vscode.workspace.applyEdit(edit);
        }
    });

    context.subscriptions.push(disposable, formatCommand);
    console.log('MDX Toolkit: Extension activated successfully');
}

export function deactivate() {
    console.log('MDX Toolkit: Extension deactivated');
}