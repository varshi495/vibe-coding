import React, { useState } from 'react';
import { MessageSquareText, ShieldCheck } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export const AuthCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b141a] relative overflow-hidden">
      {/* Decorative WhatsApp emerald ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto p-6 md:p-8 rounded-2xl border border-slate-700/40 bg-[#111b21]/90 shadow-2xl backdrop-blur-md relative z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00a884] to-teal-400 text-white shadow-lg shadow-[#00a884]/30 mb-3 ring-4 ring-white/5">
            <MessageSquareText className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">ChatApp Web</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time messaging inspired by WhatsApp
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#202c33]/70 rounded-xl mb-6 border border-slate-700/40">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-[#111b21] text-[#00a884] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-[#111b21] text-[#00a884] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="transition-all duration-200">
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>

        {/* Security / Privacy Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Protected with bcrypt password hashing & secure JWT tokens</span>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
