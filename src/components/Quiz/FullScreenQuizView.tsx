import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { QuizQuestion, Word, QuizRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { storageService } from '../../services/StorageService';
import { spacedRepetitionService } from '../../services/SpacedRepetitionService';
import { X, Volume2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { QuizResultView } from './QuizResultView';

export const FullScreenQuizView: React.FC = () => {
  const { activeQuizQuestions, quizScopeTitle, exitQuiz, settings } = useApp();

  const isTimerEnabled = (settings.quizTimerSeconds ?? 15) > 0;
  const initialSeconds = isTimerEnabled ? (settings.quizTimerSeconds ?? 15) : 0;

  const [questions, setQuestions] = useState<QuizQuestion[]>(activeQuizQuestions || []);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(initialSeconds);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [completedRecord, setCompletedRecord] = useState<QuizRecord | null>(null);

  const timerRef = useRef<number | null>(null);

  const currentQ = questions[currentIndex] || null;

  // Sound play for listening question
  useEffect(() => {
    if (currentQ && currentQ.type === 'listening') {
      speechService.speak(currentQ.word.word, currentQ.word.phonetic, settings.voiceAccent, settings.speechRate);
    }
  }, [currentIndex, currentQ, settings]);

  // Timer Countdown
  useEffect(() => {
    if (isAnswered || isQuizCompleted || !isTimerEnabled) return;

    setTimerSeconds(initialSeconds);
    timerRef.current = window.setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isQuizCompleted, isTimerEnabled, initialSeconds]);

  const handleFinishQuiz = useCallback((finalQuestions: QuizQuestion[]) => {
    let correct = 0;
    const mistakes: Word[] = [];

    finalQuestions.forEach(q => {
      if (q.selectedIndex === q.correctIndex) {
        correct += 1;
      } else {
        mistakes.push(q.word);
      }
    });

    const total = finalQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const record: QuizRecord = {
      id: `record_${Date.now()}`,
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      scopeTitle: quizScopeTitle,
      totalQuestions: total,
      correctCount: correct,
      wrongCount: mistakes.length,
      scorePercentage: percentage,
      mistakeWords: mistakes,
    };

    // 🔥 錯題重測不計入歷史紀錄
    const isRetest = quizScopeTitle.includes('錯題專項重測') || quizScopeTitle.includes('重測');
    if (!isRetest) {
      storageService.saveQuizRecord(record);
    }

    setCompletedRecord(record);
    setIsQuizCompleted(true);
  }, [quizScopeTitle]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (isAnswered || !currentQ) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const updated = [...questions];
    updated[currentIndex] = {
      ...currentQ,
      selectedIndex: optionIndex,
      isAnswered: true,
    };
    setQuestions(updated);

    // Transition to next after 0.85s
    setTimeout(() => {
      // 確保切換下一題時重置按鈕焦點與狀態
      (document.activeElement as HTMLElement)?.blur();

      // Record Ebbinghaus Spaced Repetition result
      const isCorrect = optionIndex === currentQ.correctIndex;
      spacedRepetitionService.recordReviewResult(currentQ.word.id, isCorrect);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        handleFinishQuiz(updated);
      }
    }, 850);
  }, [isAnswered, currentQ, currentIndex, questions, handleFinishQuiz]);

  // Keyboard shortcut 1,2,3,4 & A,B,C,D
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isAnswered || isQuizCompleted) return;
      const key = e.key.toUpperCase();
      if (['1', '2', '3', '4'].includes(key)) {
        const opt = parseInt(key, 10) - 1;
        handleAnswer(opt);
      } else if (['A', 'B', 'C', 'D'].includes(key)) {
        const opt = key.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1...
        handleAnswer(opt);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAnswered, isQuizCompleted, handleAnswer]);

  if (isQuizCompleted && completedRecord) {
    return <QuizResultView record={completedRecord} onExit={exitQuiz} />;
  }

  if (!currentQ) return null;

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const getQuestionTypeBadge = (t: string) => {
    switch (t) {
      case 'enToZh': return '英翻中';
      case 'zhToEn': return '中翻英';
      case 'listening': return '聽力測驗';
      case 'fillInBlank': return '例句克漏字';
      default: return '單字測驗';
    }
  };

  return (
    <div className="quiz-fullscreen-backdrop">
      <div className="quiz-container fade-in">
        {/* Header Bar */}
        <div className="quiz-top-bar">
          <button
            className="btn-icon"
            onClick={() => {
              if (window.confirm('確定要提前退出測驗嗎？本次紀錄將不會被保存。')) {
                exitQuiz();
              }
            }}
          >
            <X size={20} />
          </button>

          <div className="quiz-center-info">
            <span className="quiz-type-badge">{getQuestionTypeBadge(currentQ.type)}</span>
            <span className="question-count-text">
              第 <b>{currentIndex + 1}</b> / {questions.length} 題
            </span>
          </div>

          {isTimerEnabled ? (
            <div className={`timer-box ${timerSeconds <= 5 ? 'urgent' : ''}`}>
              <Clock size={16} />
              <span>{timerSeconds}s</span>
            </div>
          ) : (
            <div className="timer-box" style={{ opacity: 0.5 }}>
              <Clock size={16} />
              <span>無時限</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Question Stem Card */}
        <div className="question-card">
          {currentQ.type === 'listening' ? (
            <div className="listening-stem-box">
              <button
                className="big-audio-btn"
                onClick={() => speechService.speak(currentQ.word.word, currentQ.word.phonetic, settings.voiceAccent, settings.speechRate)}
                title="再次朗讀發音"
              >
                <Volume2 size={36} />
                <span>點擊朗讀單字</span>
              </button>
              <p className="listening-prompt">請聽發音選出正確中文釋義</p>
            </div>
          ) : currentQ.type === 'fillInBlank' ? (
            <div className="blank-stem-box">
              <span className="blank-hint">例句填空（選出最適合填入空格的單字）</span>
              <h3 className="blank-sentence-text">{currentQ.stem}</h3>
            </div>
          ) : (
            <div className="standard-stem-box">
              <h3 className="stem-word-text">{currentQ.stem}</h3>
              {currentQ.type === 'enToZh' && currentQ.word.pos && (
                <span className="pos-badge-stem">{currentQ.word.pos}</span>
              )}
            </div>
          )}
        </div>

        {/* Options Grid with key on currentIndex to force fresh button elements */}
        <div className="options-grid" key={currentIndex}>
          {currentQ.options.map((optionText, idx) => {
            const isCorrect = idx === currentQ.correctIndex;
            const isSelected = idx === selectedOption;

            let optionClass = 'option-btn';
            if (isAnswered) {
              if (isCorrect) {
                optionClass += ' correct';
              } else if (isSelected && !isCorrect) {
                optionClass += ' wrong';
              } else {
                optionClass += ' dimmed';
              }
            }

            return (
              <button
                key={`${currentIndex}_${idx}`}
                className={optionClass}
                disabled={isAnswered}
                onClick={(e) => {
                  (e.currentTarget as HTMLElement)?.blur();
                  handleAnswer(idx);
                }}
              >
                <div className="option-label-circle">{['A', 'B', 'C', 'D'][idx]}</div>
                <span className="option-text">{optionText}</span>
                {isAnswered && isCorrect && <CheckCircle2 size={20} className="status-icon success" />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={20} className="status-icon error" />}
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        <p className="quiz-keyboard-hint">支援鍵盤快速鍵 <b>1 ~ 4</b> 作答</p>
      </div>

      <style>{`
        .quiz-fullscreen-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-primary);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .quiz-container {
          width: 100%;
          max-width: 680px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .quiz-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .quiz-center-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .quiz-type-badge {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
        }
        .question-count-text {
          font-size: 14px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .timer-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .timer-box.urgent {
          color: var(--accent-error);
          border-color: var(--accent-error);
          animation: pulseSound 0.6s infinite;
        }
        .quiz-progress-track {
          height: 6px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          overflow: hidden;
        }
        .quiz-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
          transition: width 0.2s ease-out;
        }
        .question-card {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 36px 28px;
          box-shadow: var(--shadow-md);
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .standard-stem-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .stem-word-text {
          font-family: var(--font-display);
          font-size: 38px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .pos-badge-stem {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          font-size: 14px;
          font-weight: 800;
          font-style: italic;
          padding: 3px 10px;
          border-radius: 6px;
        }
        .listening-stem-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .big-audio-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          border: none;
          padding: 16px 28px;
          border-radius: 9999px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
          transition: transform 0.2s;
        }
        .big-audio-btn:hover {
          transform: scale(1.05);
        }
        .listening-prompt {
          font-size: 13px;
          color: var(--text-muted);
        }
        .blank-stem-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        .blank-hint {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-primary);
        }
        .blank-sentence-text {
          font-size: 20px;
          font-weight: 600;
          line-height: 1.6;
          color: var(--text-primary);
        }
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .option-btn {
          background: var(--bg-card);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .option-btn:focus, .option-btn:focus-visible {
          outline: none;
        }
        @media (hover: hover) {
          .option-btn:hover:not(:disabled) {
            border-color: var(--accent-primary);
            background: var(--bg-card-hover);
            transform: translateY(-1px);
          }
        }
        .option-btn:active:not(:disabled) {
          border-color: var(--accent-primary);
          background: var(--bg-card-hover);
          transform: scale(0.98);
        }
        .option-label-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .option-text {
          flex: 1;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .option-btn.correct {
          background: rgba(16, 185, 129, 0.15);
          border-color: var(--accent-success);
        }
        .option-btn.correct .option-label-circle {
          background: var(--accent-success);
          color: white;
        }
        .option-btn.wrong {
          background: rgba(239, 68, 68, 0.15);
          border-color: var(--accent-error);
        }
        .option-btn.wrong .option-label-circle {
          background: var(--accent-error);
          color: white;
        }
        .option-btn.dimmed {
          opacity: 0.4;
        }
        .status-icon.success {
          color: var(--accent-success);
        }
        .status-icon.error {
          color: var(--accent-error);
        }
        .quiz-keyboard-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
