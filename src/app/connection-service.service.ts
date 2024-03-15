import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig} from 'rxjs/webSocket';
import { HelloMessage, LoginMessage, LoginMessageWithSessionToken, Message, MessageType, deserialize } from './Message';
import { ConnectedComponent } from './ConnectedComponent/ConnectedComponent.component';

@Injectable({
    providedIn: 'root'
})


/// This Service manages all WebSocket connections to the backend.
/// It provides new connections to components that need them, and manages the connections.
/// Components should call the getNewConnection method to get a new connection.
/// They should also call the removeConnection method when they are done with the connection.
export class ConnectionService {

    constructor() { }

    BACKEND_ADDRESS = 'ws://localhost:8765/'
    private connections: { [componentId: string]: WebSocketSubject<object> } = {};
    private sessionToken: string = "";
    componentCounter: number = 0;

    // Create a WS Subject; used locally to allow patching in unit test
    // This method is not tested by any spec, change with utmost care
    _createWebSocketSubject(url: string): WebSocketSubject<Message> {
        return new WebSocketSubject({url: url, deserializer: deserialize});
    }
    // Create a new connection and return it.
    // Users of the connection must provide the returned componentID when sending messages.
    getNewConnection(subscriber: ConnectedComponent): void {
        let connection = this._createWebSocketSubject(this.BACKEND_ADDRESS);
        connection.subscribe({next: (message: object) => console.log("Received message", message)});
        this.nextHelloMessage(connection, subscriber);
    }
    
    // Get a connection token from the backend.
    nextHelloMessage(connection: WebSocketSubject<Message>, subscriber: ConnectedComponent) {
        const helloSubscription = connection.subscribe({
            next: (message) => {
                // The first message received from the backend should be a HelloMessage with a token.
                if (message instanceof HelloMessage) {
                    console.group("Received HelloMessage", message, "on connection", connection, "and subscriber", subscriber)
                    console.debug("this is", this);
                    subscriber.setToken(message.token);
                    this.addConnection(message.token, connection);
                    helloSubscription.unsubscribe();
                    console.log("Subscribing to connection with connected component message handler", subscriber.handleMessages)
                    connection.subscribe({
                        next: (message) => subscriber.handleMessages(message)
                    });
                    console.groupEnd();
                } else {
                    console.error("Received invalid HelloMessage:", message);
                }
            },
            error: (error) => subscriber.handleError(error),
            complete: () => subscriber.handleComplete()
        });
    }

    // Send a message to the backend.
    sendMessage(token: string, message: Message) {
        let connection = this.connections[token];
        const type: MessageType = message.type;
        if (this.sessionToken == "" && ![MessageType.Login, MessageType.Hello].includes(type)) {
            console.error("Cannot send message without session token. Need to send a login message first.", message);
            return;
        }
        message.ses_token = this.sessionToken;
        message.token = token;
        console.log("Sending message", message);
        connection.next(message);
        
    }

    addConnection(id: string, connection: WebSocketSubject<any>) {
        console.log("Adding connection", id, connection)
        this.connections[id] = connection;
        console.log("Known connections:", this.connections)
    }

    // Remove a connection when a component is done with it.
    removeConnection(componentId: string): void {
        const connection = this.connections[componentId];
        if (connection) {
            connection.complete();
            delete this.connections[componentId];
        }
    }
    
    // Set the session token, which is used to authenticate connections to the backend.
    setSessionToken(ses_token: string, originating_token: string) {
        console.log("Setting session token:", ses_token);
        this.sessionToken = ses_token;
        // Update session token for all connections
        for (let token in this.connections) {
            // Skip the connection that sent the login message
            if (token == originating_token) {
                continue;
            }
            console.log("Updating session token for connection", token)
            this.updateSessionToken(token);
        }
    }

    // Counter to prevent infinite loops when updating session tokens
    session_token_counter: number = 0

    // Update session token for connection
    updateSessionToken(componentId: string) {
        this.session_token_counter += 1;
        if (this.session_token_counter > 10) {
            throw new Error("Session token update loop detected");
        }
        console.log("Updating session token for connection", componentId);
        if (this.sessionToken == "") {
            throw new Error("Cannot update session token without a session token.");
        }
        let message = new LoginMessageWithSessionToken(this.sessionToken);
        this.sendMessage(componentId, message);
    }

}