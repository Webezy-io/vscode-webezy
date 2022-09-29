"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getProject = exports.findFile = void 0;
const fs = require("fs");
const vscode_1 = require("vscode");
function findFile(filePath) {
    if (!filePath) {
        return null;
    }
    if (!fs.existsSync(filePath)) {
        return null;
    }
    else {
        if (fs.statSync(filePath).isFile()) {
            return true;
        }
        else {
            return false;
        }
    }
}
exports.findFile = findFile;
function getProject(webezyJsonPath) {
    let webezy = undefined;
    if (findFile(webezyJsonPath)) {
        webezy = fs.readFileSync(webezyJsonPath, { encoding: 'utf-8' });
        if (webezy) {
            webezy = JSON.parse(webezy);
        }
    }
    return webezy;
}
exports.getProject = getProject;
function getConfig() {
    const projects = vscode_1.workspace.getConfiguration('webezy').get('projects.defaultProjects');
    const cli = vscode_1.workspace.getConfiguration('webezy').get('cli.pyInterpreter');
    return {
        projects: {
            defaultProjects: typeof projects === 'object' ? projects : []
        }
    };
}
exports.getConfig = getConfig;
//# sourceMappingURL=index.js.map