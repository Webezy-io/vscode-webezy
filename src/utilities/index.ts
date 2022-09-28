import * as fs from 'fs';
import { WebezyJson } from './interfaces';

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