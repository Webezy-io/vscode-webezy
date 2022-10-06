import { Component, Input, OnInit } from '@angular/core';
import { AppServiceService } from '../app-service.service';
import { vscode } from '../utilities/vscode';


interface Column {
  columnName:string;
  index:number;
}

interface Row {
  values: {value:any,index:number}[];
}

const WELL_KNOWN = ['google.protobuf.timestamp','google.protobuf.struct'];

@Component({
  selector: 'app-inspector',
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.css']
})
export class InspectorComponent implements OnInit {
  columns:Column[]=[{columnName:'Test a',index:1},{columnName:'Test b',index:2}];
  rows:Row[]=[{values:[{value:'value a',index:1},{value:'Value b',index:2}]}];
  @Input() resource:any;
  @Input() projectName:string = '';
  _editModeDependencies:boolean = false;
  currentPackages:any;
  missingPackages:any;
  addingDepend:boolean = false;
  test:any;
  serverRunMode:boolean = false;
  constructor(public _app:AppServiceService) { 

  }

  copy(str:string) {
    vscode.postMessage({
      command: 'webezy.copy',
      args: [str]
    })
  }

  removeRpc(rpc:string,svc:string) {
    vscode.postMessage({
      command: 'webezy.removeResource',
      args: [`${svc}.${rpc}`]
    })
  }

  removeEnum(enm:string) {
    vscode.postMessage({
      command: 'webezy.removeResource',
      args: [enm]
    })
  }

  removeMessage(msg:string) {
    vscode.postMessage({
      command: 'webezy.removeResource',
      args: [msg]
    })
  }

  addPackage(pkg:any, svc:string) {
    this.selection = pkg;
    vscode.postMessage({
      command:'webezy.importPackage',
      args:[`${pkg} ${svc}`]
    })
    if(this.resource.dependencies) {
      this.resource.dependencies.push(pkg)
    } else {
      this.resource.dependencies = [pkg] 
    }
    this._editModeDependencies = false;
    this.addingDepend = false;
  }
  selection:any;
  ngOnInit(): void {
   
  }

  revealEnum(enumFullname:string) {
    vscode.postMessage({
      command: 'webezy.reveal',
      args: [enumFullname]
    })
  }

  revealPackage(pkg:any) {
    vscode.postMessage({
      command: 'webezy.reveal',
      args: [pkg]
    })
  }

  revealMessage(msg:any) {
    vscode.postMessage({
      command: 'webezy.reveal',
      args: [msg]
    })
  }

  revealService(svc:any) {
    vscode.postMessage({
      command: 'webezy.reveal',
      args: [svc]
    })
  }

  revealRPC(rpc:any) {
    vscode.postMessage({
      command: 'webezy.reveal',
      args: [rpc]
    })
  }

  checkDepend(dependencies:string[],includeWellKnowns:boolean = false,exclude:string| undefined=undefined) {
    
    if (dependencies) {
      let prj = this._app.getProject(this.projectName);
      this.currentPackages = Object.keys(prj.packages).map(el => `${prj.domain}.${el.split('/').pop()?.split('.')[0]}.${el.split('/')[1]}`);
      if(includeWellKnowns) {
        this.currentPackages.push(...WELL_KNOWN);
      }
      if(exclude) {
        this.currentPackages = this.currentPackages.filter((el:any) => el !== exclude);
      }
      this.missingPackages = this.currentPackages.filter((item:any) => dependencies.indexOf(item) < 0);
      if (this.missingPackages.length>0) {
        return false
      } else {
        return true
      }
    } else {
      let prj = this._app.getProject(this.projectName);
      this.currentPackages = Object.keys(prj.packages).map(el => `${prj.domain}.${el.split('/').pop()?.split('.')[0]}.${el.split('/')[1]}`);
      if(includeWellKnowns) {
        this.currentPackages.push(...WELL_KNOWN);
      }
      if(exclude) {
        this.currentPackages = this.currentPackages.filter((el:any) => el !== exclude);
      }
      this.missingPackages = this.currentPackages
      return false
    }
  }

  addServiceDependency() {
    this.addingDepend = true;
    this._editModeDependencies = true;
  }

  addPackageDependency() {
    this.addingDepend = true;
    this._editModeDependencies = true;
  }

  generateMessage(pkg:string) {
    vscode.postMessage({
      command: 'webezy.generateMessage',
      args: [pkg]
    })
  }

  generateRPC(svc:string) {
    vscode.postMessage({
      command: 'webezy.generateRPC',
      args: [svc]
    })
  }

  generateService() {
    vscode.postMessage({
      command: 'webezy.generateService',
      args:[]
    })
  }

  generatePackage() {
    vscode.postMessage({
      command: 'webezy.generatePackage',
      args: []
    })
  }

  build() {
    vscode.postMessage({
      command: 'webezy.build',
      args: []
    })
  }

  removePackage(pkg:string,svc:string) {
    this.resource.dependencies = this.resource.dependencies.filter(function(item:any) {
      return item !== pkg
    })
    vscode.postMessage({
      command: 'webezy.removePackage',
      args:[`${pkg} ${svc}`]
    })
  }

  generateEnum(pkg:string) {
    vscode.postMessage({
      command:'webezy.generateEnum',
      args:[pkg]
    })
  }

  run() {
    this.serverRunMode = true;
    vscode.postMessage({
      command: 'webezy.run',
      args:[]
    })
  }

  stop() {
    this.serverRunMode = false;
    vscode.postMessage({
      command: 'webezy.stop',
      args:[]
    })
  }

  addMessageField(msg:string) {
    vscode.postMessage({
      command: 'webezy.addMessageField',
      args: [msg]
    })
  }
  addEnumValue(enumName:string) {
    vscode.postMessage({
      command: 'webezy.addEnumValue',
      args: [enumName]
    })
  }

  openCodeFile() {
    vscode.postMessage({
      command:'webezy.openCode',
      args: [this.resource]
    })
  }

}
