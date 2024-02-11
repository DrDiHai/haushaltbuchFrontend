export enum MessageType {
    Hello = "Hello",
    Login = "Login",
    Welcome = "Welcome",
    Bye = "Bye"
  }

export interface Message {
    type: MessageType;
    token?: string;
    status?: string;
    ses_token?: string;
  }
  
class BasicMessage implements Message {
    type: MessageType;
    token?: string;
    status?: string;
    constructor(type: MessageType, token?: string, status?: string) {
      this.type = type;
      this.token = token;
      this.status = status;
    }
    serialize(): string {
      return JSON.stringify(this);
    }
  }


export class HelloMessage extends BasicMessage {
    constructor(token?: string, status?: string) {
      super(MessageType.Hello, token, status);
    }
  }

export class LoginMessage extends BasicMessage {
    user: string;
    constructor(user:string, token?: string, status?: string) {
      super(MessageType.Login, token, status);
      this.user = user;
    }
  }

export class WelcomeMessage extends BasicMessage {
  ses_token: string = "";
}