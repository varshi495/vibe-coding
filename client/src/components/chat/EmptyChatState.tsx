import React from 'react';
import { MessageSquarePlus, Lock } from 'lucide-react';

export const EmptyChatState: React.FC<{ onNewChatClick?: () => void }> = ({ onNewChatClick }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-[#8696a0] p-6 text-center select-none h-full relative overflow-hidden">
      {/* Subtle WhatsApp-style background pattern layer */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#e9edef 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[#111b21] border border-[#222e35] flex items-center justify-center mb-6 shadow-xl text-[#00a884] animate-pulse">
          <MessageSquarePlus size={40} />
        </div>

        <h2 className="text-2xl font-semibold text-[#e9edef] mb-2">WhatsApp Web for Antigravity</h2>
        <p className="text-sm leading-relaxed text-[#8696a0] mb-8">
          Send and receive messages in real time with instant optimistic rendering, delivery receipts, and secure JWT authentication.
        </p>

        {onNewChatClick && (
          <button
            onClick={onNewChatClick}
            className="flex items-center gap-2 bg-[#00a884] hover:bg-[#008069] text-[#111b21] font-semibold px-5 py-2.5 rounded-full transition shadow-lg hover:shadow-emerald-900/30 text-sm"
          >
            <MessageSquarePlus size={18} />
            Start a new conversation
          </button>
        )}

        <div className="mt-12 flex items-center gap-1.5 text-xs text-[#8696a0] opacity-80">
          <Lock size={12} className="text-[#00a884]" />
          <span>End-to-end encrypted messaging interface</span>
        </div>
      </div>
    </div>
  );
};
