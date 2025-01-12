import { TestBed } from '@angular/core/testing';
import * as rxjs  from 'rxjs';
import * as rxws from 'rxjs/webSocket';

import { ConnectionService, RXJS, Logger } from './connection.service';
import { ConnectedComponent } from './connected-component/connected.component';
import { IncomingMessage, OutgoingMessage, Message, MessageType } from './messages/Message';
import { LoginMessage, LoginCredentials, LogMessage } from "./messages/admin.messages";
import { ByeMessage, WelcomeMessage } from "./messages/admin.messages";
import { HelloMessage } from "./messages/admin.messages";

class MockOutMessage extends OutgoingMessage {
  constructor() {
    super(MessageType.None);
  }
}
class MockSubscription {}
class MockWebSocketSubject {
  pipe(op1: any, ...ops: any[]): MockWebSocketSubject { return this; }
  subscribe(observer?: Partial<rxjs.Observer<any>> | undefined): MockSubscription | null {
    return null;
  }
  next(message: any): void {}
  complete(): void {}
}
class MockSubject {
  pipe(op1: any, ...ops: any[]): MockSubject { return this; }
  subscribe(observer?: Partial<rxjs.Observer<any>>): MockSubscription | null { return null; }
}

// use a class derived from ConnectedComponent to allow access to protected members for unittests
class MockConnectedComponent extends ConnectedComponent {
  constructor(private connService: ConnectionService) {
    super(connService);
    this.componentID = 'mockComponent';
  }
  protected override token: string | null = null;
  override handleMessages(message: any) {}
  override handleError(error: any) {}
  override handleComplete() {}
  override setToken(token: string): void {}
  getToken() {return this.token; }
}


