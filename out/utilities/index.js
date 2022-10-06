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
    const projectsDefaultPort = vscode_1.workspace.getConfiguration('webezy').get('projects.defaultPort');
    const projectsDefaultDomain = vscode_1.workspace.getConfiguration('webezy').get('projects.defaultDomain');
    const cliLogLevel = vscode_1.workspace.getConfiguration('webezy').get('cli.logLevel');
    const cliAutoExpand = vscode_1.workspace.getConfiguration('webezy').get('cli.autoExpand');
    const cliAutoBuild = vscode_1.workspace.getConfiguration('webezy').get('cli.autoBuild');
    return {
        projects: {
            defaultProjects: typeof projects === 'object' ? projects : [],
            defaultPort: typeof projectsDefaultPort === 'number' ? projectsDefaultPort : 50051,
            defaultDomain: typeof projectsDefaultDomain === 'string' ? projectsDefaultDomain : 'domain',
        },
        cli: {
            autoExpand: typeof cliAutoExpand === 'boolean' ? cliAutoExpand : true,
            logLevel: typeof cliLogLevel === 'string' ? cliLogLevel : 'ERROR',
            autoBuild: typeof cliAutoBuild === 'boolean' ? cliAutoBuild : false
        }
    };
}
exports.getConfig = getConfig;
//# sourceMappingURL=index.js.map