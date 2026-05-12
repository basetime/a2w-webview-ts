import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { webApp } from './atw';
import './styles.css';

if (!webApp.isEmbedded) {
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
