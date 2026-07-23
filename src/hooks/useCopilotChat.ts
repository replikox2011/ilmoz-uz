import * as React from "react";
import { Center } from "../types";
import { COPILOT_TOOLS, CenterSnapshot, executeTool } from "../components/copilot/copilotTools";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_STORED = 100;
const MAX_TOOL_ROUNDS = 6;

// ── Model definitions ─────────────────────────────────────────────────────────
export type CopilotModel = "gpt-4o" | "groq-fast" | "groq-pro";

export interface ModelConfig {
  id: CopilotModel;
  label: string;
  sublabel: string;
  apiModel: string;
}

export const COPILOT_MODELS: ModelConfig[] = [
  { id: "groq-fast", label: "Llama 3.1 8B", sublabel: "Быстрый",    apiModel: "llama-3.1-8b-instant"     },
  { id: "groq-pro",  label: "Llama 3.3 70B", sublabel: "Расширенный", apiModel: "llama-3.3-70b-versatile" },
  { id: "gpt-4o",    label: "GPT-4o",         sublabel: "OpenRouter",  apiModel: "openai/gpt-4o"            },
];

const MODEL_STORAGE_KEY = "ilmoz:copilot:model";

export function loadSavedModel(): CopilotModel {
  try {
    const v = localStorage.getItem(MODEL_STORAGE_KEY) as CopilotModel | null;
    if (v && COPILOT_MODELS.some(m => m.id === v)) return v;
  } catch { /* ignore */ }
  return "groq-fast";
}

export function saveModel(model: CopilotModel) {
  try { localStorage.setItem(MODEL_STORAGE_KEY, model); } catch { /* ignore */ }
}

// ── Chat message types ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}

type ApiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
};

// ── History persistence ───────────────────────────────────────────────────────
function storageKey(uid: string) {
  return `ilmoz:copilot:history:${uid}`;
}

export function loadHistory(uid: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(uid: string, msgs: ChatMessage[]) {
  const clean = msgs.filter(m => !m.pending).slice(-MAX_STORED);
  try { localStorage.setItem(storageKey(uid), JSON.stringify(clean)); } catch { /* quota */ }
}

function clearHistory(uid: string) {
  localStorage.removeItem(storageKey(uid));
}

// ── API streaming ─────────────────────────────────────────────────────────────
async function streamOnce(
  apiMessages: ApiMessage[],
  model: CopilotModel,
  onDelta: (delta: string) => void,
  signal: AbortSignal,
): Promise<{ text: string; toolCalls: Array<{ id: string; name: string; arguments: string }> }> {
  const cfg = COPILOT_MODELS.find(m => m.id === model) ?? COPILOT_MODELS[0];
  const isGroq = model === "groq-fast" || model === "groq-pro";

  const url = isGroq ? GROQ_URL : OPENROUTER_URL;
  const apiKey = isGroq
    ? process.env.REACT_APP_GROQ_API_KEY
    : process.env.REACT_APP_OPENROUTER_API_KEY;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (!isGroq) {
    headers["HTTP-Referer"] = "https://nexo-eos.app";
    headers["X-Title"] = "Nexo";
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.apiModel,
      messages: apiMessages,
      tools: COPILOT_TOOLS,
      tool_choice: "auto",
      stream: true,
      max_tokens: 1024,
    }),
    signal,
  });

  if (!resp.ok) {
    const provider = isGroq ? "Groq" : "OpenRouter";
    throw new Error(`${provider} ${resp.status}: ${await resp.text()}`);
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  const toolMap: Record<number, { id: string; name: string; arguments: string }> = {};

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") break outer;
      try {
        const delta = JSON.parse(raw)?.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          text += delta.content;
          onDelta(delta.content);
        }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const i: number = tc.index ?? 0;
            if (!toolMap[i]) toolMap[i] = { id: "", name: "", arguments: "" };
            if (tc.id) toolMap[i].id = tc.id;
            if (tc.function?.name) toolMap[i].name += tc.function.name;
            if (tc.function?.arguments) toolMap[i].arguments += tc.function.arguments;
          }
        }
      } catch { /* ignore malformed chunks */ }
    }
  }

  const toolCalls = Object.values(toolMap).filter(tc => tc.name);
  return { text, toolCalls };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export interface UseCopilotChatOptions {
  center: Center | null;
  uid: string | null;
  snapshot: CenterSnapshot;
  systemPrompt: string;
  model: CopilotModel;
}

export function useCopilotChat({ center, uid, snapshot, systemPrompt, model }: UseCopilotChatOptions) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    uid ? loadHistory(uid) : []
  );
  const [streaming, setStreaming] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  // Re-load history when uid changes (login/logout)
  React.useEffect(() => {
    if (uid) setMessages(loadHistory(uid));
    else setMessages([]);
  }, [uid]);

  // Persist history on change
  React.useEffect(() => {
    if (uid && messages.length > 0) saveHistory(uid, messages);
  }, [messages, uid]);

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || streaming || !center) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: userText.trim() };
    const assistantId = crypto.randomUUID();

    const historySnapshot = messages.filter(m => !m.pending);

    setMessages(prev => [...prev, userMsg, { id: assistantId, role: "assistant", content: "", pending: true }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages: ApiMessage[] = [
      { role: "system", content: systemPrompt },
      ...historySnapshot.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: userText.trim() },
    ];

    let currentContent = "";

    const setAssistantMsg = (content: string, pending: boolean) => {
      currentContent = content;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content, pending } : m
      ));
    };

    const appendDelta = (delta: string) => {
      currentContent += delta;
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: currentContent, pending: false } : m
      ));
    };

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        if (controller.signal.aborted) break;
        currentContent = "";

        const { text, toolCalls } = await streamOnce(apiMessages, model, appendDelta, controller.signal);

        if (toolCalls.length === 0) break;

        apiMessages.push({
          role: "assistant",
          content: text || null,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        });

        setAssistantMsg("⚙️", true);

        for (const tc of toolCalls) {
          let args: Record<string, any> = {};
          try { args = JSON.parse(tc.arguments); } catch { /* invalid json */ }

          const result = await executeTool(tc.name, args, center.id, snapshot);

          apiMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const msg = err?.message ?? "Unknown error";
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `⚠️ ${msg}`, pending: false } : m
        ));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
    if (uid) clearHistory(uid);
  };

  return { messages, streaming, sendMessage, clearChat };
}
