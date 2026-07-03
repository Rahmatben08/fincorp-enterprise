import React, { useState } from 'react';
import axios from 'axios';
import { Bot, X, Send } from 'lucide-react';

const AIAssistantUI: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
    { sender: 'ai', text: 'Halo! Saya AI Asisten FinCorp. Anda bisa bertanya soal arus kas, laba rugi, piutang, dan lainnya.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8081/api/public/ai/chat', { query: userMessage });
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Maaf, server backend tidak dapat dihubungi saat ini.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="print:hidden" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {isOpen ? (
        <div style={{
          width: '350px',
          height: '500px',
          backgroundColor: '#fff',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(0,166,81,0.2)'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#00A651',
            color: 'white',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={24} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Expro AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? '#00A651' : '#fff',
                color: msg.sender === 'user' ? '#fff' : '#1e293b',
                padding: '10px 14px',
                borderRadius: '12px',
                maxWidth: '85%',
                boxShadow: msg.sender === 'ai' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                border: msg.sender === 'ai' ? '1px solid #e2e8f0' : 'none',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '13px' }}>
                AI sedang mengetik...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={sendMessage} style={{
            padding: '16px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '8px',
            backgroundColor: '#fff'
          }}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya soal keuangan..."
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '24px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#00A651',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#00A651',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 166, 81, 0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={30} />
        </button>
      )}
    </div>
  );
};

export default AIAssistantUI;
