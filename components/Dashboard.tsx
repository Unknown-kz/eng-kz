import React from 'react';
import { User, Topic, Level } from '../types';
import { LEVELS } from '../constants';

interface DashboardProps {
  user: User;
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onLevelChange: (level: Level) => void;
  onStartExam: () => void;
}

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export const Dashboard: React.FC<DashboardProps> = ({ user, topics, onSelectTopic, onLevelChange, onStartExam }) => {
  
  const isTopicComplete = (topicId: string) => {
    const topicProgress = user.progress[topicId];
    if (!topicProgress) return false;
    // A topic is complete if both the lesson and the practice have been done.
    return topicProgress.completedSections.includes('lesson') && topicProgress.completedSections.includes('practice');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl pt-24">
       <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Welcome, {user.name}!</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Let's continue your learning journey.</p>
      </div>

      <div className="my-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
        <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
                <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Change Your Learning Level</h2>
                <div className="flex flex-wrap gap-2">
                    {LEVELS.map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => onLevelChange(lvl)}
                            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${user.level === lvl ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600'}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>
            <div className="text-right">
                 <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Test Your Knowledge</h2>
                 <button 
                    onClick={onStartExam}
                    className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-transform transform hover:scale-105 shadow-md"
                >
                    Take Placement Exam
                </button>
            </div>
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Topics for Level {user.level}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              {isTopicComplete(topic.id) && (
                <div className="absolute top-2 right-2">
                  <CheckCircleIcon />
                </div>
              )}
              <span className="text-5xl mb-4">{topic.emoji}</span>
              <h3 className="font-semibold text-gray-800 dark:text-white">{topic.title}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
