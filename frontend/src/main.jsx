import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Import App component from App.jsx
import './styles/index.css'; // Import Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);