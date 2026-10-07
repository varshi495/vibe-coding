import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, User as UserIcon, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name or handle.');
      return;
    }

    if (!identifier.trim()) {
      setError('Please provide an email or phone number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name.trim(), identifier.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs md:text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-start space-x-2 animate-fadeIn">
          <span className="font-semibold block">Notice:</span>
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
          Your Display Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            disabled={isSubmitting}
            autoComplete="name"
            className="w-full pl-9 pr-4 py-2.5 bg-[#202c33] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
          Email or Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="name@example.com or +1..."
            disabled={isSubmitting}
            autoComplete="email"
            className="w-full pl-9 pr-4 py-2.5 bg-[#202c33] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
          Password (min 6 characters)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a secure password"
            disabled={isSubmitting}
            autoComplete="new-password"
            className="w-full pl-9 pr-11 py-2.5 bg-[#202c33] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 py-3 px-4 bg-[#00a884] hover:bg-[#008f6f] active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[#00a884]/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Free Account</span>
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
