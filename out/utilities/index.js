"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProject = exports.findFile = void 0;
const fs = require("fs");
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
//# sourceMappingURL=index.js.map