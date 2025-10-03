import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../types';
import { generateExam } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';

interface ExamViewProps {
  onBack: () => void;
  onSaveResult: (result: { score: number; total: number; }) => void;
}

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Generating your exam..."}) => (
    <div className="flex justify-center items-center flex-col p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg mt-4">{text}</p>
    </div>
);

const EXAM_DURATION = 30 * 60; // 30 minutes in seconds

export const ExamView: React.FC<ExamViewProps> = ({ onBack, onSaveResult }) => {
    const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [examStarted, setExamStarted] = useState(false);
    const [examFinished, setExamFinished] = useState(false);
    
    const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>([]);
    
    useEffect(() => {
        const fetchExam = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const examQuestions = await generateExam();
                setQuestions(examQuestions);
                setAnswers(new Array(examQuestions.length).fill(null));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load exam.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchExam();
    }, []);

    const calculateScore = useCallback(() => {
        if (!questions) return 0;
        return answers.reduce((score, answer, index) => {
            if (answer === questions[index].correctAnswer) {
                return score + 1;
            }
            return score;
        }, 0);
    }, [answers, questions]);

    const finishExam = useCallback(() => {
        setExamFinished(true);
        setExamStarted(false);
        if (questions) {
            onSaveResult({ score: calculateScore(), total: questions.length });
        }
    }, [onSaveResult, questions, calculateScore]);

    useEffect(() => {
        if (!examStarted || examFinished) return;
        
        if (timeLeft <= 0) {
            finishExam();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [examStarted, timeLeft, examFinished, finishExam]);

    const handleAnswerSelect = (option: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = option;
        setAnswers(newAnswers);
    };
    
    const handleNext = () => {
        if (questions && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    if (isLoading) return <LoadingSpinner text="Preparing your exam questions..." />;
    if (error) return <p className="text-red-500 text-center p-4">Error: {error}</p>;
    if (!questions) return <p className="text-center">No exam questions available.</p>;

    if (!examStarted) {
        return (
            <div className="container mx-auto p-4 max-w-2xl text-center">
                 <div className="pt-24">
                    <h1 className="text-4xl font-bold mb-4">Placement Exam</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">You will have 30 minutes to answer 25 questions.</p>
                    <button onClick={() => setExamStarted(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-xl">
                        Start Exam
                    </button>
                    <button onClick={onBack} className="block mx-auto mt-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }
    
    if (examFinished) {
         const score = calculateScore();
         return (
             <div className="container mx-auto p-4 max-w-2xl text-center pt-24">
                 <h1 className="text-4xl font-bold mb-4">Exam Finished!</h1>
                 <p className="text-2xl mb-6">Your score: <span className="font-bold text-blue-500">{score}</span> out of {questions.length}</p>
                  <p className="text-lg mb-8">{score > 20 ? "Excellent!" : score > 15 ? "Good job!" : "Keep practicing!"}</p>
                 <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                    Back to Dashboard
                </button>
             </div>
         )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="container mx-auto p-4 max-w-2xl pt-24">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Placement Exam</h2>
                    <div className={`text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                    </div>
                </div>

                <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
                <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
                <div className="grid grid-cols-1 gap-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={`p-4 rounded-lg text-left transition w-full text-lg ${answers[currentQuestionIndex] === option ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg disabled:opacity-50">Previous</button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={finishExam} className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg">Finish Exam</button>
                    ) : (
                        <button onClick={handleNext} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg">Next</button>
                    )}
                </div>
            </div>
        </div>
    );
};
