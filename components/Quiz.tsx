import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { ProgressBar } from './ProgressBar';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ questions, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions || questions.length === 0) {
    return <p className="text-center text-gray-500">No quiz questions available for this topic yet.</p>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  const handleAnswerSelect = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
        onComplete();
    }
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentQuestionIndex(prev => prev + 1);
  };
  
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
        <p className="text-xl mb-6">Your score: {score} out of {questions.length}</p>
        <button onClick={handleRestart} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
          Restart Quiz
        </button>
      </div>
    );
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div>
      <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
      <h3 className="text-xl font-semibold mb-6 text-center">{currentQuestion.question}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            let buttonClass = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
            if (showResult) {
                if (option === currentQuestion.correctAnswer) {
                    buttonClass = 'bg-green-500 text-white';
                } else if (isSelected) {
                    buttonClass = 'bg-red-500 text-white';
                }
            }
            return (
                <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`p-4 rounded-lg text-left transition w-full disabled:cursor-not-allowed ${buttonClass}`}
                >
                    {option}
                </button>
            )
        })}
      </div>
      {showResult && (
        <div className="mt-6 text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
          <p className={`font-bold text-lg ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isCorrect ? 'Correct!' : 'Incorrect.'}
          </p>
          {currentQuestion.explanation && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{currentQuestion.explanation}</p>}
          <button onClick={handleNext} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
            {currentQuestionIndex + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
};
