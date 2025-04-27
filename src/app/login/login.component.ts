import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, signInWithPopup, GoogleAuthProvider, UserCredential } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

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
