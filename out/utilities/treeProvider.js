"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsView = void 0;
const vscode_1 = require("vscode");
class ProjectsView {
    constructor(workspaceRoot, projects) {
        this.workspaceRoot = workspaceRoot;
        this._projects = [];
        this.parseProjects(projects);
    }
    getParent(element) {
        let parent = {};
        if (element.kind === 'Message') {
            this._projects.forEach(prj => {
                var _a;
                if (prj.children) {
                    let pkg = prj.children.filter(el => el.kind === 'Package').find(el => el.label === element.data.fullName.split('.')[1]);
                    let msgs = (_a = pkg === null || pkg === void 0 ? void 0 : pkg.children) === null || _a === void 0 ? void 0 : _a.filter(msg => msg.kind === 'Message');
                    if (msgs) {
                        if (msgs.find(msg => msg.label === element.label)) {
                            parent = pkg;
                        }
                    }
                }
            });
        }
        else if (element.kind === 'Package') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    let pkg = prj.children.filter(el => el.kind === 'Package').find(el => el.label === element.data.package.split('.')[1]);
                    if (pkg) {
                        parent = prj;
                    }
                }
            });
        }
        else if (element.kind === 'Service') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    let svc = prj.children.filter(el => el.kind === 'Service').find(el => el.label === element.data.name);
                    if (svc) {
                        parent = prj;
                    }
                }
            });
        }
        else if (element.kind === 'RPC') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    prj.children.filter(el => el.kind === 'Service').forEach(svc => {
                        var _a;
                        let rpc = (_a = svc.children) === null || _a === void 0 ? void 0 : _a.find(el => el.label === element.label);
                        if (rpc) {
                            parent = svc;
                        }
                    });
                }
            });
        }
        else if (element.kind === 'Enum') {
            this._projects.forEach(prj => {
                var _a;
                if (prj.children) {
                    let pkg = prj.children.filter(el => el.kind === 'Package').find(el => el.label === element.data.fullName.split('.')[1]);
                    let enums = (_a = pkg === null || pkg === void 0 ? void 0 : pkg.children) === null || _a === void 0 ? void 0 : _a.filter(enm => enm.kind === 'Enum');
                    if (enums) {
                        if (enums.find(enm => enm.label === element.label)) {
                            parent = pkg;
                        }
                    }
                }
            });
        }
        return parent;
    }
    parseProjects(projects) {
        for (const project in projects) {
            // if (Object.prototype.hasOwnProperty.call(projects, key)) {
            //     const element = projects[key];
            //     console.log(element);
            // }
            let prj = projects[project];
            let childrens = [];
            for (const s in prj.services) {
                let svc = prj.services[s];
                let rpcs = [];
                if (svc.methods) {
                    svc.methods.forEach(rpc => {
                        rpcs.push({ label: rpc.name, kind: "RPC", data: rpc, children: [] });
                    });
                }
                childrens.push({ label: svc.name, kind: "Service", data: s, children: rpcs });
            }
            for (const p in prj.packages) {
                let pkg = prj.packages[p];
                let pkgChildrens = [];
                if (pkg.messages) {
                    pkg.messages.forEach(msg => {
                        pkgChildrens.push({ label: msg.name, kind: "Message", data: msg, children: [] });
                    });
                }
                if (pkg.enums) {
                    pkg.enums.forEach(e => {
                        pkgChildrens.push({ label: e.name, kind: "Enum", data: e, children: [] });
                    });
                }
                childrens.push({ label: pkg.name, kind: "Package", data: p, children: pkgChildrens });
            }
            let resource = {
                label: project, data: prj.project,
                kind: "Project",
                children: childrens
            };
            this._projects.push(resource);
        }
    }
    getTreeItem(element) {
        var _a, _b;
        return new Resource(element.label, element.kind, element.data, ((_b = (_a = element.children) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0
            ? vscode_1.TreeItemCollapsibleState.Expanded
            : vscode_1.TreeItemCollapsibleState.None, element.children);
    }
    getChildren(element) {
        var _a;
        if (!this.workspaceRoot) {
            vscode_1.window.showInformationMessage('No projects in empty workspace');
            return Promise.resolve([]);
        }
        return element && Promise.resolve((_a = element.children) !== null && _a !== void 0 ? _a : [])
            || Promise.resolve(this._projects);
    }
}
exports.ProjectsView = ProjectsView;
class Resource extends vscode_1.TreeItem {
    constructor(label, kind, data, collapsibleState, children) {
        super(label, collapsibleState);
        this.label = label;
        this.kind = kind;
        this.data = data;
        this.collapsibleState = collapsibleState;
        this.children = children;
        // dark: path.join(__filename, '..', '..', '..','resources', 'dark' ,'folder.svg')
        this.contextValue = this.kind;
        this.tooltip = `${this.label}${data.fullName !== undefined ? ` [${data.fullName}]` : ''}`;
        this.description = this.kind;
        this.getIcon();
    }
    getIcon() {
        if (this.kind.includes('Project')) {
            this.iconPath = new vscode_1.ThemeIcon("symbol-folder");
        }
        else if (this.kind === 'Service') {
            this.iconPath = new vscode_1.ThemeIcon("server");
        }
        else if (this.kind === 'Package') {
            this.iconPath = new vscode_1.ThemeIcon("package");
        }
        else if (this.kind === 'Message') {
            this.iconPath = new vscode_1.ThemeIcon("mail");
        }
        else if (this.kind === 'RPC') {
            this.iconPath = new vscode_1.ThemeIcon("json");
        }
        else if (this.kind === 'Enum') {
            this.iconPath = new vscode_1.ThemeIcon("symbol-enum");
        }
    }
}
//# sourceMappingURL=treeProvider.js.map