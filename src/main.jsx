import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CalendarProvider } from './contexts/CalendarContext';
import App from './App.jsx';
import './index.css';

const GOOGLE_CLIENT_ID = "1052585843086-goq4k05jf0ts974s44qldr12c6qicgmf.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CalendarProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </CalendarProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

