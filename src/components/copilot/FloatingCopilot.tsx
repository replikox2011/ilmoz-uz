import * as React from "react";
import { motion, AnimatePresence as _AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, RotateCcw, Copy, Check, Zap, Brain, Bot } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { useCopilotChat, ChatMessage, CopilotModel, COPILOT_MODELS, loadSavedModel, saveModel } from "../../hooks/useCopilotChat";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";
import { CenterSnapshot } from "./copilotTools";

// Framer v11 shim
const AnimatePresence = _AnimatePresence as any as React.FC<{
  mode?: string; children?: React.ReactNode;
}>;

export function FloatingCopilot() {
  const { user, center } = useAuth();
  const { t } = useI18n();
  const data = useCenterData();
  const [open, setOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
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
    rooms: data.rooms,
    courses: data.courses,
    currentUserId: user?.id,
  }), [data.groups, data.students, data.teachers, data.rooms, data.courses, user?.id]);

  const systemPrompt = React.useMemo(() => {
    const activeGroups = data.groups.filter(g => g.status === "active").length;
    return [
      `Ты NexoGPT — AI-ассистент в системе управления учебным центром Ilmoz.`,
      `Центр: «${center?.name ?? ""}». Данные: ${activeGroups} active groups, ${data.students.length} students, ${data.rooms.length} rooms, ${data.teachers.length} teachers.`,
      `У тебя есть инструменты для просмотра и создания данных (групп, студентов, преподавателей, аудиторий).`,
      `Ты умеешь генерировать тесты по теме (generate_test) — с поиском актуальной информации в интернете. Перед вызовом уточни тему, число вопросов и сколько с вариантами ответа. Готовый черновик активируется на странице «Тесты».`,
      `ВАЖНО: Перед созданием любой записи — сначала уточни все необходимые детали у пользователя. Например, перед созданием ученика спроси: номер телефона, имя родителя, телефон родителя. Перед созданием преподавателя спроси: логин, email, телефон. Не создавай записи пока не получишь подтверждение от пользователя.`,
      `Перед созданием группы — сначала вызови list_courses, list_teachers, list_rooms чтобы получить актуальные ID, затем уточни детали у пользователя.`,
      `Отвечай кратко и по делу. Используй язык пользователя.`,
    ].join(" ");
  }, [center, data]);

  const { messages, streaming, sendMessage, clearChat } = useCopilotChat({
    center,
    uid: user?.id ?? null,
    snapshot,
    systemPrompt,
    model,
  });

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when panel opens
  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user || !center) return null;

  return (
    <>
      {/* Panel */}
      <AnimatePresence mode="sync">
        {open && (
          <motion.div
            key="copilot-panel"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed bottom-24 right-6 z-50 flex w-[380px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d0f17] shadow-2xl shadow-black/60"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500/20 ring-1 ring-brand-400/30">
                  <Sparkles className="h-4 w-4 text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("copilot.title")}</p>
                  <p className="text-[10px] text-white/35">{center.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Compact model picker */}
                <MiniModelPicker value={model} onChange={handleModelChange} />
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    title={t("copilot.clear")}
                    className="grid h-7 w-7 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <MiniWelcome centerName={center.name} onSuggest={s => { sendMessage(s); }} t={t} />
              ) : (
                <>
                  {messages.map(msg => (
                    <MiniMessage
                      key={msg.id}
                      msg={msg}
                      userName={user.name}
                      userColor={user.avatarColor}
                      copyLabel={t("copilot.copy")}
                      copiedLabel={t("copilot.copied")}
                    />
                  ))}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.07] p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("copilot.inputPlaceholder")}
                  rows={1}
                  disabled={streaming}
                  className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50"
                  style={{ minHeight: "24px", maxHeight: "100px" }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || streaming}
                  loading={streaming}
                  className="h-7 w-7 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-2xl shadow-lg shadow-brand-500/30 transition-colors",
          open
            ? "bg-brand-600 ring-2 ring-brand-400/50"
            : "bg-brand-500 hover:bg-brand-400"
        )}
        title="NexoGPT"
      >
        <AnimatePresence mode="sync">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-5 w-5 text-white" />
            </motion.span>
          ) : (
            <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="h-5 w-5 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread dot */}
        {!open && messages.length > 0 && (
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0d0f17] bg-emerald-400" />
        )}
      </motion.button>
    </>
  );
}

// ── Mini model picker (icon-only with tooltip dropdown) ───────────────────────
const MINI_ICONS: Record<CopilotModel, React.ReactNode> = {
  "groq-fast": <Zap className="h-3.5 w-3.5" />,
  "groq-pro":  <Brain className="h-3.5 w-3.5" />,
  "gpt-4o":    <Bot className="h-3.5 w-3.5" />,
  "openai-gpt-oss-free": <Sparkles className="h-3.5 w-3.5" />,
};

function MiniModelPicker({ value, onChange }: { value: CopilotModel; onChange: (m: CopilotModel) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

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
        title="Выбрать модель"
        className={cn(
          "grid h-7 w-7 place-items-center rounded-lg transition",
          open
            ? "bg-brand-500/20 text-brand-300"
            : "text-white/35 hover:bg-white/[0.06] hover:text-white/70"
        )}
      >
        {MINI_ICONS[value]}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0f17] shadow-xl shadow-black/50">
          {COPILOT_MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => { onChange(m.id); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition",
                m.id === value
                  ? "bg-brand-500/15 text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white"
              )}
            >
              <span className={m.id === value ? "text-brand-300" : "text-white/30"}>
                {MINI_ICONS[m.id]}
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

// ── Mini welcome ──────────────────────────────────────────────────────────────
function MiniWelcome({ centerName, onSuggest, t }: {
  centerName: string;
  onSuggest: (s: string) => void;
  t: (k: string) => string;
}) {
  const suggestions = [
    t("copilot.suggestion1"),
    t("copilot.suggestion2"),
    t("copilot.suggestion3"),
    t("copilot.suggestion4"),
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-4 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 ring-1 ring-brand-400/20">
        <Sparkles className="h-6 w-6 text-brand-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{t("copilot.welcomeGreeting")}</p>
        <p className="mt-0.5 text-xs text-white/40">{t("copilot.welcomeSubtitlePrefix")} «{centerName}»</p>
      </div>
      <div className="w-full space-y-1.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggest(s)}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-left text-xs text-white/55 transition hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Mini message ──────────────────────────────────────────────────────────────
function MiniMessage({ msg, userName, userColor, copyLabel, copiedLabel }: {
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
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      {isUser ? (
        <Avatar name={userName} color={userColor} size="sm" />
      ) : (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/20 ring-1 ring-brand-400/30">
          <Sparkles className="h-3 w-3 text-brand-300" />
        </div>
      )}

      <div className={cn("group max-w-[75%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-2xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-brand-500/80 text-white"
            : "rounded-tl-sm bg-white/[0.06] text-white/85 border border-white/[0.06]"
        )}>
          {msg.pending && !msg.content ? (
            <span className="flex gap-1 py-0.5">
              {[0,1,2].map(i => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>

        {!isUser && msg.content && !msg.pending && (
          <button
            onClick={copy}
            className="mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition text-[9px] text-white/30 hover:text-white/60"
          >
            {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
            {copied ? copiedLabel : copyLabel}
          </button>
        )}
      </div>
    </div>
  );
}
