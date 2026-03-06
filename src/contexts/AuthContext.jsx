/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    collection, doc, setDoc, updateDoc, deleteDoc,
    onSnapshot, query, getDoc, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Constants ────────────────────────────────────────────────────────────────
const AUTH_STORAGE_KEY = 'rankfast_crm_auth';
const AUTH_STATUS_KEY = 'rankfast_crm_is_authenticated';
const SETTINGS_STORAGE_KEY = 'rankfast_crm_settings';

// Only the Super Admin is permanently seeded — others are added manually
const CORE_ADMINS = [
    {
        id: 'admin-1',
        name: 'Admin (Rohit)',
        role: 'admin',
        email: import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'Admin@Rankfast.co',
        password: import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'Admin@Pranav'
    },
];

const DEFAULT_SETTINGS = { followUpDays: 7 };

const AuthContext = createContext(null);

// ─── Seed core admins into Firestore (only writes if document doesn't exist) ──
async function seedCoreAdmins() {
    for (const admin of CORE_ADMINS) {
        const ref = doc(db, 'users', admin.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, admin);
        }
    }
}

export function AuthProvider({ children }) {
    // ── Users: live-synced from Firestore ─────────────────────────────────────
    const [users, setUsers] = useState(CORE_ADMINS);

    useEffect(() => {
        // Seed core admins without overwriting existing ones
        seedCoreAdmins().catch(console.error);

        // Real-time listener for the users collection
        const unsubscribe = onSnapshot(
            query(collection(db, 'users')),
            (snapshot) => {
                const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                // Merge: always ensure core admins are in the list (in case Firestore read order differs)
                const mergedIds = new Set(fetched.map(u => u.id));
                const missing = CORE_ADMINS.filter(a => !mergedIds.has(a.id));
                setUsers([...fetched, ...missing]);
            },
            (err) => console.error('Firestore users error:', err)
        );

        return () => unsubscribe();
    }, []);

    // ── Session (stays in localStorage — per browser, by design) ─────────────
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const item = window.localStorage.getItem(AUTH_STORAGE_KEY);
            return item ? JSON.parse(item) : null;
        } catch { return null; }
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() =>
        window.localStorage.getItem(AUTH_STATUS_KEY) === 'true'
    );

    const [settings, setSettings] = useState(() => {
        try {
            const item = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
            return item ? JSON.parse(item) : DEFAULT_SETTINGS;
        } catch { return DEFAULT_SETTINGS; }
    });

    useEffect(() => {
        if (currentUser) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        } else {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }, [currentUser]);

    useEffect(() => {
        window.localStorage.setItem(AUTH_STATUS_KEY, String(isAuthenticated));
    }, [isAuthenticated]);

    useEffect(() => {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    // ── Login: reads LIVE from Firestore, falls back to CORE_ADMINS ───────────
    const login = async (email, password) => {
        const inputEmail = String(email).trim().toLowerCase();
        const inputPass = String(password).trim();

        try {
            // Fetch the LATEST user list from Firestore
            const snapshot = await getDocs(collection(db, 'users'));
            const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Always include core admins (in case Firestore is empty/slow)
            const mergedIds = new Set(allUsers.map(u => u.id));
            CORE_ADMINS.filter(a => !mergedIds.has(a.id)).forEach(a => allUsers.push(a));

            const user = allUsers.find(u => {
                if (!u.email || !u.password) return false;
                return String(u.email).trim().toLowerCase() === inputEmail &&
                    String(u.password).trim() === inputPass;
            });

            if (user) {
                window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
                setCurrentUser(user);
                setIsAuthenticated(true);
                return true;
            }
        } catch (err) {
            console.error('Login Firestore error, falling back:', err);
            // Fallback: try matching against CORE_ADMINS only
            const admin = CORE_ADMINS.find(u =>
                String(u.email).trim().toLowerCase() === inputEmail &&
                String(u.password).trim() === inputPass
            );
            if (admin) {
                window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(admin));
                setCurrentUser(admin);
                setIsAuthenticated(true);
                return true;
            }
        }

        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    // ── addUser: writes to Firestore → real-time listener updates all browsers ─
    const addUser = async (userData) => {
        const newUser = { ...userData, id: uuidv4() };
        await setDoc(doc(db, 'users', newUser.id), newUser);
        // Local state will update automatically via onSnapshot
    };

    // ── updateUser: updates in Firestore ─────────────────────────────────────
    const updateUser = async (id, updates) => {
        await updateDoc(doc(db, 'users', id), updates);
        if (currentUser?.id === id) {
            setCurrentUser(prev => ({ ...prev, ...updates }));
        }
    };

    // ── deleteUser: only super admin can delete anyone; super admin itself is immutable ──
    const SUPER_ADMIN_ID = 'admin-1';
    const deleteUser = async (id) => {
        // Super admin can never be deleted by anyone
        if (id === SUPER_ADMIN_ID) return;
        // Only the super admin can delete other core admins
        if (CORE_ADMINS.some(a => a.id === id) && currentUser?.id !== SUPER_ADMIN_ID) return;
        await deleteDoc(doc(db, 'users', id));
        if (currentUser?.id === id) logout();
    };

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated,
            users,
            settings,
            login,
            logout,
            addUser,
            updateUser,
            deleteUser,
            updateSettings
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
