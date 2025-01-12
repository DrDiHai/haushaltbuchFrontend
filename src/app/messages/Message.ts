// console.log('init messages.Message');

import { HelloMessage, WelcomeMessage, ByeMessage } from "./admin.messages";
import { ObjectMessage } from "./data.messages"

export enum MessageType {
  None = 'None',
  Log = "Log",
    Hello = "Hello",
    Login = "Login",
    Welcome = "Welcome",
    Setup = "Setup",
    Bye = "Bye",
    Echo = "Echo",
    Fetch = "Fetch",
    Object = "Object",
    Store = 'Store',
    FetchSetup = "FetchSetup",
    ObjectSetup = "ObjectSetup",
    StoreSetup = 'StoreSetup'
  }

  
export interface Message {
  type: MessageType;
  token?: string;
  status?: string;
  reason?: string;
  ses_token?: string;
  object?: string;
  index?: number | string;
  payload?: any;
}

export class OutgoingMessage implements Message {
  type: MessageType;
  token?: string;
  status?: string;
  constructor(type: MessageType, token?: string, status?: string) {
    this.type = type;
    this.token = token;
    if (status) { this.status = status; }
  }
}

export class IncomingMessage implements Message {
    type: MessageType;
    token: string;
    status?: string;
    ses_token?: string;
    constructor(data: Message) {
      this.type = data.type;
      this.token = data.token || '';
      this.status = data.status;
      this.ses_token = data.ses_token;
    }
}



