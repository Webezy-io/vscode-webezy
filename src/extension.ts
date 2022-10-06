import { commands, TreeView, env, EventEmitter, ExtensionContext, Uri, window, workspace, Terminal, ThemeIcon, StatusBarItem, StatusBarAlignment, FileSystemWatcher, Position, Range, TextEditorRevealType } from "vscode";
import { WebezyPanel } from "./panels/webezy";
import { findFile, getConfig } from "./utilities";

import { WebezyModule } from "./utilities/webezyJson";
import { PathLike, readdirSync } from 'fs';
import { ProjectsView } from "./utilities/treeProvider";
import { CustomType } from "./utilities/interfaces";

import { newProject } from './utilities/newProject';
let watcher: FileSystemWatcher;
let activeProjectStatusBar: StatusBarItem;
let currentResourceOnView:CustomType;
let treeProvider:ProjectsView;
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
    treeProvider = new ProjectsView(context.extensionUri.fsPath,webezy.projects)
    treeView = window.createTreeView('webezy-projects', {
      treeDataProvider: treeProvider,
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

    console.log('*',filtered,term.name,terminals.length+'/'+projects.length);
    if (filtered) {
      terminals.push(term);
    }
    if (terminals.length === projects.length && projects.length > 0) {
      if(term.name !== 'WZ') {
        activeTerminal = true;
      }
    }
  });

  if (!activeTerminal) {
    await commands.executeCommand('python.setInterpreter');
    console.log(`Empty projects ${webezy?.isEmpty()}`);
    if (webezy && !webezy?.isEmpty()) {
      for (const prj in webezy.projects) {
        let prjPath = webezy.projects[prj].project?.uri;
        terminals.push(window.createTerminal({name:prj,cwd:Uri.file(<string>prjPath),iconPath: Uri.file(context.extensionUri.fsPath+'/favicon.svg')}));
      }
    } else {
      terminals.push(window.createTerminal({name:'WZ',iconPath: Uri.file(context.extensionUri.fsPath+'/favicon.svg')}));
    }
   
  }
  // Create the show hello world command
  WebezyPanel.render(context.extensionUri);

  const showHelloWorldCommand = commands.registerCommand("webezy.help", () => {
    window.activeTerminal?.sendText(`wz --help`);
    commands.executeCommand(`workbench.action.openWalkthrough`, `webezy.vscode-webezy#webezy-setup`, true);
  });
  context.subscriptions.push(showHelloWorldCommand);
  
  const runServer = commands.registerCommand("webezy.run", () => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} --run-server`);
  });
  context.subscriptions.push(runServer);

  const stopServer = commands.registerCommand("webezy.stop", () => {
    window.activeTerminal?.sendText('\u0003');
  });
  context.subscriptions.push(stopServer);


  const build = commands.registerCommand("webezy.build", () => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} --build`);
  });
  context.subscriptions.push(build);

  const showCurrentVersion = commands.registerCommand("webezy.version", () => {
    window.activeTerminal?.sendText(`wz --version`);
  });
  context.subscriptions.push(showCurrentVersion);

  const generatePackage = commands.registerCommand("webezy.generatePackage", () => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g p ${webezyConfig.cli.autoBuild && checkPreBuild(<WebezyModule>webezy,context) ? '--build' : ''}`);
  });
  context.subscriptions.push(generatePackage);

  const generateService = commands.registerCommand("webezy.generateService", () => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g s ${webezyConfig.cli.autoBuild && checkPreBuild(<WebezyModule>webezy,context) ? '--build' : ''}`);
  });
  context.subscriptions.push(generateService);

  const generateMessage = commands.registerCommand("webezy.generateMessage", (parent) => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g m ${parent ? '-p '+parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(<WebezyModule>webezy,context) ? '--build' : ''}`);
  });
  context.subscriptions.push(generateMessage);

  const generateEnum = commands.registerCommand("webezy.generateEnum", (parent) => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g e ${parent ? '-p '+parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(<WebezyModule>webezy,context)  ? '--build' : ''}`);
  });
  context.subscriptions.push(generateEnum);

  const generateRPC = commands.registerCommand("webezy.generateRPC", (parent) => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g r ${parent ? '-p '+parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(<WebezyModule>webezy,context) ? '--build' : ''}`);
  });
  context.subscriptions.push(generateRPC);

  const importPackage = commands.registerCommand("webezy.importPackage", (importStatment) => {
    window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} package ${importStatment}`);
  });
  context.subscriptions.push(importPackage);

  const removePackage = commands.registerCommand("webezy.removePackage", (statment) => {
    window.activeTerminal?.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} package ${statment} --remove`);
  });
  context.subscriptions.push(removePackage);


  const addMessageField = commands.registerCommand("webezy.addMessageField", (message) => {
    window.activeTerminal?.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${message} --action modify --sub-action fields`);
  });
  context.subscriptions.push(addMessageField);


  const addEnumValue = commands.registerCommand("webezy.addEnumValue", (message) => {
    window.activeTerminal?.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${message} --action modify --sub-action values`);
  });
  context.subscriptions.push(addEnumValue);
  
  const copy = commands.registerCommand("webezy.copy", (copyMsg) => {
    env.clipboard.writeText(copyMsg).then(res => {
      window.showInformationMessage(`Copied ${copyMsg}`);
    });
  });
  context.subscriptions.push(copy);

  const openCode = commands.registerCommand("webezy.openCode", (resource) => {
    console.log(resource);
    if (resource.kind === 'Webezy.descriptor/method') {
      let svcLanguage= webezy?.projects[<string>context.globalState.get('webezy.projects.active')].project?.server?.language ? <string><unknown>webezy?.projects[<string>context.globalState.get('webezy.projects.active')].project?.server?.language : 'python'; 
      for (const svc in webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services) {
        let tempResource = webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services[svc].methods.find(el => el.name === resource.name)
        if (tempResource !== undefined) {
          
          workspace.openTextDocument(
            Uri.file(folderPath+'/'+context.globalState.get('webezy.projects.active')+'/services/'+svc+'.'+fileSuffix(svcLanguage))).then(doc => {
              window.showTextDocument(doc).then(res => {
                console.log(res);
              });
          });
        }
      }
      
    }
  });
  context.subscriptions.push(openCode);


  const removeResource = commands.registerCommand("webezy.removeResource", (fullName) => {
    window.activeTerminal?.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${fullName} --action remove`);
  });
  context.subscriptions.push(removeResource);

  WebezyPanel.currentPanel?.setWebezyModule(<any>webezy);
  
  context.subscriptions.push(
    window.registerWebviewViewProvider('webezy-inspector', <any>WebezyPanel.currentPanel));
  // if(WebezyPanel.generatorPanel) {
  //   WebezyPanel.generatorPanel._page = 'Generator';
  // }
  // context.subscriptions.push(
  //     window.registerWebviewViewProvider('webezy-generator', <any>WebezyPanel.generatorPanel));
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
    console.log(webezyConfig.projects.defaultProjects);
   if (webezy) {
      if (webezyConfig.projects.defaultProjects.length > 0) {
        webezy.setDefaultProjects(webezyConfig.projects.defaultProjects);
      }
      webezy.refresh(webezyProjects);
      treeProvider = new ProjectsView(context.extensionUri.fsPath,webezy.projects);
      treeView = window.createTreeView('webezy-projects', {
        treeDataProvider:treeProvider,
        showCollapseAll:true
      });
      initTreeView(treeView,context,webezy,<any>folderPath,activeProjectStatusBar);
    
    }
    if(webezyProjects.length === 0 && webezyConfig.projects.defaultProjects.length > 0) {
      commands.executeCommand('setContext','webezy.projects', false);
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
            window.activeTerminal?.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
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

      if (webezy?.projects[currentActive].packages[pkgName].enums && !msg) {
        enm = webezy?.projects[currentActive].packages[pkgName].enums.find(enm => enm.fullName === resource);
        treeView.reveal({label:resource.split('.').pop(),data:enm,kind:'Enum'});
      } else {
        treeView.reveal({label:resource.split('.').pop(),data:msg,kind:'Message'});
      }

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
        webezy?.refresh();
        WebezyPanel.currentPanel?.setWebezyModule(<any>webezy);
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
    } else if(currentResourceOnView.kind === 'Enum') {
      let pkgName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`
      let pkg = webezy?.projects[currentPrj].packages[pkgName];
      if(pkg) {
        let enm = pkg.enums.find(el => el.name === currentResourceOnView.label);
        if(enm ) {
          parent = {label: pkg.name, data: pkg, kind: 'Package'};
          treeView.reveal(parent);
        }
      }
    } 
    else if(currentResourceOnView.kind === 'RPC') {
      let svcName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`

      window.showErrorMessage("Not supported yet");
    } 

  }));
}

