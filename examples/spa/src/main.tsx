import { WebApp } from '@basetime/a2w-webview-ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Refuse to boot when not embedded in the scanner webview. A throwaway
// `WebApp` is used here because the React tree gets its own memoized
// instance via `useWebApp()` inside components.
if (!new WebApp().isEmbedded) {
  throw new Error('This app is not embedded in the atw scanner webview.');
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
