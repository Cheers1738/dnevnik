"use client";

import { useEffect, useMemo, useState } from "react";
import type { Artifact, ChatMessage, ScenarioId } from "@dnevnik/shared";
import { scenarios } from "@dnevnik/shared";
import { generateArtifact } from "../lib/api";
import {
  getSettings,
  listSessions,
  saveSession,
  saveSettings,
  type PrivacyMode,
  type SessionRecord
} from "../lib/db";

const supportPrompts = [
  "Что сейчас тревожит или утомляет больше всего?",
  "Что может помочь тебе почувствовать немного больше опоры?",
  "Каким будет мягкий следующий шаг для тебя сегодня?"
];

const digitizePrompts = [
  "Какие события последнего времени кажутся ключевыми?",
  "Какие ценности ты замечаешь в этих историях?",
  "Что хочется сохранить в виде заметки о себе?"
];

type ViewState = "onboarding" | "scenario" | "session" | "artifact" | "archive" | "settings";

export function Dashboard() {
  const [view, setView] = useState<ViewState>("onboarding");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("artifact");
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [currentSession, setCurrentSession] = useState<SessionRecord | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [artifact, setArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    getSettings().then((settings) => setPrivacyMode(settings.privacyMode));
    listSessions().then((stored) => setSessions(stored));
  }, []);

  const prompts = useMemo(() => {
    if (!currentSession) {
      return [] as string[];
    }
    if (currentSession.mode === "support") {
      return supportPrompts;
    }
    if (currentSession.mode === "digitize") {
      return digitizePrompts;
    }
    const scenario = scenarios.find((item) => item.id === currentSession.scenarioId);
    return scenario?.prompts ?? [];
  }, [currentSession]);

  const currentPrompt = prompts[currentPromptIndex];
  const isComplete = currentPromptIndex >= prompts.length;

  async function updatePrivacy(mode: PrivacyMode) {
    setPrivacyMode(mode);
    await saveSettings({ id: "settings", privacyMode: mode });
  }

  function startSession(mode: SessionRecord["mode"], scenarioId?: ScenarioId) {
    const firstPrompt =
      mode === "support"
        ? supportPrompts[0]
        : mode === "digitize"
          ? digitizePrompts[0]
          : scenarios.find((item) => item.id === scenarioId)?.prompts[0];
    const session: SessionRecord = {
      id: crypto.randomUUID(),
      mode,
      scenarioId,
      createdAt: new Date().toISOString(),
      messages: firstPrompt
        ? ([{ role: "assistant", content: firstPrompt }] as ChatMessage[])
        : []
    };
    setCurrentSession(session);
    setCurrentPromptIndex(0);
    setInput("");
    setArtifact(null);
    setView("session");
  }

  function appendMessage(message: ChatMessage) {
    if (!currentSession) {
      return;
    }
    setCurrentSession({
      ...currentSession,
      messages: [...(currentSession.messages ?? []), message]
    });
  }

  async function handleSend() {
    if (!input.trim() || !currentSession || isComplete) {
      return;
    }
    appendMessage({ role: "user", content: input.trim() });
    setInput("");

    const nextPromptIndex = currentPromptIndex + 1;
    if (nextPromptIndex < prompts.length) {
      const nextPrompt = prompts[nextPromptIndex];
      appendMessage({ role: "assistant", content: nextPrompt });
    }
    setCurrentPromptIndex(nextPromptIndex);
  }

  async function handleGenerate() {
    if (!currentSession) {
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateArtifact({
        messages: currentSession.messages ?? [],
        mode: currentSession.mode,
        scenarioId: currentSession.scenarioId
      });
      setArtifact(result);
      const record: SessionRecord = {
        ...currentSession,
        artifact: result,
        messages: privacyMode === "all" ? currentSession.messages : undefined
      };
      if (privacyMode !== "none") {
        await saveSession(record);
        const updated = await listSessions();
        setSessions(updated);
      }
      setCurrentSession(record);
      setView("artifact");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleArchiveOpen(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId) ?? null;
    setCurrentSession(session);
    setArtifact(session?.artifact ?? null);
    setView("artifact");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-mist bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">AI-дневник</h1>
            <p className="text-sm text-slate-500">Интервью, поддержка и оцифровка жизни</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full border border-mist px-3 py-1 text-xs text-slate-600">
              Приватность: {privacyMode === "none" && "не сохранять"}
              {privacyMode === "artifact" && "сохранять итог"}
              {privacyMode === "all" && "сохранять всё"}
            </span>
            <button
              className="text-sm text-slate-600 hover:text-ink"
              onClick={() => setView("archive")}
            >
              Архив
            </button>
            <button
              className="text-sm text-slate-600 hover:text-ink"
              onClick={() => setView("settings")}
            >
              Настройки
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {view === "onboarding" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold">Начнём короткую сессию</h2>
              <p className="text-slate-600">
                Выбери формат — мы задаём вопросы и соберём красивый артефакт.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                className="rounded-2xl border border-mist bg-white p-6 text-left shadow-sm transition hover:-translate-y-1"
                onClick={() => setView("scenario")}
              >
                <h3 className="text-lg font-semibold">Интервью</h3>
                <p className="text-sm text-slate-500">
                  Три сценария с лёгким ветвлением и аккуратными вопросами.
                </p>
              </button>
              <button
                className="rounded-2xl border border-mist bg-white p-6 text-left shadow-sm transition hover:-translate-y-1"
                onClick={() => startSession("support")}
              >
                <h3 className="text-lg font-semibold">Поддержка</h3>
                <p className="text-sm text-slate-500">
                  Эмпатичный companion для journaling, без медицинских советов.
                </p>
              </button>
              <button
                className="rounded-2xl border border-mist bg-white p-6 text-left shadow-sm transition hover:-translate-y-1"
                onClick={() => startSession("digitize")}
              >
                <h3 className="text-lg font-semibold">Оцифровка жизни</h3>
                <p className="text-sm text-slate-500">
                  Собираем события и ценности в понятную историю.
                </p>
              </button>
            </div>
          </section>
        )}

        {view === "scenario" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Выберите сценарий интервью</h2>
              <p className="text-sm text-slate-500">Каждый займёт 7–10 минут.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  className="rounded-2xl border border-mist bg-white p-6 text-left shadow-sm transition hover:-translate-y-1"
                  onClick={() => startSession("interview", scenario.id)}
                >
                  <h3 className="text-lg font-semibold">{scenario.title}</h3>
                  <p className="text-sm text-slate-500">{scenario.prompts[0]}</p>
                </button>
              ))}
            </div>
            <button
              className="text-sm text-slate-500 hover:text-ink"
              onClick={() => setView("onboarding")}
            >
              ← Назад
            </button>
          </section>
        )}

        {view === "session" && currentSession && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {currentSession.mode === "interview" && "Интервью"}
                  {currentSession.mode === "support" && "Поддержка"}
                  {currentSession.mode === "digitize" && "Оцифровка жизни"}
                </h2>
                <p className="text-sm text-slate-500">
                  {currentSession.scenarioId
                    ? scenarios.find((item) => item.id === currentSession.scenarioId)?.title
                    : "Ответьте на вопросы, чтобы собрать артефакт."}
                </p>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-ink"
                onClick={() => setView("onboarding")}
              >
                Завершить позже
              </button>
            </div>

            <div className="space-y-4 rounded-2xl border border-mist bg-white p-6 shadow-sm">
              {(currentSession.messages ?? []).map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-lg rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      message.role === "user"
                        ? "bg-aurora text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {isComplete ? (
              <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
                <div>
                  <h3 className="font-semibold">Сессия завершена</h3>
                  <p className="text-sm text-slate-600">
                    Нажмите, чтобы создать артефакт и сохранить впечатления.
                  </p>
                </div>
                <button
                  className="rounded-full bg-ink px-6 py-2 text-sm text-white"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Генерация..." : "Создать артефакт"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ваш ответ"
                  className="flex-1 rounded-full border border-mist px-4 py-3 text-sm"
                />
                <button
                  className="rounded-full bg-ink px-6 py-3 text-sm text-white"
                  onClick={handleSend}
                >
                  Отправить
                </button>
              </div>
            )}
          </section>
        )}

        {view === "artifact" && artifact && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-mist bg-white p-8 shadow-sm">
              <h2 className="text-3xl font-semibold">{artifact.chapter_title}</h2>
              <p className="mt-4 whitespace-pre-line text-sm text-slate-700">
                {artifact.chapter_text}
              </p>
              <div className="mt-6 grid gap-2 md:grid-cols-2">
                {artifact.quotes.map((quote, index) => (
                  <div
                    key={`${quote}-${index}`}
                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                  >
                    “{quote}”
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button
                className="rounded-full border border-mist px-4 py-2 text-sm"
                onClick={() => setView("onboarding")}
              >
                Новая сессия
              </button>
              <button
                className="rounded-full border border-mist px-4 py-2 text-sm"
                onClick={() => setView("archive")}
              >
                В архив
              </button>
            </div>
          </section>
        )}

        {view === "archive" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Архив</h2>
                <p className="text-sm text-slate-500">Локальные записи на этом устройстве.</p>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-ink"
                onClick={() => setView("onboarding")}
              >
                ← Назад
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500">Пока нет сохранённых сессий.</p>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    className="rounded-2xl border border-mist bg-white p-5 text-left shadow-sm"
                    onClick={() => handleArchiveOpen(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {session.artifact?.chapter_title ?? "Без названия"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {new Date(session.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {session.mode}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {view === "settings" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Настройки приватности</h2>
                <p className="text-sm text-slate-500">Выберите режим хранения на устройстве.</p>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-ink"
                onClick={() => setView("onboarding")}
              >
                ← Назад
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  value: "none",
                  title: "Не сохранять",
                  description: "После сессии ничего не остаётся в архиве."
                },
                {
                  value: "artifact",
                  title: "Сохранять итог",
                  description: "Хранится только артефакт и метаданные."
                },
                {
                  value: "all",
                  title: "Сохранять всё",
                  description: "Хранится артефакт и полная переписка."
                }
              ].map((option) => (
                <button
                  key={option.value}
                  className={`rounded-2xl border p-6 text-left shadow-sm transition ${
                    privacyMode === option.value
                      ? "border-aurora bg-sky-50"
                      : "border-mist bg-white"
                  }`}
                  onClick={() => updatePrivacy(option.value as PrivacyMode)}
                >
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                  <p className="text-sm text-slate-500">{option.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
