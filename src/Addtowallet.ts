import type { Message } from './types';

export interface Addtowallet {
  /**
   * Sends a message to the Addtowallet app.
   * 
   * @param message The message to send.
   * @returns void
   */
  send: (message: Message<any, any>) => void;

  /**
   * Listens for events from the Addtowallet app.
   * 
   * @param event The event to listen for.
   * @param callback The callback to call when the event is received.
   * @returns void
   */
  on: (event: string, callback: (message: Message<any, any>) => void) => void;

  /**
   * Removes an event listener from the Addtowallet app.
   * 
   * @param event The event to remove the listener for.
   * @param callback The callback to remove.
   * @returns void
   */
  off: (event: string, callback: (message: Message<any, any>) => void) => void;
}
