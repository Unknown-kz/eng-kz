import React, { useState, useEffect, useRef } from 'react';
import { User, Level, ContentSectionType } from '../types';
import { curriculum } from '../data/curriculum';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onGoToAccount: () => void;
}

const DefaultAvatar = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const AccountIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onGoToAccount }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const calculateProgress = (level: Level, progress: User['progress']) => {
        const topicsForLevel = curriculum[level];
        if (!topicsForLevel || topicsForLevel.length === 0) return 0;

        const sectionTypes: ContentSectionType[] = ['lesson', 'practice'];
        const totalPossibleSections = topicsForLevel.length * sectionTypes.length;

        let totalCompletedSections = 0;
        topicsForLevel.forEach(topic => {
            const topicProgress = progress[topic.id];
            if (topicProgress) {
                totalCompletedSections += topicProgress.completedSections.length;
            }
        });
      
        if (totalPossibleSections === 0) return 0;
        return Math.round((totalCompletedSections / totalPossibleSections) * 100);
    };

    const isTopicComplete = (topicId: string, progress: User['progress']) => {
        const topicProgress = progress[topicId];
        if (!topicProgress) return false;
        return topicProgress.completedSections.includes('lesson') && topicProgress.completedSections.includes('practice');
    };
    
    const topicsForLevel = curriculum[user.level];
    const completedTopicsCount = topicsForLevel.filter(topic => isTopicComplete(topic.id, user.progress)).length;
    const totalTopicsForLevel = topicsForLevel.length;
    const progressPercentage = calculateProgress(user.level, user.progress);

    return (
        <div className="fixed top-6 right-6 z-50">
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-950 shadow-lg hover:ring-blue-500 transition-all duration-300"
                    aria-label="User menu"
                >
                     {user.avatar ? (
                        <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <DefaultAvatar />
                    )}
                </button>
                
                {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all origin-top-right animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                             <h2 className="font-bold text-lg text-gray-800 dark:text-white">Hi, {user.name}!</h2>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Current Level: <span className="font-semibold text-blue-500">{user.level}</span></p>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">My Progress ({user.level})</h3>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Completion</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{completedTopicsCount} of {totalTopicsForLevel} topics completed.</p>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => { onGoToAccount(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center space-x-3 transition-colors text-gray-700 dark:text-gray-200">
                                <AccountIcon />
                                <span>View My Account</span>
                            </button>
                            <button onClick={onLogout} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center space-x-3 transition-colors text-red-600 dark:text-red-400">
                                <LogoutIcon />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};