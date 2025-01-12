import { Message, IncomingMessage, MessageType } from './Message'
import { HelloMessage,WelcomeMessage,ByeMessage } from './admin.messages'
import { ObjectMessage } from './data.messages'
import { ObjectSetupMessage } from './setup.messages'

export function deserialize(event: MessageEvent): Message {
    let data = JSON.parse(event.data)
    switch (data.type) {
      case MessageType.Object:
        return new ObjectMessage(data);
      case MessageType.ObjectSetup:
        return new ObjectSetupMessage(data);
      case MessageType.Hello:
        return new HelloMessage(data);
      case MessageType.Welcome:
        return new WelcomeMessage(data);
      case MessageType.Bye:
        return new ByeMessage(data);
      default:
        return new IncomingMessage(data);
    }
  }
  