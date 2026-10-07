import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  isOnline,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-2xl',
  };

  const badgeSizeClasses = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2',
  };

  const initials = name
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const colors = [
    'from-emerald-500 to-teal-700',
    'from-cyan-500 to-blue-700',
    'from-indigo-500 to-purple-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-700',
  ];
  const charCode = name.charCodeAt(0) || 0;
  const gradientClass = colors[charCode % colors.length];

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-1 ring-white/10`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr ${gradientClass} flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-white/10`}
        >
          {initials}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ${
            badgeSizeClasses[size]
          } ${
            isOnline
              ? 'bg-[#00a884] border-[#111b21]'
              : 'bg-slate-400 border-[#111b21]'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default Avatar;
