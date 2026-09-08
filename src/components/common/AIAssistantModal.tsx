import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldAlert, 
  ArrowRight, 
  HelpCircle,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { dataSourceService } from '../../services/dataSourceService';
import { useTheme } from '../../context/ThemeContext';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateEntity: (route: string, id: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedEntities?: { id: string; name: string; type: string }[];
  supportingCases?: string[];
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateEntity,
}) => {
  const { theme } = useTheme();
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'NEXUS AI Investigation Assistant initialized. Operating exclusively on the controlled PostgreSQL investigation dataset, including persisted FIR intelligence. You can ask queries regarding person associations, cross-case linkages, telephone contacts, or transaction flows.',
      timestamp: 'Now',
      suggestedEntities: [
        { id: 'PER-01', name: 'Rahul Sharma', type: 'person' },
        { id: 'CASE-1001', name: 'Operation Sahyadri', type: 'case' },
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const response = dataSourceService.queryInvestigationAssistant(q);
      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedEntities: response.suggestedEntities,
        supportingCases: response.supportingCases,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const samplePrompts = [
    'Show all cases associated with Rahul Sharma',
    'Who is connected to Rahul Sharma?',
    'Which persons appear across multiple cases?',
    'Which entities connect Case 1001 and Case 1007?',
    'What is the Hawala clearing pipeline in Zaveri Bazaar?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="ai-investigation-assistant-modal"
        className="relative w-full max-w-2xl h-[620px] rounded-xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: theme === 'dark' ? 'var(--bg-card)' : '#FFFFFF',
          borderColor: 'var(--border-main)',
        }}
      >
        {/* Header */}
        <div 
          className="p-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-main)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0b1b11] text-[#37ff85] dark:bg-[#0d2115] flex items-center justify-center border border-[#37ff85]/40 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#37ff85]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  AI Investigation Assistant
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#37ff85]/15 text-[#37ff85] dark:text-[#37ff85]">
                  platform
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Deterministic Natural Language Reasoning over Authorized Records
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical disclaimer strip */}
        <div 
          className="px-3.5 py-1.5 bg-[#2b5a3a]/15 dark:bg-[#2b5a3a]/10 border-b flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <Info className="w-3.5 h-3.5 text-[#37ff85] shrink-0" />
          <span>
            Investigative Assistance Aid: Insights require corroboration by authorized sworn investigators.
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-[#0b1b11] text-[#37ff85] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 shadow-xs space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-[#0b1b11] text-white dark:bg-[#0d2115] dark:text-[#D8E0E7]'
                    : 'border text-[var(--text-primary)]'
                }`}
                style={{
                  backgroundColor: m.sender === 'user' ? undefined : (theme === 'dark' ? 'var(--bg-card-elevated)' : 'var(--bg-card-elevated)'),
                  borderColor: m.sender === 'user' ? undefined : 'var(--border-light)',
                }}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>

                {/* Suggested Entity Chips */}
                {m.suggestedEntities && m.suggestedEntities.length > 0 && (
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] w-full font-semibold">
                      Referenced Record Dossiers:
                    </span>
                    {m.suggestedEntities.map((ent) => (
                      <button
                        key={ent.id}
                        onClick={() => {
                          onClose();
                          if (ent.id.startsWith('PER-')) {
                            onNavigateEntity('/person', ent.id);
                          } else if (ent.id.startsWith('CASE-')) {
                            onNavigateEntity('/cases', ent.id);
                          } else {
                            onNavigateEntity('/network', ent.id);
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#76a886]/15 text-[#76a886] dark:bg-[#76a886]/20 dark:text-[#76a886] border border-[#76a886]/25 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <span>{ent.id}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-[var(--text-muted)] text-right">
                  {m.timestamp}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-[#76a886] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-xs text-[var(--text-secondary)]">
              <div className="w-6 h-6 rounded-full bg-[#0b1b11] text-[#37ff85] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="animate-pulse">Traversing criminal graph nodes and matching investigative dockets...</span>
            </div>
          )}
        </div>

        {/* Quick Query Suggestions */}
        <div 
          className="px-3.5 py-2 border-t flex items-center gap-1.5 overflow-x-auto text-[11px]"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <span className="text-[10px] font-semibold text-[var(--text-muted)] whitespace-nowrap">
            Presets:
          </span>
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-2 py-1 rounded-full whitespace-nowrap bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-[10px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div 
          className="p-3 border-t flex items-center gap-2"
          style={{ borderColor: 'var(--border-main)' }}
        >
          <input
            id="ai-assistant-user-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask about persons, cases, phone links, hawala pipelines or clusters..."
            className="flex-1 px-3 py-2 rounded-lg border text-xs bg-transparent text-[var(--text-primary)] outline-none focus:border-[var(--navy-primary)]"
            style={{ borderColor: 'var(--border-main)' }}
          />
          <button
            id="ai-assistant-submit-btn"
            onClick={() => handleSend()}
            disabled={!inputQuery.trim()}
            className="px-3 py-2 rounded-lg bg-[#0b1b11] text-white dark:bg-[#0d2115] dark:text-[#D8E0E7] hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
