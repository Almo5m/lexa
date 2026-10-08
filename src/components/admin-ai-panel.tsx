"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagButton } from "@/components/tag-button";
import { useT } from "@/lib/i18n/provider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { AppSettings } from "@/lib/settings";

interface TestResult {
  model: string;
  role: "main" | "fallback";
  ok: boolean;
  ms: number;
  kind?: string;
  message?: string;
}

const KINDS = ["busy", "quota", "model", "auth", "other"];

interface SystemCheck {
  id: "gemini" | "service" | "settings" | "usage";
  ok: boolean;
  message?: string;
}

export function AdminAiPanel({ settings, keySet }: { settings: AppSettings; keySet: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [current, setCurrent] = useState({ main: settings.aiModel, fallback: settings.aiFallbackModel });
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [checks, setChecks] = useState<SystemCheck[] | null>(null);
  const [testFailed, setTestFailed] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [models, setModels] = useState<string[] | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function runTest() {
    setTesting(true);
    setTestFailed(false);
    setResults(null);
    setChecks(null);
    try {
      const response = await fetch("/api/admin/ai-test", { method: "POST" });
      if (!response.ok) throw new Error("test_failed");
      const data = await response.json();
      setResults(data.results);
      setChecks(data.checks);
    } catch {
      setTestFailed(true);
    } finally {
      setTesting(false);
    }
  }

  async function loadModels() {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const response = await fetch("/api/admin/ai-models");
      const data = await response.json();
      if (!response.ok) throw new Error("models_failed");
      setModels(data.models);
      if (data.error) setModelsError(data.message ?? data.error);
    } catch {
      setModelsError(t("common.error"));
    } finally {
      setLoadingModels(false);
    }
  }

  async function useModel(name: string, role: "main" | "fallback") {
    setUpdating(`${role}:${name}`);
    setNotice(null);
    const next = {
      ...settings,
      aiModel: role === "main" ? name : current.main,
      aiFallbackModel: role === "fallback" ? name : current.fallback,
    };
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("save_failed");
      setCurrent({ main: next.aiModel, fallback: next.aiFallbackModel });
      setNotice(t("admin.ai.updated"));
      setResults(null);
      router.refresh();
    } catch {
      setNotice(t("common.error"));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">{t("admin.ai.intro")}</p>

      <section className="sheet space-y-5 p-6" aria-labelledby="ai-status">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="ai-status" className="text-lg font-bold">
            {t("admin.ai.title")}
          </h2>
          <TagButton onClick={runTest} loading={testing} disabled={!keySet} gradient>
            {t("admin.ai.test")}
          </TagButton>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <Fact label={t("admin.keyStatus")} ok={keySet} value={keySet ? t("admin.keyOk") : t("admin.keyMissing")} />
          <Fact label={t("admin.ai.main")} value={current.main} mono />
          <Fact label={t("admin.ai.fallback")} value={current.fallback || "—"} mono />
        </dl>

        <div aria-live="polite" className="space-y-3">
          {testing && <p className="text-ink-soft">{t("admin.ai.testing")}…</p>}
          {testFailed && <p className="pen-error text-pen-red">{t("admin.ai.testError")}</p>}
          {checks && (
            <ul className="space-y-2 rounded-[var(--r-sm)] bg-paper-deep/60 p-4">
              <li className="text-sm font-semibold text-ink-soft">{t("admin.check.title")}</li>
              {checks.map((check) => (
                <li key={check.id} className="text-sm">
                  <span className={check.ok ? "font-semibold text-leaf" : "font-semibold text-pen-red"}>
                    {check.ok ? "✓" : "✗"}
                  </span>{" "}
                  {t(`admin.check.${check.id}` as DictKey)}
                  {!check.ok && check.message && (
                    <span className="ltr-text mt-0.5 block break-words text-xs text-ink-faint">{check.message}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {results?.map((result) => (
            <div
              key={result.model}
              className={`rounded-[var(--r-sm)] border-s-4 p-4 ${
                result.ok ? "border-leaf bg-leaf/10" : "border-pen-red bg-pen-red/10"
              }`}
            >
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <span>{result.role === "main" ? t("admin.ai.main") : t("admin.ai.fallback")}</span>
                <span className="ltr-text font-mono text-sm font-normal">{result.model}</span>
              </p>
              {result.ok ? (
                <p className="text-leaf">{t("admin.ai.ok", { ms: result.ms })}</p>
              ) : (
                <>
                  <p className="font-semibold text-pen-red">
                    {KINDS.includes(result.kind ?? "") ? t(`admin.kind.${result.kind}` as DictKey) : t("admin.kind.other")}
                    {" · "}
                    <span className="font-normal">
                      {t(`admin.kindHelp.${KINDS.includes(result.kind ?? "") ? result.kind : "other"}` as DictKey)}
                    </span>
                  </p>
                  <p className="ltr-text mt-1 break-words text-sm text-ink-soft">{result.message}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="sheet space-y-4 p-6" aria-labelledby="ai-models">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="ai-models" className="text-lg font-bold">
              {t("admin.ai.models")}
            </h2>
            <p className="text-sm text-ink-soft">{t("admin.ai.modelsHint")}</p>
          </div>
          <TagButton quiet onClick={loadModels} loading={loadingModels} disabled={!keySet}>
            {t("admin.ai.loadModels")}
          </TagButton>
        </div>

        {loadingModels && <p className="text-ink-soft">{t("admin.ai.loadingModels")}…</p>}
        {modelsError && (
          <p role="alert" className="ltr-text break-words text-sm text-pen-red">
            {modelsError}
          </p>
        )}
        {models && models.length === 0 && !modelsError && <p className="text-ink-soft">{t("admin.ai.noModels")}</p>}

        {models && models.length > 0 && (
          <ul className="divide-y divide-line">
            {models.map((name) => {
              const isMain = name === current.main;
              const isFallback = name === current.fallback;
              return (
                <li key={name} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="ltr-text font-mono text-sm">{name}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    {isMain && <Badge tone="good">{t("admin.ai.isMain")}</Badge>}
                    {isFallback && <Badge tone="info">{t("admin.ai.isFallback")}</Badge>}
                    {!isMain && (
                      <SmallButton busy={updating === `main:${name}`} onClick={() => useModel(name, "main")}>
                        {t("admin.ai.useMain")}
                      </SmallButton>
                    )}
                    {!isFallback && (
                      <SmallButton busy={updating === `fallback:${name}`} onClick={() => useModel(name, "fallback")}>
                        {t("admin.ai.useFallback")}
                      </SmallButton>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p aria-live="polite" className="text-sm font-medium text-leaf">
          {notice}
        </p>
      </section>
    </div>
  );
}

function Fact({ label, value, ok, mono }: { label: string; value: string; ok?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-[var(--r-sm)] bg-paper-deep/70 p-3">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd
        className={`mt-0.5 break-words font-semibold ${mono ? "ltr-text font-mono text-sm" : ""} ${
          ok === undefined ? "" : ok ? "text-leaf" : "text-pen-red"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Badge({ tone, children }: { tone: "good" | "info"; children: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        tone === "good" ? "bg-leaf/20 text-leaf" : "bg-cyan/20 text-cyan"
      }`}
    >
      {children}
    </span>
  );
}

function SmallButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="min-h-11 rounded-full px-4 text-sm font-medium shadow-[inset_0_0_0_2px_var(--color-line)] hover:bg-paper-deep disabled:opacity-50"
    >
      {children}
    </button>
  );
}
