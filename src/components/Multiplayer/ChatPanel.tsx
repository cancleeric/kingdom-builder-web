import { useState, useRef, useEffect } from 'react';
import { useMultiplayerStore } from '../../store/multiplayerStore';

const QUICK_MESSAGES = [
  '👍 Good move!',
  '🤔 Hmm…',
  '😄 Nice!',
  '😅 Oops!',
  '⏳ Just a sec',
  '🎉 GG!',
];

export function ChatPanel() {
  const {
    chatMessages,
    unreadChatCount,
    chatOpen,
    playerId,
    openChat,
    closeChat,
    sendChat,
  } = useMultiplayerStore();

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendChat(text);
    setInput('');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={chatOpen ? closeChat : openChat}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition"
        aria-label="Toggle chat"
      >
        💬
        {!chatOpen && unreadChatCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadChatCount > 9 ? '9+' : unreadChatCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-72 bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <span className="font-semibold text-sm">💬 Chat</span>
            <button
              onClick={closeChat}
              className="text-white hover:text-blue-200 text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64">
            {chatMessages.length === 0 && (
              <p className="text-xs text-gray-400 text-center italic pt-4">
                No messages yet
              </p>
            )}
            {chatMessages.map((msg, i) => {
              const isOwn = msg.playerId === playerId;
              const isSystem = msg.playerName === 'System';
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isSystem ? 'items-center' : isOwn ? 'items-end' : 'items-start'}`}
                >
                  {isSystem ? (
                    <span className="text-xs text-gray-400 italic bg-gray-100 px-2 py-0.5 rounded-full">
                      {msg.text}
                    </span>
                  ) : (
                    <>
                      {!isOwn && (
                        <span className="text-xs text-gray-500 mb-0.5">{msg.playerName}</span>
                      )}
                      <div
                        className={`px-3 py-1.5 rounded-2xl text-sm max-w-[80%] break-words ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Quick messages */}
          <div className="flex flex-wrap gap-1 px-3 py-2 border-t">
            {QUICK_MESSAGES.map(qm => (
              <button
                key={qm}
                onClick={() => sendChat(qm)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full transition"
              >
                {qm}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Type a message…"
              maxLength={200}
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
