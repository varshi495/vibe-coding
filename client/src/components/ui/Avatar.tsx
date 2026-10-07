import React from 'react';
import { Avatar as ProfileAvatar } from '../profile/Avatar';

interface AvatarProps {
  name: string;
  src?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  avatarUrl,
  size = 'md',
  showOnline,
  isOnline,
  className = '',
}) => {
  return (
    <ProfileAvatar
      name={name}
      avatarUrl={src || avatarUrl}
      size={size}
      isOnline={showOnline !== undefined ? showOnline : isOnline}
      className={className}
    />
  );
};

export default Avatar;
