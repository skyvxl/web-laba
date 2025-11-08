import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-page',
  imports: [],
  templateUrl: './user.html',
  styleUrl: './user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPage {
  private readonly auth = inject(AuthService);
  private router: Router = inject(Router);

  user = toSignal(this.auth.getAuthState(), { initialValue: null });

  uid = computed(() => this.user()?.$id ?? '—');
  email = computed(() => this.user()?.email ?? '—');
  name = computed(() => this.user()?.name ?? '—');
  phone = computed(() => this.user()?.phone ?? '—');
  creation = computed(() => formatDt(this.user()?.$createdAt));
  lastLogin = computed(() => formatDt(this.user()?.accessedAt));

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}

function formatDt(dt: string | null | undefined): string {
  if (!dt) return '—';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString('ru-RU');
}
