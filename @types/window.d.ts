import type { Addtowallet } from './Addtowallet';

declare global {
  interface Window {
    ReactNativeWebView: any;
    atw: Addtowallet;
  }
}

export {};