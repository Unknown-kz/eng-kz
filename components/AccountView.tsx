import React from 'react';
// FIX: Import TopicProgress to correctly type user progress data.
import { User, TopicProgress } from '../types';
import { curriculum } from '../data/curriculum';

interface AccountViewProps {
  user: User;
  onBack: () => void;
}

const DefaultAvatar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

export const AccountView: React.FC<AccountViewProps> = ({ user, onBack }) => {
    const allTopics = Object.values(curriculum).flat();
    const topicMap = new Map(allTopics.map(t => [t.id, t]));

    const completedVocabularyByTopic = Object.entries(user.progress)
        .map(([topicId, progress]) => ({
            topic: topicMap.get(topicId),
            // FIX: Cast `progress` to `TopicProgress` to access `completedVocabulary`.
            vocabulary: (progress as TopicProgress).completedVocabulary
        }))
        .filter(item => item.topic && item.vocabulary.length > 0);

    const completedTopics = Object.entries(user.progress)
        // FIX: Cast `progress` to `TopicProgress` to access `completedSections`.
        .filter(([, progress]) => (progress as TopicProgress).completedSections.length > 0)
        .map(([topicId]) => topicMap.get(topicId))
        .filter(Boolean);

    return (
        <div className="container mx-auto p-4 max-w-4xl pt-24">
            <button onClick={onBack} className="mb-6 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow">
                &larr; Back to Dashboard
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
                 <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800">
                            {user.avatar ? (
                            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                            <DefaultAvatar />
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400">Level: <span className="font-semibold text-blue-500">{user.level}</span></p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Completed Topics ({completedTopics.length})</h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {completedTopics.length > 0 ? completedTopics.map(topic => (
                             <div key={topic.id} className="flex items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <span className="text-2xl mr-4">{topic.emoji}</span>
                                <span className="font-semibold">{topic.title}</span>
                             </div>
                        )) : <p className="text-gray-500">No topics completed yet. Keep learning!</p>}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Learned Vocabulary</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {completedVocabularyByTopic.length > 0 ? completedVocabularyByTopic.map(({ topic, vocabulary }) => (
                            <details key={topic.id} className="group">
                                <summary className="font-semibold cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex justify-between items-center">
                                    <span>{topic.emoji} {topic.title}</span>
                                    <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold px-2 py-1 rounded-full">{vocabulary.length} words</span>
                                </summary>
                                <ul className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                                    {vocabulary.map(word => <li key={word} className="text-gray-600 dark:text-gray-300">{word}</li>)}
                                </ul>
                            </details>
                        )) : <p className="text-gray-500">No vocabulary marked as learned yet.</p>}
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Exam History</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {user.examHistory && user.examHistory.length > 0 ? (
                        [...user.examHistory].reverse().map((exam, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {new Date(exam.date).toLocaleString()}
                                </span>
                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                    {exam.score} / {exam.total}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No exam attempts recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
