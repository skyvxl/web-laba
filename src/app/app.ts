import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthService);
  private router = inject(Router);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}
