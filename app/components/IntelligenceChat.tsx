'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, Loader2, Bot, User, X, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function IntelligenceChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/leads/intelligence/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await res.json();
            if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No response generated.' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        "Find eye care clinics in London with the highest marketing spend",
        "Which private hospitals appear on both Doctify and IHPN?",
        "Show me dental clinics that have a CQC 'Requires Improvement' rating",
        "What's the competitive landscape for cosmetic surgery in Manchester?",
    ];

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl shadow-violet-500/30 flex items-center justify-center hover:shadow-violet-500/50 transition-shadow"
                    >
                        <Brain className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={clsx(
                            "fixed z-50 flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden",
                            isExpanded
                                ? "inset-4"
                                : "bottom-6 right-6 w-[440px] h-[600px]"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-violet-600/10 to-indigo-600/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">MedLeads Intelligence</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">AI-Powered Healthcare Market Analysis</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                                        <Brain className="w-8 h-8 text-violet-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">Healthcare Intelligence Agent</h4>
                                    <p className="text-xs text-slate-400 mb-6 max-w-[300px]">
                                        Ask complex questions that cross-reference our scraped marketing data with live CQC and NHS regulatory data.
                                    </p>
                                    <div className="space-y-2 w-full">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setInput(s); }}
                                                className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 hover:bg-slate-700/60 hover:border-violet-500/30 hover:text-white transition-all"
                                            >
                                                <Sparkles className="w-3 h-3 inline mr-2 text-violet-400" />
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={clsx("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className={clsx(
                                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-violet-600 text-white rounded-br-md"
                                            : "bg-slate-800/80 text-slate-200 border border-slate-700/40 rounded-bl-md"
                                    )}>
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-sm max-w-none [&_table]:text-xs [&_th]:px-2 [&_td]:px-2 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                                        ) : (
                                            <span>{msg.content}</span>
                                        )}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                                            <User className="w-4 h-4 text-slate-300" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-slate-800/80 border border-slate-700/40 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                                        <span className="text-xs text-slate-400">Analyzing data across 3 sources...</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-700/50">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Ask about the healthcare market..."
                                    className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                                    disabled={loading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl hover:from-violet-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Simple markdown to HTML (bold, italic, headers, lists, tables, code)
function formatMarkdown(text: string): string {
    return text
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 rounded-lg p-3 my-2 overflow-x-auto"><code>$2</code></pre>')
        // Tables
        .replace(/\|(.+)\|\n\|[-| ]+\|\n((\|.+\|\n?)+)/g, (match, header, body) => {
            const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th class="border border-slate-600 px-2 py-1 bg-slate-800">${h.trim()}</th>`).join('');
            const rows = body.trim().split('\n').map((row: string) => {
                const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border border-slate-700 px-2 py-1">${c.trim()}</td>`).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            return `<table class="w-full border-collapse my-2"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        })
        // Headers
        .replace(/^### (.+)$/gm, '<h3 class="font-bold text-violet-300 mt-3 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="font-bold text-violet-200 mt-3 mb-1">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="font-bold text-white mt-3 mb-1">$1</h1>')
        // Bold & italic
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`(.+?)`/g, '<code class="bg-slate-800 px-1 rounded text-violet-300">$1</code>')
        // Lists
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        // Line breaks
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');
}
