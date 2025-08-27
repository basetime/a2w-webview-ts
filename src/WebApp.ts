import type { Addtowallet } from './Addtowallet';
import type { AppEvents, Message } from './Message';

/**
 * Provides two way communication with the atw scanner.
 */
export default class WebApp<E extends Record<string, unknown> = AppEvents> {
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
   * Sends a message to the scanner.
   *
   * @param event The event to post.
   * @param payload The message to post.
   */
  public send = <K extends keyof E>(event: K, payload: E[K]): void => {
    this.atw?.send({
      action: event.toString(),
      payload,
    });
  };

  /**
   * Receives a message from the webview.
   *
   * Returns a function that removes the event listener.
   *
   * @param event The event to listen to.
   * @param callback The callback to call when a message is received.
   */
  public on = <K extends keyof E>(
    event: K,
    callback: (message: Message<E, K>) => void,
  ): (() => void) => {
    this.atw?.on(event.toString(), callback);

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
  public off = <K extends keyof E>(event: K, callback: (message: Message<E, K>) => void): void => {
    this.atw?.off(event.toString(), callback);
  };
}
