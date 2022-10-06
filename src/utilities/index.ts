import * as fs from 'fs';
import { workspace } from 'vscode';
import { VSCodeWebezyConfig, WebezyJson } from './interfaces';


export function findFile(filePath: string) {
    if (!filePath) {return null;}
    if (!fs.existsSync(filePath)) {
        return null;
    } else {
        if (fs.statSync(filePath).isFile()) {
            return true;
        } else {
            return false;
        }
    }
}

export function getProject(webezyJsonPath:string): WebezyJson | undefined {
    let webezy:any = undefined;
    if(findFile(webezyJsonPath)) {
        webezy = fs.readFileSync(webezyJsonPath,{encoding:'utf-8'});
        if (webezy) {
            webezy = JSON.parse(webezy);
        }
    } 
    return <any>webezy;

}

export function getConfig():VSCodeWebezyConfig {
    const projects = workspace.getConfiguration('webezy').get('projects.defaultProjects');
    const projectsDefaultPort = workspace.getConfiguration('webezy').get('projects.defaultPort');
    const projectsDefaultDomain = workspace.getConfiguration('webezy').get('projects.defaultDomain');

    const cliLogLevel = workspace.getConfiguration('webezy').get('cli.logLevel');
    const cliAutoExpand = workspace.getConfiguration('webezy').get('cli.autoExpand');
    const cliAutoBuild = workspace.getConfiguration('webezy').get('cli.autoBuild');
    
    return {
        projects: {
            defaultProjects: typeof projects === 'object' ? <string[]>projects : [],
            defaultPort: typeof projectsDefaultPort === 'number' ? projectsDefaultPort : 50051,
            defaultDomain: typeof projectsDefaultDomain === 'string' ? projectsDefaultDomain : 'domain',
        },
        cli: {
            autoExpand: typeof cliAutoExpand === 'boolean' ? cliAutoExpand : true,
            logLevel:typeof cliLogLevel === 'string' ? cliLogLevel : 'ERROR',
            autoBuild: typeof cliAutoBuild === 'boolean' ? cliAutoBuild : false
        }
    };
    
}