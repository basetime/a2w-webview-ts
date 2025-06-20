import { Addtowallet } from "src/Addtowallet";

export default class EmbeddedApp {
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
}