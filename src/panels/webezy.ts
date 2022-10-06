import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn, WebviewViewProvider, CancellationToken, WebviewView, WebviewViewResolveContext, commands } from "vscode";
import { getUri } from "../utilities/getUri";
import { VSCodeMessage } from "../utilities/interfaces";
import { WebezyModule } from "../utilities/webezyJson";

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class WebezyPanel implements WebviewViewProvider {
  public static currentPanel: WebezyPanel | undefined;
  public static generatorPanel: WebezyPanel | undefined;
  public static helpPanel: WebezyPanel | undefined;

  private readonly _panel: WebviewPanel | undefined;
  private _disposables: Disposable[] = [];
	private _view?: WebviewView;
  private _extensionUri: Uri;
  public _webezyModule: WebezyModule | undefined;
  public _page:'Inspector' | 'Help' | 'Generator' = 'Inspector';
  public resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext<unknown>, token: CancellationToken): void | Thenable<void> {
		this._view = webviewView;
    
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};
    webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri, true);
    webviewView.webview.postMessage({type:'init',resource:this._webezyModule?.projects,page:this._page});
    webviewView.webview.onDidReceiveMessage((data:any) => {
      console.log(data);
      let args = data.args ? data.args : [];

      commands.executeCommand(data.command,...args);
    });

    webviewView.onDidChangeVisibility(event => {
      if (webviewView.visible) {
        webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri, true);
        webviewView.webview.postMessage({type:'init',resource:this._webezyModule?.projects,page:this._page});
      }
    });
	
	}
  /**
   * The HelloWorldPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(panel: WebviewPanel | undefined, extensionUri: Uri) {
    if(panel !== undefined) {
      this._panel = panel;
      // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
      // the panel or when the panel is closed programmatically)
      this._panel.onDidDispose(this.dispose, null, this._disposables);

      // Set the HTML content for the webview panel
      this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

      // Set an event listener to listen for messages passed from the webview context
      this._setWebviewMessageListener(this._panel.webview);
      this._panel.webview.postMessage(<VSCodeMessage>{type:'init',resource:undefined,page:'Home'});
    }
    this._extensionUri = extensionUri;
  }

  public setWebezyModule(webezyModule:WebezyModule) {
    this._webezyModule = webezyModule;
  }


  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(extensionUri: Uri ) {
    if (WebezyPanel.currentPanel) {
      console.log("Got current panel !");
      // If the webview panel already exists reveal it
      WebezyPanel.currentPanel._panel?.reveal(ViewColumn.One);

    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "showWebezy",
        // Panel title
        "Webezy.io",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
        }
      );

      WebezyPanel.currentPanel = new WebezyPanel(panel, extensionUri);
      WebezyPanel.generatorPanel = new WebezyPanel(panel, extensionUri);
      WebezyPanel.helpPanel = new WebezyPanel(panel, extensionUri);

    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    WebezyPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel?.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the Angular webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri, isInspector?:boolean) {
    // The CSS file from the Angular build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "styles.css"]);
    // The JS files from the Angular build output
    const logo =  getUri(webview, extensionUri, ["webview-ui", "build", "assets","proto.svg"]);
    const runtimeUri = getUri(webview, extensionUri, ["webview-ui", "build", "runtime.js"]);
    const polyfillsUri = getUri(webview, extensionUri, ["webview-ui", "build", "polyfills.js"]);
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "main.js"]);
    const comp = isInspector ? '<app-root page="test"></app-root>': '<app-root></app-root>';
    console.log(comp);
		const codiconsUri = webview.asWebviewUri(Uri.joinPath(extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <base href="/" />
          <title>Webezy.io</title>
          <link href="${codiconsUri}" rel="stylesheet" />
        </head>
        <body>
          ${comp}
          <script type="module" src="${runtimeUri}"></script>
          <script type="module" src="${polyfillsUri}"></script>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }

  public getWebeview() {
    return this._panel?.webview;
  }

  public setResource(resource:any,projectName:string) {
    this._view?.webview.postMessage(<VSCodeMessage>{type:'event',resource:resource,project:projectName,page:'Inspector'}).then(res => {
      console.log(`[${res}] Sent to webview: ${JSON.stringify(resource.uri)} - ${projectName}`);
    });
  }
}
