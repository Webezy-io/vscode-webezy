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
exports.activate = void 0;
const vscode_1 = require("vscode");
const webezy_1 = require("./panels/webezy");
const utilities_1 = require("./utilities");
const webezyJson_1 = require("./utilities/webezyJson");
const fs_1 = require("fs");
const treeProvider_1 = require("./utilities/treeProvider");
const newProject_1 = require("./utilities/newProject");
function activate(context) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        vscode_1.commands.executeCommand('setContext', 'webezy.projects', false);
        let folderName = vscode_1.workspace.name; // get the open folder name
        let folderPath = vscode_1.workspace.rootPath; // get the open folder path
        let webezyProjects = getDirectories(folderPath);
        let webezy;
        let treeView;
        if (folderPath !== undefined) {
            webezy = new webezyJson_1.WebezyModule(folderPath, webezyProjects);
            treeView = vscode_1.window.createTreeView('webezy-projects', {
                treeDataProvider: new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects),
                showCollapseAll: true
            });
            initTreeView(treeView, context, webezy, folderPath);
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
            console.log('*', filtered, term.name);
            if (filtered) {
                terminals.push(term);
            }
            if (terminals.length === projects.length) {
                activeTerminal = true;
            }
        });
        if (!activeTerminal) {
            yield vscode_1.commands.executeCommand('python.setInterpreter');
            if (webezy) {
                for (const prj in webezy.projects) {
                    terminals.push(vscode_1.window.createTerminal({ name: prj, cwd: vscode_1.Uri.file(folderPath + '/' + prj), iconPath: vscode_1.Uri.file(context.extensionUri.fsPath + '/favicon.svg') }));
                }
            }
        }
        // Create the show hello world command
        webezy_1.WebezyPanel.render(context.extensionUri);
        const showHelloWorldCommand = vscode_1.commands.registerCommand("webezy.showHelp", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --help`);
        });
        context.subscriptions.push(showHelloWorldCommand);
        const showCurrentVersion = vscode_1.commands.registerCommand("webezy.version", () => {
            var _a;
            (_a = vscode_1.window.activeTerminal) === null || _a === void 0 ? void 0 : _a.sendText(`wz --version`);
        });
        context.subscriptions.push(showCurrentVersion);
        (_a = webezy_1.WebezyPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.setWebezyModule(webezy);
        context.subscriptions.push(vscode_1.window.registerWebviewViewProvider('webezy-inspector', webezy_1.WebezyPanel.currentPanel));
        let refresh = vscode_1.commands.registerCommand('webezy.refreshEntry', () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            let folderPath = vscode_1.workspace.rootPath; // get the open folder path
            let webezyProjects = getDirectories(folderPath);
            if (webezy) {
                webezy.refresh(webezyProjects);
                treeView = vscode_1.window.createTreeView('webezy-projects', {
                    treeDataProvider: new treeProvider_1.ProjectsView(context.extensionUri.fsPath, webezy.projects),
                    showCollapseAll: true
                });
                initTreeView(treeView, context, webezy, folderPath);
            }
            // terminal.sendText("echo 'Sent text immediately after creating'");
            vscode_1.window.showInformationMessage('Refreshed projects view');
        });
        context.subscriptions.push(refresh);
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
function initTreeView(treeView, context, webezy, folderPath) {
    vscode_1.commands.executeCommand('setContext', 'webezy.projects', true);
    let currentProject = '';
    treeView.onDidChangeSelection(event => {
        var _a;
        if (event.selection[0].data.uri !== undefined) {
            let term = vscode_1.window.terminals.find(term => term.name === event.selection[0].data.uri.split(folderPath)[1].split('/')[1]);
            currentProject = term === null || term === void 0 ? void 0 : term.name;
            term === null || term === void 0 ? void 0 : term.show();
        }
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
        vscode_1.window.showInformationMessage("Clicked on " + event.selection[0].label);
        (_a = webezy_1.WebezyPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.setResource(data);
    });
    context.subscriptions.push(vscode_1.commands.registerCommand('webezy.newProject', () => __awaiter(this, void 0, void 0, function* () {
        (0, newProject_1.newProject)(context).then((res) => {
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
    context.subscriptions.push(vscode_1.commands.registerCommand('webezy.wz', () => __awaiter(this, void 0, void 0, function* () {
        const options = {
            newProject: newProject_1.newProject,
        };
        const quickPick = vscode_1.window.createQuickPick();
        quickPick.items = Object.keys(options).map(label => ({ label }));
        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                options[selection[0].label](context).then(res => {
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
}
//# sourceMappingURL=extension.js.map