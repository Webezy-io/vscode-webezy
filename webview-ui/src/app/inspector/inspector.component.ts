import { Component, Input, OnInit } from '@angular/core';
import { AppServiceService } from '../app-service.service';


interface Column {
  columnName:string;
  index:number;
}

interface Row {
  values: {value:any,index:number}[];
}

@Component({
  selector: 'app-inspector',
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.css']
})
export class InspectorComponent implements OnInit {

  columns:Column[]=[{columnName:'Test a',index:1},{columnName:'Test b',index:2}];
  rows:Row[]=[{values:[{value:'value a',index:1},{value:'Value b',index:2}]}];
  @Input() resource:any;

  constructor(public _app:AppServiceService) { }

  ngOnInit(): void {
    
  }


}
