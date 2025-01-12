// console.log('init login component');

import { Component, OnInit, Output } from '@angular/core';
import * as rxjs from 'rxjs';
import { ConnectedComponent } from '../connected-component/connected.component';
import { ConnectionService } from '../connection.service';
import { IncomingMessage, MessageType } from '../messages/Message';
import { LoginCredentials } from "../messages/admin.messages";

@Component({
  selector: 'app-login-component',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent extends ConnectedComponent implements OnInit {

  getLoginCredentials = false;

  constructor(private specificService:ConnectionService) {
    super(specificService);
    this.setComponentID('LoginComponent');
  }

  username: string = "";
  loginSubject = new rxjs.ReplaySubject<LoginCredentials>();

  override handleMessages(message: IncomingMessage): void {
    console.groupCollapsed(this.componentID, "received", message.type, "message");
    console.log(message);
    console.groupEnd();
    if (message.type == MessageType.Hello) {
      let status = message.status;
      if (status == 'singleUser') {
        this.loginSubject.next({});
      } else {
        this.getLoginCredentials = true;
      }
    }
  }

  override handleError(error: any): void {
    console.error("Login Component received error");
    throw new Error(error);
  }

  override handleComplete(): void {
    console.debug('Login connection closed.')
  }

  logIn(): void {
    console.log("Login button pressed (", this.username, ')');
    this.loginSubject.next({user: this.username});
  }

  // Creates the connection to the backend when the component is initialized.
  // The LoginComponent
  override ngOnInit() {
    this.getConnection(this.loginSubject);
  }

}
