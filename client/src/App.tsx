import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthCard from './components/auth/AuthCard';
import Avatar from './components/profile/Avatar';
import ProfileDrawer from './components/profile/ProfileDrawer';
import {
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#00a884]/20 flex items-center justify-center animate-pulse">
          <MessageSquare className="w-8 h-8 text-[#00a884]" />
        </div>
        <div className="w-36 h-2 bg-slate-800 rounded-full animate-pulse" />
        <p className="text-xs text-slate-400">Loading ChatApp Web...</p>
      </div>
    );
  }

  // 2. Unauthenticated State -> AuthCard
  if (!user) {
    return <AuthCard />;
  }

  // 3. Authenticated App Shell
  return (
    <div className="min-h-screen bg-[#0b141a] flex flex-col text-slate-100">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#111b21] border-b border-slate-700/50 px-4 md:px-6 flex items-center justify-between shadow-md select-none">
        {/* Left: User Avatar & Profile Trigger */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center space-x-3 cursor-pointer p-1.5 -ml-1.5 rounded-xl hover:bg-[#202c33] transition-colors group"
          title="Open Profile Settings"
        >
          <Avatar name={user.name} avatarUrl={user.avatar} size="md" isOnline={true} />
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-semibold text-white group-hover:text-[#00a884] transition-colors">
                {user.name}
              </span>
              <Settings className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs text-slate-400 max-w-[200px] truncate">
              {user.status || 'Available'}
            </span>
          </div>
        </div>

        {/* Center: Brand Badge */}
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-[#202c33]/60 px-3 py-1 rounded-full border border-slate-700/30">
          <span className="w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
          <span className="text-[#00a884] font-medium">Session Active</span>
          <span>•</span>
          <span>Phase 1 Verified</span>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#202c33] transition-colors"
            title="Profile Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-300 hover:text-red-400 hover:bg-[#202c33] transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <div className="w-full bg-[#111b21] border border-slate-700/40 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Welcome Banner */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00a884] to-teal-500 text-white shadow-xl shadow-[#00a884]/25 mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user.name}!
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Authentication and profile management are live. You are signed in with a persistent 7-day JWT session.
            </p>
          </div>

          {/* User Account Snapshot Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-[#202c33]/70 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                <span>Account ID</span>
              </div>
              <p className="text-xs font-mono text-slate-200 truncate">{user.id}</p>
            </div>

            <div className="p-4 bg-[#202c33]/70 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                <Zap className="w-4 h-4 text-[#00a884]" />
                <span>Identifier</span>
              </div>
              <p className="text-xs text-slate-200 truncate">{user.email || user.phone || 'Unknown'}</p>
            </div>

            <div className="p-4 bg-[#202c33]/70 rounded-xl border border-slate-700/50">
              <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                <Sparkles className="w-4 h-4 text-[#00a884]" />
                <span>Status Bio</span>
              </div>
              <p className="text-xs text-slate-200 truncate">"{user.status}"</p>
            </div>
          </div>

          {/* Phase 1 Verification Checklist */}
          <div className="bg-[#0b141a]/60 rounded-xl p-5 border border-slate-800 space-y-2.5 mb-6">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Phase 1 Deliverables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
                <span>AUTH-01 & AUTH-06: Bcrypt registration & hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
                <span>AUTH-02 & AUTH-05: JWT login & session restore</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
                <span>AUTH-03: Session termination & clean logout</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
                <span>AUTH-04: Profile drawer, avatar & bio updates</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[#00a884]/20 transition-all flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Customize Profile</span>
            </button>
            <button
              onClick={logout}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </main>

      {/* Profile Slide-Over Drawer */}
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default App;
