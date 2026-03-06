export const QUALIFICATIONS = [
    'Qualified',
    'Unqualified',
    'Fake Request',
    'No Show'
];

export const ACTIVE_STATUSES = [
    'Active',
    'Inactive',
    'Later'
];

export const LEAD_STAGES = [
    'Denied to work',
    'in pipeline',
    'Converted',
    'Meet booked',
    'Proposal Sent'
];

export const MEETING_TYPES = [
    'Pre Discovery',
    'Discovery',
    'Analysis',
    'Follow up meet'
];

export const getQualificationColor = (status) => {
    switch (status) {
        case 'Qualified': return 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]'; // emerald-100/800
        case 'Unqualified': return 'bg-[#991b1b] text-white border-[#7f1d1d]'; // red-800
        case 'Fake Request': return 'bg-[#fecaca] text-[#991b1b] border-[#f87171]'; // red-200/800
        case 'No Show': return 'bg-[#fed7aa] text-[#9a3412] border-[#fdba74]'; // orange-200/800
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

export const getActiveStatusColor = (status) => {
    switch (status) {
        case 'Active': return 'bg-[#166534] text-white border-[#14532d]'; // emerald-800
        case 'Inactive': return 'bg-[#b91c1c] text-white border-[#991b1b]'; // red-700
        case 'Later': return 'bg-[#fdf08a] text-[#854d0e] border-[#fef08a]'; // yellow-200, darker text
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};

export const getLeadStageColor = (stage) => {
    switch (stage) {
        case 'Denied to work': return 'bg-slate-200 text-slate-800 border-slate-300';
        case 'in pipeline': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Converted': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'Meet booked': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Proposal Sent': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
};
