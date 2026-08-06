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

  private isSequenceRunning: boolean = false;
  private currentAccentListeners: ((accent: VoiceAccent | null) => void)[] = [];
  public activeAccent: VoiceAccent | null = null;

  public subscribeAccent(listener: (accent: VoiceAccent | null) => void) {
    this.currentAccentListeners.push(listener);
    return () => {
      this.currentAccentListeners = this.currentAccentListeners.filter(l => l !== listener);
    };
  }

  private notifyAccent(accent: VoiceAccent | null) {
    this.activeAccent = accent;
    this.currentAccentListeners.forEach(fn => fn(accent));
  }

  public speak(text: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0) {
    if (!this.synth) return;

    this.stop();
    this.notifyAccent(accent);

    const naturalText = this.prepareNaturalText(text, ipaHint);
    const lang = this.resolveLang(accent);
    const utterance = new SpeechSynthesisUtterance(naturalText);
    utterance.lang = lang;
    const voice = this.selectVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.rate = Math.min(Math.max(rateMultiplier * 0.95, 0.5), 1.5);
    utterance.pitch = 1.0;

    utterance.onstart = () => this.notify(true, text);
    utterance.onend = () => {
      this.notify(false, null);
      this.notifyAccent(null);
    };
    utterance.onerror = () => {
      this.notify(false, null);
      this.notifyAccent(null);
    };

    this.synth.speak(utterance);
  }

  public async speakAllAccents(
    text: string,
    ipaHint?: string,
    rateMultiplier: number = 1.0,
    accents: VoiceAccent[] = ['us', 'uk', 'au']
  ): Promise<void> {
    if (!this.synth) return;

    this.stop();
    this.isSequenceRunning = true;

    for (let i = 0; i < accents.length; i++) {
      if (!this.isSequenceRunning) break;
      const acc = accents[i];
      this.notifyAccent(acc);
      await this.speakSingleAsync(text, ipaHint, acc, rateMultiplier);
      if (!this.isSequenceRunning) break;
      if (i < accents.length - 1) {
        await new Promise(r => setTimeout(r, 380));
      }
    }

    this.isSequenceRunning = false;
    this.notifyAccent(null);
    this.notify(false, null);
  }

  public speakAsync(text: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0): Promise<void> {
    return this.speakSingleAsync(text, ipaHint, accent, rateMultiplier);
  }

  private speakSingleAsync(text: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }
      const naturalText = this.prepareNaturalText(text, ipaHint);
      const lang = this.resolveLang(accent);
      const utterance = new SpeechSynthesisUtterance(naturalText);
      utterance.lang = lang;
      const voice = this.selectVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.rate = Math.min(Math.max(rateMultiplier * 0.95, 0.5), 1.5);
      utterance.pitch = 1.0;

      utterance.onstart = () => this.notify(true, text);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  public speakSentence(sentence: string, targetWord: string, ipaHint?: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0) {
    if (!this.synth) return;

    this.stop();
    this.notifyAccent(accent);

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
    utterance.onend = () => {
      this.notify(false, null);
      this.notifyAccent(null);
    };
    utterance.onerror = () => {
      this.notify(false, null);
      this.notifyAccent(null);
    };

    this.synth.speak(utterance);
  }

  public async speakSentenceAllAccents(
    sentence: string,
    targetWord: string,
    ipaHint?: string,
    rateMultiplier: number = 1.0,
    accents: VoiceAccent[] = ['us', 'uk', 'au']
  ): Promise<void> {
    if (!this.synth) return;

    this.stop();
    this.isSequenceRunning = true;

    let naturalSentence = sentence.trim();
    if (targetWord.toLowerCase() === 'resume' && ipaHint && (ipaHint.includes('rɛz') || ipaHint.includes('rez'))) {
      naturalSentence = naturalSentence.replace(/\bresume\b/gi, 'résumé');
    }

    for (let i = 0; i < accents.length; i++) {
      if (!this.isSequenceRunning) break;
      const acc = accents[i];
      this.notifyAccent(acc);
      await this.speakSingleSentenceAsync(naturalSentence, sentence, acc, rateMultiplier);
      if (!this.isSequenceRunning) break;
      if (i < accents.length - 1) {
        await new Promise(r => setTimeout(r, 450));
      }
    }

    this.isSequenceRunning = false;
    this.notifyAccent(null);
    this.notify(false, null);
  }

  public speakSentenceAsync(
    sentence: string,
    targetWord: string,
    ipaHint?: string,
    accent: VoiceAccent = 'us',
    rateMultiplier: number = 1.0
  ): Promise<void> {
    let naturalSentence = sentence.trim();
    if (targetWord.toLowerCase() === 'resume' && ipaHint && (ipaHint.includes('rɛz') || ipaHint.includes('rez'))) {
      naturalSentence = naturalSentence.replace(/\bresume\b/gi, 'résumé');
    }
    return this.speakSingleSentenceAsync(naturalSentence, sentence, accent, rateMultiplier);
  }

  private speakSingleSentenceAsync(naturalSentence: string, originalSentence: string, accent: VoiceAccent = 'us', rateMultiplier: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }
      const lang = this.resolveLang(accent);
      const utterance = new SpeechSynthesisUtterance(naturalSentence);
      utterance.lang = lang;
      const voice = this.selectVoice(lang);
      if (voice) utterance.voice = voice;

      utterance.rate = Math.min(Math.max(rateMultiplier * 0.95, 0.5), 1.5);
      utterance.pitch = 1.0;

      utterance.onstart = () => this.notify(true, originalSentence);
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  public stop() {
    this.isSequenceRunning = false;
    if (this.synth) {
      this.synth.cancel();
      this.notify(false, null);
      this.notifyAccent(null);
    }
  }
}

export const speechService = new SpeechService();
