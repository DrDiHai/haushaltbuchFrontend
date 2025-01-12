// console.log('init app component');

import { Component, OnInit } from '@angular/core';
import { ConnectionService } from './connection.service';
import { ConnectedComponent } from './connected-component/connected.component';
import { IncomingMessage, MessageType } from './messages/Message';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent extends ConnectedComponent implements OnInit {
  title = 'haushaltbuchFrontend';
  activateAnyComponent = true;
  activateLoginComponent = false;
  activateSetupConfigComponent = false;

  constructor(private specificService:ConnectionService) {
    super(specificService);
    this.setComponentID('AppComponent');
  }

  override handleMessages(message: IncomingMessage): void {
    console.groupCollapsed(this.componentID, "received", message.type, "message");
    console.log(message);
    console.groupEnd();
    if (message.type == MessageType.Hello) {
      // check basic status of backend
      if (message.status == 'noDB') {
        console.log('Open Setup Dialogue');
        this.activateAnyComponent = false;
        this.activateSetupConfigComponent = true;
      } else {
        this.activateLoginComponent = true;
        this.activateAnyComponent = true;
      }
    }
    if (message.type == MessageType.Welcome) {
      // we are logged in, destroy LoginComponent
      this.activateLoginComponent = false;
    }
  }

  // Creates the connection to the backend when the component is initialized.
  // The App Component ownes the 'promary connection' that is used by the backend
  // to request actions
  override ngOnInit() {
    const observeHandshake = true;
    const isPrimary = true;
    this.getConnection(observeHandshake, isPrimary);
  }
}
