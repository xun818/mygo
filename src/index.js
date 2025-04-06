import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // 可選，如果你有 css 的話

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
