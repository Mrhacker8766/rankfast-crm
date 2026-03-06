import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
    onSnapshot, query, orderBy, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Lead ID generation helper ───────────────────────────────────────────────
function generateNextLeadId(currentLeads) {
    let maxId = 1000;
    currentLeads.forEach(l => {
        if (l.leadId && l.leadId.startsWith('#LD-')) {
            const num = parseInt(l.leadId.replace('#LD-', ''), 10);
            if (!isNaN(num) && num > maxId) maxId = num;
        }
    });
    return `#LD-${maxId + 1}`;
}

// ─── Migrate legacy lead fields ───────────────────────────────────────────────
function migrateLead(lead) {
    return {
        communications: [],
        documents: [],
        convertedAmount: '',
        leadStage: '',
        meetingType: '',
        ...lead,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  useLeads — Firestore-backed, real-time across all browsers
// ═══════════════════════════════════════════════════════════════════════════════
export function useLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener — triggered for ALL browsers instantly on any change
    useEffect(() => {
        const leadsRef = collection(db, 'leads');
        const q = query(leadsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(d => migrateLead({ id: d.id, ...d.data() }));
            setLeads(fetched);
            setLoading(false);
        }, (error) => {
            console.error('Firestore leads error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addLead = async (leadDetails) => {
        try {
            const newId = uuidv4();
            const leadId = generateNextLeadId(leads);
            const payload = {
                ...migrateLead(leadDetails),
                id: newId,
                leadId,
                createdAt: serverTimestamp(),
            };
            // Use the uuid as the Firestore document ID for consistency
            await setDoc(doc(db, 'leads', newId), payload);
        } catch (error) {
            console.error('Error adding lead:', error);
            window.alert('Failed to save lead to database. Please check your internet or database permissions.\n\nError: ' + error.message);
        }
    };

    const updateLead = async (id, updates) => {
        try {
            const ref = doc(db, 'leads', id);
            await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
        } catch (error) {
            console.error('Error updating lead:', error);
            window.alert('Failed to update lead. Error: ' + error.message);
        }
    };

    const deleteLead = async (id) => {
        try {
            await deleteDoc(doc(db, 'leads', id));
        } catch (error) {
            console.error('Error deleting lead:', error);
            window.alert('Failed to delete lead. Error: ' + error.message);
        }
    };

    const updateStatus = async (id, newStatusType, newStatusValue) => {
        await updateLead(id, { [newStatusType]: newStatusValue });
    };

    return { leads, loading, addLead, updateLead, deleteLead, updateStatus };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  useMeetings — Firestore-backed, real-time across all browsers
// ═══════════════════════════════════════════════════════════════════════════════
export function useMeetings() {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const meetingsRef = collection(db, 'meetings');
        const q = query(meetingsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMeetings(fetched);
            setLoading(false);
        }, (error) => {
            console.error('Firestore meetings error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addMeeting = async (meetingRecord) => {
        try {
            const newId = meetingRecord.id || uuidv4();
            await setDoc(doc(db, 'meetings', newId), {
                ...meetingRecord,
                id: newId,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding meeting:', error);
            window.alert('Failed to schedule meeting. Error: ' + error.message);
        }
    };

    const deleteMeeting = async (id) => {
        try {
            await deleteDoc(doc(db, 'meetings', id));
        } catch (error) {
            console.error('Error deleting meeting:', error);
            window.alert('Failed to delete meeting. Error: ' + error.message);
        }
    };

    return { meetings, loading, addMeeting, deleteMeeting };
}
