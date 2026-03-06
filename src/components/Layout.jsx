import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

import { LogOut } from 'lucide-react';

export default function Layout() {
    const { currentUser, logout } = useAuth();

    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 shrink-0">
                    <h1 className="text-xl font-semibold text-slate-800 tracking-tight">CRM Dashboard</h1>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right">
                            <span className="block text-sm font-bold text-slate-700 leading-tight">{currentUser?.name}</span>
                            <span className="block text-xs font-semibold text-slate-400 capitalize">{currentUser?.role} Mode</span>
                        </div>

                        <div
                            className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 uppercase bg-cover bg-center overflow-hidden shrink-0"
                            style={currentUser?.avatar ? { backgroundImage: `url(${currentUser.avatar})` } : {}}
                        >
                            {!currentUser?.avatar && (currentUser?.name ? currentUser.name[0] : 'U')}
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-1"></div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Log Out</span>
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-8 relative">
                    <Outlet />
                    <div className="mt-10 pt-4 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            Developed by <span className="font-semibold text-slate-500">Rohit</span> ❤️
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
