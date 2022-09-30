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
let activeProjectStatusBar;
let currentResourceOnView;
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
            treeView = vscode_1.window.createTreeView('webezy-projects', {
                treeDataProvider: new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects),
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
        const showCurrentVersion = vscode_1.commands.registerCommand("webezy.version", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --version`);
        });
        context.subscriptions.push(showCurrentVersion);
        (_b = webezy_1.WebezyPanel.currentPanel) === null || _b === void 0 ? void 0 : _b.setWebezyModule(webezy);
        context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('webezy-inspector', webezy_1.WebezyPanel.currentPanel));
        if (webezy_1.WebezyPanel.generatorPanel) {
            webezy_1.WebezyPanel.generatorPanel._page = 'Generator';
        }
        context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('webezy-generator', webezy_1.WebezyPanel.generatorPanel));
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
                treeView = vscode_1.window.createTreeView('webezy-projects', {
                    treeDataProvider: new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects),
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
                        (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz n ${res.name} --server-language ${res.serverLanguage.label.toLowerCase()} --clients ${clients} --host ${res.host} --port ${res.port} --domain ${res.domain} --path ${folderPath}`);
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
                }
                else {
                    treeView.reveal({ label: resource.split('.').pop(), data: msg, kind: 'Message' });
                }
                console.log(msg, enm);
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
                    vscode_1.commands.executeCommand('webezy.refreshEntry');
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
            else if (currentResourceOnView.kind === 'RPC') {
                vscode_1.window.showErrorMessage("Not supported yet");
            }
        })));
    });
}
exports.activate = activate;
const getDirectories = (source) => (0, fs_1.readdirSync)(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && (0, utilities_1.findFile)(vscode_1.Uri.joinPath(vscode_1.Uri.file(source), dirent.name, 'webezy.json').fsPath))
    .map(dirent => dirent.name);
function colorText(text) {
    let output = '';
    let colorIndex = 1;
    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === ' ' || char === '\r' || char === '\n') {
            output += char;
        }
        else {
            output += `\x1b[3${colorIndex++}m${text.charAt(i)}\x1b[0m`;
            if (colorIndex > 6) {
                colorIndex = 1;
            }
        }
    }
    return output;
}
function initTreeView(treeView, context, webezy, folderPath, statusBar) {
    vscode_1.commands.executeCommand('setContext', 'webezy.projects', true);
    let currentProject = '';
    treeView.onDidChangeSelection(event => {
        var _a;
        if (event.selection[0].data.uri !== undefined) {
            try {
                if (event.selection[0].data.uri.includes(folderPath)) {
                    let term = vscode_1.window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
                    if (term === undefined) {
                        let prjName = event.selection[0].data.uri.split(folderPath)[1];
                        currentProject = prjName.split('/').length > 1 ? prjName.split('/')[1] : prjName;
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
            // statusBar.text = `$(folder) ${currentProject}`;
            // statusBar.show();
        }
        console.log(currentProject);
        context.globalState.update('webezy.projects.active', currentProject);
        activeProjectStatusBar.text = `$(folder) ${currentProject}`;
        let data;
        if (typeof (event.selection[0].data) === 'object') {
            data = event.selection[0].data;
        }
        else {
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
        (_a = webezy_1.WebezyPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.setResource(data);
    });
}
function dispose() {
    return __awaiter(this, void 0, void 0, function* () {
        vscode_1.window.terminals.forEach(term => {
            if (term.name === 'WZ') {
                term.dispose();
            }
        });
    });
}
exports.dispose = dispose;
//# sourceMappingURL=extension.js.map