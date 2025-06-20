import type { Addtowallet } from './Addtowallet';
import type { Message } from './Message';

/**
 * Provides two way communication with the atw scanner.
 */
export default class WebApp {
  /**
   * Is the app embedded in the atw scanner webview?
   */
  public readonly isEmbedded: boolean = true;

  /**
   * The atw object.
   */
  private readonly atw?: Addtowallet;

  /**
   * Constructor.
   */
  constructor() {
    this.isEmbedded = window.ReactNativeWebView !== undefined && window.atw !== undefined;
    this.atw = window.atw;
  }

  /**
   * Posts a message to the scanner.
   *
   * @param message The message to post.
   */
  public send = (message: Message): void => {
    this.atw?.send(message);
  };

  /**
   * Receives a message from the webview.
   *
   * Returns a function that removes the event listener.
   *
   * @param event The event to listen to.
   * @param callback The callback to call when a message is received.
   */
  public on = (event: string, callback: (message: Message) => void): (() => void) => {
    this.atw?.on(event, callback);

    return () => {
      this.off(event, callback);
    };
  };

  /**
   * Removes an event listener.
   *
   * @param event The event to remove.
   * @param callback The callback to remove.
   */
  public off = (event: string, callback: (message: Message) => void): void => {
    this.atw?.off(event, callback);
  };
}
