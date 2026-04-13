import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslate, useTextToSpeech } from "@workspace/api-client-react";
import { ArrowLeftRight, Copy, Volume2, X, Check, Loader2, Sun, Moon, Globe, Mic, Zap } from "lucide-react";

const LANGUAGES = [
  { code: "auto", label: "Detect language" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "hi", label: "Hindi" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "tr", label: "Turkish" },
  { code: "sv", label: "Swedish" },
  { code: "da", label: "Danish" },
  { code: "fi", label: "Finnish" },
  { code: "no", label: "Norwegian" },
  { code: "uk", label: "Ukrainian" },
  { code: "cs", label: "Czech" },
  { code: "ro", label: "Romanian" },
  { code: "hu", label: "Hungarian" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay" },
  { code: "he", label: "Hebrew" },
  { code: "el", label: "Greek" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "bn", label: "Bengali" },
];

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== "auto");
const QUICK_SOURCE = ["auto", "en", "es", "fr", "de"];
const QUICK_TARGET = ["en", "es", "fr", "de", "zh"];

function getLangLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

const BASE = import.meta.env.BASE_URL;

export default function Translator() {
  const [inputText, setInputText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string | undefined>();
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [playingSource, setPlayingSource] = useState(false);
  const [playingTarget, setPlayingTarget] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const translateMutation = useTranslate({
    mutation: {
      onSuccess: (data) => {
        setTranslatedText(data.translatedText ?? "");
        setDetectedLang(data.detectedLanguage);
      },
    },
  });

  const ttsMutation = useTextToSpeech({
    mutation: {
      onSuccess: (data, variables) => {
        const vars = variables as { text: string; language: string; _isSource?: boolean };
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = audio;
        audio.play();
        audio.onended = () => { setPlayingSource(false); setPlayingTarget(false); };
        if (vars._isSource) { setPlayingSource(true); setPlayingTarget(false); }
        else { setPlayingTarget(true); setPlayingSource(false); }
      },
    },
  });

  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return;
    translateMutation.mutate({ data: { text: inputText, sourceLang, targetLang } });
  }, [inputText, sourceLang, targetLang]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleTranslate(); }
  };

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
    setDetectedLang(undefined);
  };

  const handleCopyTarget = () => {
    navigator.clipboard.writeText(translatedText).then(() => {
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    });
  };

  const handleSpeak = (text: string, lang: string, isSource: boolean) => {
    if (!text.trim()) return;
    const effectiveLang = lang === "auto" ? (detectedLang ?? "en") : lang;
    ttsMutation.mutate({ data: { text, language: effectiveLang, _isSource: isSource } as { text: string; language: string } });
  };

  const handleClear = () => {
    setInputText("");
    setTranslatedText("");
    setDetectedLang(undefined);
    translateMutation.reset();
  };

  const isTranslating = translateMutation.isPending;
  const hasError = translateMutation.isError;

  const setSourceAndClear = (code: string) => {
    setSourceLang(code);
    setTranslatedText("");
    setDetectedLang(undefined);
  };

  const setTargetAndClear = (code: string) => {
    setTargetLang(code);
    setTranslatedText("");
    setDetectedLang(undefined);
  };

  const headerBg = isDark ? "#0f172a" : "#ffffff";
  const headerBorder = isDark ? "#1e293b" : "#e8eaed";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e8eaed";
  const inputBg = isDark ? "#1e293b" : "#ffffff";
  const targetBg = isDark ? "#0f172a" : "#f8f9fa";
  const textPrimary = isDark ? "#f1f5f9" : "#202124";
  const textMuted = isDark ? "#94a3b8" : "#5f6368";
  const textPlaceholder = isDark ? "#475569" : "#bdc1c6";
  const dividerColor = isDark ? "#334155" : "#e8eaed";
  const blue = "#1a73e8";
  const buttonHover = isDark ? "#1e293b" : "#f8f9fa";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "'Google Sans', Roboto, system-ui, sans-serif",
        background: isDark
          ? "linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #0a1628 100%)"
          : "linear-gradient(135deg, #e8f0fe 0%, #f8f9fa 50%, #e3f2fd 100%)",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: headerBg,
          borderBottom: `1px solid ${headerBorder}`,
          boxShadow: isDark
            ? "0 1px 8px rgba(0,0,0,0.4)"
            : "0 1px 3px rgba(60,64,67,.08)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill={isDark ? "#1e293b" : "#f0f4ff"}/>
              <circle cx="16" cy="16" r="10" fill="none" stroke="#1a73e8" strokeWidth="2"/>
              <ellipse cx="16" cy="16" rx="5" ry="10" fill="none" stroke="#34A853" strokeWidth="1.5"/>
              <line x1="6" y1="16" x2="26" y2="16" stroke="#FBBC05" strokeWidth="1.5"/>
              <line x1="16" y1="6" x2="16" y2="26" stroke="#EA4335" strokeWidth="1.5"/>
            </svg>
            <span className="text-xl font-semibold" style={{ color: textPrimary }}>LinguaAI</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
              style={{ background: isDark ? "rgba(26,115,232,0.2)" : "#e8f0fe", color: blue }}
            >
              AI
            </span>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            title="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: buttonHover, color: textMuted }}
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: isDark ? "rgba(10,15,26,0.0)" : "rgba(232,240,254,0.0)" }}
        />
        <img
          src={`${BASE}world-network.png`}
          alt="World language network"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isDark ? 0.18 : 0.08 }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-10 flex flex-col items-center text-center gap-4">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: textPrimary }}
          >
            Speak every language,{" "}
            <span style={{ color: blue }}>instantly.</span>
          </h1>
          <p className="text-base max-w-xl" style={{ color: textMuted }}>
            Powered by GPT-4 — translate text and voice across 30+ languages with natural text-to-speech playback.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: isDark ? "rgba(26,115,232,0.15)" : "#e8f0fe", color: blue }}
            >
              <Globe className="w-3.5 h-3.5" />
              30+ Languages
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: isDark ? "rgba(52,168,83,0.15)" : "#e6f4ea", color: "#34A853" }}
            >
              <Mic className="w-3.5 h-3.5" />
              Voice Translation
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: isDark ? "rgba(251,188,4,0.15)" : "#fef7e0", color: "#f9a825" }}
            >
              <Zap className="w-3.5 h-3.5" />
              Instant TTS
            </div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: isDark
              ? "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)"
              : "0 1px 8px rgba(60,64,67,.15), 0 2px 4px rgba(60,64,67,.08)",
          }}
        >
          {/* Language selector row */}
          <div className="flex items-stretch" style={{ borderBottom: `1px solid ${dividerColor}` }}>
            {/* Source lang tabs */}
            <div className="flex-1 flex items-center px-1 gap-0.5 overflow-x-auto scrollbar-none">
              {QUICK_SOURCE.map((code) => (
                <button
                  key={code}
                  onClick={() => setSourceAndClear(code)}
                  className="whitespace-nowrap px-4 h-12 text-sm font-medium rounded-t transition-colors"
                  style={{
                    color: sourceLang === code ? blue : textMuted,
                    borderBottom: sourceLang === code ? `2px solid ${blue}` : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {getLangLabel(code)}
                </button>
              ))}
              <div className="ml-1">
                <select
                  value={QUICK_SOURCE.includes(sourceLang) ? "" : sourceLang}
                  onChange={(e) => { if (e.target.value) setSourceAndClear(e.target.value); }}
                  className="h-12 px-2 text-sm bg-transparent border-none cursor-pointer focus:outline-none appearance-none"
                  style={{ color: blue }}
                >
                  <option value="">More</option>
                  {LANGUAGES.filter((l) => !QUICK_SOURCE.includes(l.code)).map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap button */}
            <div className="flex items-center px-3" style={{ borderLeft: `1px solid ${dividerColor}`, borderRight: `1px solid ${dividerColor}` }}>
              <button
                onClick={handleSwap}
                disabled={sourceLang === "auto"}
                title="Swap languages"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: textMuted, background: "transparent" }}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Target lang tabs */}
            <div className="flex-1 flex items-center px-1 gap-0.5 overflow-x-auto scrollbar-none">
              {QUICK_TARGET.map((code) => (
                <button
                  key={code}
                  onClick={() => setTargetAndClear(code)}
                  className="whitespace-nowrap px-4 h-12 text-sm font-medium rounded-t transition-colors"
                  style={{
                    color: targetLang === code ? blue : textMuted,
                    borderBottom: targetLang === code ? `2px solid ${blue}` : "2px solid transparent",
                    background: "transparent",
                  }}
                >
                  {getLangLabel(code)}
                </button>
              ))}
              <div className="ml-1">
                <select
                  value={QUICK_TARGET.includes(targetLang) ? "" : targetLang}
                  onChange={(e) => { if (e.target.value) setTargetAndClear(e.target.value); }}
                  className="h-12 px-2 text-sm bg-transparent border-none cursor-pointer focus:outline-none appearance-none"
                  style={{ color: blue }}
                >
                  <option value="">More</option>
                  {TARGET_LANGUAGES.filter((l) => !QUICK_TARGET.includes(l.code)).map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Translation panels */}
          <div className="flex min-h-[260px]">
            {/* Source */}
            <div className="flex-1 flex flex-col" style={{ borderRight: `1px solid ${dividerColor}` }}>
              <div className="relative flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter text"
                  className="w-full h-full min-h-[200px] px-6 pt-5 pb-14 text-[1.1rem] leading-relaxed bg-transparent resize-none focus:outline-none"
                  style={{
                    color: textPrimary,
                    fontFamily: "inherit",
                    caretColor: blue,
                  }}
                />
                <span
                  className="pointer-events-none absolute top-5 left-6 text-[1.1rem]"
                  style={{ color: textPlaceholder, display: inputText ? "none" : "block" }}
                >
                  Enter text
                </span>
                {inputText && (
                  <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: textMuted, background: buttonHover }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: `1px solid ${dividerColor}`, background: inputBg }}
              >
                <div className="flex items-center gap-1">
                  {inputText && (
                    <button
                      onClick={() => handleSpeak(inputText, sourceLang, true)}
                      disabled={ttsMutation.isPending && playingSource}
                      title="Listen"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: textMuted }}
                    >
                      {playingSource
                        ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: blue }} />
                        : <Volume2 className="w-5 h-5" />}
                    </button>
                  )}
                  {sourceLang === "auto" && detectedLang && (
                    <span className="text-xs ml-2" style={{ color: textMuted }}>
                      Detected: <span className="font-medium" style={{ color: blue }}>{getLangLabel(detectedLang)}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {inputText && (
                    <span className="text-xs tabular-nums" style={{ color: textPlaceholder }}>{inputText.length} / 5000</span>
                  )}
                  <button
                    onClick={handleTranslate}
                    disabled={!inputText.trim() || isTranslating}
                    className="inline-flex items-center gap-2 px-5 h-9 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: !inputText.trim() || isTranslating
                        ? (isDark ? "#334155" : "#e8eaed")
                        : blue,
                      color: !inputText.trim() || isTranslating
                        ? (isDark ? "#64748b" : "#bdc1c6")
                        : "#fff",
                    }}
                  >
                    {isTranslating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Translating...</>
                    ) : "Translate"}
                  </button>
                </div>
              </div>
            </div>

            {/* Target */}
            <div className="flex-1 flex flex-col" style={{ background: targetBg }}>
              <div className="relative flex-1">
                {isTranslating ? (
                  <div className="min-h-[200px] px-6 pt-6 flex items-start gap-2">
                    <div className="flex gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: blue, animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: blue, animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: blue, animationDelay: "300ms" }} />
                    </div>
                  </div>
                ) : hasError ? (
                  <div className="min-h-[200px] px-6 pt-6 flex items-start">
                    <p className="text-sm text-red-400">Translation failed. Please try again.</p>
                  </div>
                ) : (
                  <div
                    className="min-h-[200px] px-6 pt-5 pb-4 text-[1.1rem] leading-relaxed whitespace-pre-wrap select-text overflow-y-auto"
                    style={{
                      color: translatedText ? textPrimary : textPlaceholder,
                      fontFamily: "inherit",
                    }}
                  >
                    {translatedText || "Translation"}
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-1 px-4 py-3"
                style={{ borderTop: `1px solid ${dividerColor}` }}
              >
                {translatedText && (
                  <>
                    <button
                      onClick={() => handleSpeak(translatedText, targetLang, false)}
                      disabled={ttsMutation.isPending && playingTarget}
                      title="Listen"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: textMuted }}
                    >
                      {playingTarget
                        ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: blue }} />
                        : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleCopyTarget}
                      title="Copy translation"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ color: textMuted }}
                    >
                      {copiedTarget
                        ? <Check className="w-5 h-5" style={{ color: blue }} />
                        : <Copy className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: textMuted }}>
          Press{" "}
          <kbd
            className="px-1.5 py-0.5 rounded border text-xs"
            style={{
              fontFamily: "Roboto Mono, monospace",
              borderColor: isDark ? "#334155" : "#dadce0",
              background: isDark ? "#1e293b" : "#ffffff",
              color: textMuted,
            }}
          >
            Ctrl+Enter
          </kbd>{" "}
          to translate
        </p>
      </main>
    </div>
  );
}
