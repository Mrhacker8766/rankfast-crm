/* eslint-disable react-refresh/only-export-components, no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
    const [googleAccessToken, setGoogleAccessToken] = useState(() => {
        return localStorage.getItem('google_access_token') || null;
    });

    // If token exists, we treat the user as authenticated for Calendar API ops.
    // In a production app, we should also track token expiry.

    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            const token = tokenResponse.access_token;
            setGoogleAccessToken(token);
            localStorage.setItem('google_access_token', token);
        },
        onError: (error) => {
            console.error('Login Failed', error);
        },
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    const logoutCalendar = () => {
        setGoogleAccessToken(null);
        localStorage.removeItem('google_access_token');
    };

    const value = {
        googleAccessToken,
        isGoogleAuthenticated: !!googleAccessToken,
        loginToGoogle: login,
        logoutCalendar
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendar() {
    return useContext(CalendarContext);
}
