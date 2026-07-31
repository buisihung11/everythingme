import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { UserRecord } from './users.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-card">
      <h3>User Detail</h3>
      <dl>
        <dt>Name</dt><dd>{{ user.name }}</dd>
        <dt>Email</dt><dd>{{ user.email }}</dd>
        <dt>Role</dt><dd>{{ user.role }}</dd>
        <dt>Status</dt><dd>{{ user.status }}</dd>
        <dt>Last Login</dt><dd>{{ user.lastLogin }}</dd>
      </dl>
      <p class="hint">Selecting a user publishes a <code>user:selected</code> event to the shared event bus.</p>
    </div>
  `,
  styles: [`
    .detail-card { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.25rem; color: #e2e8f0; }
    h3 { font-weight: 600; margin: 0 0 1rem; }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; font-size: 0.875rem; }
    dt { color: #94a3b8; }
    dd { margin: 0; }
    .hint { margin-top: 1rem; font-size: 0.75rem; color: #94a3b8; }
    code { background: #0f172a; padding: 0.125rem 0.375rem; border-radius: 0.25rem; color: #7dd3fc; }
  `],
})
export class UserDetailComponent {
  @Input({ required: true }) user!: UserRecord;
}
