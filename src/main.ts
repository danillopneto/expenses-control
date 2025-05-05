import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';

ModuleRegistry.registerModules([
  ClientSideRowModelModule
]);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
