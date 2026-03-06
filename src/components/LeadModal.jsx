import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Phone, Send, CheckCircle2, Paperclip, FileText, Download, Trash2, FileUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { QUALIFICATIONS, ACTIVE_STATUSES, LEAD_STAGES, MEETING_TYPES } from '../utils/theme';
import { useMeetings } from '../utils/storage';
import MeetSchedulerModal from './MeetSchedulerModal';

const INITIAL_STATE = {
    dateReceived: new Date().toISOString().split('T')[0],
    clientName: '',
    website: '',
    email: '',
    phone: '',
    country: '',
    industry: '',
    category: '',
    revenue: '',
    source: 'LinkedIn Inbound',
    serviceRequested: '',
    budgetShared: '',
    budgetQuoted: '',
    ltv: '',
    followedUpBy: '',
    qualification: 'Qualified',
    activeStatus: 'Active',
    lastChatDate: '',
    lastCallDialed: '',
    statusHistory: '',
    assignedTo: '',
    convertedAmount: '',
    leadStage: '',
    meetingType: '',
    communications: [],
    documents: []
};

export default function LeadModal({ isOpen, onClose, lead, onSave }) {
    const { users, currentUser } = useAuth();
    const { addMeeting } = useMeetings();
    const [formData, setFormData] = useState(INITIAL_STATE);

    // Communication Log State
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [commType, setCommType] = useState('call'); // 'call' or 'chat'
    const [commDate, setCommDate] = useState(new Date().toISOString().split('T')[0]);
    const [commPlatform, setCommPlatform] = useState('');
    const [commNotes, setCommNotes] = useState('');
    const [commHasReply, setCommHasReply] = useState('no'); // 'yes' or 'no'
    const [commReplyText, setCommReplyText] = useState('');

    // Document Upload State
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [docCategory, setDocCategory] = useState('Proposal');
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleAttachDocument = () => {
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const newDoc = {
                id: Date.now().toString(),
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                category: docCategory,
                date: new Date().toISOString().split('T')[0],
                data: reader.result
            };

            setFormData(prev => ({
                ...prev,
                documents: [newDoc, ...(prev.documents || [])]
            }));

            setIsUploadingDoc(false);
            setSelectedFile(null);
            setDocCategory('Proposal');
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleDeleteDocument = (docId) => {
        setFormData(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(d => d.id !== docId)
        }));
    };

    useEffect(() => {
        if (lead) {
            // eslint-disable-next-line
            setFormData(lead);
        } else {
            // eslint-disable-next-line
            setFormData({ ...INITIAL_STATE, assignedTo: currentUser?.id || (users.length > 0 ? users[0].id : '') });
        }
    }, [lead, isOpen, users]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogCommunication = () => {
        if (!commPlatform || (!commNotes && commType === 'chat')) return;

        const newComm = {
            id: Date.now().toString(),
            type: commType,
            date: commDate,
            platform: commPlatform,
            notes: commNotes,
            hasReply: commType === 'chat' ? commHasReply === 'yes' : false,
            replyText: commType === 'chat' && commHasReply === 'yes' ? commReplyText : '',
            loggedBy: currentUser?.name || 'User'
        };

        setFormData(prev => ({
            ...prev,
            communications: [newComm, ...(prev.communications || [])],
            // Auto update last call/chat date if applicable
            ...(commType === 'call' ? { lastCallDialed: commDate } : { lastChatDate: commDate })
        }));

        // Reset form
        setIsLogging(false);
        setCommNotes('');
        setCommReplyText('');
        setCommHasReply('no');
        setCommPlatform('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm sm:p-4 transition-all">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-full sm:w-[600px] sm:rounded-2xl shadow-xl flex flex-col transform transition-transform animate-in slide-in-from-right-8 fade-in-0 duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        {lead ? 'Edit Lead' : 'New Lead'}
                        {lead && lead.leadId && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md border border-slate-200 uppercase">
                                {lead.leadId}
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-800">Assign To 👤</label>
                            <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-sm font-medium">
                                <option value="">Select a user...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                                <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date Received</label>
                                <input type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                            <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="https://" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                                <select name="qualification" value={formData.qualification} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Active Status</label>
                                <select name="activeStatus" value={formData.activeStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                    {ACTIVE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Stage</label>
                                <select name="leadStage" value={formData.leadStage} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                                    <option value="">Select Stage...</option>
                                    {LEAD_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {formData.leadStage === 'Meet booked' && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Type</label>
                                    <select name="meetingType" value={formData.meetingType} onChange={handleChange} className="w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer text-blue-900">
                                        <option value="">Select Meeting...</option>
                                        {MEETING_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {(formData.leadStage === 'Converted') && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-bold text-emerald-800">Closed Deal Amount / Revenue ($)</label>
                                <input type="number" name="convertedAmount" value={formData.convertedAmount} onChange={handleChange} placeholder="e.g. 5000" className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-emerald-900" />
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                                <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                                <input type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Revenue</label>
                                <input type="text" name="revenue" value={formData.revenue} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Source of Lead</label>
                                <select name="source" value={formData.source} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option>LinkedIn Inbound</option>
                                    <option>LinkedIn Outbound</option>
                                    <option>Clutch</option>
                                    <option>Website</option>
                                    <option>Reddit</option>
                                    <option>Referral</option>
                                    <option>Email Inbound</option>
                                    <option>Email Outbound</option>
                                    <option>Cold Calling</option>
                                    <option>Google Search</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Service Requested</label>
                                <input type="text" name="serviceRequested" value={formData.serviceRequested} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Budget Shared</label>
                                <input type="text" name="budgetShared" value={formData.budgetShared} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Budget Quoted</label>
                                <input type="text" name="budgetQuoted" value={formData.budgetQuoted} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Potential LTV</label>
                                <input type="text" name="ltv" value={formData.ltv} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6 grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Followed Up By</label>
                                <input type="text" name="followedUpBy" value={formData.followedUpBy} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Call</label>
                                <input type="date" name="lastCallDialed" value={formData.lastCallDialed} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Last Chat</label>
                                <input type="date" name="lastChatDate" value={formData.lastChatDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status Context / History</label>
                            <textarea name="statusHistory" value={formData.statusHistory} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" placeholder="General context about this lead..."></textarea>
                        </div>
                    </form>

                    {/* COMMUNICATION HISTORY SECTION */}
                    {lead && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Communication History</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Track calls, messages, and replies.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsSchedulerOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors shadow-sm border border-blue-200 cursor-pointer flex items-center gap-1.5 shrink-0">
                                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-3.5 h-3.5 bg-white p-0.5 rounded-full" />
                                        Schedule Meet
                                    </button>
                                    {!isLogging && (
                                        <button onClick={() => setIsLogging(true)} className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors shadow-sm border border-slate-200 cursor-pointer shrink-0">
                                            + Log Activity
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* LOG ACTIVITY FORM */}
                            {isLogging && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                            <button onClick={() => setCommType('call')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${commType === 'call' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>
                                                <Phone className="w-4 h-4" /> Call
                                            </button>
                                            <button onClick={() => setCommType('chat')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-2 cursor-pointer ${commType === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>
                                                <MessageSquare className="w-4 h-4" /> Chat
                                            </button>
                                        </div>
                                        <button onClick={() => setIsLogging(false)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Date</label>
                                                <input type="date" value={commDate} onChange={(e) => setCommDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Platform</label>
                                                <select value={commPlatform} onChange={(e) => setCommPlatform(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer">
                                                    <option value="">Select Platform...</option>
                                                    {commType === 'call' ? (
                                                        <>
                                                            <option>Phone Call</option>
                                                            <option>WhatsApp Call</option>
                                                            <option>Zoom / Meet</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option>Email</option>
                                                            <option>LinkedIn</option>
                                                            <option>WhatsApp Message</option>
                                                            <option>Other Chat</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {commType === 'chat' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Our Message Sent</label>
                                                <textarea value={commNotes} onChange={(e) => setCommNotes(e.target.value)} rows="2" placeholder="What was sent to the client..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white resize-none"></textarea>
                                            </div>
                                        )}

                                        {commType === 'chat' && (
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Did they reply?</label>
                                                <div className="flex gap-4 mb-3">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                                                        <input type="radio" checked={commHasReply === 'yes'} onChange={() => setCommHasReply('yes')} className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                                        Yes, they replied
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                                                        <input type="radio" checked={commHasReply === 'no'} onChange={() => setCommHasReply('no')} className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                                        No reply yet
                                                    </label>
                                                </div>
                                                {commHasReply === 'yes' && (
                                                    <textarea value={commReplyText} onChange={(e) => setCommReplyText(e.target.value)} rows="2" placeholder="Paste the client's reply here..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 resize-none"></textarea>
                                                )}
                                            </div>
                                        )}

                                        {commType === 'call' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Call Notes / Summary</label>
                                                <textarea value={commNotes} onChange={(e) => setCommNotes(e.target.value)} rows="2" placeholder="Discussed project scope, budget, etc..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white resize-none"></textarea>
                                            </div>
                                        )}

                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={handleLogCommunication}
                                                disabled={!commPlatform || (!commNotes && commType === 'chat') || (commHasReply === 'yes' && !commReplyText && commType === 'chat')}
                                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
                                            >
                                                <Send className="w-4 h-4" /> Save Log Entry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ACTIVITY FEED */}
                            <div className="space-y-4">
                                {formData.communications && formData.communications.length > 0 ? (
                                    formData.communications.map((comm) => (
                                        <div key={comm.id} className="relative pl-6 pb-4 border-l-2 border-slate-100 last:border-transparent last:pb-0">
                                            <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white text-white ${comm.type === 'call' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                                                {comm.type === 'call' ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${comm.type === 'call' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 border' : 'bg-blue-100 text-blue-800 border-blue-200 border'}`}>
                                                            {comm.platform}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-500">{comm.date}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium opacity-70">Logged by {comm.loggedBy || 'System'}</span>
                                                </div>

                                                {comm.type === 'call' && comm.notes && (
                                                    <p className="text-sm text-slate-700 mt-2">{comm.notes}</p>
                                                )}

                                                {comm.type === 'chat' && (
                                                    <div className="space-y-3 mt-3">
                                                        <div className="bg-white border text-sm border-blue-100 p-3 rounded-lg rounded-tl-none shadow-sm relative">
                                                            <p className="text-slate-800 font-medium">{comm.notes}</p>
                                                        </div>
                                                        {comm.hasReply && (
                                                            <div className="flex justify-end pl-8">
                                                                <div className="bg-slate-800 text-white text-sm p-3 rounded-lg rounded-tr-none shadow-sm relative w-full border border-slate-700">
                                                                    <div className="flex items-center gap-1 mb-1.5 opacity-60">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        <span className="text-[10px] uppercase tracking-wider font-bold">Client Replied</span>
                                                                    </div>
                                                                    <p className="text-slate-100 font-medium">{comm.replyText}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">
                                        No communication history logged for this lead yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS SECTION */}
                    {lead && (
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Documents</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Attach proposals, price lists, and other files.</p>
                                </div>
                                {!isUploadingDoc && (
                                    <button onClick={() => setIsUploadingDoc(true)} type="button" className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold transition-colors shadow-sm border border-indigo-200 cursor-pointer">
                                        + Add Document
                                    </button>
                                )}
                            </div>

                            {isUploadingDoc && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><FileUp className="w-4 h-4" /> Upload New Document</h4>
                                        <button onClick={() => { setIsUploadingDoc(false); setSelectedFile(null); }} type="button" className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Document Category</label>
                                            <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer">
                                                <option>Proposal</option>
                                                <option>Price Document</option>
                                                <option>Contract</option>
                                                <option>Other Document</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Select File</label>
                                            <input type="file" onChange={handleFileSelect} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <button onClick={handleAttachDocument} disabled={!selectedFile} type="button" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                                                <FileUp className="w-4 h-4" /> Upload & Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {formData.documents && formData.documents.length > 0 ? (
                                    formData.documents.map((doc) => (
                                        <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                                                    {doc.category === 'Proposal' ? <FileText className="w-5 h-5 text-indigo-600" /> : <Paperclip className="w-5 h-5 text-slate-600" />}
                                                </div>
                                                <div className="truncate">
                                                    <h5 className="text-sm font-bold text-slate-800 truncate mb-0.5">{doc.name}</h5>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold text-slate-600">{doc.category}</span>
                                                        <span>{doc.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={doc.data} download={doc.name} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" title="Download">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => handleDeleteDocument(doc.id)} type="button" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-500 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl">
                                        No documents attached.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 sm:rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-white text-sm font-medium transition-colors cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" form="lead-form" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer">
                        {lead ? 'Save Changes' : 'Create Lead'}
                    </button>
                </div>
            </div>

            <MeetSchedulerModal
                isOpen={isSchedulerOpen}
                onClose={() => setIsSchedulerOpen(false)}
                lead={formData}
                onMeetingCreated={(meet) => {
                    addMeeting(meet);
                    setIsSchedulerOpen(false);
                }}
            />
        </div>
    );
}
