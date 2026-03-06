import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, Video } from 'lucide-react';
import { useCalendar } from '../contexts/CalendarContext';
import { useAuth } from '../contexts/AuthContext';

export default function MeetSchedulerModal({ isOpen, onClose, lead, onMeetingCreated }) {
    const { googleAccessToken, isGoogleAuthenticated, loginToGoogle, logoutCalendar } = useCalendar();
    const { currentUser } = useAuth();

    const [title, setTitle] = useState(lead ? `Meeting with ${lead.clientName}` : 'New Meeting');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('10:00');
    const [duration, setDuration] = useState('30'); // minutes
    const [additionalEmails, setAdditionalEmails] = useState('');
    const [description, setDescription] = useState(lead ? `Discussion with ${lead.clientName} regarding our services.` : '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    if (!isGoogleAuthenticated) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Google Calendar Integration</h2>
                    <p className="text-slate-600 mb-6 text-sm">
                        Authenticate with Google to seamlessly schedule meetings and generate Meet links directly from the CRM.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                            Cancel
                        </button>
                        <button onClick={() => loginToGoogle()} className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4 bg-white rounded-full" />
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.submitter?.blur();
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Calculate end time
            const startDateTime = new Date(`${date}T${startTime}:00`);
            const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

            const event = {
                summary: title,
                description: description,
                start: {
                    dateTime: startDateTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: endDateTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                attendees: [
                    ...(lead?.email ? [{ email: lead.email }] : []),
                    ...additionalEmails.split(',').map(email => email.trim()).filter(email => email).map(email => ({ email }))
                ],
                conferenceData: {
                    createRequest: {
                        requestId: `rankfast-meet-${Date.now()}`,
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet'
                        }
                    }
                }
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    logoutCalendar();
                    throw new Error('Google session expired. Please sign in again.');
                }
                throw new Error(errData.error?.message || 'Failed to create event');
            }

            const data = await response.json();

            // Extract the Meet link
            const meetLink = data.hangoutLink || '';

            // Construct meeting record for CRM dashboard
            const meetingRecord = {
                id: data.id,
                leadId: lead?.id,
                clientName: lead?.clientName,
                title,
                date,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                meetLink,
                assignedTo: currentUser?.id,
                createdAt: new Date().toISOString()
            };

            onMeetingCreated(meetingRecord);
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while scheduling.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
                        Schedule Meeting
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <form id="scheduler-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Meeting Title</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                    <CalendarIcon className="w-3.5 h-3.5" /> Date
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Time
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Duration</label>
                            <select
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer bg-white"
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="45">45 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="120">2 Hours</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> Additional Guests
                            </label>
                            <input
                                type="text"
                                placeholder="example1@email.com, example2@email.com"
                                value={additionalEmails}
                                onChange={e => setAdditionalEmails(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                            />
                            {lead?.email && (
                                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                                    Primary Lead: <span className="font-semibold">{lead.email}</span> is already invited. Add others separated by commas.
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-sm text-blue-800 font-medium leading-tight">Google Meet link will be generated automatically.</span>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Agenda</label>
                            <textarea
                                rows="3"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button form="scheduler-form" type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm">
                        {isSubmitting ? 'Scheduling...' : 'Schedule & Create Meet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
