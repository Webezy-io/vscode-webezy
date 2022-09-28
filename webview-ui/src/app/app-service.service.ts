import { Injectable } from '@angular/core';
import { MethodDescriptor, Projects, WebezyJson } from './utilities/webezy';

@Injectable({
  providedIn: 'root'
})
export class AppServiceService {

  webezy: Projects = {};

  constructor() { }


  setWebezy(webezy:Projects) {
    this.webezy = webezy;
  }

  getProject(projectName:string): WebezyJson {
    return this.webezy[projectName]
  }

  getRPC(projectName:string,svcName:string,rpcName:string):MethodDescriptor | undefined {
    let prj = this.webezy[projectName]
    let rpc = prj.services[svcName].methods.find(rpc => rpc.name === rpcName);
    return rpc
  }

  getMessage(projectName:string,messageFullName:string) {
    let pkg = `protos/${messageFullName.split('.')[2]}/${messageFullName.split('.')[1]}.proto`
    let prj = this.webezy[projectName]
    let msg = prj.packages[pkg].messages.find(msg => msg.fullName === messageFullName);
    return msg
  }

  getEnum(projectName:string,enumFullName:string) {
    let pkg = `protos/${enumFullName.split('.')[2]}/${enumFullName.split('.')[1]}.proto`
    let prj = this.webezy[projectName]
    let en = prj.packages[pkg].enums.find(e => e.fullName === enumFullName);
    return en
  }

  getService(projectName:string, serviceName:string) {
    let prj = this.webezy[projectName]
    let svc = prj.services[serviceName]
    return svc
  }

  listServices(projectName:string) {
    return this.webezy[projectName].services;
  }

  listPackages(projectName:string) {
    return this.webezy[projectName].packages;
  }

  getPackage(projectName:string, packageFullName:string) {
    let pkgN = `protos/${packageFullName.split('.').pop()}/${packageFullName.split('.')[1]}.proto`
    let prj = this.webezy[projectName]
    let pkg = prj.packages[pkgN]
    return pkg
  }

  getConfig(projectName:string) {
    let prj = this.webezy[projectName]
    return prj.config
  }
}
