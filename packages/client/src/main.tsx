import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { initNative } from './lib/native.js';
import { api } from './api/client.js';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Initialize native platform features (no-op on web)
void initNative((token) => {
  // Register push token with backend
  void api.post('/notifications/push-token', { token, platform: 'capacitor' }).catch(() => {});
});
