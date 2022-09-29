"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebezyModule = void 0;
const index_1 = require("./index");
const vscode_1 = require("vscode");
class WebezyModule {
    constructor(rootDir, subDirs) {
        this.rootDir = rootDir;
        this.subDirs = subDirs;
        this._projects = {};
        this._defaultProjects = [];
        this.subDirs = subDirs;
        this.rootDir = rootDir;
        this.refresh();
    }
    get projects() {
        return this._projects;
    }
    setDefaultProjects(projectsPaths) {
        this._defaultProjects = projectsPaths;
    }
    refresh(subDirs) {
        this.subDirs = subDirs ? subDirs : this.subDirs;
        this.subDirs.forEach(element => {
            console.log('*', element);
            let project = (0, index_1.getProject)(vscode_1.Uri.file(this.rootDir + '/' + element + '/webezy.json').fsPath);
            if (project !== undefined) {
                if (this._projects !== undefined) {
                    this._projects[element] = project;
                }
            }
        });
        this._defaultProjects.forEach(prj => {
            var _a, _b;
            let project = (0, index_1.getProject)(vscode_1.Uri.file(prj + '/webezy.json').fsPath);
            if (project !== undefined) {
                if (this._projects !== undefined) {
                    this._projects[((_a = project.project) === null || _a === void 0 ? void 0 : _a.name) !== undefined ? (_b = project.project) === null || _b === void 0 ? void 0 : _b.name : 'unknown'] = project;
                }
            }
        });
    }
}
exports.WebezyModule = WebezyModule;
//# sourceMappingURL=webezyJson.js.map