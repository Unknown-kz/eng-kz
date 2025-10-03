import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { TopicView } from './components/TopicView';
import { AccountView } from './components/AccountView';
import { ExamView } from './components/ExamView';
import { Header } from './components/Header';
import { User, Topic, Level, TopicProgress } from './types';
import { curriculum } from './data/curriculum';

type View = 'welcome' | 'dashboard' | 'topic' | 'account' | 'exam';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const persistUserUpdate = (updatedUser: User) => {
    try {
        const accounts = JSON.parse(localStorage.getItem('english-learner-accounts') || '{}');
        if (accounts[updatedUser.name]) {
            accounts[updatedUser.name].data = updatedUser;
            localStorage.setItem('english-learner-accounts', JSON.stringify(accounts));
        }
    } catch (error) {
        console.error("Failed to persist user update:", error);
    }
  };

  const handleSignUp = async (newUser: Omit<User, 'progress' | 'examHistory'>, pass: string) => {
    const accounts = JSON.parse(localStorage.getItem('english-learner-accounts') || '{}');
    if (accounts[newUser.name]) {
        throw new Error('Username already exists. Please choose another one or login.');
    }
    const userWithProgress: User = { ...newUser, progress: {}, examHistory: [] };
    accounts[newUser.name] = {
        password: btoa(pass), // Simple base64 encoding for the password
        data: userWithProgress
    };
    localStorage.setItem('english-learner-accounts', JSON.stringify(accounts));
    setUser(userWithProgress);
    setCurrentView('dashboard');
  };

  const handleLogin = async (name: string, pass: string) => {
    const accounts = JSON.parse(localStorage.getItem('english-learner-accounts') || '{}');
    const account = accounts[name];
    if (!account) {
        throw new Error('User not found. Please check your username or sign up.');
    }
    if (atob(account.password) !== pass) {
        throw new Error('Incorrect password.');
    }
    setUser(account.data);
    setCurrentView('dashboard');
  };
  
  const handleLogout = () => {
    setUser(null);
    setCurrentView('welcome');
  }

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('topic');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedTopic(null);
  };
  
  const handleLevelChange = (newLevel: Level) => {
    if (user) {
        const updatedUser = { ...user, level: newLevel };
        setUser(updatedUser);
        persistUserUpdate(updatedUser);
    }
  }

  const handleGoToAccount = () => setCurrentView('account');
  const handleStartExam = () => setCurrentView('exam');
  
  const handleProgressUpdate = (topicId: string, updatedProgress: TopicProgress) => {
      if (user) {
          const updatedUser = {
              ...user,
              progress: {
                  ...user.progress,
                  [topicId]: updatedProgress,
              },
          };
          setUser(updatedUser);
          persistUserUpdate(updatedUser);
      }
  }

  const handleSaveExamResult = (result: { score: number, total: number }) => {
    if (user) {
        const newResult = { ...result, date: new Date().toISOString() };
        const updatedUser = { 
            ...user, 
            examHistory: [...(user.examHistory || []), newResult]
        };
        setUser(updatedUser);
        persistUserUpdate(updatedUser);
    }
  }

  const renderContent = () => {
    if (!user || currentView === 'welcome') {
      return <WelcomeScreen onSignUp={handleSignUp} onLogin={handleLogin} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            topics={curriculum[user.level]}
            onSelectTopic={handleSelectTopic}
            onLevelChange={handleLevelChange}
            onStartExam={handleStartExam}
          />
        );
      case 'topic':
        if (selectedTopic && user) {
          return (
            <TopicView
              topic={selectedTopic}
              level={user.level}
              userProgress={user.progress[selectedTopic.id]}
              onUpdateProgress={handleProgressUpdate}
              onBack={handleBackToDashboard}
            />
          );
        }
        // Fallback to dashboard if something is wrong
        handleBackToDashboard();
        return null;
      case 'account':
        return <AccountView user={user} onBack={handleBackToDashboard} />;
      case 'exam':
        return <ExamView onBack={handleBackToDashboard} onSaveResult={handleSaveExamResult} />;
      default:
        return <WelcomeScreen onSignUp={handleSignUp} onLogin={handleLogin} />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 font-sans">
        {user && currentView !== 'welcome' && (
            <Header user={user} onLogout={handleLogout} onGoToAccount={handleGoToAccount} />
        )}
        <main>{renderContent()}</main>
    </div>
  );
};

export default App;