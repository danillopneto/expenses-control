import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  breadcrumb: string[] = [];

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumb = this.router.url
        .split('/')
        .filter(Boolean)
        .map(str => str.charAt(0).toUpperCase() + str.slice(1));
    });
  }
}
