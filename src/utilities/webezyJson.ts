import { Projects, WebezyJson } from "./interfaces";
import { getProject } from "./index";
import { Uri, window } from "vscode";


export class WebezyModule {

  private readonly _projects: Projects | any = {};
  private _defaultProjects: string[] = [];

    constructor(private rootDir:string, private subDirs: string[]) {
      this.subDirs = subDirs;
      this.rootDir = rootDir;
      this.refresh();
    }

    public isEmpty():boolean {
      return (this._projects._defaultProjects === undefined || this._projects._defaultProjects.length === 0 ) && this.subDirs.length === 0;
    }

    public get projects() : Projects {
      return <Projects>this._projects;
    }
    public setDefaultProjects(projectsPaths:string[]): void {
      this._defaultProjects = projectsPaths;
    }

    public refresh(subDirs?:string[]) {
      this.subDirs = subDirs ? subDirs : this.subDirs;
      this.subDirs.forEach(element => {
        console.log('*',element)
        try {
          let project = getProject(Uri.file(this.rootDir+'/'+element+'/webezy.json').fsPath);
          console.log('*',project)
          if (project !== undefined) {
            if (this._projects !== undefined) {
              this._projects[element] = project;
            }
          }
        } catch (error:any) {
          window.showErrorMessage(`Some error ${error.message}`)
        }
        
      });
      this._defaultProjects.forEach(prj => {
        let project = getProject(Uri.file(prj+'/webezy.json').fsPath);
        if (project !== undefined) {
          if (this._projects !== undefined) {
            this._projects[project.project?.name !== undefined ? project.project?.name : 'unknown'] = project;
          }
        }
      });
    }
    
}