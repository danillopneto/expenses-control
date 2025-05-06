import { Component } from '@angular/core';
import { LoadingService } from './shared/loading.service';
import { Observable } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loading$: Observable<boolean>;
  constructor(public loadingService: LoadingService, private dateAdapter: DateAdapter<any>) {
    this.loading$ = this.loadingService.loading$;
    // SSR-safe: Only access window if it exists
    if (typeof window !== 'undefined') {
      const translate = (window as any).ng?.injector?.get?.('TranslateService') || null;
      if (translate && translate.onLangChange) {
        translate.onLangChange.subscribe((event: any) => {
          this.dateAdapter.setLocale(event.lang);
        });
        this.dateAdapter.setLocale(translate.currentLang || 'pt-BR');
      }
    }
  }
}
