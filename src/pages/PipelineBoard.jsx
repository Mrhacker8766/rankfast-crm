import React, { useState } from 'react';
import { useLeads } from '../utils/storage';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import LeadModal from '../components/LeadModal';
import { QUALIFICATIONS, ACTIVE_STATUSES, LEAD_STAGES, getQualificationColor, getActiveStatusColor, getLeadStageColor } from '../utils/theme';

function SortableLeadCard({ lead, isOverlay = false, onClick }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onClick(lead)}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col gap-2 
        ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : 'hover:border-blue-400'} 
        ${isOverlay ? 'scale-105 shadow-xl opacity-100 ring-2 ring-blue-500 cursor-grabbing' : 'cursor-grab'} 
        transition-all mb-3 group active:cursor-grabbing select-none`}
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold text-slate-800 text-sm leading-tight">{lead.clientName || 'Unknown Lead'}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getQualificationColor(lead.qualification)} shrink-0 leading-none`}>
                    {lead.qualification || 'New'}
                </span>
            </div>

            <div className="text-xs text-slate-500 line-clamp-1 font-medium">
                {lead.company || lead.website || lead.email || '--'}
            </div>

            <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLeadStageColor(lead.leadStage)} truncate max-w-[50%] leading-none`}>
                    {lead.leadStage || 'No Stage'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActiveStatusColor(lead.activeStatus)} shrink-0 leading-none`}>
                    {lead.activeStatus || 'New'}
                </span>
            </div>
        </div>
    );
}

import { useDroppable } from '@dnd-kit/core';

function BoardColumn({ id, title, leads, onCardClick }) {
    const { setNodeRef } = useDroppable({ id });
    const leadIds = leads.map(l => l.id);

    return (
        <div className="w-[320px] shrink-0 bg-slate-100/50 rounded-2xl flex flex-col border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-100/80 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">{title}</h3>
                <span className="bg-white text-slate-600 text-xs px-2.5 py-1 rounded-full border border-slate-200 font-bold shadow-sm leading-none">
                    {leads.length}
                </span>
            </div>

            <div ref={setNodeRef} className="p-3 flex-1 overflow-y-auto w-full min-h-[150px] flex flex-col gap-3">
                <SortableContext id={id} items={leadIds} strategy={verticalListSortingStrategy}>
                    {leads.map(lead => (
                        <SortableLeadCard key={lead.id} lead={lead} onClick={onCardClick} />
                    ))}
                </SortableContext>
                {leads.length === 0 && (
                    <div className="h-24 w-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PipelineBoard() {
    const { leads, updateStatus, updateLead } = useLeads();
    const [groupBy, setGroupBy] = useState('leadStage');
    const [activeId, setActiveId] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    const columns = groupBy === 'leadStage' ? LEAD_STAGES : groupBy === 'activeStatus' ? ACTIVE_STATUSES : QUALIFICATIONS;

    const groupedLeads = columns.reduce((acc, col) => {
        acc[col] = leads.filter(l => (l[groupBy] || 'New') === col);
        return acc;
    }, {});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        let targetContainer = null;

        // If dragging over the empty column area (column id)
        if (columns.includes(over.id)) {
            targetContainer = over.id;
        } else {
            // Dragging over another card, get that card's column
            const overLead = leads.find(l => l.id === over.id);
            if (overLead) {
                targetContainer = overLead[groupBy] || 'New';
            }
        }

        if (targetContainer) {
            const activeLead = leads.find(l => l.id === active.id);
            if (activeLead && (activeLead[groupBy] || 'New') !== targetContainer) {
                // Update the state using our localStorage hook
                updateStatus(active.id, groupBy, targetContainer);
            }
        }
    };

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

    const handleCardClick = (lead) => {
        // Only open if not dragging
        if (!activeId) {
            setSelectedLead(lead);
            setIsModalOpen(true);
        }
    };

    const handleSaveLead = (leadData) => {
        updateLead(selectedLead.id, leadData);
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col pt-2">
            <div className="flex items-center justify-between mb-6 px-2 shrink-0">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sales Pipeline</h2>
                <div className="flex gap-2">
                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <option value="leadStage">Group by: Lead Stage</option>
                        <option value="activeStatus">Group by: Activity Status</option>
                        <option value="qualification">Group by: Qualification</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm shadow-sm hidden-scrollbar">
                <div className="h-full p-6 inline-block min-w-full">
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-6 h-full items-start">
                            {columns.map(status => (
                                <BoardColumn
                                    key={status}
                                    id={status}
                                    title={status}
                                    leads={groupedLeads[status]}
                                    activeId={activeId}
                                    onCardClick={handleCardClick}
                                />
                            ))}
                        </div>

                        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                            {activeLead ? <SortableLeadCard lead={activeLead} isOverlay={true} onClick={() => { }} /> : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            <LeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                lead={selectedLead}
                onSave={handleSaveLead}
            />
        </div>
    );
}
