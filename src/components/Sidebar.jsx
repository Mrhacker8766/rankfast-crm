import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, KanbanSquare, Settings, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../contexts/AuthContext';
import { isConfigValid } from '../firebase';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Leads List', path: '/leads', icon: Users },
    { name: 'Pipeline', path: '/pipeline', icon: KanbanSquare },
    { name: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
    const { currentUser } = useAuth();

    // Filter out admin-only items if the user is not an admin
    const visibleNavItems = navItems.filter(item =>
        !item.adminOnly || currentUser?.role === 'admin'
    );

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">R</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Rankfast</span>
                </div>
            </div>

            <div className="p-4 flex-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2 tracking-widest">
                    Main Menu
                </div>
                <nav className="space-y-1">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        className={cn(
                                            'w-5 h-5 shrink-0 transition-colors',
                                            isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                        )}
                                    />
                                    {item.name}
                                    {isActive && (
                                        <ChevronRight className="w-4 h-4 ml-auto text-blue-500 opacity-50" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>

        </aside>
    );
}
