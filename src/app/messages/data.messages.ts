// console.log('init messages.data');

import { MessageType, Message, IncomingMessage, OutgoingMessage } from "../messages/Message";

export class FetchMessage extends OutgoingMessage {
  object: string;
  index: number | string;

    constructor(
      object: string,
      index: number | string,
      token?: string,
      message_type?: MessageType
    ) {
        super(message_type || MessageType.Fetch, token);
        this.object = object;
        this.index = index;
    }
}

export class ObjectMessage extends IncomingMessage {
  object: string;
  index: number | string;
  payload: any;

  constructor(data: Message) {
    super(data);
    this.object = data.object || '';
    this.index = data.index || '';
    this.payload = data.payload;
  }
}

export class StoreMessage extends OutgoingMessage {
  object: string;
  index: number | string;
  payload: any;

    constructor(
      object: string,
      index: number | string,
      payload: any,
      token?: string,
      message_type?: MessageType
    ) {
        super(message_type || MessageType.Store, token);
        this.object = object;
        this.index = index;
        this.payload = payload;
    }
}