const getDirectories = (source: string) =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && findFile(Uri.joinPath(Uri.file(source), dirent.name, 'webezy.json').fsPath) )
    .map(dirent => dirent.name);


function initTreeView(treeView:TreeView<any>,context:ExtensionContext,webezy:WebezyModule,folderPath:string,statusBar:StatusBarItem) {

  commands.executeCommand('setContext','webezy.projects', true);
  if(watcher) {
    watcher.dispose();
  }
  let currentProject:any='';
  treeView.onDidChangeSelection(event => {
    if(event.selection[0].data.uri !== undefined) {
      console.log(event);
      try {
        if (event.selection[0].data.uri.includes(folderPath)) {
          let term = window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
          if(term === undefined) {
            console.log(window.activeTerminal?.creationOptions.iconPath?.toString())
            let prjName = event.selection[0].data.uri.split(folderPath)[1]
            currentProject = prjName.split('/').length>1 ?prjName.split('/')[1] : prjName ;
            window.createTerminal({name:currentProject,cwd:Uri.file(<string>event.selection[0].data.uri),iconPath: Uri.file(context.extensionUri.fsPath+'/favicon.svg')});

          } else {
            currentProject=term?.name;
            term?.show();
          }
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
    }
    if(currentProject=== undefined) {
      for (const prj in webezy.projects) {
        let project = webezy.projects[prj];
        if(project.services[event.selection[0].data] !== undefined) {
          currentProject= project.project?.name;
        } else if (project.packages[event.selection[0].data] !== undefined) {
          currentProject= project.project?.name;
        }
      }
    }
   
    context.globalState.update('webezy.projects.active',currentProject);


    activeProjectStatusBar.text = `$(folder) ${currentProject}`;
    let data:any;
    if (typeof(event.selection[0].data) === 'object') {
      data = event.selection[0].data;
    } else {
      console.log(webezy.projects[currentProject])

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
    WebezyPanel.currentPanel?.setResource(data,<string>context.globalState.get('webezy.projects.active'));

    watcher = workspace.createFileSystemWatcher( webezy.projects[currentProject].project?.uri+'/webezy.json');
    watcher.onDidChange(el => {
      window.showInformationMessage('Altered webezy.json\n'+el.fsPath);
      setTimeout(() => {
        webezy.refresh();
        commands.executeCommand('webezy.refreshEntry');
        if (typeof(currentResourceOnView.data) === 'object') {
          if(currentResourceOnView.kind === 'Package') {
            let packageName = `protos/${currentResourceOnView.data.package.split('.')[2]}/${currentResourceOnView.data.package.split('.')[1]}.proto`;
            data = webezy.projects[currentProject].packages[packageName];
          } else if(currentResourceOnView.kind === 'Message') {
            let packageName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
            data = webezy.projects[currentProject].packages[packageName].messages.filter(msg => msg.fullName === currentResourceOnView.data.fullName)[0];
          } else if(currentResourceOnView.kind === 'RPC') {
            data = webezy.projects[currentProject].services[currentResourceOnView.data.fullName.split('.')[1]].methods.filter(el => el.fullName === currentResourceOnView.data.fullName);
          } else if (currentResourceOnView.kind === 'Enum') {
            let packageName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
            data = webezy.projects[currentProject].packages[packageName].enums.filter(el => el.fullName === currentResourceOnView.data.fullName)[0];
          } else if (currentResourceOnView.kind === 'Project') {
            data = webezy.projects[currentProject];
          }
        } else {
          console.log(webezy.projects[currentProject])
    
          data = webezy.projects[currentProject].packages[currentResourceOnView.data];
          if (data === undefined) {
            data = webezy.projects[currentProject].services[currentResourceOnView.data];
          }
        }
        console.log('Refreshing data '+JSON.stringify(data));
        WebezyPanel.currentPanel?.setWebezyModule(<any>webezy);

        WebezyPanel.currentPanel?.setResource(data,<string>context.globalState.get('webezy.projects.active'));

      },500);
    });

    console.log(event.selection[0].data.kind,event.selection[0].data.type);
    try {
      if(event.selection[0].data.kind) {
        console.log("Selected "+event.selection[0].data.kind);
        if(event.selection[0].data.type === 'projects') {
          workspace.openTextDocument(Uri.file(folderPath+'/'+context.globalState.get('webezy.projects.active')+'/webezy.json')).then(doc => {
            if (doc) {
              window.showTextDocument(doc);
            } else {
              window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`)
            }
          });
        } else if(event.selection[0].data.type === 'descriptors') {
          if(event.selection[0].kind === 'Message') {
            workspace.openTextDocument(Uri.file(folderPath+'/'+context.globalState.get('webezy.projects.active')+'/protos/'+event.selection[0].data.fullName.split('.')[1]+'.proto')).then(doc => {
              if (doc) {
                window.showTextDocument(doc).then(res => {
                  let pos = window.activeTextEditor?.document.getText().split('\n').findIndex((v,i) => v.includes(`message ${event.selection[0].data.name}`))
                  pos = pos ? pos : 0;
                  let posEnd = pos ? pos + event.selection[0].data.fields.length : 0
                  window.activeTextEditor?.revealRange(new Range(new Position(<number>pos,9),new Position(posEnd,0)),TextEditorRevealType.InCenter);
                  let isAfter = window.activeTextEditor?.selection.active.isAfter(new Position(<number>pos,0));
                  let diff = 0;

                  if(isAfter) {
                    diff = window.activeTextEditor?.selection.start.line ? window.activeTextEditor?.selection.start.line - pos : 0 + pos;
                  } else {
                    diff = window.activeTextEditor?.selection.start.line ? pos - window.activeTextEditor?.selection.start.line  : 0 + pos;
                  }
                  commands.executeCommand("cursorMove",
                  {
                      to: isAfter ? 'up' : 'down', by:'wrappedLine', value: diff
                  });
                });
              } else {
                window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`)
              }
            });
          } else if(event.selection[0].kind === 'Enum') {
            workspace.openTextDocument(Uri.file(folderPath+'/'+context.globalState.get('webezy.projects.active')+'/protos/'+event.selection[0].data.fullName.split('.')[1]+'.proto')).then(doc => {
              if (doc) {
                window.showTextDocument(doc).then(res => {
                  let pos = window.activeTextEditor?.document.getText().split('\n').findIndex((v,i) => v.includes(`enum ${event.selection[0].data.name}`))
                  pos = pos ? pos : 0;
                  let posEnd = pos ? pos + event.selection[0].data.values.length : 0
                  window.activeTextEditor?.revealRange(new Range(new Position(<number>pos,6),new Position(posEnd,0)),TextEditorRevealType.InCenter);
                  let isAfter = window.activeTextEditor?.selection.active.isAfter(new Position(<number>pos,0));
                  let diff = 0;

                  if(isAfter) {
                    diff = window.activeTextEditor?.selection.start.line ? window.activeTextEditor?.selection.start.line - pos : 0 + pos;
                  } else {
                    diff = window.activeTextEditor?.selection.start.line ? pos - window.activeTextEditor?.selection.start.line  : 0 + pos;
                  }
                  commands.executeCommand("cursorMove",
                  {
                      to: isAfter ? 'up' : 'down', by:'wrappedLine', value: diff
                  });
                });
              } else {
                window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`);
              }
            });
          } else if(event.selection[0].kind === 'RPC') {
            let serviceName;
            for (const svc in webezy.projects[currentProject].services) {
              let s = webezy.projects[currentProject].services[svc].methods.find(el => el.name ===event.selection[0].data.name);
              if (s) {
                serviceName = svc;
              }
            }
            workspace.openTextDocument(Uri.file(folderPath+'/'+context.globalState.get('webezy.projects.active')+'/protos/'+serviceName+'.proto')).then(doc => {
              if (doc) {
                window.showTextDocument(doc).then(res => {
                  let pos = window.activeTextEditor?.document.getText().split('\n').findIndex((v,i) => v.includes(`rpc ${event.selection[0].data.name}`))
                  pos = pos ? pos : 0;
                  window.activeTextEditor?.revealRange(new Range(new Position(<number>pos,9),new Position(pos,event.selection[0].data.name.length)),TextEditorRevealType.InCenter);
                  let isAfter = window.activeTextEditor?.selection.active.isAfter(new Position(<number>pos,0));
                  let diff = 0;

                  if(isAfter) {
                    diff = window.activeTextEditor?.selection.start.line ? window.activeTextEditor?.selection.start.line - pos : 0 + pos;
                  } else {
                    diff = window.activeTextEditor?.selection.start.line ? pos - window.activeTextEditor?.selection.start.line  : 0 + pos;
                  }
                  commands.executeCommand("cursorMove",
                  {
                      to: isAfter ? 'up' : 'down', by:'wrappedLine', value: diff
                  });
                });
              } else {
                window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`)
              }
            });
          }
  
        } 
      } else {
        console.log("Selected "+event.selection[0].data.type);
      }
    } catch (error:any) {
      console.log(error)
      window.showErrorMessage("Please build project to view code")
    }
    
  });
}

