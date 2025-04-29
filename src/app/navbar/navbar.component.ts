import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Auth } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared.module';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    SharedModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  authChecked = false;
  languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' }
  ];
  selectedLang = 'en';
  constructor(private translate: TranslateService) {
    this.auth.onAuthStateChanged(() => {
      this.authChecked = true;
      this.cdr.detectChanges();
    });
    this.translate.addLangs(['en', 'pt']);
    this.translate.setDefaultLang('en');
    const browserLang = this.translate.getBrowserLang() || 'en';
    this.selectedLang = (browserLang && ['en', 'pt'].includes(browserLang)) ? browserLang : 'en';
    this.translate.use(this.selectedLang);
  }
  isAuthenticated() {
    return !!this.auth.currentUser;
  }
  changeLang(lang: string) {
    this.selectedLang = lang;
    this.translate.use(lang);
  }
}
