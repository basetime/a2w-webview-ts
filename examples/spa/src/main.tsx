import { WebApp } from '@basetime/a2w-webview-ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import NotEmbeddedScreen from './screens/NotEmbeddedScreen';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing in index.html');
}

// Render a friendly message when not embedded in the scanner WebView
// (e.g. opened in a regular browser tab) instead of throwing. The React
// tree gets its own memoized `WebApp` instance via `useWebApp()` inside
// components, so the one constructed here is only used for the
// `isEmbedded` probe.
const isEmbedded = new WebApp().isEmbedded;

createRoot(container).render(
  <StrictMode>{isEmbedded ? <App /> : <NotEmbeddedScreen />}</StrictMode>,
);
