// console.log('init connected component');

import { Component, OnDestroy, OnInit } from '@angular/core';
import * as rxjs from 'rxjs';
import { BaseComponent } from '../base.component';
import { ConnectionService } from '../connection.service';
import { Message } from '../messages/Message';
import { LoginCredentials } from "../messages/admin.messages";

@Component({
    selector: 'app-ConnectedComponent',
    templateUrl: './connected.component.html',
    styleUrls: ['./connected.component.css']
})

/// This class is the base class for all components that need to send and receive messages to and from the backend.
/// It provides methods for sending messages and subscribing to incoming messages.
/// Subclasses should implement the handleMessages method to handle incoming messages, and the handleError method to handle errors.
/// If necessary, they can also implement the handleComplete method to handle the connection closing.
/// They can also call the sendMessage method to send messages.
export class ConnectedComponent extends BaseComponent implements OnInit, OnDestroy {

    constructor(protected connectionService: ConnectionService) {
        super();
    }
    
    connected = false;
    protected token: string  | null = null;

    protected getConnection(
        loginSubjectOrObserveHandshake?: rxjs.Subject<LoginCredentials> | boolean,
        isPrimary?: boolean
    ) {
        this.connectionService.getNewConnection(this, loginSubjectOrObserveHandshake, isPrimary);
        this.connected = true; // always true if no exception was thrown
    }

    // remember token of owned connection
    setToken(to: string) {
        this.token = to;
    }

    // Sends a message to the backend.
    sendMessage(message: Message) {
        // console.log("Connected Component prepares to send message:", message);
        if (this.token == null) {
            console.warn("Tried to send a message before the connection token was set", message);
            return;
        }
        message.token = this.token;
        this.connectionService.sendMessage(message, this.componentID);
    }

    /// This method closes the connection to the backend when the component is destroyed.
    ngOnDestroy(): void {
        if (this.componentID == null) {
            return;
        }
        console.info(this.componentID, 'is shutting down')
        if (this.connected) {
            this.connectionService.removeConnection(this.componentID);
            this.connected = false;
         }
    }

    // // Abstract method for components to implement login handling.
    // // This should only be implemented by LoginComponent
    // handleLoginMessage(message: Message): void {
    //     throw new Error('LoginComponent must implement the handleLoginMessage method.');
    // }

    // Abstract method for components to implement their message handling.
    // Messages after the handshaking
    handleMessages(message: Message): void {
        throw new Error('Subclasses must implement the handleMessages method.');
    }

    // Abstract method for components to implement their error handling.
    handleError(error: any): void {
        throw new Error('Subclasses must implement the handleError method.');
    }

    // Abstract method for components to implement their connection closing handling.
    handleComplete(): void {
        console.warn(`Connection closed for component ${this.componentID}.`);
    }

    // Creates the connection to the backend when the component is initialized.
    // Subclasses should call super.ngOnInit() in their ngOnInit method instead of
    // creating their own connection if they don't implement login dialogue
    ngOnInit() {
        this.getConnection();
    }
}
