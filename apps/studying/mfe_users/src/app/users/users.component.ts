import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDetailComponent } from './user-detail.component';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const MOCK_USERS: UserRecord[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'active', lastLogin: '2026-06-21' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'active', lastLogin: '2026-06-20' },
  { id: '3', name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'inactive', lastLogin: '2026-06-15' },
  { id: '4', name: 'David Lee', email: 'david@example.com', role: 'Editor', status: 'active', lastLogin: '2026-06-19' },
  { id: '5', name: 'Eva Martinez', email: 'eva@example.com', role: 'Admin', status: 'active', lastLogin: '2026-06-21' },
];

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UserDetailComponent],
  template: `
    <div class="users-module">
      <div class="concept-tags">
        <span class="tag">Angular Remote</span>
        <span class="tag">Web Components</span>
        <span class="tag">Event Bus Publisher</span>
      </div>

      <div class="card">
        <h2>Users Management</h2>
        <p class="subtitle">Angular micro frontend mounted inside the React shell.</p>
      </div>

      <div class="grid">
        <div class="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.selected]="selectedUser()?.id === user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role }}</td>
                  <td>
                    <span class="status" [class.active]="user.status === 'active'">
                      {{ user.status }}
                    </span>
                  </td>
                  <td>
                    <button class="btn" (click)="selectUser(user)">View</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (selectedUser(); as user) {
          <app-user-detail [user]="user" />
        }
      </div>
    </div>
  `,
  styles: [`
    .users-module { display: flex; flex-direction: column; gap: 1.5rem; color: #e2e8f0; }
    .concept-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .tag { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; background: rgba(56,189,248,0.2); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.3); }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.25rem; }
    h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 0.875rem; margin-top: 0.25rem; }
    .grid { display: grid; gap: 1.5rem; }
    @media (min-width: 1024px) { .grid { grid-template-columns: 2fr 1fr; } }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th { text-align: left; padding: 0.75rem; color: #94a3b8; border-bottom: 1px solid #334155; }
    td { padding: 0.75rem; border-bottom: 1px solid #1e293b; }
    tr.selected { background: rgba(56,189,248,0.1); }
    .status { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; background: #334155; }
    .status.active { background: rgba(52,211,153,0.2); color: #6ee7b7; }
    .btn { padding: 0.375rem 0.75rem; border-radius: 0.5rem; background: #0ea5e9; color: white; border: none; cursor: pointer; font-size: 0.75rem; }
    .btn:hover { background: #38bdf8; }
  `],
})
export class UsersComponent {
  users = signal(MOCK_USERS);
  selectedUser = signal<UserRecord | null>(null);

  selectUser(user: UserRecord) {
    this.selectedUser.set(user);
    const bus = (window as unknown as { __MFE_EVENT_BUS__?: { publish: (type: string, payload: unknown, source: string) => void } }).__MFE_EVENT_BUS__;
    bus?.publish('user:selected', { id: user.id, name: user.name }, 'mfe_users');
  }
}
