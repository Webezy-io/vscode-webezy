import { commands, TreeView, EventEmitter, ExtensionContext, Uri, window, workspace, Terminal, ThemeIcon } from "vscode";
import { WebezyPanel } from "./panels/webezy";
import { findFile } from "./utilities";

import { WebezyModule } from "./utilities/webezyJson";
import { PathLike, readdirSync } from 'fs';
import { ProjectsView } from "./utilities/treeProvider";
import { CustomType } from "./utilities/interfaces";

import { newProject } from './utilities/newProject';


export async function activate(context: ExtensionContext) {
  commands.executeCommand('setContext','webezy.projects', false);

  let folderName = workspace.name; // get the open folder name
  
  let folderPath = workspace.rootPath; // get the open folder path
  let webezyProjects = getDirectories(<string>folderPath);
  let webezy: WebezyModule | undefined;
  let treeView: TreeView<CustomType>;

  if(folderPath !== undefined) {
    webezy = new WebezyModule(folderPath,webezyProjects);
    treeView = window.createTreeView('webezy-projects', {
      treeDataProvider: new ProjectsView(context.extensionUri.fsPath,webezy.projects),
      showCollapseAll:true
    });
    initTreeView(treeView,context,webezy,<any>folderPath);

  } else {
    window.showErrorMessage("webezy: couldn't get current folder path !");
  }

  let activeTerminal = false;
  let terminals: Terminal[] = [];
  let projects: string[] = [];
  for (const prj in webezy?.projects) {
    projects.push(prj);
  }
  window.terminals.forEach(term => {
    
    let filtered = projects.find(prj => term.name.includes(prj));

    console.log('*',filtered,term.name);
    if (filtered) {
      terminals.push(term);
    }
    if (terminals.length === projects.length) {
      activeTerminal = true;
    }
  });

  if (!activeTerminal) {
    await commands.executeCommand('python.setInterpreter');
    if (webezy) {
      for (const prj in webezy.projects) {
        terminals.push(window.createTerminal({name:prj,cwd:Uri.file(<string>folderPath+'/'+prj),iconPath: Uri.file(context.extensionUri.fsPath+'/favicon.svg')}));
      }
    }
   
  }
  // Create the show hello world command
  WebezyPanel.render(context.extensionUri);

  const showHelloWorldCommand = commands.registerCommand("webezy.showHelp", () => {
    window.activeTerminal?.sendText(`wz --help`);
  });
  context.subscriptions.push(showHelloWorldCommand);
  
  const showCurrentVersion = commands.registerCommand("webezy.version", () => {
    window.activeTerminal?.sendText(`wz --version`);
  });
  context.subscriptions.push(showCurrentVersion);
  WebezyPanel.currentPanel?.setWebezyModule(<any>webezy);
  
  context.subscriptions.push(
    window.registerWebviewViewProvider('webezy-inspector', <any>WebezyPanel.currentPanel));

	let refresh = commands.registerCommand('webezy.refreshEntry', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
    let folderPath = workspace.rootPath; // get the open folder path
    let webezyProjects = getDirectories(<string>folderPath);
    if (webezy) {
 
      webezy.refresh(webezyProjects);
      treeView = window.createTreeView('webezy-projects', {
        treeDataProvider: new ProjectsView(context.extensionUri.fsPath,webezy.projects),
        showCollapseAll:true
      });
      initTreeView(treeView,context,webezy,<any>folderPath);
    }

    // terminal.sendText("echo 'Sent text immediately after creating'");
		window.showInformationMessage('Refreshed projects view');
	});
	context.subscriptions.push(refresh);
 
}

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && findFile(Uri.joinPath(Uri.file(source), dirent.name, 'webezy.json').fsPath) )
    .map(dirent => dirent.name);

function colorText(text: string): string {
  let output = '';
  let colorIndex = 1;
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === ' ' || char === '\r' || char === '\n') {
      output += char;
    } else {
      output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
      if (colorIndex > 6) {
        colorIndex = 1;
      }
    }
  }
  return output;
}

function initTreeView(treeView:TreeView<any>,context:ExtensionContext,webezy:WebezyModule,folderPath:string) {

  commands.executeCommand('setContext','webezy.projects', true);
  let currentProject:any='';

  treeView.onDidChangeSelection(event => {

    if(event.selection[0].data.uri !== undefined) {

      let term = window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
      currentProject=term?.name;
      term?.show();
    }
    let data;
    if (typeof(event.selection[0].data) === 'object') {
      data = event.selection[0].data;
    } else {
      data = webezy.projects[currentProject].packages[event.selection[0].data];
      if (data === undefined) {
        data = webezy.projects[currentProject].services[event.selection[0].data];
      }
    }
    window.showInformationMessage("Clicked on "+event.selection[0].label);
    WebezyPanel.currentPanel?.setResource(data);
  });

  context.subscriptions.push(commands.registerCommand('webezy.newProject', async () => {
    newProject(context,webezy).then((res:any) => {
      let clients = '';
      res.clients.forEach((c: { label: string; }) => {
        clients = clients + ' '+ c.label.toLowerCase();
      });
      console.log('Running ->',`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
      window.activeTerminal?.sendText(`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
      setTimeout(() => {
        commands.executeCommand('webezy.refreshEntry');
      },2000);
    });
  }));

  context.subscriptions.push(commands.registerCommand('webezy.wz', async () => {
		const options: { [key: string]: (context: ExtensionContext , webezy: WebezyModule) => Promise<any> } = {
			newProject,
		};
		const quickPick = window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				options[selection[0].label](context,webezy).then(res => {
            let clients = '';
            res.clients.forEach((c: { label: string; }) => {
              clients = clients + ' '+ c.label.toLowerCase();
            });
            console.log('Running ->',`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
            window.activeTerminal?.sendText(`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
            setTimeout(() => {
              commands.executeCommand('webezy.refreshEntry');
            },2000);
          }).catch(console.error);
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	}));
}