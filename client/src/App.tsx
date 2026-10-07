import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import AuthCard from './components/auth/AuthCard';
import ProfileDrawer from './components/profile/ProfileDrawer';
import { ChatList } from './components/chat/ChatList';
import { ActiveChat } from './components/chat/ActiveChat';
import { EmptyChatState } from './components/chat/EmptyChatState';
import { MessageSquare } from 'lucide-react';

const ChatContent: React.FC<{ onOpenProfile: () => void }> = ({ onOpenProfile }) => {
  const { activeConversationId } = useSocket();

  return (
    <div className="flex h-screen w-screen bg-[#0b141a] overflow-hidden text-[#e9edef] select-none">
      {/* Left Sidebar (ChatList) */}
      <div className={`h-full w-full md:w-auto ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <ChatList onOpenProfile={onOpenProfile} />
      </div>

      {/* Right Active Chat or Empty State */}
      <div className={`flex-1 h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversationId ? <ActiveChat /> : <EmptyChatState />}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#00a884]/20 flex items-center justify-center animate-pulse">
          <MessageSquare className="w-8 h-8 text-[#00a884]" />
        </div>
        <div className="w-36 h-2 bg-[#202c33] rounded-full animate-pulse" />
        <p className="text-xs text-[#8696a0]">Loading WhatsApp Web...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthCard />;
  }

  return (
    <SocketProvider>
      <ChatContent onOpenProfile={() => setIsProfileOpen(true)} />
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </SocketProvider>
  );
};

export default App;
