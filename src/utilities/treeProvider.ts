import { window, ThemeIcon, TreeDataProvider, TreeItem, TreeItemCollapsibleState, ThemeColor } from "vscode";
import { CustomType, Projects } from "./interfaces";

export class ProjectsView implements TreeDataProvider<CustomType> {

    private _projects: CustomType[] = [];

    constructor(private workspaceRoot: string,projects: Projects) {
        this.parseProjects(projects);
    }

    getParent(element:CustomType): CustomType {
        let parent :any = {};
        if (element.kind === 'Message') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    let pkg = prj.children.filter(el => el.kind === 'Package').find(el => el.label === element.data.fullName.split('.')[1]);
                    let msgs = pkg?.children?.filter(msg => msg.kind === 'Message');
                    if(msgs) {
                        if(msgs.find(msg => msg.label === element.label)) {
                            parent = pkg;
                        }
                    }
                    
                }
                
            });
        } else if (element.kind === 'Package') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    let pkg = prj.children.filter(el => el.kind === 'Package').find(el => el.label === element.data.package.split('.')[1]);
                    if(pkg) {
                        parent = prj;
                    }
                }
                
            });
        } else if(element.kind === 'Service') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    let svc = prj.children.filter(el => el.kind === 'Service').find(el => el.label === element.data.name);
                    if(svc) {
                        parent = prj;
                    }
                }
                
            });
        } else if(element.kind === 'RPC') {
            this._projects.forEach(prj => {
                if (prj.children) {
                    prj.children.filter(el => el.kind === 'Service').forEach(svc => {
                        let rpc = svc.children?.find(el => el.label === element.label);
                        if(rpc) {
                            parent = svc;
                        }
                    });
                }
            });
        }
        return parent;
    }

    parseProjects(projects: Projects) {
        for (const project in projects) {
            // if (Object.prototype.hasOwnProperty.call(projects, key)) {
            //     const element = projects[key];
            //     console.log(element);
            // }
            let prj = projects[project];
            let childrens:CustomType[] = [];
            
            for (const s in prj.services) {
                let svc = prj.services[s];
                let rpcs:CustomType[] = [];
                if (svc.methods) {
                    svc.methods.forEach(rpc => {
                        rpcs.push({label:rpc.name,kind:"RPC",data:rpc,children:[]});
                    });
                }

                childrens.push({label:svc.name,kind:"Service",data:s,children:rpcs});
            }

            for (const p in prj.packages) {
                let pkg = prj.packages[p];
                let pkgChildrens:CustomType[] = [];
                if (pkg.messages) {
                    pkg.messages.forEach(msg => {
                        pkgChildrens.push({label:msg.name,kind:"Message",data:msg,children:[]});
                    });
                }

                if (pkg.enums) {
                    pkg.enums.forEach(e => {
                        pkgChildrens.push({label:e.name,kind:"Enum",data:e,children:[]});
                    });
                }

                childrens.push({label:pkg.name,kind:"Package",data:p,children:pkgChildrens});
            }
            
            let resource:CustomType = {
                label: project, data: prj.project,
                kind: "Project",
                children: childrens
            }; 

            this._projects.push(resource);
        }
    }

	getTreeItem(element: CustomType): Resource {
		return new Resource(element.label,element.kind,element.data,(element.children?.length ?? 0) > 0
		? TreeItemCollapsibleState.Expanded
		: TreeItemCollapsibleState.None,element.children);
	}

	getChildren(element?: CustomType): Thenable<CustomType[]> {
		if (!this.workspaceRoot) {
			window.showInformationMessage('No projects in empty workspace');
			return Promise.resolve([]);
		}
		return element && Promise.resolve(element.children ?? [])
		|| Promise.resolve(this._projects);
	}
}


class Resource extends TreeItem {
	constructor(
	  public readonly label: string,
	  private kind: string,
	  private data:any,
	  public readonly collapsibleState: TreeItemCollapsibleState,
	  private children?: CustomType[],
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}${data.fullName !== undefined ? ` [${data.fullName}]` : ''}`;
		this.description =this.kind;
        this.getIcon();

	}	
		// dark: path.join(__filename, '..', '..', '..','resources', 'dark' ,'folder.svg')
	contextValue?: string | undefined = this.kind;
    getIcon() {
		if (this.kind.includes('Project')) {
			this.iconPath =  new ThemeIcon("symbol-folder");
		} else if (this.kind === 'Service') {
			this.iconPath =  new ThemeIcon("server");
		} else if (this.kind === 'Package') {
			this.iconPath = new ThemeIcon("package");
		} else if (this.kind === 'Message') {
			this.iconPath = new ThemeIcon("mail");
		} else if (this.kind === 'RPC') {
			this.iconPath = new ThemeIcon("json");
		}
	}
}