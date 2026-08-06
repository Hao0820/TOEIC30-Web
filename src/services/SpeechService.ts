import type { VoiceAccent } from '../types';

class SpeechService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private voices: SpeechSynthesisVoice[] = [];
  public isSpeaking: boolean = false;
  private onStateChangeListeners: ((speaking: boolean, text: string | null) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public subscribe(listener: (speaking: boolean, text: string | null) => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== listener);
    };
  }

  private notify(speaking: boolean, text: string | null = null) {
    this.isSpeaking = speaking;
    this.onStateChangeListeners.forEach(fn => fn(speaking, text));
  }

  private resolveLang(accent: VoiceAccent): string {
    if (accent === 'random') {
      const accents: VoiceAccent[] = ['us', 'uk', 'au', 'ca'];
      const picked = accents[Math.floor(Math.random() * accents.length)];
      return this.resolveLang(picked);
    }
    switch (accent) {
      case 'uk': return 'en-GB';
      case 'au': return 'en-AU';
      case 'ca': return 'en-CA';
      case 'us':
      default:
        return 'en-US';
    }
  }

  private selectVoice(lang: string): SpeechSynthesisVoice | null {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    // Prefer Enhanced / Premium / Natural
    const matching = this.voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
    const naturalVoice = matching.find(v => 
      v.name.toLowerCase().includes('natural') || 
      v.name.toLowerCase().includes('enhanced') || 
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('daniel') ||
      v.name.toLowerCase().includes('karen')
    );
    if (naturalVoice) return naturalVoice;
    if (matching.length > 0) return matching[0];
    return this.voices.find(v => v.lang.startsWith('en')) || null;
  }

  private prepareNaturalText(text: string, ipaHint?: string): string {
    const clean = text.trim();
    if (clean.toLowerCase() === 'resume') {
      if (ipaHint && (ipaHint.includes('rɛz') || ipaHint.includes('rez'))) {
        return 'résumé';
      }
      return 'résumé';
    }
    return clean;
  }

  public speak(text: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0) {
    if (!this.synth) return;

    this.stop();

    const naturalText = this.prepareNaturalText(text, ipaHint);
    const lang = this.resolveLang(accent);
    const utterance = new SpeechSynthesisUtterance(naturalText);
    utterance.lang = lang;
    const voice = this.selectVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.rate = Math.min(Math.max(rateMultiplier * 0.95, 0.5), 1.5);
    utterance.pitch = 1.0;

    utterance.onstart = () => this.notify(true, text);
    utterance.onend = () => this.notify(false, null);
    utterance.onerror = () => this.notify(false, null);

    this.synth.speak(utterance);
  }

  public speakSentence(sentence: string, targetWord: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0) {
    if (!this.synth) return;

    this.stop();

    let naturalSentence = sentence.trim();
    if (targetWord.toLowerCase() === 'resume' && ipaHint && (ipaHint.includes('rɛz') || ipaHint.includes('rez'))) {
      naturalSentence = naturalSentence.replace(/\bresume\b/gi, 'résumé');
    }

    const lang = this.resolveLang(accent);
    const utterance = new SpeechSynthesisUtterance(naturalSentence);
    utterance.lang = lang;
    const voice = this.selectVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.rate = Math.min(Math.max(rateMultiplier * 0.95, 0.5), 1.5);
    utterance.pitch = 1.0;

    utterance.onstart = () => this.notify(true, sentence);
    utterance.onend = () => this.notify(false, null);
    utterance.onerror = () => this.notify(false, null);

    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false, null);
    }
  }
}

export const speechService = new SpeechService();
