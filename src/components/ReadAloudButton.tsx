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

// Most browsers/OSes don't actually label voices "female" in the name — they use proper
// names instead, and those names vary by platform. This list covers common ones across
// macOS/Safari, Chrome, and Windows/Edge, plus "Samantha" — the one voice virtually
// guaranteed to be pre-installed on macOS/Safari without the user downloading anything.
const KNOWN_PLEASANT_VOICE_NAMES =
  /female|samantha|victoria|karen|susan|zira|kate|serena|stephanie|fiona|moira|tessa|martha|libby|hazel|sonia/i;

/**
 * Picks a voice to read with. Earlier versions of this forced an en-GB (British) voice,
 * but on a typical Mac/Safari setup the only pre-installed en-GB voice is "Daniel" — a
 * deliberately deep, dramatic voice — while nicer-sounding British voices (Kate, Serena)
 * require the user to manually download them in System Settings. Safari also largely
 * ignores the `pitch` property on its built-in voices, so there's no way to tune Daniel's
 * pitch back to normal from code. Prefer any pleasant-sounding English voice over forcing
 * a British accent that, in practice, usually means "the deep one."
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pleasant = english.filter((v) => KNOWN_PLEASANT_VOICE_NAMES.test(v.name));

  const britishPleasant = pleasant.find((v) => v.lang.toLowerCase().startsWith("en-gb"));
  const anyBritish = english.find((v) => v.lang.toLowerCase().startsWith("en-gb"));
  return britishPleasant ?? pleasant[0] ?? anyBritish ?? english[0];
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
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    // Harmless on voices that ignore it (Safari mostly does), and still helps on
    // browsers/voices that do respect it.
    utterance.pitch = 1.1;
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
