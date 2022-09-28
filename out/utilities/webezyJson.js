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
        this.subDirs = subDirs;
        this.rootDir = rootDir;
        this.refresh();
    }
    get projects() {
        return this._projects;
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
        console.log(this._projects);
    }
}
exports.WebezyModule = WebezyModule;
//# sourceMappingURL=webezyJson.js.map