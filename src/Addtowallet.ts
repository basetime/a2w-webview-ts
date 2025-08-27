import type { Message } from './Message';

export interface Addtowallet {
  send: (message: Message<any, any>) => void;
  on: (event: string, callback: (message: Message<any, any>) => void) => void;
  off: (event: string, callback: (message: Message<any, any>) => void) => void;
}