export async function dispose() {
  window.terminals.forEach(term => {
    if(term.name === 'WZ') {
       term.dispose();
    }
  });

  watcher.dispose();
}

function checkPreBuild(webezy:WebezyModule,context:ExtensionContext):boolean {
  let packagesReady = false;
  let servicesReady = false;

  if (webezy?.projects[<string>context.globalState.get('webezy.projects.active')].packages !== undefined && webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services !== undefined) {
    for (const pkg in webezy?.projects[<string>context.globalState.get('webezy.projects.active')].packages) {
      if (webezy?.projects[<string>context.globalState.get('webezy.projects.active')].packages[pkg].messages !== undefined) {
        if (webezy?.projects[<string>context.globalState.get('webezy.projects.active')].packages[pkg].messages.length>0) {
          packagesReady = true;
        } else {
          packagesReady = false;
        }
      } else {
        packagesReady = false;
      }
    }
  
    for (const svc in webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services) {
      if(webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services[svc].methods !== undefined) {
        if(webezy?.projects[<string>context.globalState.get('webezy.projects.active')].services[svc].methods.length>0) {
          servicesReady = true;
        } else {
          servicesReady = false;
        }
      } else {
        servicesReady = false;
      }
    }
  } 
  return servicesReady && packagesReady;
}

function fileSuffix(language:string):string {
  let suffix = 'py';
  if (language === 'python') {
    suffix = 'py';
  }

  return suffix;
}