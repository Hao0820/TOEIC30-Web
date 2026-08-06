import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import { FlashcardView } from './components/Flashcard/FlashcardView';
import { WordListModal } from './components/Flashcard/WordListModal';
import { QuizHomeView } from './components/Quiz/QuizHomeView';
import { FullScreenQuizView } from './components/Quiz/FullScreenQuizView';
import { FavoritesView } from './components/Profile/FavoritesView';
import { MistakeBookView } from './components/Profile/MistakeBookView';
import { ProfileView } from './components/Profile/ProfileView';
import { AuthModal } from './components/Auth/AuthModal';

const MainContent: React.FC = () => {
  const { activeTab, activeQuizQuestions, isAuthModalOpen, closeAuthModal } = useApp();
  const [isWordListOpen, setIsWordListOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <Navbar onOpenSearch={() => setIsWordListOpen(true)} />

      {/* Main Tab Content */}
      <main className="main-content-area">
        {activeTab === 'vocabulary' && (
          <FlashcardView onOpenWordList={() => setIsWordListOpen(true)} />
        )}
        {activeTab === 'quiz' && <QuizHomeView />}
        {activeTab === 'favorites' && <FavoritesView />}
        {activeTab === 'mistakes' && <MistakeBookView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Tab Bar */}
      <TabBar />

      {/* Word List / Search Modal */}
      <WordListModal
        isOpen={isWordListOpen}
        onClose={() => setIsWordListOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* Fullscreen Quiz Overlay */}
      {activeQuizQuestions && <FullScreenQuizView />}

      <style>{`
        .app-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .main-content-area {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
