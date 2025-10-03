import React, { useState, useEffect } from 'react';
import { Topic, Level, User, TopicProgress, LessonContent, ComprehensivePractice, TaskItem } from '../types';
import { generateLessonContent, generateComprehensivePractice, checkUserAnswer } from '../services/geminiService';
import { Quiz } from './Quiz';

interface TopicViewProps {
  topic: Topic;
  level: Level;
  userProgress: TopicProgress | undefined;
  onUpdateProgress: (topicId: string, updatedProgress: TopicProgress) => void;
  onBack: () => void;
}

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Generating your lesson..."}) => (
    <div className="flex justify-center items-center flex-col p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg mt-4">{text}</p>
    </div>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

export const TopicView: React.FC<TopicViewProps> = ({ topic, level, userProgress, onUpdateProgress, onBack }) => {
    const [activeTab, setActiveTab] = useState<'lesson' | 'practice'>('lesson');
    const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
    const [practiceContent, setPracticeContent] = useState<ComprehensivePractice | null>(null);
    const [isLoading, setIsLoading] = useState({ lesson: true, practice: false });
    const [error, setError] = useState<string | null>(null);
    
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [taskFeedback, setTaskFeedback] = useState<Record<number, { text: string; loading: boolean; isCorrect?: boolean } | null>>({});

    const progress = userProgress || { completedVocabulary: [], completedSections: [] };
    
    useEffect(() => {
        const fetchLesson = async () => {
            setIsLoading({ lesson: true, practice: false });
            setError(null);
            try {
                const generatedContent = await generateLessonContent(level, topic);
                setLessonContent(generatedContent);
                if (!progress.completedSections.includes('lesson')) {
                     handleProgressUpdate({ completedSections: [...progress.completedSections, 'lesson'] });
                }
            } catch (err) {
                 setError(err instanceof Error ? err.message : "Failed to load lesson.");
            } finally {
                setIsLoading(prev => ({ ...prev, lesson: false }));
            }
        };
        fetchLesson();

        // Pre-load voices for text-to-speech, which can be initially empty.
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }, [level, topic]);

    const handleProgressUpdate = (updates: Partial<TopicProgress>) => {
        const newProgress = { ...progress, ...updates };
        onUpdateProgress(topic.id, newProgress);
    };

    const handleVocabToggle = (targetWord: string) => {
        const completed = progress.completedVocabulary || [];
        const newCompleted = completed.includes(targetWord)
            ? completed.filter(word => word !== targetWord)
            : [...completed, targetWord];
        handleProgressUpdate({ completedVocabulary: newCompleted });
    };

    const handlePlayPronunciation = (text: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering other click events on the parent.
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous speech
            
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            // Prefer a US English voice, but fall back to any English voice.
            const englishVoice = voices.find(voice => voice.lang === 'en-US') || voices.find(voice => voice.lang.startsWith('en'));

            utterance.voice = englishVoice || null;
            utterance.lang = englishVoice ? englishVoice.lang : 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else {
            // A simple fallback for browsers that don't support the API.
            alert("Sorry, your browser doesn't support text-to-speech functionality.");
        }
    };

    const handleGeneratePractice = async () => {
        if (isLoading.practice) return;
        
        setPracticeContent(null);
        setUserAnswers({});
        setTaskFeedback({});
        setIsLoading(prev => ({ ...prev, practice: true }));
        setError(null);
        
        try {
            const generatedContent = await generateComprehensivePractice(level, topic);
            setPracticeContent(generatedContent);
            if (!progress.completedSections.includes('practice')) {
                handleProgressUpdate({ completedSections: [...progress.completedSections, 'practice'] });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(prev => ({ ...prev, practice: false }));
        }
    };
    
    const handleCheckAnswer = async (taskIndex: number, task: TaskItem) => {
        const userAnswer = userAnswers[taskIndex];
        if (!userAnswer || !userAnswer.trim()) return;

        setTaskFeedback(prev => ({ ...prev, [taskIndex]: { text: '', loading: true } }));

        try {
            const { feedback, isCorrect } = await checkUserAnswer(task.instruction, task.prompt, task.suggestedAnswer, userAnswer);
            setTaskFeedback(prev => ({ ...prev, [taskIndex]: { text: feedback, loading: false, isCorrect } }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to get feedback.";
            setTaskFeedback(prev => ({ ...prev, [taskIndex]: { text: errorMessage, loading: false } }));
        }
    };

    const renderPracticeContent = () => {
        if (isLoading.practice) return <LoadingSpinner text={`Generating your practice session...`}/>;
        if (error) return <p className="text-red-500 text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">Error: {error}</p>;
        if (!practiceContent) return (
            <div className="text-center pt-16">
                 <p className="text-gray-500 dark:text-gray-400 mb-6">Generate a comprehensive practice session based on a reading text.</p>
                 <button 
                    onClick={handleGeneratePractice}
                    disabled={isLoading.practice}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400"
                >
                    Generate Practice
                </button>
            </div>
        );

        const { readingText, comprehensionQuiz, followUpTasks } = practiceContent;

        return (
            <div className="space-y-10">
                <div>
                    <h4 className="text-2xl font-bold mb-2 flex items-center"><span className="text-3xl mr-3">📚</span> Reading Text</h4>
                     <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">{readingText.title}</h5>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{readingText.content}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-2xl font-bold mb-4 flex items-center"><span className="text-3xl mr-3">✅</span> Comprehension Quiz</h4>
                    <Quiz questions={comprehensionQuiz} onComplete={() => {}} />
                </div>

                 <div>
                    <h4 className="text-2xl font-bold mb-4 flex items-center"><span className="text-3xl mr-3">✍️</span> Follow-up Tasks</h4>
                    <div className="space-y-4">
                        {followUpTasks?.map((item, index) => {
                            const feedback = taskFeedback[index];
                            const userAnswer = userAnswers[index] || '';
                            const isChecked = feedback && !feedback.loading;

                            return (
                                <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                                    <p className="font-semibold text-gray-500 dark:text-gray-400">{item.instruction}</p>
                                    <p className="text-lg my-2">{item.prompt}</p>
                                    <textarea
                                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition"
                                        rows={2}
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                                        placeholder="Type your answer here..."
                                        disabled={isChecked}
                                    />
                                    <button
                                        onClick={() => handleCheckAnswer(index, item)}
                                        disabled={!userAnswer.trim() || feedback?.loading || isChecked}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {feedback?.loading ? 'Checking...' : isChecked ? 'Checked' : 'Check Answer'}
                                    </button>
                                    {feedback && !feedback.loading && (
                                        <div className={`mt-4 p-3 rounded-lg border-l-4 ${feedback.isCorrect ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/50 dark:text-green-200 dark:border-green-400' : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:text-red-200 dark:border-red-400'}`}>
                                            <p className="font-bold">{feedback.isCorrect ? 'Correct!' : 'Needs Improvement'}</p>
                                            <p className="whitespace-pre-wrap">{feedback.text}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    }

    const renderLessonView = () => {
        if (isLoading.lesson) return <LoadingSpinner text="Generating your lesson..." />;
        if (error && !lessonContent) return <p className="text-red-500 text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">Error: {error}</p>;
        if (!lessonContent) return <p className="text-center text-gray-500">No lesson content available for this topic yet.</p>;

        const { explanation, examples, warnings, vocabulary } = lessonContent;

        return (
            <div className="space-y-10">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><span className="text-3xl mr-3">🎓</span> Explanation</h3>
                    <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <p className="whitespace-pre-wrap">{explanation.target}</p>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 italic border-t pt-4 border-gray-200 dark:border-gray-700 whitespace-pre-wrap">{explanation.native}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><span className="text-3xl mr-3">💡</span> Examples</h3>
                    <div className="space-y-4">
                        {examples.map((ex, index) => (
                            <div key={index} className="p-4 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg">
                                <p className="text-lg font-semibold">{ex.target}</p>
                                <p className="text-md text-gray-500 dark:text-gray-400">{ex.native}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center text-yellow-800 dark:text-yellow-200"><span className="text-3xl mr-3">⚠️</span> Warnings</h3>
                    <ul className="list-disc list-inside space-y-4 text-yellow-700 dark:text-yellow-300">
                        {warnings.map((warn, index) => (
                            <li key={index}>
                                <span>{warn.target}</span>
                                <span className="block text-sm italic opacity-80 mt-1">{warn.native}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h3 className="text-2xl font-bold mb-4 flex items-center"><span className="text-3xl mr-3">📖</span> Vocabulary</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {vocabulary.map((item) => (
                             <div key={item.target} className="flex items-start p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition group space-x-4">
                                <div 
                                    onClick={() => handleVocabToggle(item.target)}
                                    className={`w-6 h-6 rounded-md flex-shrink-0 mt-1 flex items-center justify-center border-2 cursor-pointer ${progress.completedVocabulary.includes(item.target) ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500'}`}
                                    aria-label={`Mark ${item.target} as learned`}
                                    role="checkbox"
                                    aria-checked={progress.completedVocabulary.includes(item.target)}
                                >
                                    {progress.completedVocabulary.includes(item.target) && <CheckIcon />}
                                </div>
                                
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3">
                                        <p className="text-lg font-semibold text-gray-800 dark:text-white">{item.target}</p>
                                        <button 
                                            onClick={(e) => handlePlayPronunciation(item.target, e)} 
                                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-400 transition-colors" 
                                            aria-label={`Listen to ${item.target}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="flex items-baseline space-x-2 text-md text-gray-500 dark:text-gray-400">
                                        {item.pronunciation && <p className="italic">[{item.pronunciation}]</p>}
                                        <p>{item.native}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderPracticeView = () => (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center"><span className="text-3xl mr-3">💪</span> Practice</h3>
                {practiceContent && (
                     <button 
                        onClick={handleGeneratePractice}
                        disabled={isLoading.practice}
                        className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 font-semibold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:bg-gray-400"
                    >
                        {isLoading.practice ? "Generating..." : "Regenerate Practice"}
                    </button>
                )}
            </div>
            
            <div className="min-h-[15rem]">
                {renderPracticeContent()}
            </div>
         </div>
    );

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <button onClick={onBack} className="mb-6 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow">
                &larr; Back to Topics
            </button>
            <div className="text-center mb-10">
                <h1 className="text-6xl font-bold mb-2">{topic.emoji}</h1>
                <h2 className="text-4xl font-bold text-gray-800 dark:text-white">{topic.title}</h2>
            </div>
            
             <div className="mb-8 flex justify-center border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveTab('lesson')} className={`px-6 py-3 font-semibold transition-colors duration-300 ${activeTab === 'lesson' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Lesson
                </button>
                <button onClick={() => setActiveTab('practice')} className={`px-6 py-3 font-semibold transition-colors duration-300 ${activeTab === 'practice' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    Practice
                </button>
            </div>

            <div>
                {activeTab === 'lesson' ? renderLessonView() : renderPracticeView()}
            </div>
        </div>
    );
};