"use client";

import { useState, useSyncExternalStore } from "react";

// Browser support for speech synthesis never changes after mount, so this never
// needs to notify subscribers — it only exists to read the value in an SSR-safe way.
function subscribe() {
  return () => {};
}
function getSnapshot() {
  return "speechSynthesis" in window;
}
function getServerSnapshot() {
  return false;
}

/**
 * Prefers a British English voice (and a female one, if the browser's voice names
 * say so — the Web Speech API has no real "gender" field, just naming conventions
 * that vary by OS). Entirely dependent on what voices the visitor's own device/browser
 * ships with; there's no universal "Oxford" voice to request, just en-GB as the closest
 * standard category. Falls back to the browser's default voice if no en-GB voice exists.
 */
function pickBritishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const british = voices.filter((v) => v.lang.toLowerCase().startsWith("en-gb"));
  return british.find((v) => /female/i.test(v.name)) ?? british[0];
}

/**
 * Reads the given text aloud using the browser's built-in speech synthesis —
 * free, no account, no API key, works offline. Hidden entirely in browsers
 * that don't support it rather than showing a broken control.
 */
export function ReadAloudButton({ text, label }: { text: string; label: string }) {
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [speaking, setSpeaking] = useState(false);

  if (!supported) return null;

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Stop any other bio's narration before starting this one.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB"; // hints a British voice even if no exact voice match is found below
    const voice = pickBritishVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? `Stop reading ${label}` : `Listen to ${label}`}
      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:text-foreground"
    >
      <span aria-hidden="true">{speaking ? "⏹" : "🔊"}</span>
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}
