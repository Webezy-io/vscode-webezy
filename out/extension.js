"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispose = exports.activate = void 0;
const vscode_1 = require("vscode");
const webezy_1 = require("./panels/webezy");
const utilities_1 = require("./utilities");
const webezyJson_1 = require("./utilities/webezyJson");
const fs_1 = require("fs");
const treeProvider_1 = require("./utilities/treeProvider");
const newProject_1 = require("./utilities/newProject");
let watcher;
let activeProjectStatusBar;
let currentResourceOnView;
let treeProvider;
function activate(context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        vscode_1.commands.executeCommand('setContext', 'webezy.projects', false);
        let folderName = vscode_1.workspace.name; // get the open folder name
        let webezyConfig = (0, utilities_1.getConfig)();
        console.log(webezyConfig);
        context.globalState.update('webezy.projects.defaultProjects', webezyConfig.projects.defaultProjects);
        activeProjectStatusBar = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 100);
        activeProjectStatusBar.text = '$(folder)';
        activeProjectStatusBar.show();
        let folderPath = vscode_1.workspace.rootPath; // get the open folder path
        let webezyProjects = getDirectories(folderPath);
        let webezy;
        let treeView;
        context.subscriptions.push(activeProjectStatusBar);
        if (folderPath !== undefined) {
            webezy = new webezyJson_1.WebezyModule(folderPath, webezyProjects);
            if (webezyConfig.projects.defaultProjects.length > 0) {
                webezy.setDefaultProjects(webezyConfig.projects.defaultProjects);
                console.log("Loading default projects");
                webezy.refresh();
            }
            treeProvider = new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects);
            treeView = vscode_1.window.createTreeView('webezy-projects', {
                treeDataProvider: treeProvider,
                showCollapseAll: true
            });
            initTreeView(treeView, context, webezy, folderPath, activeProjectStatusBar);
        }
        else {
            vscode_1.window.showErrorMessage("webezy: couldn't get current folder path !");
        }
        let activeTerminal = false;
        let terminals = [];
        let projects = [];
        for (const prj in webezy === null || webezy === void 0 ? void 0 : webezy.projects) {
            projects.push(prj);
        }
        vscode_1.window.terminals.forEach(term => {
            let filtered = projects.find(prj => term.name.includes(prj));
            console.log('*', filtered, term.name, terminals.length + '/' + projects.length);
            if (filtered) {
                terminals.push(term);
            }
            if (terminals.length === projects.length && projects.length > 0) {
                if (term.name !== 'WZ') {
                    activeTerminal = true;
                }
            }
        });
        if (!activeTerminal) {
            yield vscode_1.commands.executeCommand('python.setInterpreter');
            console.log(`Empty projects ${webezy === null || webezy === void 0 ? void 0 : webezy.isEmpty()}`);
            if (webezy && !(webezy === null || webezy === void 0 ? void 0 : webezy.isEmpty())) {
                for (const prj in webezy.projects) {
                    let prjPath = (_a = webezy.projects[prj].project) === null || _a === void 0 ? void 0 : _a.uri;
                    terminals.push(vscode_1.window.createTerminal({ name: prj, cwd: vscode_1.Uri.file(prjPath), iconPath: vscode_1.Uri.file(context.extensionUri.fsPath + '/favicon.svg') }));
                }
            }
            else {
                terminals.push(vscode_1.window.createTerminal({ name: 'WZ', iconPath: vscode_1.Uri.file(context.extensionUri.fsPath + '/favicon.svg') }));
            }
        }
        // Create the show hello world command
        webezy_1.WebezyPanel.render(context.extensionUri);
        const showHelloWorldCommand = vscode_1.commands.registerCommand("webezy.help", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --help`);
            vscode_1.commands.executeCommand(`workbench.action.openWalkthrough`, `webezy.vscode-webezy#webezy-setup`, true);
        });
        context.subscriptions.push(showHelloWorldCommand);
        const runServer = vscode_1.commands.registerCommand("webezy.run", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} --run-server`);
        });
        context.subscriptions.push(runServer);
        const stopServer = vscode_1.commands.registerCommand("webezy.stop", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText('\u0003');
        });
        context.subscriptions.push(stopServer);
        const build = vscode_1.commands.registerCommand("webezy.build", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} --build`);
        });
        context.subscriptions.push(build);
        const showCurrentVersion = vscode_1.commands.registerCommand("webezy.version", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --version`);
        });
        context.subscriptions.push(showCurrentVersion);
        const generatePackage = vscode_1.commands.registerCommand("webezy.generatePackage", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g p ${webezyConfig.cli.autoBuild && checkPreBuild(webezy, context) ? '--build' : ''}`);
        });
        context.subscriptions.push(generatePackage);
        const generateService = vscode_1.commands.registerCommand("webezy.generateService", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g s ${webezyConfig.cli.autoBuild && checkPreBuild(webezy, context) ? '--build' : ''}`);
        });
        context.subscriptions.push(generateService);
        const generateMessage = vscode_1.commands.registerCommand("webezy.generateMessage", (parent) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g m ${parent ? '-p ' + parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(webezy, context) ? '--build' : ''}`);
        });
        context.subscriptions.push(generateMessage);
        const generateEnum = vscode_1.commands.registerCommand("webezy.generateEnum", (parent) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g e ${parent ? '-p ' + parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(webezy, context) ? '--build' : ''}`);
        });
        context.subscriptions.push(generateEnum);
        const generateRPC = vscode_1.commands.registerCommand("webezy.generateRPC", (parent) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} ${webezyConfig.cli.autoExpand ? '-e' : ''} g r ${parent ? '-p ' + parent : ''} ${webezyConfig.cli.autoBuild && checkPreBuild(webezy, context) ? '--build' : ''}`);
        });
        context.subscriptions.push(generateRPC);
        const importPackage = vscode_1.commands.registerCommand("webezy.importPackage", (importStatment) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} package ${importStatment}`);
        });
        context.subscriptions.push(importPackage);
        const removePackage = vscode_1.commands.registerCommand("webezy.removePackage", (statment) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} package ${statment} --remove`);
        });
        context.subscriptions.push(removePackage);
        const addMessageField = vscode_1.commands.registerCommand("webezy.addMessageField", (message) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${message} --action modify --sub-action fields`);
        });
        context.subscriptions.push(addMessageField);
        const addEnumValue = vscode_1.commands.registerCommand("webezy.addEnumValue", (message) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${message} --action modify --sub-action values`);
        });
        context.subscriptions.push(addEnumValue);
        const copy = vscode_1.commands.registerCommand("webezy.copy", (copyMsg) => {
            vscode_1.env.clipboard.writeText(copyMsg).then(res => {
                vscode_1.window.showInformationMessage(`Copied ${copyMsg}`);
            });
        });
        context.subscriptions.push(copy);
        const openCode = vscode_1.commands.registerCommand("webezy.openCode", (resource) => {
            var _a, _b, _c, _d;
            console.log(resource);
            if (resource.kind === 'Webezy.descriptor/method') {
                let svcLanguage = ((_b = (_a = webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].project) === null || _a === void 0 ? void 0 : _a.server) === null || _b === void 0 ? void 0 : _b.language) ? (_d = (_c = webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].project) === null || _c === void 0 ? void 0 : _c.server) === null || _d === void 0 ? void 0 : _d.language : 'python';
                for (const svc in webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services) {
                    let tempResource = webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services[svc].methods.find(el => el.name === resource.name);
                    if (tempResource !== undefined) {
                        vscode_1.workspace.openTextDocument(vscode_1.Uri.file(folderPath + '/' + context.globalState.get('webezy.projects.active') + '/services/' + svc + '.' + fileSuffix(svcLanguage))).then(doc => {
                            vscode_1.window.showTextDocument(doc).then(res => {
                                console.log(res);
                            });
                        });
                    }
                }
            }
        });
        context.subscriptions.push(openCode);
        const removeResource = vscode_1.commands.registerCommand("webezy.removeResource", (fullName) => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz  --loglevel ${webezyConfig.cli.logLevel} edit ${fullName} --action remove`);
        });
        context.subscriptions.push(removeResource);
        (_b = webezy_1.WebezyPanel.currentPanel) === null || _b === void 0 ? void 0 : _b.setWebezyModule(webezy);
        context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('webezy-inspector', webezy_1.WebezyPanel.currentPanel));
        // if(WebezyPanel.generatorPanel) {
        //   WebezyPanel.generatorPanel._page = 'Generator';
        // }
        // context.subscriptions.push(
        //     window.registerWebviewViewProvider('webezy-generator', <any>WebezyPanel.generatorPanel));
        if (webezy_1.WebezyPanel.helpPanel) {
            webezy_1.WebezyPanel.helpPanel._page = 'Help';
        }
        context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('webezy-help', webezy_1.WebezyPanel.helpPanel));
        let refresh = vscode_1.commands.registerCommand('webezy.refreshEntry', () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            let folderPath = vscode_1.workspace.rootPath; // get the open folder path
            let webezyProjects = getDirectories(folderPath);
            console.log(webezyConfig.projects.defaultProjects);
            if (webezy) {
                if (webezyConfig.projects.defaultProjects.length > 0) {
                    webezy.setDefaultProjects(webezyConfig.projects.defaultProjects);
                }
                webezy.refresh(webezyProjects);
                treeProvider = new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects);
                treeView = vscode_1.window.createTreeView('webezy-projects', {
                    treeDataProvider: treeProvider,
                    showCollapseAll: true
                });
                initTreeView(treeView, context, webezy, folderPath, activeProjectStatusBar);
            }
            if (webezyProjects.length === 0 && webezyConfig.projects.defaultProjects.length > 0) {
                vscode_1.commands.executeCommand('setContext', 'webezy.projects', false);
            }
            // terminal.sendText("echo 'Sent text immediately after creating'");
            vscode_1.window.showInformationMessage('Refreshed projects view');
        });
        context.subscriptions.push(refresh);
        let onConfEdit = vscode_1.workspace.onDidChangeConfiguration(e => {
            webezyConfig = (0, utilities_1.getConfig)();
            // Check if a projects.defaultProjects configuration is changed
            if (e.affectsConfiguration('webezy.projects.defaultProjects')) {
                vscode_1.commands.executeCommand('webezy.refreshEntry');
            }
        });
        context.subscriptions.push(onConfEdit);
        context.subscriptions.push(vscode_1.commands.registerCommand('webezy.wz', () => __awaiter(this, void 0, void 0, function* () {
            const options = {
                newProject: newProject_1.newProject,
            };
            const quickPick = vscode_1.window.createQuickPick();
            quickPick.items = Object.keys(options).map(label => ({ label }));
            quickPick.onDidChangeSelection(selection => {
                if (selection[0]) {
                    options[selection[0].label](context, webezy).then(res => {
                        var _a;
                        let clients = '';
                        res.clients.forEach((c) => {
                            clients = clients + ' ' + c.label.toLowerCase();
                        });
                        console.log('Running ->', `wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
                        (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --loglevel ${webezyConfig.cli.logLevel} n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
                        setTimeout(() => {
                            vscode_1.commands.executeCommand('webezy.refreshEntry');
                        }, 2000);
                    }).catch(console.error);
                }
            });
            quickPick.onDidHide(() => quickPick.dispose());
            quickPick.show();
        })));
        let resourceReveal = vscode_1.commands.registerCommand('webezy.reveal', (resource) => {
            console.log();
            let currentActive = context.globalState.get('webezy.projects.active');
            if (resource.split('.').length > 3) {
                let pkgName = `protos/${resource.split('.')[2]}/${resource.split('.')[1]}.proto`;
                let msg = undefined;
                let enm = undefined;
                if (webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName].messages) {
                    msg = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName].messages.find(msg => msg.fullName === resource);
                }
                if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName].enums) && !msg) {
                    enm = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName].enums.find(enm => enm.fullName === resource);
                    treeView.reveal({ label: resource.split('.').pop(), data: enm, kind: 'Enum' });
                }
                else {
                    treeView.reveal({ label: resource.split('.').pop(), data: msg, kind: 'Message' });
                }
            }
            else if (resource.split('.').length === 3) {
                let pkgName = `protos/${resource.split('.')[2]}/${resource.split('.')[1]}.proto`;
                if (webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName]) {
                    let p = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].packages[pkgName];
                    treeView.reveal({ label: resource.split('.')[1], data: p, kind: 'Package' });
                }
            }
            else if (webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].services[resource]) {
                let s = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].services[resource];
                treeView.reveal({ label: resource, data: s, kind: 'Service' });
            }
            else {
                for (const svc in webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].services) {
                    let service = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentActive].services[svc];
                    let rpc = service === null || service === void 0 ? void 0 : service.methods.find(rpc => rpc.name === resource);
                    if (rpc) {
                        treeView.reveal({ label: resource, data: rpc, kind: 'RPC' });
                    }
                }
            }
        });
        context.subscriptions.push(resourceReveal);
        context.subscriptions.push(vscode_1.commands.registerCommand('webezy.viewSources', () => {
            return { openFolder: vscode_1.Uri.joinPath(context.extensionUri, 'src') };
        }));
        context.subscriptions.push(vscode_1.commands.registerCommand('webezy.newProject', () => __awaiter(this, void 0, void 0, function* () {
            (0, newProject_1.newProject)(context, webezy).then((res) => {
                var _a;
                let clients = '';
                res.clients.forEach((c) => {
                    clients = clients + ' ' + c.label.toLowerCase();
                });
                console.log('Running ->', `wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
                (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
                setTimeout(() => {
                    var _a;
                    vscode_1.commands.executeCommand('webezy.refreshEntry');
                    webezy === null || webezy === void 0 ? void 0 : webezy.refresh();
                    (_a = webezy_1.WebezyPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.setWebezyModule(webezy);
                }, 2000);
            });
        })));
        context.subscriptions.push(vscode_1.commands.registerCommand('webezy.getParent', () => __awaiter(this, void 0, void 0, function* () {
            let currentPrj = context.globalState.get('webezy.projects.active');
            let prj = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentPrj];
            let parent = {};
            if (currentResourceOnView.kind === 'Message') {
                let pkgName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
                let pkg = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentPrj].packages[pkgName];
                if (pkg) {
                    let msg = pkg.messages.find(el => el.name === currentResourceOnView.label);
                    if (msg) {
                        parent = { label: pkg.name, data: pkg, kind: 'Package' };
                        treeView.reveal(parent);
                    }
                }
            }
            else if (currentResourceOnView.kind === 'Enum') {
                let pkgName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
                let pkg = webezy === null || webezy === void 0 ? void 0 : webezy.projects[currentPrj].packages[pkgName];
                if (pkg) {
                    let enm = pkg.enums.find(el => el.name === currentResourceOnView.label);
                    if (enm) {
                        parent = { label: pkg.name, data: pkg, kind: 'Package' };
                        treeView.reveal(parent);
                    }
                }
            }
            else if (currentResourceOnView.kind === 'RPC') {
                let svcName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
                vscode_1.window.showErrorMessage("Not supported yet");
            }
        })));
    });
}
exports.activate = activate;
const getDirectories = (source) => (0, fs_1.readdirSync)(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && (0, utilities_1.findFile)(vscode_1.Uri.joinPath(vscode_1.Uri.file(source), dirent.name, 'webezy.json').fsPath))
    .map(dirent => dirent.name);
function initTreeView(treeView, context, webezy, folderPath, statusBar) {
    vscode_1.commands.executeCommand('setContext', 'webezy.projects', true);
    let currentProject = '';
    treeView.onDidChangeSelection(event => {
        var _a, _b, _c, _d, _e, _f;
        if (event.selection[0].data.uri !== undefined) {
            console.log(event);
            try {
                if (event.selection[0].data.uri.includes(folderPath)) {
                    let term = vscode_1.window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
                    if (term === undefined) {
                        console.log((_b = (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.creationOptions.iconPath) === null || _b === void 0 ? void 0 : _b.toString());
                        let prjName = event.selection[0].data.uri.split(folderPath)[1];
                        currentProject = prjName.split('/').length > 1 ? prjName.split('/')[1] : prjName;
                        vscode_1.window.createTerminal({ name: currentProject, cwd: vscode_1.Uri.file(event.selection[0].data.uri), iconPath: vscode_1.Uri.file(context.extensionUri.fsPath + '/favicon.svg') });
                    }
                    else {
                        currentProject = term === null || term === void 0 ? void 0 : term.name;
                        term === null || term === void 0 ? void 0 : term.show();
                    }
                }
                else {
                    let defaults = context.globalState.get('webezy.projects.defaultProjects');
                    let project = defaults.find(el => event.selection[0].data.uri.includes(el));
                    let term = vscode_1.window.terminals.find(term => term.name === (project === null || project === void 0 ? void 0 : project.split('/').pop()));
                    currentProject = term === null || term === void 0 ? void 0 : term.name;
                    term === null || term === void 0 ? void 0 : term.show();
                }
            }
            catch (error) {
                vscode_1.window.showErrorMessage(error.message);
            }
        }
        if (currentProject === undefined) {
            for (const prj in webezy.projects) {
                let project = webezy.projects[prj];
                if (project.services[event.selection[0].data] !== undefined) {
                    currentProject = (_c = project.project) === null || _c === void 0 ? void 0 : _c.name;
                }
                else if (project.packages[event.selection[0].data] !== undefined) {
                    currentProject = (_d = project.project) === null || _d === void 0 ? void 0 : _d.name;
                }
            }
        }
        context.globalState.update('webezy.projects.active', currentProject);
        activeProjectStatusBar.text = `$(folder) ${currentProject}`;
        let data;
        if (typeof (event.selection[0].data) === 'object') {
            data = event.selection[0].data;
        }
        else {
            console.log(webezy.projects[currentProject]);
            data = webezy.projects[currentProject].packages[event.selection[0].data];
            if (data === undefined) {
                data = webezy.projects[currentProject].services[event.selection[0].data];
            }
        }
        if (event.selection[0].kind !== 'Project' && event.selection[0].kind !== 'Package' && event.selection[0].kind !== 'Service') {
            vscode_1.commands.executeCommand('setContext', 'webezy.hasParent', true);
        }
        else {
            vscode_1.commands.executeCommand('setContext', 'webezy.hasParent', false);
        }
        currentResourceOnView = event.selection[0];
        (_e = webezy_1.WebezyPanel.currentPanel) === null || _e === void 0 ? void 0 : _e.setResource(data, context.globalState.get('webezy.projects.active'));
        watcher = vscode_1.workspace.createFileSystemWatcher(((_f = webezy.projects[currentProject].project) === null || _f === void 0 ? void 0 : _f.uri) + '/webezy.json');
        watcher.onDidChange(el => {
            vscode_1.window.showInformationMessage('Altered webezy.json\n' + el.fsPath);
            setTimeout(() => {
                var _a, _b, _c;
                console.log('Chnaged current resource', currentResourceOnView);
                webezy.refresh();
                vscode_1.commands.executeCommand('webezy.refreshEntry');
                if (typeof (currentResourceOnView.data) === 'object') {
                    if (currentResourceOnView.kind === 'Package') {
                        let packageName = `protos/${currentResourceOnView.data.package.split('.')[2]}/${currentResourceOnView.data.package.split('.')[1]}.proto`;
                        data = webezy.projects[currentProject].packages[packageName];
                    }
                    else if (currentResourceOnView.kind === 'Message') {
                        let packageName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
                        data = webezy.projects[currentProject].packages[packageName].messages.filter(msg => msg.fullName === currentResourceOnView.data.fullName)[0];
                    }
                    else if (currentResourceOnView.kind === 'RPC') {
                        data = webezy.projects[currentProject].services[currentResourceOnView.data.fullName.split('.')[1]].methods.filter(el => el.fullName === currentResourceOnView.data.fullName);
                    }
                    else if (currentResourceOnView.kind === 'Enum') {
                        let packageName = `protos/${currentResourceOnView.data.fullName.split('.')[2]}/${currentResourceOnView.data.fullName.split('.')[1]}.proto`;
                        data = webezy.projects[currentProject].packages[packageName].enums.filter(el => el.fullName === currentResourceOnView.data.fullName)[0];
                    }
                    else if (currentResourceOnView.kind === 'Project') {
                        data = webezy.projects[currentProject];
                    }
                }
                else {
                    data = webezy.projects[currentProject].packages[currentResourceOnView.data];
                    if (data === undefined) {
                        data = webezy.projects[currentProject].services[currentResourceOnView.data];
                    }
                }
                console.log('seting resource', data);
                (_a = webezy_1.WebezyPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.setWebezyModule(webezy);
                (_b = webezy_1.WebezyPanel.currentPanel) === null || _b === void 0 ? void 0 : _b.refreshAppModule();
                (_c = webezy_1.WebezyPanel.currentPanel) === null || _c === void 0 ? void 0 : _c.setResource(data, context.globalState.get('webezy.projects.active'));
            }, 500);
        });
        console.log(event.selection[0].data.kind, event.selection[0].data.type);
        try {
            if (event.selection[0].data.kind) {
                console.log("Selected " + event.selection[0].data.kind);
                if (event.selection[0].data.type === 'projects') {
                    vscode_1.workspace.openTextDocument(vscode_1.Uri.file(folderPath + '/' + context.globalState.get('webezy.projects.active') + '/webezy.json')).then(doc => {
                        if (doc) {
                            vscode_1.window.showTextDocument(doc);
                        }
                        else {
                            vscode_1.window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`);
                        }
                    });
                }
                else if (event.selection[0].data.type === 'descriptors') {
                    if (event.selection[0].kind === 'Message') {
                        vscode_1.workspace.openTextDocument(vscode_1.Uri.file(folderPath + '/' + context.globalState.get('webezy.projects.active') + '/protos/' + event.selection[0].data.fullName.split('.')[1] + '.proto')).then(doc => {
                            if (doc) {
                                vscode_1.window.showTextDocument(doc).then(res => {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    let pos = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText().split('\n').findIndex((v, i) => v.includes(`message ${event.selection[0].data.name}`));
                                    pos = pos ? pos : 0;
                                    let posEnd = pos ? pos + event.selection[0].data.fields.length : 0;
                                    (_b = vscode_1.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.revealRange(new vscode_1.Range(new vscode_1.Position(pos, 9), new vscode_1.Position(posEnd, 0)), vscode_1.TextEditorRevealType.InCenter);
                                    let isAfter = (_c = vscode_1.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.selection.active.isAfter(new vscode_1.Position(pos, 0));
                                    let diff = 0;
                                    if (isAfter) {
                                        diff = ((_d = vscode_1.window.activeTextEditor) === null || _d === void 0 ? void 0 : _d.selection.start.line) ? ((_e = vscode_1.window.activeTextEditor) === null || _e === void 0 ? void 0 : _e.selection.start.line) - pos : 0 + pos;
                                    }
                                    else {
                                        diff = ((_f = vscode_1.window.activeTextEditor) === null || _f === void 0 ? void 0 : _f.selection.start.line) ? pos - ((_g = vscode_1.window.activeTextEditor) === null || _g === void 0 ? void 0 : _g.selection.start.line) : 0 + pos;
                                    }
                                    vscode_1.commands.executeCommand("cursorMove", {
                                        to: isAfter ? 'up' : 'down', by: 'wrappedLine', value: diff
                                    });
                                });
                            }
                            else {
                                vscode_1.window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`);
                            }
                        });
                    }
                    else if (event.selection[0].kind === 'Enum') {
                        vscode_1.workspace.openTextDocument(vscode_1.Uri.file(folderPath + '/' + context.globalState.get('webezy.projects.active') + '/protos/' + event.selection[0].data.fullName.split('.')[1] + '.proto')).then(doc => {
                            if (doc) {
                                vscode_1.window.showTextDocument(doc).then(res => {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    let pos = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText().split('\n').findIndex((v, i) => v.includes(`enum ${event.selection[0].data.name}`));
                                    pos = pos ? pos : 0;
                                    let posEnd = pos ? pos + event.selection[0].data.values.length : 0;
                                    (_b = vscode_1.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.revealRange(new vscode_1.Range(new vscode_1.Position(pos, 6), new vscode_1.Position(posEnd, 0)), vscode_1.TextEditorRevealType.InCenter);
                                    let isAfter = (_c = vscode_1.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.selection.active.isAfter(new vscode_1.Position(pos, 0));
                                    let diff = 0;
                                    if (isAfter) {
                                        diff = ((_d = vscode_1.window.activeTextEditor) === null || _d === void 0 ? void 0 : _d.selection.start.line) ? ((_e = vscode_1.window.activeTextEditor) === null || _e === void 0 ? void 0 : _e.selection.start.line) - pos : 0 + pos;
                                    }
                                    else {
                                        diff = ((_f = vscode_1.window.activeTextEditor) === null || _f === void 0 ? void 0 : _f.selection.start.line) ? pos - ((_g = vscode_1.window.activeTextEditor) === null || _g === void 0 ? void 0 : _g.selection.start.line) : 0 + pos;
                                    }
                                    vscode_1.commands.executeCommand("cursorMove", {
                                        to: isAfter ? 'up' : 'down', by: 'wrappedLine', value: diff
                                    });
                                });
                            }
                            else {
                                vscode_1.window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`);
                            }
                        });
                    }
                    else if (event.selection[0].kind === 'RPC') {
                        let serviceName;
                        for (const svc in webezy.projects[currentProject].services) {
                            let s = webezy.projects[currentProject].services[svc].methods.find(el => el.name === event.selection[0].data.name);
                            if (s) {
                                serviceName = svc;
                            }
                        }
                        vscode_1.workspace.openTextDocument(vscode_1.Uri.file(folderPath + '/' + context.globalState.get('webezy.projects.active') + '/protos/' + serviceName + '.proto')).then(doc => {
                            if (doc) {
                                vscode_1.window.showTextDocument(doc).then(res => {
                                    var _a, _b, _c, _d, _e, _f, _g;
                                    let pos = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText().split('\n').findIndex((v, i) => v.includes(`rpc ${event.selection[0].data.name}`));
                                    pos = pos ? pos : 0;
                                    (_b = vscode_1.window.activeTextEditor) === null || _b === void 0 ? void 0 : _b.revealRange(new vscode_1.Range(new vscode_1.Position(pos, 9), new vscode_1.Position(pos, event.selection[0].data.name.length)), vscode_1.TextEditorRevealType.InCenter);
                                    let isAfter = (_c = vscode_1.window.activeTextEditor) === null || _c === void 0 ? void 0 : _c.selection.active.isAfter(new vscode_1.Position(pos, 0));
                                    let diff = 0;
                                    if (isAfter) {
                                        diff = ((_d = vscode_1.window.activeTextEditor) === null || _d === void 0 ? void 0 : _d.selection.start.line) ? ((_e = vscode_1.window.activeTextEditor) === null || _e === void 0 ? void 0 : _e.selection.start.line) - pos : 0 + pos;
                                    }
                                    else {
                                        diff = ((_f = vscode_1.window.activeTextEditor) === null || _f === void 0 ? void 0 : _f.selection.start.line) ? pos - ((_g = vscode_1.window.activeTextEditor) === null || _g === void 0 ? void 0 : _g.selection.start.line) : 0 + pos;
                                    }
                                    vscode_1.commands.executeCommand("cursorMove", {
                                        to: isAfter ? 'up' : 'down', by: 'wrappedLine', value: diff
                                    });
                                });
                            }
                            else {
                                vscode_1.window.showErrorMessage(`Error while trying to open -> ${event.selection[0].data.uri}`);
                            }
                        });
                    }
                }
            }
            else {
                console.log("Selected " + event.selection[0].data.type);
            }
        }
        catch (error) {
            console.log(error);
            vscode_1.window.showErrorMessage("Please build project to view code");
        }
    });
}
function dispose() {
    return __awaiter(this, void 0, void 0, function* () {
        vscode_1.window.terminals.forEach(term => {
            if (term.name === 'WZ') {
                term.dispose();
            }
        });
        watcher.dispose();
    });
}
exports.dispose = dispose;
function checkPreBuild(webezy, context) {
    let packagesReady = false;
    let servicesReady = false;
    if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].packages) !== undefined && (webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services) !== undefined) {
        for (const pkg in webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].packages) {
            if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].packages[pkg].messages) !== undefined) {
                if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].packages[pkg].messages.length) > 0) {
                    packagesReady = true;
                }
                else {
                    packagesReady = false;
                }
            }
            else {
                packagesReady = false;
            }
        }
        for (const svc in webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services) {
            if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services[svc].methods) !== undefined) {
                if ((webezy === null || webezy === void 0 ? void 0 : webezy.projects[context.globalState.get('webezy.projects.active')].services[svc].methods.length) > 0) {
                    servicesReady = true;
                }
                else {
                    servicesReady = false;
                }
            }
            else {
                servicesReady = false;
            }
        }
    }
    return servicesReady && packagesReady;
}
function fileSuffix(language) {
    let suffix = 'py';
    if (language === 'python') {
        suffix = 'py';
    }
    return suffix;
}
//# sourceMappingURL=extension.js.map