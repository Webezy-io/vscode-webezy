import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InspectorComponent } from './inspector/inspector.component';


const routes: Routes = [
  {path:'inspector',component:InspectorComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }