import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const QUICK_SUGGESTIONS = [
  "Qual bairro tem melhor ROI?",
  "Compare Pinheiros vs Itaim",
  "Quanto custa um studio em Moema?",
  "Dicas para precificação dinâmica",
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! 👋 Sou seu consultor de investimento em short-stay em São Paulo. Como posso ajudar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showSuggestions = messages.length <= 1 && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  const sendText = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = "";

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const allMsgs = [...messages, userMsg].filter((m) => m.role === "user" || m.role === "assistant");
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMsgs }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro ao conectar com IA" }));
        upsert(err.error || "Erro inesperado. Tente novamente.");
        setLoading(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      upsert("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* FAB with pulse ring */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="relative">
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <Button
                onClick={() => setOpen(true)}
                className="relative h-14 w-14 rounded-full shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.4)] bg-primary hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_12px_40px_-4px_hsl(var(--primary)/0.5)] hover:scale-105"
                size="icon"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl border border-border/60 bg-card shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden backdrop-blur-sm"
          >
            {/* Header with gradient */}
            <div className="relative flex items-center gap-3 px-5 py-4 overflow-hidden">
              {/* Gradient bg */}
              <div className="absolute inset-0 bg-hero-gradient" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[hsl(200,60%,30%)]" />

              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="relative z-10 h-10 w-10 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20"
              >
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <div className="relative z-10 flex-1">
                <p className="text-sm font-bold font-display text-primary-foreground tracking-wide">Consultor Short-Stay</p>
                <p className="text-[11px] text-primary-foreground/70 font-body">Especialista em investimento imobiliário</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400 }}
                onClick={() => setOpen(false)}
                className="relative z-10 h-8 w-8 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center transition-colors border border-primary-foreground/10"
              >
                <X className="h-4 w-4 text-primary-foreground" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-none bg-gradient-to-b from-card to-background/50">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 35, delay: i === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/15">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/10"
                        : "bg-secondary/80 text-secondary-foreground rounded-bl-sm border border-border/50"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-2 [&_h3]:mt-1.5 [&_strong]:text-foreground [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5 border border-border/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Quick suggestions */}
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex flex-wrap gap-2 pt-2"
                >
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 400 }}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendText(s)}
                      className="text-xs border border-border/80 rounded-xl px-3.5 py-2 text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:border-primary/30 transition-colors duration-200 font-body"
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/15">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-secondary/80 rounded-2xl rounded-bl-sm px-4 py-3 border border-border/50">
                    <div className="flex gap-1.5 items-center">
                      <motion.span
                        className="h-2 w-2 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="h-2 w-2 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.span
                        className="h-2 w-2 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-border/60 bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendText(input);
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte sobre investimento..."
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  disabled={loading}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !input.trim()}
                    className="rounded-xl h-10 w-10 shadow-sm shadow-primary/10 disabled:shadow-none transition-shadow"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
