import { useState, useRef, useEffect, useCallback } from 'react';
import axiosInstance from '../lib/api-client';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

const SESSION_ID = generateSessionId();

function generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '_' + Date.now();
}

export const AiReceptionistChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleOpen = () => {
        setIsOpen((prev) => !prev);
        if (messages.length === 0) {
            setMessages([
                {
                    text: "Hi! I'm the virtual assistant for Dental Clinic. How can I help you today?",
                    sender: 'bot',
                },
            ]);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');
        setMessages((prev) => [...prev, { text, sender: 'user' }]);
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/receptionist/ask', {
                message: text,
                sessionId: SESSION_ID,
            });

            const reply: string = response.data?.data?.reply;
            if (reply) {
                setMessages((prev) => [...prev, { text: reply, sender: 'bot' }]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { text: "Sorry, I couldn't connect. Please call the clinic.", sender: 'bot' },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { text: "Sorry, I couldn't connect. Please call the clinic.", sender: 'bot' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={handleOpen}
                className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white"
                aria-label="Chat with AI Receptionist"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-44 right-6 z-50 w-[350px] h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                        <span className="font-semibold text-sm">Dental Clinic Assistant</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white text-xl leading-none"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${msg.sender === 'bot'
                                    ? 'bg-gray-200 text-gray-900 self-start rounded-bl-sm'
                                    : 'bg-blue-600 text-white self-end rounded-br-sm ml-auto'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm bg-gray-200 text-gray-500 self-start rounded-bl-sm italic">
                                ...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div className="border-t border-gray-200 p-3 flex gap-2 bg-white">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-2 text-sm font-medium"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};