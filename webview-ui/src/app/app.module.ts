import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./app.component";
import { InspectorComponent } from './inspector/inspector.component';
import { HomeComponent } from './home/home.component';
import { ResourceGeneratorComponent } from './resource-generator/resource-generator.component';
import { HelpComponent } from './help/help.component';

@NgModule({
  declarations: [AppComponent, InspectorComponent, HomeComponent, ResourceGeneratorComponent, HelpComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
