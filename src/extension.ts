import { commands, TreeView, EventEmitter, ExtensionContext, Uri, window, workspace, Terminal, ThemeIcon, StatusBarItem, StatusBarAlignment } from "vscode";
import { WebezyPanel } from "./panels/webezy";
import { findFile, getConfig } from "./utilities";

import { WebezyModule } from "./utilities/webezyJson";
import { PathLike, readdirSync } from 'fs';
import { ProjectsView } from "./utilities/treeProvider";
import { CustomType } from "./utilities/interfaces";

import { newProject } from './utilities/newProject';

let activeProjectStatusBar: StatusBarItem;
let currentResourceOnView:CustomType;
export async function activate(context: ExtensionContext) {
  commands.executeCommand('setContext','webezy.projects', false);

  let folderName = workspace.name; // get the open folder name
  let webezyConfig = getConfig();
  console.log(webezyConfig);  
  context.globalState.update('webezy.projects.defaultProjects',webezyConfig.projects.defaultProjects);
  activeProjectStatusBar = window.createStatusBarItem(StatusBarAlignment.Right,100);
  activeProjectStatusBar.text= '$(folder)';
  activeProjectStatusBar.show();
  
  let folderPath = workspace.rootPath; // get the open folder path
  let webezyProjects = getDirectories(<string>folderPath);
  let webezy: WebezyModule | undefined;
  let treeView: TreeView<CustomType>;
  context.subscriptions.push(activeProjectStatusBar);
  if(folderPath !== undefined) {
   
    webezy = new WebezyModule(folderPath,webezyProjects);
    if (webezyConfig.projects.defaultProjects.length > 0) {
      webezy.setDefaultProjects(webezyConfig.projects.defaultProjects);
      console.log("Loading default projects");
      webezy.refresh();
    }
    treeView = window.createTreeView('webezy-projects', {
      treeDataProvider: new ProjectsView(context.extensionUri.fsPath,webezy.projects),
      showCollapseAll:true
    });
    initTreeView(treeView,context,webezy,<any>folderPath,activeProjectStatusBar);

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
        let prjPath = webezy.projects[prj].project?.uri;
        terminals.push(window.createTerminal({name:prj,cwd:Uri.file(<string>prjPath),iconPath: Uri.file(context.extensionUri.fsPath+'/favicon.svg')}));
      }
    }
   
  }
  // Create the show hello world command
  WebezyPanel.render(context.extensionUri);

  const showHelloWorldCommand = commands.registerCommand("webezy.help", () => {
    window.activeTerminal?.sendText(`wz --help`);
    commands.executeCommand(`workbench.action.openWalkthrough`, `webezy.vscode-webezy#webezy-setup`, true);
  });
  context.subscriptions.push(showHelloWorldCommand);
  
  const showCurrentVersion = commands.registerCommand("webezy.version", () => {
    window.activeTerminal?.sendText(`wz --version`);
  });
  context.subscriptions.push(showCurrentVersion);
  WebezyPanel.currentPanel?.setWebezyModule(<any>webezy);
  
  context.subscriptions.push(
    window.registerWebviewViewProvider('webezy-inspector', <any>WebezyPanel.currentPanel));
  if(WebezyPanel.generatorPanel) {
    WebezyPanel.generatorPanel._page = 'Generator';
  }
  context.subscriptions.push(
      window.registerWebviewViewProvider('webezy-generator', <any>WebezyPanel.generatorPanel));
  if(WebezyPanel.helpPanel) {
    WebezyPanel.helpPanel._page = 'Help';
  }
  context.subscriptions.push(
      window.registerWebviewViewProvider('webezy-help', <any>WebezyPanel.helpPanel));
      
	let refresh = commands.registerCommand('webezy.refreshEntry', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
    let folderPath = workspace.rootPath; // get the open folder path
    let webezyProjects = getDirectories(<string>folderPath);
    if (webezy) {
      if (webezyConfig.projects.defaultProjects.length > 0) {
        webezy.setDefaultProjects(webezyConfig.projects.defaultProjects);
      }
      webezy.refresh(webezyProjects);
  
      treeView = window.createTreeView('webezy-projects', {
        treeDataProvider: new ProjectsView(context.extensionUri.fsPath,webezy.projects),
        showCollapseAll:true
      });
      initTreeView(treeView,context,webezy,<any>folderPath,activeProjectStatusBar);
    }

    // terminal.sendText("echo 'Sent text immediately after creating'");
		window.showInformationMessage('Refreshed projects view');
	});
	context.subscriptions.push(refresh);

  let onConfEdit = workspace.onDidChangeConfiguration(e => {
    webezyConfig = getConfig();

		// Check if a projects.defaultProjects configuration is changed
		if (e.affectsConfiguration('webezy.projects.defaultProjects')) {
      commands.executeCommand('webezy.refreshEntry');      
		}

	});
  context.subscriptions.push(onConfEdit);


  context.subscriptions.push(commands.registerCommand('webezy.wz', async () => {
		const options: { [key: string]: (context: ExtensionContext , webezy: WebezyModule) => Promise<any> } = {
			newProject,
		};
		const quickPick = window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({ label }));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				options[selection[0].label](context,<WebezyModule>webezy).then(res => {
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

  let resourceReveal = commands.registerCommand('webezy.reveal', (resource) => {
    console.log();
    let currentActive = <string>context.globalState.get('webezy.projects.active');

    if (resource.split('.').length> 3) {
      let pkgName = `protos/${resource.split('.')[2]}/${resource.split('.')[1]}.proto`;
      let msg :any = undefined;
      let enm :any = undefined;
      if (webezy?.projects[currentActive].packages[pkgName].messages) {
        msg = webezy?.projects[currentActive].packages[pkgName].messages.find(msg => msg.fullName === resource);
      }

      if ( webezy?.projects[currentActive].packages[pkgName].enums && !msg) {
        enm = webezy?.projects[currentActive].packages[pkgName].enums.find(enm => enm.fullName === resource);
      } else {
        treeView.reveal({label:resource.split('.').pop(),data:msg,kind:'Message'});
      }
      console.log(msg,enm);
    } else if(resource.split('.').length === 3) {
      let pkgName = `protos/${resource.split('.')[2]}/${resource.split('.')[1]}.proto`;
      if (webezy?.projects[currentActive].packages[pkgName]) {
        let p = webezy?.projects[currentActive].packages[pkgName];
        treeView.reveal({label:resource.split('.')[1],data:p,kind:'Package'});
      } 

    } else if(webezy?.projects[currentActive].services[resource]) {
      let s = webezy?.projects[currentActive].services[resource];
      treeView.reveal({label:resource,data:s,kind:'Service'});
    } else {
      for (const svc in webezy?.projects[currentActive].services) {
        let service = webezy?.projects[currentActive].services[svc];
        let rpc = service?.methods.find(rpc => rpc.name === resource);
        if (rpc) {
          treeView.reveal({label:resource,data:rpc,kind:'RPC'});
        }
      }
    }
	});

  context.subscriptions.push(resourceReveal);

  context.subscriptions.push(commands.registerCommand('webezy.viewSources', () => {
		return { openFolder: Uri.joinPath(context.extensionUri, 'src') }; 
	}));

  context.subscriptions.push(commands.registerCommand('webezy.newProject', async () => {
    newProject(context,<WebezyModule>webezy).then((res:any) => {
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

  context.subscriptions.push(commands.registerCommand('webezy.getParent', async () => {
    let currentPrj = <string>context.globalState.get('webezy.projects.active');
    let prj = webezy?.projects[currentPrj];
    let parent:any = {};
    if (currentResourceOnView.kind === 'Message') {
      let pkgName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`
      let pkg = webezy?.projects[currentPrj].packages[pkgName];
      if(pkg) {
        let msg = pkg.messages.find(el => el.name === currentResourceOnView.label);
        if(msg ) {
          parent = {label: pkg.name, data: pkg, kind: 'Package'};
          treeView.reveal(parent);
        }
      }
    } else if(currentResourceOnView.kind === 'RPC') {
      window.showErrorMessage("Not supported yet");
    } 

  }));
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

function initTreeView(treeView:TreeView<any>,context:ExtensionContext,webezy:WebezyModule,folderPath:string,statusBar:StatusBarItem) {

  commands.executeCommand('setContext','webezy.projects', true);
  let currentProject:any='';
  treeView.onDidChangeSelection(event => {

    if(event.selection[0].data.uri !== undefined) {
      try {
        if (event.selection[0].data.uri.includes('folderPath')) {
          let term = window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
          currentProject=term?.name;
          term?.show();
        } else {
          let defaults = <string[]>context.globalState.get('webezy.projects.defaultProjects');
          let project = defaults.find(el => event.selection[0].data.uri.includes(el));
          let term = window.terminals.find(term => term.name === project?.split('/').pop());
          currentProject=term?.name;

          term?.show();
        }
        
      } catch (error:any) {
        window.showErrorMessage(error.message);
      }
      // statusBar.text = `$(folder) ${currentProject}`;
      // statusBar.show();
    }
    context.globalState.update('webezy.projects.active',currentProject);
    activeProjectStatusBar.text = `$(folder) ${currentProject}`;
    let data;
    if (typeof(event.selection[0].data) === 'object') {
      data = event.selection[0].data;
    } else {
      data = webezy.projects[currentProject].packages[event.selection[0].data];
      if (data === undefined) {
        data = webezy.projects[currentProject].services[event.selection[0].data];
      }
    }
    if (event.selection[0].kind !== 'Project' && event.selection[0].kind !== 'Package' && event.selection[0].kind !== 'Service') {
      commands.executeCommand('setContext','webezy.hasParent',true);
    } else {
      commands.executeCommand('setContext','webezy.hasParent',false);
    }
    currentResourceOnView =event.selection[0];
    WebezyPanel.currentPanel?.setResource(data);
  });
}