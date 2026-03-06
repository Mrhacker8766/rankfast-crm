import React, { useState, useRef } from 'react';
import { X, Upload, Copy, FileText, CheckCircle2, FileDown } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportExportModal({ isOpen, onClose, onImport }) {
    const [mode, setMode] = useState('upload'); // 'upload' | 'paste' | 'success'
    const [pasteText, setPasteText] = useState('');
    const [importedCount, setImportedCount] = useState(0);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const processData = (data) => {
        const formattedLeads = data.map(rawRow => {
            // Lowercase all keys to avoid case-sensitivity issues
            const row = {};
            for (const key in rawRow) {
                if (key) {
                    row[key.trim().toLowerCase()] = rawRow[key];
                }
            }

            return {
                clientName: row['client name'] || row['name'] || row['clientname'] || 'Unknown imported lead',
                email: row['email'] || '',
                phone: row['phone'] || '',
                website: row['website'] || '',
                source: row['lead source'] || row['source'] || 'Imported',
                qualification: row['qualification'] || 'Qualified',
                activeStatus: row['status'] || row['active status'] || 'Active',
                country: row['country'] || '',
                industry: row['industry'] || '',
                revenue: row['revenue'] || row['company revenue'] || '',
                serviceRequested: row['service requested'] || row['service'] || '',
                budgetShared: row['budget shared'] || '',
                budgetQuoted: row['budget quoted'] || row['budget'] || '',
                ltv: row['potential ltv'] || row['ltv'] || '',
                dateReceived: row['date received'] || row['date'] || new Date().toISOString().split('T')[0]
            };
        });

        // Filter out completely empty rows
        const validLeads = formattedLeads.filter(l =>
            (l.clientName && l.clientName !== 'Unknown imported lead') ||
            l.email ||
            l.phone ||
            l.website ||
            l.source !== 'Imported'
        );

        onImport(validLeads);
        setImportedCount(validLeads.length);
        setMode('success');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                processData(results.data);
            }
        });
    };

    const handlePasteSubmit = () => {
        if (!pasteText.trim()) return;

        // Try parsing tab separated first (from Excel/Sheets paste), fallback to comma
        const isTabSeparated = pasteText.indexOf('\t') !== -1;
        Papa.parse(pasteText, {
            header: true,
            delimiter: isTabSeparated ? '\t' : ',',
            skipEmptyLines: true,
            complete: function (results) {
                processData(results.data);
            }
        });
    };

    const handleDownloadTemplate = () => {
        const headers = ["Client Name", "Email", "Phone", "Website", "Lead Source", "Qualification", "Status", "Country", "Industry", "Revenue", "Service Requested", "Budget Quoted", "Date Received"];
        const sampleRow = ["Acme Corp", "contact@acme.com", "+1234567890", "acme.com", "Website", "Qualified", "Active", "USA", "Technology", "100000", "SEO", "5000", new Date().toISOString().split('T')[0]];
        const csvContent = Papa.unparse([headers, sampleRow]);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'rankfast_leads_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col transform transition-transform animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        Import Leads
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {mode === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Import Successful!</h3>
                            <p className="text-slate-500 mb-6">Successfully added {importedCount} new leads to your CRM.</p>
                            <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-900 transition-colors cursor-pointer">
                                Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                                <button
                                    onClick={() => setMode('upload')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${mode === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Upload CSV
                                </button>
                                <button
                                    onClick={() => setMode('paste')}
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all cursor-pointer ${mode === 'paste' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Paste Data
                                </button>
                            </div>

                            {mode === 'upload' && (
                                <div className="space-y-4">
                                    <div
                                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".csv"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                        />
                                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                        <h4 className="text-lg font-bold text-slate-700 mb-1">Click to upload CSV</h4>
                                        <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mb-4">
                                            Ensure your CSV has headers exactly matching the exact fields (e.g. "Client Name", "Email")
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer flex justify-center items-center gap-2 border border-slate-200"
                                    >
                                        <FileDown className="w-4 h-4" /> Download Sample Template
                                    </button>
                                </div>
                            )}

                            {mode === 'paste' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                                        <Copy className="w-5 h-5 shrink-0 text-blue-600" />
                                        <p>Copy multiple rows directly from Excel or Google Sheets (including headers) and paste them below.</p>
                                    </div>
                                    <textarea
                                        className="w-full h-40 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none whitespace-pre"
                                        placeholder="Client Name&#9;Email&#9;Status&#10;Acme Corp&#9;contact@acme.com&#9;Active"
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                    ></textarea>
                                    <button
                                        onClick={handlePasteSubmit}
                                        disabled={!pasteText.trim()}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer flex justify-center items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Process Data
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
