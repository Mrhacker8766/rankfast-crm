import React, { useState, useMemo } from 'react';
import { useLeads, useMeetings } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { Users, DollarSign, Target, TrendingUp, UserCheck, Activity, Calendar, AlertCircle, Video } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
    const { leads } = useLeads();
    const { meetings } = useMeetings();
    const { currentUser, settings } = useAuth();
    const [dateRange, setDateRange] = useState('all'); // 'all', '7d', '30d', 'custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Admin sees all, User sees only assigned
    const visibleLeads = useMemo(() => {
        if (currentUser?.role === 'admin') return leads;
        return leads.filter(l => l.assignedTo === currentUser?.id);
    }, [leads, currentUser]);

    // Apply Date Filter
    const filteredLeads = useMemo(() => {
        if (dateRange === 'all') return visibleLeads;

        let cutoffStart = null;
        let cutoffEnd = null;

        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (dateRange === '7d') {
            cutoffStart = new Date();
            cutoffStart.setDate(now.getDate() - 7);
            cutoffEnd = now;
        } else if (dateRange === '30d') {
            cutoffStart = new Date();
            cutoffStart.setDate(now.getDate() - 30);
            cutoffEnd = now;
        } else if (dateRange === 'custom') {
            if (customStartDate) {
                cutoffStart = new Date(customStartDate);
                cutoffStart.setHours(0, 0, 0, 0);
            }
            if (customEndDate) {
                cutoffEnd = new Date(customEndDate);
                cutoffEnd.setHours(23, 59, 59, 999);
            }
        }

        return visibleLeads.filter(l => {
            if (!l.dateReceived) return true;
            const leadDate = new Date(l.dateReceived);
            if (cutoffStart && leadDate < cutoffStart) return false;
            if (cutoffEnd && leadDate > cutoffEnd) return false;
            return true;
        });
    }, [visibleLeads, dateRange, customStartDate, customEndDate]);

    const totalLeads = filteredLeads.length;
    const activeLeads = filteredLeads.filter(l => l.activeStatus === 'Active' || l.qualification === 'Qualified').length;
    const convertedLeads = filteredLeads.filter(l => l.activeStatus === 'Converted').length;

    const parseRevenue = (str) => {
        if (!str) return 0;
        const matches = str.toString().match(/\d+/g);
        return matches ? parseInt(matches.join(''), 10) : 0;
    };

    const pipelineValue = filteredLeads.reduce((acc, lead) => acc + parseRevenue(lead.budgetQuoted || 0), 0);
    const convertedAmountValue = filteredLeads.filter(l => l.activeStatus === 'Converted').reduce((acc, lead) => acc + parseRevenue(lead.convertedAmount || 0), 0);
    const partnerAmountValue = filteredLeads.filter(l => l.activeStatus === 'Partner').reduce((acc, lead) => acc + parseRevenue(lead.convertedAmount || 0), 0);
    const conversionRate = totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Format Meetings
    const visibleMeetings = useMemo(() => {
        if (currentUser?.role === 'admin') return meetings;
        return meetings.filter(m => m.assignedTo === currentUser?.id);
    }, [meetings, currentUser]);

    const upcomingMeetings = useMemo(() => {
        const now = new Date();
        return visibleMeetings
            .filter(m => new Date(m.startTime) > now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [visibleMeetings]);

    const completedMeetings = useMemo(() => {
        const now = new Date();
        return visibleMeetings
            .filter(m => new Date(m.startTime) <= now)
            .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }, [visibleMeetings]);

    // Chart Data: Sources
    const sourceData = useMemo(() => {
        const counts = {};
        filteredLeads.forEach(l => {
            const src = l.source || 'Unknown';
            counts[src] = (counts[src] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [filteredLeads]);
    const COLORS = ['#3B82F6', '#10B981', '#6366F1', '#8B5CF6', '#F59E0B'];

    // Chart Data: Timeline (Last 6 Months logic mock)
    const timelineData = useMemo(() => {
        const counts = {};
        visibleLeads.forEach(l => {
            if (!l.dateReceived) return;
            const d = new Date(l.dateReceived);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([date, count]) => ({ date, count }));
    }, [visibleLeads]);

    const needsFollowUp = useMemo(() => {
        const now = new Date();
        const threshold = settings?.followUpDays || 7;

        return visibleLeads.filter(l => {
            // Exclude closed/inactive leads from follow-up
            if (['Converted', 'Partner', 'Inactive', 'Fake Request', 'Denied to work'].includes(l.activeStatus)) return false;
            if (l.leadStage === 'Converted' || l.leadStage === 'Denied to work') return false;
            if (!l.lastChatDate) return true;

            const lastContact = new Date(l.lastChatDate);
            const diffTime = Math.abs(now - lastContact);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= threshold;
        }).sort((a, b) => {
            if (!a.lastChatDate) return -1;
            if (!b.lastChatDate) return 1;
            return new Date(a.lastChatDate) - new Date(b.lastChatDate);
        }).slice(0, 5);
    }, [visibleLeads, settings]);

    // Closed deals (Converted + Partner) within selected timeframe
    const closedDeals = useMemo(() => {
        return filteredLeads.filter(l =>
            l.activeStatus === 'Converted' ||
            l.activeStatus === 'Partner' ||
            l.leadStage === 'Converted'
        ).sort((a, b) => new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0));
    }, [filteredLeads]);

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                    Dashboard Overview
                </h2>
                <div className="flex items-center gap-3">
                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-slate-400 text-sm font-medium">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-slate-700 py-1.5 pl-2 pr-6 outline-none cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="custom">Custom Filter</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Leads</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 mt-2">{totalLeads}</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Converted</span>
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">{convertedLeads}</span>
                        <span className="text-sm font-bold text-emerald-500 mb-1">{conversionRate}% rate</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Deals</span>
                    </div>
                    <span className="text-3xl font-black text-slate-900 mt-2">{activeLeads}</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:border-violet-200 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Est. Pipeline Value</span>
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-black text-slate-900">${pipelineValue.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-0.5">Converted Rev</span>
                            <span className="font-bold text-emerald-600">${convertedAmountValue.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-0.5">Partner Rev</span>
                            <span className="font-bold text-blue-600">${partnerAmountValue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Lead Acquisition Trend
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Top Sources
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Needs Follow-up ({settings?.followUpDays} Days+)
                        </h3>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            {needsFollowUp.length} Action Items
                        </span>
                    </div>

                    <div className="space-y-4">
                        {needsFollowUp.map(lead => (
                            <div key={lead.id} className="flex items-start gap-4 p-4 rounded-xl bg-amber-50/30 border border-amber-100 hover:bg-amber-50 transition-colors">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600">
                                    {lead.clientName ? lead.clientName[0].toUpperCase() : '?'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900">{lead.clientName || 'Unnamed Lead'}</h4>
                                    <p className="text-xs text-slate-500 mt-1">Last contacted: {lead.lastChatDate ? new Date(lead.lastChatDate).toLocaleDateString() : 'Never'}</p>
                                </div>
                                <NavLink to="/pipeline" className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer p-2 mx-1">
                                    View Lead
                                </NavLink>
                            </div>
                        ))}
                        {needsFollowUp.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl">
                                Awesome! All active leads have been followed up with recently.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-500" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {visibleLeads.slice(0, 5).map(lead => (
                            <div key={lead.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                    {lead.clientName ? lead.clientName[0].toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{lead.clientName || 'Unnamed Lead'}</h4>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{lead.statusHistory || 'Added to CRM pipeline.'}</p>
                                </div>
                                <div className="ml-auto text-xs font-bold text-slate-400">
                                    {lead.lastChatDate || lead.dateReceived || 'Recent'}
                                </div>
                            </div>
                        ))}
                        {visibleLeads.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl">
                                No recent activity. Start adding leads!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CLOSED DEALS CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 mt-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Closed Deals
                    </h3>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        {closedDeals.length} Deal{closedDeals.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="space-y-3">
                    {closedDeals.map(lead => {
                        const isPartner = lead.activeStatus === 'Partner';
                        return (
                            <div key={lead.id} className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                                    {lead.clientName ? lead.clientName[0].toUpperCase() : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 truncate">{lead.clientName || 'Unnamed Lead'}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{lead.dateReceived || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isPartner ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {isPartner ? 'Partner' : 'Converted'}
                                    </span>
                                    {lead.convertedAmount ? (
                                        <span className="text-sm font-black text-emerald-700">₹{Number(lead.convertedAmount).toLocaleString()}</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                    {closedDeals.length === 0 && (
                        <div className="text-center py-8 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl">
                            No closed deals in this time period yet. Keep pushing! 💪
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Upcoming Meets */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Upcoming Meetings
                    </h3>
                    <div className="space-y-4">
                        {upcomingMeetings.map(meet => (
                            <div key={meet.id} className="flex flex-col gap-2 p-5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors shadow-sm">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold text-slate-900">{meet.title || 'Meeting'}</h4>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{new Date(meet.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                    {new Date(meet.startTime).toLocaleDateString()}
                                    {meet.clientName && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">Lead: {meet.clientName}</span>}
                                </div>
                                {meet.meetLink && (
                                    <a href={meet.meetLink} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 w-max px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm">
                                        <Video className="w-4 h-4" /> Join Google Meet
                                    </a>
                                )}
                            </div>
                        ))}
                        {upcomingMeetings.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl">
                                No upcoming meetings scheduled.
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed Meets */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-500" />
                        Completed Meetings
                    </h3>
                    <div className="space-y-4">
                        {completedMeetings.map(meet => (
                            <div key={meet.id} className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                                <div className="flex justify-between items-start opacity-75">
                                    <h4 className="text-sm font-bold text-slate-700">{meet.title || 'Meeting'}</h4>
                                    <span className="text-xs font-bold text-slate-500">{new Date(meet.startTime).toLocaleDateString()}</span>
                                </div>
                                <div className="text-xs text-slate-400 font-medium opacity-75">
                                    {new Date(meet.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {meet.clientName && <span className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded">Lead: {meet.clientName}</span>}
                                </div>
                            </div>
                        ))}
                        {completedMeetings.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl">
                                No completed meetings yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
