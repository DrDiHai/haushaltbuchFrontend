// console.log('init connection service');

import { Injectable, EventEmitter } from '@angular/core';
import * as rxjs from 'rxjs';
import * as rxws from 'rxjs/webSocket';
import { HelloMessage, WelcomeMessage, ByeMessage, LogMessage, LogLevel, LoginMessage, LoginCredentials } from "./messages/admin.messages";
import { Message, IncomingMessage, MessageType } from './messages/Message';
import { deserialize } from './messages/deserialize_message'
import { ConnectedComponent } from './connected-component/connected.component';

  export class RXJS {
    static take(n: number): rxjs.MonoTypeOperatorFunction<any> { return rxjs.take(n); }
    static skip(n: number): rxjs.MonoTypeOperatorFunction<any> { return rxjs.skip(n); }
}

export class Logger {
    static takeOverConsole(component: ConnectedComponent){
        var console: any = window.console;
        if (!console) return;
        function intercept(method: string, level: LogLevel){
            var original = console[method];
            console[method] = function(){
                // join arguments to one string
                var message = Array.prototype.slice.apply(arguments).join(' ');
                // determine caller of console message
                var caller = '';
                const stack = new Error().stack;
                if (stack) caller = stack.split("\n")[2].trim().split(" ")[1];
                component.sendMessage(new LogMessage(level, message, caller));
                // output to console
                if (original.apply){
                    // Do this for normal browsers
                    original.apply(console, arguments);
                }else{
                    // Do this for IE
                    original(message);
                }
            }
        }
        var methods = ['debug', /*'log',*/ 'info', 'warn', 'error'];
        var levels = [LogLevel.Debug, /*LogLevel.Info,*/ LogLevel.Info, LogLevel.Warning, LogLevel.Error]
        for (var i = 0; i < methods.length; i++) {
            intercept(methods[i], levels[i]);
        }
    }
}

type LoginSubject = rxjs.Subject<{user?: string, ses_token?: string}>;


@Injectable({ providedIn: 'root' })
/// This Service manages all WebSocket connections to the backend.
/// It provides new connections to components that need them, and manages the connections.
/// Components should call the getNewConnection method to get a new connection.
/// They should also call the removeConnection method when they are done with the connection.
export class ConnectionService {

    constructor() { }

    BACKEND_ADDRESS = 'ws://localhost:8765/';

    static connections: { [componentId: string]: {
        subject: rxws.WebSocketSubject<Message>,
        subscriber: ConnectedComponent
    } } = {};

    static loginBySessionTokenSubject = new rxjs.ReplaySubject<LoginCredentials>();
    static _sessionToken: string = "";

    // methods acting as wrappers for imported functions, allowing replacement by unittest spies
    webSocket(cfg: rxws.WebSocketSubjectConfig<Message>): rxws.WebSocketSubject<Message> {
        return rxws.webSocket(cfg);
    }

    loginCompLoginSubject?: rxjs.Subject<LoginCredentials>;

    // Create a new connection and subscribe for the handshake messages (HelloMessage, WelcomeMessage).
    // Subscribe the subscriber for further messages.
    // The optional second parameter provides either a Subject or a boolean 
    // If a Subject is present it will be subscribed for the login credentials, otherwise an internal observer
    // will be used for accessing the session token as login credential
    // If the secon parameter is truthy the handshake messages (first 2 messages) will be delivered to the subscriber
    getNewConnection(subscriber: ConnectedComponent, loginSubject?: rxjs.Subject<LoginCredentials>, isPrimary?: boolean): void;
    getNewConnection(subscriber: ConnectedComponent, observeHandshake?: boolean, isPrimary?: boolean): void;
    getNewConnection(
        subscriber: ConnectedComponent,
        loginSubjectOrObserveHandshake?: rxjs.Subject<LoginCredentials> | boolean,
        isPrimary?: boolean
    ): void;
    getNewConnection(
        subscriber: ConnectedComponent,
        loginSubjectOrObserveHandshake?: rxjs.Subject<LoginCredentials> | boolean,
        isPrimary?: boolean
    ): void {
        console.groupCollapsed('Creating connection for component ', subscriber.componentID);
        console.log('Subscriber: ', subscriber); 
        console.log('LoginSubjectOrObserveHandshake: ',loginSubjectOrObserveHandshake);
        console.log('is primary: ', isPrimary);
        let connection = this.webSocket({url: this.BACKEND_ADDRESS, deserializer: deserialize});
        let loginSubject: LoginSubject;
        loginSubject = (loginSubjectOrObserveHandshake instanceof rxjs.Subject)
            ? loginSubjectOrObserveHandshake
            : ConnectionService.loginBySessionTokenSubject;
        ConnectionService.addConnection(connection, subscriber);
        connection.pipe(RXJS.skip(loginSubjectOrObserveHandshake ? 0 : 2)).subscribe({
            next: (message: Message) => subscriber.handleMessages(message),
            complete: () => subscriber.handleComplete(),
            error: (error: any) => subscriber.handleError(error)
        });
        connection.pipe(RXJS.take(2)).subscribe({
            next: (message: Message) => this.handleHandshakeMessages(
                message, {
                    service: this,
                    connection: connection,
                    subscriber: subscriber,
                    /* use either credentials from the subscriber or the local session token: */
                    loginSubject: loginSubject,
                    isPrimary: isPrimary == true
                    // ,rxjsTake: RXJS.takeCred
                }
            )
            // ,complete: () => { console.log('handshake completed for', subscriber.componentID); }
        });
        console.groupEnd();
    }
    
