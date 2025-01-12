// console.log('init messages.data');

import { FetchMessage, ObjectMessage, StoreMessage } from "../messages/data.messages";
import { Message, MessageType } from "../messages/Message"

export class FetchSetupMessage extends FetchMessage {

    constructor(object: string, index: number | string, token?: string) {
        super(object, index, token, MessageType.FetchSetup);
    }
}

export class ObjectSetupMessage extends ObjectMessage {

  constructor(data: Message) { super(data); }
}

export class StoreSetupMessage extends StoreMessage {

    constructor(object: string, index: number | string, payload: any, token?: string) {
        super(object, index, payload, token, MessageType.StoreSetup);
    }
}