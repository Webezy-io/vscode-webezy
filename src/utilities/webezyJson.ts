import { Projects, WebezyJson } from "./interfaces";
import { getProject } from "./index";
import { Uri } from "vscode";


export class WebezyModule {

  private readonly _projects: Projects | any = {};

    constructor(private rootDir:string, private subDirs: string[]) {
      this.subDirs = subDirs;
      this.rootDir = rootDir;
      this.refresh();
    }

    public get projects() : Projects {
      return <Projects>this._projects;
    }

    public refresh(subDirs?:string[]) {
      this.subDirs = subDirs ? subDirs : this.subDirs;
      this.subDirs.forEach(element => {
        console.log('*',element)
        let project = getProject(Uri.file(this.rootDir+'/'+element+'/webezy.json').fsPath);
        if (project !== undefined) {
          if (this._projects !== undefined) {
            this._projects[element] = project;
          }
        }
      });
      console.log(this._projects)
    }
    
}