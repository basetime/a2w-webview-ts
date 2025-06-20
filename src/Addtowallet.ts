import type { Message } from './Message';

export interface Addtowallet {
  send: (message: Message) => void;
  on: (event: string, callback: (message: Message) => void) => void;
  off: (event: string, callback: (message: Message) => void) => void;
}
