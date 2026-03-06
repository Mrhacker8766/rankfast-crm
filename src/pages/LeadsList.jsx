import React, { useState } from 'react';
import { useLeads } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Plus, FileDown, UploadCloud, MoreHorizontal, Trash2, Edit2, User } from 'lucide-react';
import LeadModal from '../components/LeadModal';
import ImportExportModal from '../components/ImportExportModal';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { QUALIFICATIONS, ACTIVE_STATUSES, LEAD_STAGES, getQualificationColor, getActiveStatusColor, getLeadStageColor } from '../utils/theme';
import Papa from 'papaparse';

export default function LeadsList() {
    const { leads, addLead, updateLead, deleteLead } = useLeads();
    const { currentUser, users } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [userFilter, setUserFilter] = useState('all');

    // Date filter state
    const [dateRange, setDateRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Multi-Select filter states
    const [selectedQualifications, setSelectedQualifications] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [selectedLeadStages, setSelectedLeadStages] = useState([]);

    const handleAddClick = () => {
        setSelectedLead(null);
        setIsModalOpen(true);
    };

    const filteredLeads = leads.filter(lead => {
        // Admin role sees ALL leads; regular users only see their assigned leads
        if (currentUser?.role !== 'admin' && lead.assignedTo !== currentUser?.id) {
            return false;
        }

        if (selectedQualifications.length > 0 && !selectedQualifications.includes(lead.qualification)) {
            return false;
        }

        if (selectedStatuses.length > 0 && !selectedStatuses.includes(lead.activeStatus)) {
            return false;
        }

        if (selectedLeadStages.length > 0 && !selectedLeadStages.includes(lead.leadStage)) {
            return false;
        }

        // Admin specific user filter
        if (currentUser?.role === 'admin' && userFilter !== 'all') {
            if (userFilter === 'unassigned' && lead.assignedTo) return false;
            if (userFilter !== 'unassigned' && lead.assignedTo !== userFilter) return false;
        }

        // Date Filter Validation
        if (dateRange !== 'all') {
            const leadDate = lead.dateReceived ? new Date(lead.dateReceived) : null;
            if (leadDate) {
                const now = new Date();
                now.setHours(23, 59, 59, 999);
                let cutoffStart = null;
                let cutoffEnd = now;

                if (dateRange === '7d') {
                    cutoffStart = new Date();
                    cutoffStart.setDate(now.getDate() - 7);
                } else if (dateRange === '30d') {
                    cutoffStart = new Date();
                    cutoffStart.setDate(now.getDate() - 30);
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

                if (cutoffStart && leadDate < cutoffStart) return false;
                if (cutoffEnd && leadDate > cutoffEnd) return false;
            }
        }

        const searchTermLower = (searchTerm || '').toLowerCase();
        return (lead.clientName || '').toLowerCase().includes(searchTermLower) ||
            (lead.email || '').toLowerCase().includes(searchTermLower) ||
            (lead.source || '').toLowerCase().includes(searchTermLower) ||
            (lead.leadId || '').toLowerCase().includes(searchTermLower);
    });

    const isAllSelected = filteredLeads.length > 0 && selectedRowIds.length === filteredLeads.length;

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRowIds([]);
        } else {
            setSelectedRowIds(filteredLeads.map(l => l.id));
        }
    };

    const handleSelectRow = (e, id) => {
        e.stopPropagation();
        setSelectedRowIds(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const handleBulkAssign = (e) => {
        const userId = e.target.value;
        if (!userId) return;
        selectedRowIds.forEach(id => {
            updateLead(id, { assignedTo: userId === 'unassigned' ? '' : userId });
        });
        setSelectedRowIds([]);
    };

    const handleRowClick = (lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleSaveLead = (leadData) => {
        if (selectedLead) {
            updateLead(selectedLead.id, leadData);
        } else {
            addLead(leadData);
        }
    };

    const handleBulkImport = (newLeadsData) => {
        newLeadsData.forEach(l => {
            const leadData = { ...l, assignedTo: currentUser?.id };
            addLead(leadData);
        });
    };

    const handleExportCSV = () => {
        const dataToExport = selectedRowIds.length > 0 ? leads.filter(l => selectedRowIds.includes(l.id)) : filteredLeads;
        if (dataToExport.length === 0) return;

        const csvData = Papa.unparse(dataToExport);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rankfast_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSelectedRowIds([]);
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 shrink-0 gap-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">All Leads</h2>
                    {selectedRowIds.length > 0 && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="text-sm font-bold text-blue-700">{selectedRowIds.length} selected</span>
                            <button onClick={handleExportCSV} className="text-sm border border-blue-200 bg-white hover:bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer transition-colors shadow-sm font-medium">
                                Export Selected
                            </button>
                            {currentUser?.role === 'admin' && (
                                <select onChange={handleBulkAssign} value="" className="text-sm border border-blue-200 bg-white hover:bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer transition-colors shadow-sm font-medium outline-none">
                                    <option value="" disabled>Bulk Assign To...</option>
                                    <option value="unassigned">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {currentUser?.role === 'admin' && (
                        <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                        >
                            <option value="all">All Users</option>
                            <option value="unassigned">Unassigned</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    )}

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium h-[38px]"
                            />
                            <span className="text-slate-400 text-sm font-medium">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-medium h-[38px]"
                            />
                        </div>
                    )}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-slate-200 text-sm font-semibold text-slate-700 py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer h-[38px]"
                    >
                        <option value="all">All Dates</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <MultiSelectDropdown
                        options={QUALIFICATIONS}
                        selectedOptions={selectedQualifications}
                        onChange={setSelectedQualifications}
                        placeholder="Qualification"
                    />

                    <MultiSelectDropdown
                        options={ACTIVE_STATUSES}
                        selectedOptions={selectedStatuses}
                        onChange={setSelectedStatuses}
                        placeholder="Status"
                    />

                    <MultiSelectDropdown
                        options={LEAD_STAGES}
                        selectedOptions={selectedLeadStages}
                        onChange={setSelectedLeadStages}
                        placeholder="Lead Stages"
                    />

                    <div className="relative flex-1 sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        <UploadCloud className="w-4 h-4" />
                        <span className="hidden sm:inline">Import</span>
                    </button>
                    <button onClick={handleExportCSV} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ml-2 cursor-pointer" onClick={handleAddClick}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Lead</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="min-w-max inline-block align-middle w-full relative">
                    <table className="min-w-full divide-y divide-slate-200 table-fixed">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                            <tr>
                                <th scope="col" className="w-[48px] px-4 py-3 text-left">
                                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                                </th>
                                <th scope="col" className="w-[100px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead ID</th>
                                <th scope="col" className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Recd</th>
                                <th scope="col" className="w-[180px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Name</th>
                                <th scope="col" className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualification</th>
                                <th scope="col" className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                                <th scope="col" className="w-[200px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                <th scope="col" className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                <th scope="col" className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                                <th scope="col" className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Call</th>
                                <th scope="col" className="w-[100px] px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {filteredLeads.map((lead) => {
                                const isSelected = selectedRowIds.includes(lead.id);
                                return (
                                    <tr key={lead.id} onClick={() => handleRowClick(lead)} className={`transition-colors group cursor-pointer text-sm ${isSelected ? 'bg-blue-50/60' : 'hover:bg-blue-50/40'}`}>
                                        <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => handleSelectRow(e, lead.id)}>
                                            <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">
                                            {lead.leadId || '--'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                                            {lead.dateReceived || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                                                {lead.clientName || 'Unknown Details'}
                                                {lead.assignedTo && (
                                                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200" title={`Assigned to ${users.find(u => u.id === lead.assignedTo)?.name || 'Unknown'}`}>
                                                        {users.find(u => u.id === lead.assignedTo)?.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            {lead.company && (
                                                <div className="text-xs text-slate-500 truncate">{lead.company}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getQualificationColor(lead.qualification)}`}>
                                                {lead.qualification || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActiveStatusColor(lead.activeStatus)}`}>
                                                {lead.activeStatus || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getLeadStageColor(lead.leadStage)}`}>
                                                {lead.leadStage || 'Unassigned'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-slate-800 truncate">{lead.email}</div>
                                            <div className="text-xs text-slate-500 truncate">{lead.phone || lead.website || '--'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{lead.source || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                            {lead.serviceRequested || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs font-medium">
                                            {lead.lastCallDialed || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="px-4 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                                        No leads found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between text-sm text-slate-500 font-medium">
                Showing {filteredLeads.length} leads
            </div>

            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lead={selectedLead}
                onSave={handleSaveLead}
            />

            <ImportExportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleBulkImport}
            />
        </div>
    );
}
