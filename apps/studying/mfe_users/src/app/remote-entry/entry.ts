import { Component } from '@angular/core';
import { UsersComponent } from '../users/users.component';

@Component({
  imports: [UsersComponent],
  selector: 'app-mfe_users-entry',
  template: `<app-users />`,
})
export class RemoteEntry {}
