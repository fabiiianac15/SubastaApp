import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/big-shoulders-display';
import '@fontsource-variable/hanken-grotesk';
import './styles/system.css';
import { initTheme } from './lib/theme';
import App from './App';
import reportWebVitals from './reportWebVitals';

initTheme();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