describe('ConnectionService', () => {
  let connectionService: ConnectionService = null!;
  let mockWebSocketSubject: MockWebSocketSubject;
  let mockSubscriber: MockConnectedComponent;
  let mockSubject: MockSubject;
  let mockTake: rxjs.MonoTypeOperatorFunction<any>;
  let mockTakeCred: rxjs.MonoTypeOperatorFunction<LoginCredentials>;
  let mockSkip: rxjs.MonoTypeOperatorFunction<any>;

  beforeEach(() => {
    connectionService = new ConnectionService;
    connectionService.BACKEND_ADDRESS = 'MockBackendAddress';
    ConnectionService._sessionToken = 'mockSes1';
    mockWebSocketSubject = new MockWebSocketSubject();
    mockSubscriber = new MockConnectedComponent(connectionService);
    mockSubject = new MockSubject();
    mockTake = () => rxjs.EMPTY;
    mockSkip = () => rxjs.EMPTY;
    ConnectionService.connections = {};
  });

  it('should be created', () => {
    expect(connectionService).toBeTruthy();
  });

  function testGetNewConnection(
    mockLoginSubject?: rxjs.ReplaySubject<LoginCredentials>,
    observeHandshake?: boolean,
    primary?: boolean
  ) {
    const spyOnDeserialize = spyOn(IncomingMessage,'deserialize');
    const spyOnWebSocket = 
      spyOn(connectionService, 'webSocket')
      .and.returnValue(mockWebSocketSubject as unknown as rxws.WebSocketSubject<Message>);
    const spyOnAddConnection = spyOn(ConnectionService, 'addConnection')
    const spyOnPipe = spyOn(mockWebSocketSubject, 'pipe').and.callThrough();
    const spyOnSubscribe = spyOn(mockWebSocketSubject,'subscribe');
    const spyOnTake = spyOn(RXJS, 'take')
      .and.returnValue(mockTake);
      const spyOnSkip = spyOn(RXJS, 'skip')
      .and.returnValue(mockSkip);

    // call the tested object
    if (mockLoginSubject) {
      connectionService.getNewConnection(mockSubscriber,mockLoginSubject,primary);
    } else {
      connectionService.getNewConnection(mockSubscriber,observeHandshake,primary);
    }

    expect(spyOnWebSocket).toHaveBeenCalledWith(
      {url:'MockBackendAddress', deserializer: spyOnDeserialize}
    );
    expect(ConnectionService.connections).toBeTruthy();
    expect(ConnectionService.connections).toEqual({});
    expect(spyOnAddConnection).toHaveBeenCalledOnceWith(
      mockWebSocketSubject as unknown as rxws.WebSocketSubject<Message>,
      mockSubscriber
    );
    expect(spyOnTake).toHaveBeenCalledOnceWith(2);
    expect(spyOnSkip).toHaveBeenCalledOnceWith(observeHandshake ? 0 : 2);
    expect(spyOnPipe).toHaveBeenCalledTimes(2);
    expect(spyOnPipe).toHaveBeenCalledWith(mockTake);
    expect(spyOnPipe).toHaveBeenCalledWith(mockSkip);
    expect(spyOnSubscribe).toHaveBeenCalledTimes(2);
    expect(spyOnSubscribe.calls.argsFor(0)[0]?.next).toBeTruthy();
    expect(spyOnSubscribe.calls.argsFor(0)[0]?.complete).toBeTruthy();
    expect(spyOnSubscribe.calls.argsFor(0)[0]?.error).toBeTruthy();
    const mockInMsg = new IncomingMessage({type: MessageType.Log});
    const arg0Next = spyOnSubscribe.calls.argsFor(0)[0]?.next;
    if (arg0Next) {
      const spyOnHandleMessages = spyOn(mockSubscriber, 'handleMessages');
      arg0Next(mockInMsg);
      expect(spyOnHandleMessages).toHaveBeenCalledTimes(1);
      expect(spyOnHandleMessages).toHaveBeenCalledOnceWith(mockInMsg);
    }
    const arg1Complete = spyOnSubscribe.calls.argsFor(1)[0]?.complete;
    if (arg1Complete) {
      const spyOnHandleComplete = spyOn(mockSubscriber, 'handleComplete');
      arg1Complete();
      expect(spyOnHandleComplete).toHaveBeenCalledOnceWith();
    }
    const arg1Error = spyOnSubscribe.calls.argsFor(1)[0]?.error;
    if (arg1Error) {
      const spyOnHandleError = spyOn(mockSubscriber, 'handleError');
      arg1Error('muck');
      expect(spyOnHandleError).toHaveBeenCalledOnceWith('muck');
    }
    expect(spyOnSubscribe.calls.argsFor(1)[0]?.next).toBeTruthy();
    expect(spyOnSubscribe.calls.argsFor(1)[0]?.complete).toBeFalsy();
    expect(spyOnSubscribe.calls.argsFor(1)[0]?.error).toBeFalsy();
    const arg1Next = spyOnSubscribe.calls.argsFor(1)[0]?.next;
    if (arg1Next) {
      const spyOnHandleHandshake = spyOn(connectionService, 'handleHandshakeMessages');
      arg1Next(mockInMsg );
      expect(spyOnHandleHandshake).toHaveBeenCalledOnceWith(
        mockInMsg,
        {
          service: connectionService,
          connection: mockWebSocketSubject as unknown as rxws.WebSocketSubject<Message>,
          subscriber: mockSubscriber,
          loginSubject: mockLoginSubject ? mockLoginSubject : ConnectionService.loginBySessionTokenSubject,
          isPrimary: primary==true
        }
      );
    }
  }

  it('should create new connection and subscribe with credential Subject', () => {
    const mockReplaySubject = new rxjs.ReplaySubject<LoginCredentials>();
    testGetNewConnection(mockReplaySubject, true);
  });

  it('should create new connection and subscribe without skip', () => {
    testGetNewConnection(undefined, true);
  });

  it('should create new primary connection and subscribe without skip', () => {
    testGetNewConnection(undefined, true, true);
  });

  it('should create new connection and subscribe with skip', () => {
    testGetNewConnection(undefined, false);
  });

  function testHandleHandshakeMessage(msg: Message, primary: boolean, error?: RegExp|string) {
    const mockContext = {
      service: connectionService,
      connection: mockWebSocketSubject as unknown as rxws.WebSocketSubject<Message>,
      subscriber: mockSubscriber,
      loginSubject: mockSubject as rxjs.Subject<any>,
      isPrimary: primary,
      rxjsTake: mockTakeCred
    };
    const spyOnSetToken = spyOn(mockSubscriber, 'setToken');
    const spyOnPipe = spyOn(mockSubject, 'pipe').and.callThrough();
    const spyOnTake = spyOn(RXJS, 'take')
      .and.returnValue(mockTake);
    const spyOnSubscribe = spyOn(mockSubject,'subscribe');
    const spyOnSendMessage = spyOn(connectionService, 'sendMessage');
    const spyOnNext = spyOn(ConnectionService.loginBySessionTokenSubject, 'next');
    const spyOnTakeOverConsole = spyOn(Logger, 'takeOverConsole');

    if (error) {
      console.log('expect to throw',error)
      expect( function() {
        connectionService.handleHandshakeMessages(msg, mockContext);
      }).toThrowError(error);
      return;
    } else {
      connectionService.handleHandshakeMessages(msg, mockContext);
    }

    if (msg.type==MessageType.Hello && msg.token) {
      expect(spyOnSetToken).toHaveBeenCalledOnceWith('mockToken');
      expect(spyOnPipe).toHaveBeenCalledTimes(1);
      expect(spyOnPipe).toHaveBeenCalledWith(mockTake);
      expect(spyOnTake).toHaveBeenCalledOnceWith(1);
      expect(spyOnSubscribe).toHaveBeenCalledTimes(1);
      expect(spyOnSubscribe.calls.argsFor(0)[0]?.next).toBeTruthy();
      expect(spyOnSubscribe.calls.argsFor(0)[0]?.complete).toBeFalsy();
      expect(spyOnSubscribe.calls.argsFor(0)[0]?.error).toBeFalsy();
      const mockCred = {user: 'mick', mock: 'muck'};
      const mockLoginMsg = new LoginMessage(
        mockCred, msg.token, primary, 
        mockContext.subscriber.componentID);
      const arg0Next = spyOnSubscribe.calls.argsFor(0)[0]?.next;
      if (arg0Next) {
        arg0Next(mockCred);
        expect(spyOnSendMessage).toHaveBeenCalledTimes(1);
        expect(spyOnSendMessage).toHaveBeenCalledOnceWith(mockLoginMsg, 
          mockContext.subscriber.componentID);
      }
      expect(spyOnNext).not.toHaveBeenCalled();
      expect(spyOnTakeOverConsole).not.toHaveBeenCalled();
      expect(ConnectionService._sessionToken).toBe('mockSes1');
    } else if (msg.type==MessageType.Welcome && msg.ses_token) {
      expect(spyOnSetToken).not.toHaveBeenCalled();
      expect(spyOnPipe).not.toHaveBeenCalled();
      expect(spyOnPipe).not.toHaveBeenCalled();
      expect(spyOnTake).not.toHaveBeenCalled();
      expect(spyOnSubscribe).not.toHaveBeenCalled();
      if (primary) {
        expect(spyOnNext).toHaveBeenCalledOnceWith({ses_token: msg.ses_token});
        expect(spyOnTakeOverConsole).toHaveBeenCalledOnceWith(mockSubscriber);
        expect(ConnectionService._sessionToken).toBe(msg.ses_token);
      } else {
        expect(spyOnNext).not.toHaveBeenCalled();
        expect(spyOnTakeOverConsole).not.toHaveBeenCalled();
        expect(ConnectionService._sessionToken).toBe('mockSes1');
      }
    } else {
      expect(spyOnSetToken).not.toHaveBeenCalled();
      expect(spyOnPipe).not.toHaveBeenCalled();
      expect(spyOnPipe).not.toHaveBeenCalled();
      expect(spyOnTake).not.toHaveBeenCalled();
      expect(spyOnSubscribe).not.toHaveBeenCalled();
      expect(spyOnNext).not.toHaveBeenCalled();
      expect(spyOnTakeOverConsole).not.toHaveBeenCalled();
      expect(ConnectionService._sessionToken).toBe('mockSes1');
    }
  }

  it('should handle HelloMessage', () => {
    const mockHelloMessage = new HelloMessage({type: MessageType.Hello, token: 'mockToken'});
    testHandleHandshakeMessage(mockHelloMessage, false);
  });

  it('should handle HelloMessage for primary', () => {
    const mockHelloMessage = new HelloMessage({type: MessageType.Hello, token: 'mockToken'});
    testHandleHandshakeMessage(mockHelloMessage, true);
  });

  it('should handle first WelcomeMessage', () => {
    const mockWelcomeMessage = new WelcomeMessage(
      {type: MessageType.Welcome, token: 'mockToken', ses_token: 'mockSession'});
    ConnectionService._sessionToken = '';
    testHandleHandshakeMessage(mockWelcomeMessage, true);
  });

  it('should handle later WelcomeMessages', () => {
    const mockWelcomeMessage = new WelcomeMessage(
      {type: MessageType.Welcome, token: 'mockToken', ses_token: 'mockSes1'});
    testHandleHandshakeMessage(mockWelcomeMessage, false);
  });

  it("should throw when session token doesn't match", () => {
    const mockWelcomeMessage = new WelcomeMessage(
      {type: MessageType.Welcome, token: 'mockToken', ses_token: 'mockOtherSes'});
    testHandleHandshakeMessage(mockWelcomeMessage, false, /alien session/);
  })

  it('should handle ByeMessages', () => {
    const mockByeMessage = new ByeMessage(
      {type: MessageType.Bye, token: 'mockToken', ses_token: 'mockSession'});
    testHandleHandshakeMessage(mockByeMessage, false);
  });

  it('should output a message on the components connection', () => {
    const mockMessage = new MockOutMessage();
    const mockComponentId = 'MockComponent_99'
    ConnectionService.connections[mockComponentId] = {
      subject: mockWebSocketSubject as unknown as rxws.WebSocketSubject<any>,
      subscriber: mockSubscriber
    }
    const spyOnNext = spyOn(
      ConnectionService.connections[mockComponentId].subject,
      'next'
    );

    connectionService.sendMessage(mockMessage, mockComponentId);

    expect(spyOnNext).toHaveBeenCalledOnceWith(mockMessage);
  });

  it('should add a connection to connections list', () => {
    expect(ConnectionService.connections).toHaveSize(0);
    const mockId1 = 'mockComponent_1';
    const mockSubject1 = new MockWebSocketSubject()  as unknown as rxws.WebSocketSubject<any>;
    const mockSubscriber1 = new MockConnectedComponent(connectionService);
    mockSubscriber1.componentID = mockId1;

    ConnectionService.addConnection(mockSubject1, mockSubscriber1);
    expect(ConnectionService.connections).toHaveSize(1);
    expect(ConnectionService.connections[mockId1]).toBeTruthy();
    expect(ConnectionService.connections).toEqual({mockComponent_1:
      {subject: mockSubject1, subscriber: mockSubscriber1}
    });

    const mockId2 = 'mockComponent_2';
    const mockSubject2 = new MockWebSocketSubject()  as unknown as rxws.WebSocketSubject<any>;
    const mockSubscriber2 = new MockConnectedComponent(connectionService);
    mockSubscriber2.componentID = mockId2;

    ConnectionService.addConnection(mockSubject2, mockSubscriber2);
    expect(ConnectionService.connections).toHaveSize(2);
    expect(ConnectionService.connections[mockId2]).toBeTruthy();
    expect(ConnectionService.connections).toEqual({
      mockComponent_1: {subject: mockSubject1, subscriber: mockSubscriber1},
      mockComponent_2: {subject: mockSubject2, subscriber: mockSubscriber2}
    });
  });

  it('should remove connection from connections list', () => {
    const mockId1 = 'mockComponent_1';
    const mockSubject1 = new MockWebSocketSubject()  as unknown as rxws.WebSocketSubject<any>;
    const mockSubscriber1 = new MockConnectedComponent(connectionService);
    mockSubscriber1.componentID = mockId1;
    const mockId2 = 'mockComponent_2';
    const mockSubject2 = new MockWebSocketSubject()  as unknown as rxws.WebSocketSubject<any>;
    const mockSubscriber2 = new MockConnectedComponent(connectionService);
    mockSubscriber2.componentID = mockId2;
    ConnectionService.connections = {
      mockComponent_1: {subject: mockSubject1, subscriber: mockSubscriber1},
      mockComponent_2: {subject: mockSubject2, subscriber: mockSubscriber2}
    };
    const spyOnComplete1 = spyOn(mockSubject1, 'complete');
    const spyOnComplete2 = spyOn(mockSubject2, 'complete');

    expect(ConnectionService.connections).toHaveSize(2);
    expect(ConnectionService.connections).toEqual({
      mockComponent_1: {subject: mockSubject1, subscriber: mockSubscriber1},
      mockComponent_2: {subject: mockSubject2, subscriber: mockSubscriber2}
    });

    connectionService.removeConnection(mockId1);
    expect(ConnectionService.connections).toHaveSize(1);
    expect(spyOnComplete1).toHaveBeenCalledOnceWith();
    expect(spyOnComplete2).not.toHaveBeenCalled();
    expect(ConnectionService.connections).toEqual({
      // mockComponent_1: {subject: mockSubject1, subscriber: mockSubscriber1},
      mockComponent_2: {subject: mockSubject2, subscriber: mockSubscriber2}
    });
  });
});