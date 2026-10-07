import React, { useState } from 'react';
import { X, Camera, Check, LogOut, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from './Avatar';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [status, setStatus] = useState(user?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Name cannot be empty.' });
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        status: status.trim(),
        avatar: avatarUrl.trim() || undefined,
      });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#111b21] h-full shadow-2xl border-r border-slate-700/50 flex flex-col z-10 animate-slideRight">
        {/* Header */}
        <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between border-b border-slate-700/40 text-slate-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold">Profile Settings</h2>
          </div>
          <span className="text-xs text-[#00a884] font-medium px-2 py-0.5 rounded-full bg-[#00a884]/10">
            Active
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => setIsCustomAvatarOpen(!isCustomAvatarOpen)}>
              <Avatar name={user.name} avatarUrl={avatarUrl || user.avatar} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                <Camera className="w-5 h-5 mb-1" />
                <span>Change</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {user.email || user.phone}
            </p>

            {isCustomAvatarOpen && (
              <div className="w-full mt-3 p-3 bg-[#202c33]/70 rounded-xl border border-slate-700/50 text-left animate-fadeIn">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Avatar Image URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 bg-[#111b21] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomAvatarOpen(false)}
                    className="px-3 py-1.5 bg-[#00a884] text-white rounded-lg text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {feedback && (
            <div
              className={`p-3 text-xs rounded-xl flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#00a884] uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />
              <span className="block text-[11px] text-slate-500 text-right mt-1">
                {name.length}/40
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#00a884] uppercase tracking-wider mb-1.5">
                About / Status Bio
              </label>
              <textarea
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                maxLength={120}
                rows={3}
                placeholder="Write something about yourself..."
                className="w-full px-3.5 py-2.5 bg-[#202c33] border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] resize-none"
              />
              <span className="block text-[11px] text-slate-500 text-right mt-1">
                {status.length}/120
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>

          {/* Danger zone / Logout */}
          <div className="pt-6 border-t border-slate-800">
            {showLogoutConfirm ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                <p className="text-xs text-red-300 font-medium">
                  Are you sure you want to log out of your session on this device?
                </p>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Yes, Log Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDrawer;
