import * as React from "react";
import { Sparkles, Send, Lock } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, SectionCard, EmptyState } from "./adminUi";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

const SUGGESTED_KEYS = [
  "admin.ai.suggested1",
  "admin.ai.suggested2",
  "admin.ai.suggested3",
  "admin.ai.suggested4",
];

export function AdminAiPage() {
  const { t } = useI18n();
  const [prompt, setPrompt] = React.useState("");
  const [thread, setThread] = React.useState<{ role: "user" | "ai"; text: string }[]>([]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    setThread((prev) => [
      ...prev,
      { role: "user", text: question },
      {
        role: "ai",
        text: t("admin.ai.previewResponse"),
      },
    ]);
    setPrompt("");
  };

  return (
    <div>
      <AdminHeader
        title={t("admin.nav.ai")}
        subtitle={t("admin.subtitle.ai")}
        crumbs={[{ label: t("admin.nav.ai") }]}
      />

      <PageBody>
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3.5 text-xs text-emerald-200/80">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
          <p>{t("admin.ai.readOnlyMessage")}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Insights */}
          <SectionCard title={t("admin.ai.activeInsights")}>
            <EmptyState
              icon={Sparkles}
              message={t("admin.ai.noInsights")}
            />
          </SectionCard>

          {/* Ask panel */}
          <SectionCard title={t("admin.ai.askAnalyst")}>
            <div className="mb-3 max-h-72 space-y-3 overflow-y-auto">
              {thread.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/40">{t("admin.ai.tryAsking")}</p>
                  {SUGGESTED_KEYS.map((key) => {
                    const label = t(key);
                    return (
                      <button
                        key={key}
                        onClick={() => ask(label)}
                        className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-sm text-white/70 transition hover:border-amber-400/25 hover:text-white"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              {thread.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm",
                    m.role === "user"
                      ? "ml-6 bg-amber-500/15 text-amber-100"
                      : "mr-6 border border-white/[0.06] bg-white/[0.02] text-white/70"
                  )}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(prompt);
                  }
                }}
                placeholder={t("admin.ai.placeholder")}
                rows={2}
                className="flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
              />
              <button
                onClick={() => ask(prompt)}
                disabled={!prompt.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}
