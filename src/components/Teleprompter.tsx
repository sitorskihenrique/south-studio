"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Expand,
  FlipHorizontal2,
  Minus,
  Pause,
  Play,
  Plus,
  Save,
} from "lucide-react";

const storageKey = "south-studio-teleprompter-text";
const defaultText =
  "Cole seu roteiro aqui.\n\nUse os controles para ajustar a velocidade, o tamanho da fonte e o espelhamento horizontal.";

export function Teleprompter() {
  const [text, setText] = useState(defaultText);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(32);
  const [fontSize, setFontSize] = useState(46);
  const [mirrored, setMirrored] = useState(false);
  const [saved, setSaved] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    const savedText = window.localStorage.getItem(storageKey);
    if (savedText) {
      setText(savedText);
    }
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const scheduleFrame =
      window.requestAnimationFrame?.bind(window) ??
      ((callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(window.performance.now()), 16));
    const cancelFrame =
      window.cancelAnimationFrame?.bind(window) ?? window.clearTimeout.bind(window);

    if (animationRef.current) {
      cancelFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!isPlaying) {
      lastTickRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      const panel = previewRef.current;
      if (!panel) return;

      if (lastTickRef.current === null) {
        lastTickRef.current = timestamp;
      }

      const delta = timestamp - lastTickRef.current;
      const maxScroll = panel.scrollHeight - panel.clientHeight;
      const nextScroll = panel.scrollTop + (speedRef.current * delta) / 1000;

      if (maxScroll <= 0 || nextScroll >= maxScroll) {
        panel.scrollTop = Math.max(0, maxScroll);
        setIsPlaying(false);
        lastTickRef.current = null;
        animationRef.current = null;
        return;
      }

      panel.scrollTop = nextScroll;
      lastTickRef.current = timestamp;
      animationRef.current = scheduleFrame(step);
    };

    animationRef.current = scheduleFrame(step);

    return () => {
      if (animationRef.current) {
        cancelFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    const panel = previewRef.current;
    if (!panel || !isPlaying) return;

    const maxScroll = panel.scrollHeight - panel.clientHeight;
    if (panel.scrollTop >= maxScroll) {
      setIsPlaying(false);
    }
  }, [fontSize, isPlaying, text]);

  const paragraphs = useMemo(() => text.split(/\n/g), [text]);

  function handleSave() {
    window.localStorage.setItem(storageKey, text);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  async function handleFullscreen() {
    const panel = previewRef.current;
    if (!panel) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await panel.requestFullscreen();
  }

  function nudgeFontSize(amount: number) {
    setFontSize((current) => Math.min(86, Math.max(24, current + amount)));
  }

  function handleTextChange(value: string) {
    setText(value);
  }

  function togglePlayback() {
    const panel = previewRef.current;
    if (!panel) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const maxScroll = panel.scrollHeight - panel.clientHeight;
    if (maxScroll <= 0) return;

    if (panel.scrollTop >= maxScroll - 1) {
      panel.scrollTop = 0;
    }

    setIsPlaying(true);
  }

  return (
    <section className="grid h-auto min-h-0 gap-0 overflow-y-auto lg:h-[calc(100vh-40px)] lg:grid-cols-[420px_1fr] lg:overflow-hidden">
      <div className="overflow-y-auto border-b border-zinc-200/70 bg-white/54 p-5 sm:p-7 lg:border-b-0 lg:border-r">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Teleprompter
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Texto de gravação
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Cole o roteiro, salve no navegador e controle a leitura no painel ao
            lado.
          </p>
        </div>

        <label className="mt-7 block text-sm font-semibold text-zinc-700">
          Roteiro
        </label>
        <textarea
          value={text}
          onChange={(event) => handleTextChange(event.target.value)}
          onInput={(event) => handleTextChange(event.currentTarget.value)}
          onKeyUp={(event) => handleTextChange(event.currentTarget.value)}
          className="mt-3 min-h-[300px] w-full resize-y rounded-3xl border border-zinc-200 bg-white/84 p-4 text-sm leading-6 text-zinc-800 shadow-inner outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/12"
          placeholder="Cole seu texto aqui..."
        />

        <div className="mt-5 grid gap-4">
          <Control label="Velocidade" value={`${speed}px/s`}>
            <input
              type="range"
              min="8"
              max="120"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="w-full accent-zinc-950"
            />
          </Control>

          <Control label="Tamanho da fonte" value={`${fontSize}px`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nudgeFontSize(-2)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
                aria-label="Diminuir fonte"
              >
                <Minus size={17} />
              </button>
              <input
                type="range"
                min="24"
                max="86"
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="min-w-0 flex-1 accent-zinc-950"
              />
              <button
                type="button"
                onClick={() => nudgeFontSize(2)}
                className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
                aria-label="Aumentar fonte"
              >
                <Plus size={17} />
              </button>
            </div>
          </Control>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-950/12 transition hover:bg-zinc-800"
          >
            <Save size={17} />
            {saved ? "Salvo" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => setMirrored((current) => !current)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              mirrored
                ? "bg-teal-600 text-white"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            <FlipHorizontal2 size={17} />
            Espelhar
          </button>
        </div>
      </div>

      <div className="flex h-[72vh] min-h-[460px] flex-col bg-zinc-950 p-3 sm:p-5 lg:h-auto lg:min-h-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-zinc-100"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? "Pausar" : "Play"}
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/16"
              aria-label="Tela cheia"
            >
              <Expand size={19} />
            </button>
          </div>
          <p className="text-sm font-medium text-zinc-400">
            {speed}px/s · {fontSize}px
          </p>
        </div>

        <div
          ref={previewRef}
          data-teleprompter-preview
          className="relative min-h-0 flex-1 overflow-y-auto rounded-[28px] border border-white/10 bg-zinc-900 px-6 py-16 text-center text-white shadow-2xl shadow-black/30 fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-black fullscreen:p-16"
        >
          <div
            className="mx-auto max-w-5xl whitespace-pre-wrap pb-[70vh] pt-[18vh] font-semibold leading-[1.35] tracking-normal"
            style={{
              fontSize,
              transform: mirrored ? "scaleX(-1)" : "scaleX(1)",
            }}
          >
            {paragraphs.map((line, index) => (
              <p key={`${line}-${index}`} className="min-h-[1.35em]">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Control({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white/76 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-zinc-700">{label}</span>
        <span className="text-xs font-semibold text-zinc-500">{value}</span>
      </div>
      {children}
    </div>
  );
}
