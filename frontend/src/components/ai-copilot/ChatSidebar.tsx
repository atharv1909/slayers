import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User as UserIcon, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/stores/app-context";
import { copilotChat } from "@/lib/ai/groq";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatSidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I can help reason through catalyst performance, failure modes, experiment design, and scale-up decisions. Select a catalyst or ask a reaction-level question.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selectedCandidate, currentPage, currentReaction } = useAppContext();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await copilotChat(userMsg.content, {
        page: currentPage,
        candidate: selectedCandidate,
        reaction: currentReaction,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const selected = selectedCandidate?.name || "the current catalyst set";
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `${selected} needs a focused validation pass.\n\n- Run a 220-260 C temperature sweep at 15-25 bar.\n- Track selectivity and time-on-stream, not only final yield.\n- Check coking with TPO/Raman and metal sintering with TEM/XRD.\n- Keep candidates that stay within 15% of predicted yield after a 6-12h hold.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Why did this catalyst fail?",
    "Suggest optimizations",
    "Analyze selectivity trend",
    "Compare with known catalysts",
  ];

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="fixed right-4 top-20 z-30 w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 380 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative flex flex-col border-l border-slate-800 bg-slate-900/95 backdrop-blur-sm overflow-hidden flex-shrink-0 h-screen"
      >
        {isOpen && (
          <>
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">AI Co-Pilot</h2>
                  <p className="text-[10px] text-slate-500">Catalysis reasoning</p>
                </div>
              </div>
              <button onClick={onToggle} className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedCandidate && (
              <div className="px-3 py-2 bg-cyan-500/5 border-b border-slate-800 flex-shrink-0">
                <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">Selected</p>
                <p className="text-xs text-slate-300 truncate">{selectedCandidate.name}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    A:{selectedCandidate.predicted_activity?.toFixed(2) || "N/A"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    S:{selectedCandidate.predicted_selectivity?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {selectedCandidate.metal_type || "M"}/{selectedCandidate.support_material || "support"}
                  </span>
                </div>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/20"
                        : "bg-slate-800/80 text-slate-300 border border-slate-700/50"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/50">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {messages.length < 3 && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition-colors border border-slate-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="px-3 py-3 border-t border-slate-800 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about catalysts, results..."
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.aside>
    </>
  );
}
