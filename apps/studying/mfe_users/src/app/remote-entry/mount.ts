import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { UsersComponent } from '../users/users.component';

const ELEMENT_TAG = 'mfe-users-widget';

export async function mountUsers(element: HTMLElement): Promise<void> {
  if (!customElements.get(ELEMENT_TAG)) {
    const app = await createApplication({ providers: [] });
    const usersElement = createCustomElement(UsersComponent, {
      injector: app.injector,
    });
    customElements.define(ELEMENT_TAG, usersElement);
  }

  const widget = document.createElement(ELEMENT_TAG);
  element.innerHTML = '';
  element.appendChild(widget);
}
