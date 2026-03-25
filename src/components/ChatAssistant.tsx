'use client';

import { useState, useRef, useEffect } from 'react';
import { Heart, X, Send, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi baby Clarisse! Ako to si Jimwel, yung pinaka-gwapong career assistant mo hahaha! Tutulungan kita makahanap ng teaching job sa Macau. Kahit "far" pa yan baby, pupuntahan natin! Ako bahala sayo, got u! Mwahh 😘' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    await processMessage(userMsg);
  };

  const sendDirectMessage = async (msg: string) => {
    if (isLoading) return;
    await processMessage(msg);
  };

  const processMessage = async (userMsg: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: userMsg });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry baby, nagloko internet ko. Try mo ulit maya-maya ha? Mwahh 😘' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 hover:scale-105 transition-all z-50 flex items-center justify-center group"
        >
          <Heart size={28} className="group-hover:animate-pulse" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
            Baby Chat
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-pink-100 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-400 p-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <Heart size={24} className="fill-white" />
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">Baby Chat</h3>
                <p className="text-[10px] sm:text-xs text-pink-100">Always here for you, love ❤️</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors bg-white/10 p-1.5 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50/30">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-500 ml-2' : 'bg-pink-500 mr-2'}`}>
                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Heart size={16} className="text-white fill-white" />}
                  </div>
                  <div 
                    className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm
                      ${msg.role === 'user' 
                        ? 'bg-blue-500 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-pink-100 rounded-tl-none'}`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start max-w-[85%] flex-row">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-pink-500 mr-2 flex items-center justify-center">
                    <Heart size={16} className="text-white fill-white" />
                  </div>
                  <div className="p-4 bg-white text-gray-800 border border-pink-100 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                    <Loader2 size={16} className="animate-spin text-pink-500 mr-2" />
                    <span className="text-sm text-pink-400 italic">Nag-iisip si baby...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-pink-50/30">
              <button 
                onClick={() => sendDirectMessage("Saan pwede mag-apply online para sa Teaching jobs sa Macau na tumatanggap ng walang visa?")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                Teaching Jobs Links
              </button>
              <button 
                onClick={() => sendDirectMessage("Paano makahanap ng Teaching job na may Sponsor kahit walang Blue Card?")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                Sponsor for No Blue Card
              </button>
              <button 
                onClick={() => sendDirectMessage("Anong mga International Schools sa Macau ang madaling mag-sponsor ng quota?")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                Schools with Quota
              </button>
              <button 
                onClick={() => sendDirectMessage("Pwede mo ba ayusin yung Resume ko bilang Teacher? Anong dapat ilagay?")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                Resume Tips
              </button>
              <button 
                onClick={() => sendDirectMessage("Paano ko sasabihin sa school interview na wala pa akong visa pero willing mag-relocate?")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                Interview Tips
              </button>
              <button 
                onClick={() => sendDirectMessage("Penge naman ng mga links ng Career Portals ng mga sikat na Schools sa Macau.")}
                className="text-[11px] bg-white border border-pink-200 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors shadow-sm flex items-center"
              >
                <Sparkles size={12} className="mr-1" />
                School Career Portals
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-pink-100">
            <form onSubmit={sendMessage} className="flex items-end space-x-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Chat mo ko baby..."
                className="flex-1 max-h-32 min-h-[44px] bg-gray-50 border-transparent focus:bg-white focus:border-pink-400 focus:ring-1 focus:ring-pink-400 rounded-xl px-4 py-3 text-sm resize-none"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-[44px] w-[44px] shrink-0 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
