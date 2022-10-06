import { Component, ElementRef, HostListener, Input, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton,vsCodeDataGrid,vsCodeDataGridCell,vsCodeDataGridRow,vsCodeDivider,vsCodeDropdown,vsCodeLink, vsCodeOption, vsCodeProgressRing, vsCodeTag } from "@vscode/webview-ui-toolkit";
import { AppServiceService } from "./app-service.service";
import { vscode } from "./utilities/vscode";
import { Projects, VSCodeMessage } from "./utilities/webezy";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton(),vsCodeLink(),vsCodeTag(),vsCodeDivider(),vsCodeDataGrid(),vsCodeDataGridCell(),vsCodeDataGridRow(),vsCodeDropdown(),vsCodeOption(),vsCodeProgressRing());
// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
// provideVSCodeDesignSystem().register(allComponents.register());

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = 'hello-world';
  helpPage:boolean = false;
  homePage: boolean = false;
  inspectorPage: boolean = false;
  generatorPage: boolean = false;
  startData: Projects = {};
  resource : any;
  projectName: string = '';
  loadingResource: boolean = false;
  @HostListener('window:message', ['$event'])
  onMessage(event:{data:VSCodeMessage}) {

    if (event.data.type === 'init') {
      this.startData = <Projects>event.data.resource;
      this._app.setWebezy(this.startData);
      this.initPage(event.data.page);
    } else {
      this.projectName = event.data.project
      this.loadingResource = true;
      setTimeout(() => {
        this.resource = event.data.resource;
        this.loadingResource = false;
      }, 100);
    }
  }

  @Input() page: string | undefined;
  
  constructor(private _app:AppServiceService) {}

  ngOnInit() {
    
  }

  initPage(page:string) {

    switch (page) {
      case 'Home':
        this.homePage = true;
        break;
    
      case 'Inspector':
        this.inspectorPage = true;

        break;
        
      case 'Generator':
        this.generatorPage = true;
        break;

      case 'Help':
        this.helpPage = true;
        break;

      default:
        break;
    }

  }


  handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: this.resource,
      inspectorPage: this.inspectorPage,
      homePage: this.homePage
    });
  }
}
