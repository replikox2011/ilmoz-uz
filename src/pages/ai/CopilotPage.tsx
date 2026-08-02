import * as React from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, RotateCcw, Copy, Check, Zap, Brain, Bot } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { useCopilotChat, ChatMessage, CopilotModel, COPILOT_MODELS, loadSavedModel, saveModel } from "../../hooks/useCopilotChat";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";
import { CenterSnapshot } from "../../components/copilot/copilotTools";
import { buildNexoPrompt } from "./nexo-prompt";
import DOMPurify from "dompurify";

// =============================================================================
export function CopilotPage() {
  const { user, center } = useAuth();
  const { t } = useI18n();
  const data = useCenterData();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [input, setInput] = React.useState("");
  const [model, setModel] = React.useState<CopilotModel>(loadSavedModel);

  const handleModelChange = (m: CopilotModel) => {
    setModel(m);
    saveModel(m);
  };

  const snapshot: CenterSnapshot = React.useMemo(() => ({
    groups: data.groups,
    students: data.students,
    teachers: data.teachers,
    parents: data.users.filter(u => u.role === "parent"),
    rooms: data.rooms,
    courses: data.courses,
    currentUserId: user?.id,
  }), [data.groups, data.students, data.teachers, data.users, data.rooms, data.courses, user?.id]);

  const systemPrompt = React.useMemo(() => {
    const activeGroups = data.groups.filter(g => g.status === "active").length;
    return buildNexoPrompt({
      centerName: center?.name ?? "",
      activeGroups,
      totalStudents: data.students.length,
      totalRooms: data.rooms.length,
      totalTeachers: data.teachers.length,
    });
  }, [center, data]);

  const { messages, streaming, sendMessage, clearChat } = useCopilotChat({
    center,
    uid: user?.id ?? null,
    snapshot,
    systemPrompt,
    model,
  });

  const suggestions = React.useMemo(() => [
    t("copilot.suggestion1"),
    t("copilot.suggestion2"),
    t("copilot.suggestion3"),
    t("copilot.suggestion4"),
    t("copilot.suggestion5"),
    t("copilot.suggestion6"),
  ], [t]);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Center logo or fallback icon */}
          {center?.logoUrl ? (
            <img
              src={center.logoUrl}
              alt={center.name}
              className="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/20 ring-1 ring-brand-400/30">
              <Sparkles className="h-5 w-5 text-brand-300" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gradient-animated">{t("copilot.title")}</h1>
            <p className="text-xs text-white/40">{center?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <ModelPicker value={model} onChange={handleModelChange} />
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("copilot.clear")}
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4">
        {messages.length === 0 ? (
          <WelcomeScreen
            centerName={center?.name ?? ""}
            onSuggest={s => { sendMessage(s); }}
            suggestions={suggestions}
            greeting={t("copilot.welcomeGreeting")}
            subtitlePrefix={t("copilot.welcomeSubtitlePrefix")}
            subtitleSuffix={t("copilot.welcomeSubtitleSuffix")}
          />
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map(msg => (
              <ChatMessageBubble
                key={msg.id}
                msg={msg}
                userName={user?.name ?? ""}
                userColor={user?.avatarColor ?? "#3b6bff"}
                copyLabel={t("copilot.copy")}
                copiedLabel={t("copilot.copied")}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3">
        <GlassCard highlight className="p-2">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("copilot.inputPlaceholder")}
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent py-2 pl-2 text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50"
              style={{ minHeight: "40px", maxHeight: "160px" }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || streaming}
              loading={streaming}
              className="shrink-0 mb-0.5"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </GlassCard>
        <p className="mt-1.5 text-center text-[10px] text-white/25">
          {t("copilot.disclaimer")}
        </p>
      </div>
    </div>
  );
}

// ── Model picker ──────────────────────────────────────────────────────────────
const MODEL_ICONS: Record<string, React.ReactNode> = {
  "groq-fast": <Zap className="h-3.5 w-3.5" />,
  "groq-pro": <Brain className="h-3.5 w-3.5" />,
  "gpt-4o": <Bot className="h-3.5 w-3.5" />,
  "ling-3-flash-free": <Sparkles className="h-3.5 w-3.5" />,
};

function ModelPicker({ value, onChange }: { value: CopilotModel; onChange: (m: CopilotModel) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const cfg = COPILOT_MODELS.find(m => m.id === value)!;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/[0.07] hover:text-white"
      >
        {MODEL_ICONS[value]}
        <span>{cfg.label}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/35">{cfg.sublabel}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f17] shadow-xl shadow-black/50">
          {COPILOT_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs transition",
                m.id === value
                  ? "bg-brand-500/15 text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <span className={m.id === value ? "text-brand-300" : "text-white/30"}>
                {MODEL_ICONS[m.id]}
              </span>
              <span>
                <span className="block font-medium">{m.label}</span>
                <span className="text-[10px] text-white/35">{m.sublabel}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ centerName, onSuggest, suggestions, greeting, subtitlePrefix, subtitleSuffix }: {
  centerName: string;
  onSuggest: (s: string) => void;
  suggestions: string[];
  greeting: string;
  subtitlePrefix: string;
  subtitleSuffix: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, filter: 'blur(12px)', y: 40 }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-2 grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/15 ring-1 ring-brand-400/25"
      >
        <Sparkles className="h-8 w-8 text-brand-300" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-4 text-2xl font-semibold text-gradient-animated"
      >
        {greeting}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="mt-1 text-sm text-white/45 text-center max-w-sm"
      >
        {subtitlePrefix} «{centerName}». {subtitleSuffix}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 40, filter: 'blur(12px)', scale: 0.9 }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }} transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 grid gap-2 w-full max-w-lg grid-cols-1 sm:grid-cols-2"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, delay: 0.35 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSuggest(s)}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-sm text-white/60 transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white"
          >
            {s}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Chat message ──────────────────────────────────────────────────────────────
function ChatMessageBubble({ msg, userName, userColor, copyLabel, copiedLabel }: {
  msg: ChatMessage;
  userName: string;
  userColor: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const isUser = msg.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {isUser ? (
        <Avatar name={userName} color={userColor} size="sm" />
      ) : (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/20 ring-1 ring-brand-400/30">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        </div>
      )}

      <div className={cn("group relative max-w-[80%]", isUser && "items-end flex flex-col")}>
        <div
          className={cn(
            "rounded-3xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md text-white"
              : "rounded-tl-md bg-white/[0.05] text-white/90 border border-white/[0.07]"
          )}
          style={isUser ? { backgroundColor: userColor + "cc" } : undefined}
        >
          {msg.pending && !msg.content ? (
            <span className="flex gap-1 py-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          ) : (
            <MessageContent content={msg.content} />
          )}
        </div>

        {!isUser && msg.content && !msg.pending && (
          <button
            onClick={copy}
            className="mt-1 ml-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition text-[10px] text-white/30 hover:text-white/60"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? copiedLabel : copyLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Markdown-ish renderer ─────────────────────────────────────────────────────
function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const isBullet = /^[-*•]\s/.test(line);
        const isNumbered = /^\d+\.\s/.test(line);
        const formatted = line
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/`(.+?)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">$1</code>');
        return (
          <span key={i}>
            {isBullet || isNumbered ? (
              <span className={cn("block", i > 0 && "mt-1", isBullet && "pl-3 before:content-['•'] before:mr-2 before:text-brand-300")}>
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(isBullet ? formatted.replace(/^[-*•]\s/, "") : formatted) }} />
              </span>
            ) : (
              <span className={cn(i > 0 && line === "" && "block h-2")} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatted) }} />
            )}
          </span>
        );
      })}
    </>
  );
}
