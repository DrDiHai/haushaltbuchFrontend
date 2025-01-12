// console.log('init echo component');

import { Component, OnInit } from '@angular/core';
import { ConnectionService } from '../connection.service';
import { ConnectedComponent } from '../connected-component/connected.component';
import { IncomingMessage } from '../messages/Message';
import { EchoMessage } from '../messages/admin.messages';

@Component({
  selector: 'app-echo',
  templateUrl: './echo.component.html',
  styleUrls: ['./echo.component.css']
})
export class EchoComponent extends ConnectedComponent implements OnInit {

  connectionKeys: string[] = [];
  selectedConnectionKey: string = '';
  payload:string = '{ "type": "Echo", "payload": "to myself" }'
  incoming: string = '';

  constructor(protected override connectionService: ConnectionService) {
    super(connectionService);
    this.setComponentID('Echo');
  }

  override handleMessages(message: IncomingMessage): void {
    console.groupCollapsed(this.componentID, "received", message.type, "message");
    console.log(message);
    console.groupEnd();
    this.incoming = JSON.stringify(message);
  }

  override handleError(error: any): void {
    console.error(this.componentID, "received error");
    console.error(error);
    throw new Error(error);
  }

  submitForm() {
    if (this.selectedConnectionKey===''
      || this.selectedConnectionKey==='*' 
      || ConnectionService.connections[this.selectedConnectionKey]) {
      this.sendMessage(new EchoMessage(this.selectedConnectionKey, this.payload));
    } else {
      console.error('Unknown Component', this.selectedConnectionKey);
    }
  }
  
  get objectKeys() {
    return Object.keys(ConnectionService.connections);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.refreshConnectionList();
  }
  refreshConnectionList() {
    this.connectionKeys = Object.keys(ConnectionService.connections);
  }

}
