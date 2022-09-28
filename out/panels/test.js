"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPanel = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
/**
 * Manages webview panels
 */
class WebPanel {
    constructor(extensionPath, column) {
        this.disposables = [];
        this.extensionPath = extensionPath;
        this.builtAppFolder = 'webview-ui/build';
        // Create and show a new webview panel
        this.panel = vscode.window.createWebviewPanel(WebPanel.viewType, 'My Angular Webview', column, {
            // Enable javascript in the webview
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode.Uri.file(path.join(this.extensionPath, this.builtAppFolder))]
        });
        // Set the webview's initial html content
        this.panel.webview.html = this._getHtmlForWebview();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this.disposables);
    }
    static createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        // If we already have a panel, show it.
        // Otherwise, create angular panel.
        if (WebPanel.currentPanel) {
            WebPanel.currentPanel.panel.reveal(column);
        }
        else {
            WebPanel.currentPanel = new WebPanel(extensionPath, column || vscode.ViewColumn.One);
        }
        return WebPanel.currentPanel;
    }
    dispose() {
        WebPanel.currentPanel = undefined;
        // Clean up our resources
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    /**
     * Returns html of the start page (index.html)
     */
    _getHtmlForWebview() {
        // path to dist folder
        const appDistPath = path.join(this.extensionPath, 'webview-ui/build');
        const appDistPathUri = vscode.Uri.file(appDistPath);
        // path as uri
        const baseUri = this.panel.webview.asWebviewUri(appDistPathUri);
        // get path to index.html file from dist folder
        const indexPath = path.join(appDistPath, 'index.html');
        // read index file from file system
        let indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });
        // update the base URI tag
        indexHtml = indexHtml.replace('<base href="/">', `<base href="${String(baseUri)}/">`);
        return indexHtml;
    }
}
exports.WebPanel = WebPanel;
WebPanel.viewType = 'angular';
//# sourceMappingURL=test.js.map