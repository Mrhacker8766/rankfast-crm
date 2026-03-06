import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Shield, Trash2, KeyRound, AlertCircle, CheckCircle2, User, Upload } from 'lucide-react';

export default function Settings() {
    const { currentUser, users, settings, updateSettings, addUser, deleteUser, updateUser } = useAuth();

    // Admin state
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [userAddedMsg, setUserAddedMsg] = useState('');
    const [followUpDays, setFollowUpDays] = useState(settings.followUpDays);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingPassword, setEditingPassword] = useState('');

    // Personal Password Reset state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

    // Profile Settings state
    const [profileName, setProfileName] = useState(currentUser?.name || '');
    const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
    const [profilePicture, setProfilePicture] = useState(currentUser?.avatar || '');
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail || !newUserPassword) return;
        await addUser({
            name: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole
        });
        setUserAddedMsg(`✅ User "${newUserName}" added! They can now log in with email: ${newUserEmail}`);
        setTimeout(() => setUserAddedMsg(''), 8000);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
    };

    const handleUpdateUserPassword = async (userId) => {
        if (!editingPassword.trim()) return;
        await updateUser(userId, { password: editingPassword.trim() });
        setEditingUserId(null);
        setEditingPassword('');
    };

    const handleSaveSettings = () => {
        updateSettings({ followUpDays: parseInt(followUpDays, 10) });
        alert("System Settings Saved Locally!");
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        setPwdMessage({ type: '', text: '' });

        if (currentUser.password !== currentPassword) {
            setPwdMessage({ type: 'error', text: 'Current password is incorrect.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPwdMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        if (newPassword.length < 6) {
            setPwdMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
            return;
        }

        updateUser(currentUser.id, { password: newPassword });
        setPwdMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });

        if (!profileName || !profileEmail) {
            setProfileMessage({ type: 'error', text: 'Name and email are required.' });
            return;
        }

        await updateUser(currentUser.id, { name: profileName, email: profileEmail, avatar: profilePicture });
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings Workspace</h2>
                <p className="text-slate-500 mt-1 text-sm">Manage personal preferences and global CRM settings.</p>
            </div>

            {/* General User Settings (Visible to Everyone) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Profile Settings</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update your personal information and avatar.</p>
                    </div>
                </div>

                <div className="p-6 max-w-xl">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {profileMessage.text && (
                            <div className={`px-4 py-3 border rounded-xl text-sm flex items-start gap-3 ${profileMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {profileMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                                <p className="font-medium">{profileMessage.text}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                {profilePicture ? (
                                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">{currentUser?.name?.charAt(0)}</span>
                                )}
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                                    <label className="cursor-pointer">
                                        <Upload className="w-5 h-5 text-white" />
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Change Avatar
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                                <p className="text-xs text-slate-500 mt-2">Recommended: Square image, max 1MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:blue-500 focus:outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                                <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                            </div>
                        </div>

                        <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[42px]">
                            Save Profile
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Security</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Update your local profile password.</p>
                    </div>
                </div>

                <div className="p-6 max-w-md">
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {pwdMessage.text && (
                            <div className={`px-4 py-3 border rounded-xl text-sm flex items-start gap-3 ${pwdMessage.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                                {pwdMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                                <p className="font-medium">{pwdMessage.text}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 mt-2 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[42px]">
                            Update Password
                        </button>
                    </form>
                </div>
            </div>

            {/* Admin Only Settings */}
            {currentUser?.role === 'admin' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden mt-8">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-slate-800">Global Configuration</h3>
                        </div>

                        <div className="flex items-end gap-4 max-w-sm">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Follow-up Reminder Days</label>
                                <p className="text-xs text-slate-500 mb-2">Show leads on dashboard if last contact exceeds this.</p>
                                <input
                                    type="number"
                                    min="1"
                                    value={followUpDays}
                                    onChange={(e) => setFollowUpDays(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm text-sm font-semibold text-slate-800"
                                />
                            </div>
                            <button onClick={handleSaveSettings} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap h-[42px]">
                                Save Preset
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">User Management</h3>
                                <p className="text-xs text-slate-500 mt-1">Add and manage local offline active profiles and passwords.</p>
                            </div>
                        </div>

                        {currentUser?.id === 'admin-1' ? (
                            <div className="p-6 bg-slate-50 border-b border-slate-100">
                                <form onSubmit={handleAddUser} className="flex gap-4 items-end flex-wrap xl:flex-nowrap">
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                                        <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} required placeholder="Jane Doe" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                                        <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required placeholder="jane@rankfast.io" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                                        <input type="text" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required placeholder="Default123" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
                                    </div>
                                    <div className="w-32 shrink-0">
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                                        <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white cursor-pointer">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 h-[38px] shadow-sm">
                                        <UserPlus className="w-4 h-4" /> Add User
                                    </button>
                                </form>
                                {userAddedMsg && (
                                    <div className="mt-3 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg font-medium">
                                        {userAddedMsg}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                <p className="text-xs text-slate-500 italic">🔒 Only the Super Admin can add or manage user accounts.</p>
                            </div>
                        )}

                        <ul className="divide-y divide-slate-100">
                            {users.map(user => (
                                <li key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-cover bg-center border border-slate-200
                              ${user.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-500'}`}
                                                style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : {}}
                                            >
                                                {!user.avatar && user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                                                {currentUser?.id === 'admin-1' ? (
                                                    <>
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                        {user.password ? (
                                                            <p className="text-xs text-slate-400 font-mono mt-0.5">Password: <span className="text-slate-600 font-semibold">{user.password}</span></p>
                                                        ) : (
                                                            <p className="text-xs text-red-400 font-semibold mt-0.5">⚠ No password set – user cannot login!</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic">Credentials hidden</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                              ${user.role === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-600'}
                            `}>
                                                {user.role.toUpperCase()}
                                            </span>
                                            {currentUser?.id === 'admin-1' && (
                                                <button
                                                    onClick={() => { setEditingUserId(editingUserId === user.id ? null : user.id); setEditingPassword(user.password || ''); }}
                                                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md cursor-pointer transition-colors"
                                                >
                                                    Reset Password
                                                </button>
                                            )}
                                            {user.id === 'admin-1' ? (
                                                <span className="px-2 py-1 text-xs text-indigo-500 border border-indigo-200 rounded-md font-semibold select-none bg-indigo-50" title="Super Admin — permanent account">👑 Super Admin</span>
                                            ) : (
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="p-1.5 rounded-md transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                                                    title="Delete user"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {editingUserId === user.id && (
                                        <div className="mt-3 flex gap-2 items-center pl-14">
                                            <input
                                                type="text"
                                                value={editingPassword}
                                                onChange={e => setEditingPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => handleUpdateUserPassword(user.id)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingUserId(null); setEditingPassword(''); }}
                                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
