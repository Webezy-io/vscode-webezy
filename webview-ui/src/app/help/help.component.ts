import { Component, OnInit } from '@angular/core';
import { vscode } from "../utilities/vscode";

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  showHelp() {
    vscode.postMessage({
      command: 'webezy.help'
    })
  }

  showSettings() {
    vscode.postMessage({
      command:'workbench.action.openSettings',
      args:['webezy']
    })
  }

  showWalkthrough() {
    vscode.postMessage({
      command:'workbench.action.openWalkthrough',
      args:['webezy.vscode-webezy#webezy-setup']
    })
  }

}
