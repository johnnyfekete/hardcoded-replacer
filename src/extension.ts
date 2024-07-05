import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let replaceDisposable = vscode.commands.registerCommand('extension.replaceWithLocalizedStringKey', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor!');
      return;
    }
    
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    
    if (!text) {
      vscode.window.showErrorMessage('No text selected!');
      return;
    }
    
    const key = await vscode.window.showInputBox({
      prompt: 'Enter the key for the localized string',
      placeHolder: 'key'
    });
    
    if (!key) {
      return;
    }
    
    const config = vscode.workspace.getConfiguration('localizationReplacement');
    const format = config.get<string>('format') || "${t('${key}')}";
    
    // Replace selected text with localized string format
    await editor.edit(editBuilder => {
      editBuilder.replace(selection, format.replace('${key}', key));
    });
    
    // Update JSON file
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found!');
      return;
    }
    
    const jsonFilePath = path.join(workspaceFolder.uri.fsPath, 'localized_strings.json');
    let jsonContent: { [key: string]: string } = {};
    
    if (fs.existsSync(jsonFilePath)) {
      const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
      jsonContent = JSON.parse(fileContent);
    }
    
    // remove the double quotes from around the text, then remove the single quotes
    const textWithoutQuotes = text.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    
    jsonContent[key] = textWithoutQuotes;
    
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2));
    
    vscode.window.showInformationMessage('Localized string key added successfully!');
  });
  
  let setFormatDisposable = vscode.commands.registerCommand('extension.setLocalizationFormat', async () => {
    const format = await vscode.window.showInputBox({
      prompt: 'Enter the format for localization replacement',
      placeHolder: "${t('${key}')}",
      value: vscode.workspace.getConfiguration('localizationReplacement').get('format')
    });
    
    if (format) {
      await vscode.workspace.getConfiguration('localizationReplacement').update('format', format, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('Localization format updated successfully!');
    }
  });
  
  context.subscriptions.push(replaceDisposable, setFormatDisposable);
}

export function deactivate() {}