    // Handle the first two messages from a new connection, it should be a HelloMessage and a WelcomeMessage
    // If the session token is not set yet, assume we receive it after successfull logon by 
    // LoginComponent and send the ses_token through the sessionTokenSubject
    handleHandshakeMessages(
        message: Message,
        that?: {
            service: ConnectionService,
            connection: rxws.WebSocketSubject<Message>,
            subscriber: ConnectedComponent,
            loginSubject: LoginSubject,
            isPrimary: boolean
            // ,rxjsTake: (n: number) => rxjs.MonoTypeOperatorFunction<LoginCredentials>
        }
    ) {
        console.groupCollapsed('handle handshake: ', message.type, 'to', that?.subscriber.componentID);
        console.log( message); console.log('that:', that);
        console.groupEnd();
        if (message instanceof HelloMessage) {
            if (that) {
                console.log(that.subscriber.componentID, 'awaits credentials')
                that.subscriber.setToken(message.token);
                that.loginSubject.pipe(RXJS.take(1)).subscribe({
                    next: (credentials: LoginCredentials) => {
                        console.log(that.subscriber.componentID, 'got credentials:', credentials);
                        that.service.sendMessage(
                            new LoginMessage(credentials, message.token, that.isPrimary, that.subscriber.componentID),
                            that.subscriber.componentID
                        );
                    }
                });
                // no need to unsubscribe because take(1) implicates that
            }
        } else if (message instanceof WelcomeMessage) {
            // if received session token is from different session this is an error
            if (message.ses_token && ConnectionService._sessionToken 
                && message.ses_token != ConnectionService._sessionToken) {
                    console.error('Received session token of alien session');
                    throw new Error('Received session token of alien session');
            }
            // if the session token is not set yet provide it for other connections
            if (message.ses_token && ! ConnectionService._sessionToken ) {
                ConnectionService._sessionToken = message.ses_token;
                ConnectionService.loginBySessionTokenSubject.next({ses_token: message.ses_token});
            }
            if (that) {
                if (that && that.isPrimary) {
                Logger.takeOverConsole(that.subscriber);
                }
                console.info('Connection established for', that.subscriber.componentID);
            }
        } else if (message instanceof ByeMessage) {
            console.error('Logon failed');
        }
    }

    // Send a message to the backend.
    sendMessage(message: Message, componentId: string) {
        let connection = ConnectionService.connections[componentId].subject;
        console.groupCollapsed("Sending", message.type, 'for',
            (message instanceof LogMessage) ? message.caller : componentId
        );
        console.log('Message:', message);
        console.log('Connection:', connection);
        console.log('Component:', ConnectionService.connections[componentId].subscriber);
        console.groupEnd();
        connection.next(message);
    }

    // Associate a connection token to the WS connection und the subscribing component
    static addConnection(
        subject: rxws.WebSocketSubject<Message>,
        subscriber: ConnectedComponent
    ) {
        console.groupCollapsed("Adding connection", subscriber.componentID);
        console.log('subject:', subject); console.log('subscriber:', subscriber); 
        ConnectionService.connections[subscriber.componentID] = {
            subject: subject,
            subscriber: subscriber
        };
        console.log("Known connections:", ConnectionService.connections);
        console.groupEnd();
    }

    // Remove a connection when a component is done with it.
    removeConnection(componentId: string): void {
        if (!ConnectionService.connections[componentId]) {
            console.error('Closing connection not found.');
            return;
        }
        ConnectionService.connections[componentId].subject.complete();
        // according to ChatGPT we don't need to unsubscribe after .complete()
        // evreything is already closed cleanly
        delete ConnectionService.connections[componentId];
    }
    
}