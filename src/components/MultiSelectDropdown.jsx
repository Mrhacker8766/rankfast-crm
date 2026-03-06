import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function MultiSelectDropdown({ options, selectedOptions, onChange, placeholder, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (option) => {
        const isSelected = selectedOptions.includes(option);
        if (isSelected) {
            onChange(selectedOptions.filter(item => item !== option));
        } else {
            onChange([...selectedOptions, option]);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full sm:w-auto min-w-[160px] flex items-center justify-between border border-slate-200 rounded-lg text-sm text-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium h-[38px] cursor-pointer"
            >
                <span className="truncate mr-2">
                    {selectedOptions.length === 0 ? placeholder : `${selectedOptions.length} ${placeholder}`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-[60] top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto hidden-scrollbar">
                    {options.map((option) => {
                        const isSelected = selectedOptions.includes(option);
                        return (
                            <div
                                key={option}
                                onClick={() => toggleOption(option)}
                                className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                            >
                                <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                    {isSelected && <Check className="stroke-[3] w-3 h-3" />}
                                </div>
                                <span className="text-slate-700 font-medium">{option}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
