import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const { settings } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [userMsg, setUserMsg] = useState('Hi TechLabs! I want to ask about the upcoming IT Support bootcamp in Cape Town.');

  const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');

  const handleSend = () => {
    const encoded = encodeURIComponent(userMsg);
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end">
      {/* Interactive Chat Popup */}
      {isOpen && (
        <div className="mb-3 w-84 sm:w-96 bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#F0F0F0] overflow-hidden animate-in fade-in slide-in-from-bottom-5 text-[#1A1A1A]">
          {/* Header */}
          <div className="bg-[#FAFAFA] p-4 text-[#1A1A1A] border-b border-[#F0F0F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#000000] text-white flex items-center justify-center font-bold text-xs uppercase">
                TL
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">TechLabs Admissions</h4>
                <div className="flex items-center gap-1.5 text-[#A0A0A0] text-[10px] mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#000000]"></span>
                  <span>Cape Town HQ • Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#707070] hover:text-[#000000] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#FFFFFF] space-y-3 text-xs">
            <div className="bg-[#FAFAFA] p-3.5 rounded-xl border border-[#F0F0F0] text-[#707070]">
              <p className="font-bold text-[#000000] mb-1 text-xs">Admissions Desk</p>
              <p className="leading-relaxed">
                Have questions about VMware labs, schedules, or tuition? Send a message to chat directly with an advisor.
              </p>
              <span className="text-[10px] text-[#A0A0A0] mt-1.5 block font-mono">Replies in ~15 mins</span>
            </div>

            {/* Message input */}
            <div className="mt-2 space-y-1.5">
              <label className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-[0.2em]">Your Message:</label>
              <textarea
                value={userMsg}
                onChange={(e) => setUserMsg(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl text-xs focus:border-[#000000] focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleSend}
              className="w-full py-2.5 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        id="floating-whatsapp-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 bg-[#000000] hover:bg-neutral-800 text-white px-4 py-3 rounded-full shadow-lg hover:scale-105 active:scale-95 transition duration-200 border border-white/20 text-[10px] font-bold uppercase tracking-[0.2em]"
        title="Chat on WhatsApp"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Admissions Chat</span>
      </button>
    </div>
  );
};
