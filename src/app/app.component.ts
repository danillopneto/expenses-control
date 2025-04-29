import { Component } from '@angular/core';
import { LoadingService } from './shared/loading.service';
import { Observable } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './shared/loading-spinner.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, NavbarComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  loading$: Observable<boolean>;
  constructor(public loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}
