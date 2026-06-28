import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './upgrade.css';
import './slow-motion.css';
import './mobile-performance.css';
import './sticky-result-bar.css';
import './history-scroll.css';
import './conversion-pill-toggle.css';
import './calculate-button-label.js';
import './conversion-pill-toggle.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => registration.update()).catch(() => {});
  });
}
