// Defines the proficiency levels for language learning.
export type Level = "A1" | "A2" | "B1" | "B2";

// Defines the types of content sections that can be completed.
export type ContentSectionType = 'lesson' | 'practice'; 

// Represents a user's progress on a specific topic.
export interface TopicProgress {
  completedVocabulary: string[]; // Array of completed target words
  completedSections: ContentSectionType[];
}

// Represents the user's overall progress across all topics.
export type Progress = Record<string, TopicProgress>;

// Represents a single exam attempt.
export interface ExamResult {
    date: string; // ISO string format
    score: number;
    total: number;
}

// Represents a user of the application.
export interface User {
  name: string;
  level: Level;
  avatar?: string;
  progress: Progress;
  examHistory?: ExamResult[];
}

// Represents a single learning topic.
export interface Topic {
  id: string;
  title: string;
  emoji: string;
}

// Represents a single question in a quiz.
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  type: 'multiple-choice';
}

// Represents a single vocabulary item.
export interface VocabularyItem {
  target: string; // English
  native: string; // Kazakh
  pronunciation?: string;
}

// Represents a single interactive task for the user.
export interface TaskItem {
  instruction: string; // e.g., "Translate this sentence"
  prompt: string; // e.g., "Мен кітап оқып отырмын."
  suggestedAnswer: string; // e.g., "I am reading a book."
}

// Represents a single text for reading comprehension.
export interface TextItem {
    title: string;
    content: string; // A paragraph of text
}

// Represents a single example sentence in a lesson.
export interface LessonExample {
  target: string; // English sentence
  native: string; // Kazakh translation
}

// Represents the full content for a single lesson.
export interface LessonContent {
  explanation: {
    target: string; // English explanation
    native: string; // Kazakh translation
  };
  examples: LessonExample[];
  warnings: {
    target: string; // English warning
    native: string; // Kazakh translation
  }[];
  vocabulary: VocabularyItem[];
}


// A container for the comprehensive practice session based on a text.
export interface ComprehensivePractice {
    readingText: TextItem;
    comprehensionQuiz: QuizQuestion[];
    followUpTasks: TaskItem[];
}
