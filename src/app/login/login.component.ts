import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, signInWithPopup, GoogleAuthProvider, UserCredential } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  constructor() {
    // Redirect to dashboard if already authenticated
    if (this.auth.currentUser) {
      this.router.navigate(['/dashboard']);
    } else {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          this.router.navigate(['/dashboard']);
        }
      });
    }
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result: UserCredential = await signInWithPopup(this.auth, provider);
      // Redirect to dashboard after successful login
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // Handle errors here
      console.error('Google sign-in error:', error);
    }
  }
}
