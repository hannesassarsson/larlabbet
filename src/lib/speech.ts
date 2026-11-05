/**
 * Uppläsning med webbläsarens inbyggda talsyntes (svensk röst om den finns).
 * Startas bara när barnet trycker på "Lyssna" – aldrig automatiskt.
 */
export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function voiceFor(lang: string) {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ?? null;
}

export function speak(text: string, lang: 'sv' | 'en' = 'sv') {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/__/g, 'vad').replace(/·/g, 'gånger').replace(/−/g, 'minus'));
  u.lang = lang === 'sv' ? 'sv-SE' : 'en-GB';
  const v = voiceFor(lang);
  if (v) u.voice = v;
  u.rate = 0.9;
  synth.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
