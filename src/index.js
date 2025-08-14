/**
 * index.js
 * --------
 * The React entry point that renders the root of the
 * application. Sets up <BrowserRouter> and defines 
 * the top-level routes for:
 *   - "/" => App
 *   - "/view/:docId" => ViewRecording
 *   - "/admin" => AdminPage
 */


import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';
import './styles/index.css';

// Import your ViewRecording page
import ViewRecording from './pages/ViewRecording';

// Import your new AdminPage
import AdminPage from './pages/AdminPage'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Existing root path => main record/submit flow */}
        <Route path="/" element={<App />} />

        {/* Existing route => playback page */}
        <Route path="/view/:docId" element={<ViewRecording />} />

        {/* NEW: Admin route => /admin */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
