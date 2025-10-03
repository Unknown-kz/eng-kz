import { GoogleGenAI, Type } from "@google/genai";
import { Level, Topic, ComprehensivePractice, LessonContent, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const lessonSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { 
            type: Type.OBJECT,
            description: "A detailed explanation of the grammar topic in English, with a Kazakh translation.",
            properties: {
                target: { type: Type.STRING, description: "The explanation in English." },
                native: { type: Type.STRING, description: "The Kazakh translation of the explanation." }
            },
            required: ['target', 'native']
        },
        examples: {
            type: Type.ARRAY,
            description: "10 to 15 practical examples sentences demonstrating the topic in various situations.",
            items: {
                type: Type.OBJECT,
                properties: {
                    target: { type: Type.STRING, description: "The example sentence in English." },
                    native: { type: Type.STRING, description: "The Kazakh translation of the sentence." }
                },
                required: ['target', 'native']
            }
        },
        warnings: {
            type: Type.ARRAY,
            description: "Common mistakes or important warnings for learners regarding this topic, each with an English target and Kazakh native translation.",
            items: {
                type: Type.OBJECT,
                properties: {
                    target: { type: Type.STRING, description: "The warning message in English." },
                    native: { type: Type.STRING, description: "The Kazakh translation of the warning." }
                },
                required: ['target', 'native']
            }
        },
        vocabulary: {
            type: Type.ARRAY,
            description: "A list of 30 essential vocabulary words from the lesson.",
            items: {
                type: Type.OBJECT,
                properties: {
                    target: { type: Type.STRING, description: "The vocabulary word in English." },
                    native: { type: Type.STRING, description: "The Kazakh translation." },
                    pronunciation: { type: Type.STRING, description: "Phonetic pronunciation for the English word, using IPA format." }
                },
                required: ['target', 'native', 'pronunciation']
            }
        }
    },
    required: ['explanation', 'examples', 'warnings', 'vocabulary']
};

export const generateLessonContent = async (level: Level, topic: Topic): Promise<LessonContent> => {
    const cacheKey = `lesson-${level}-${topic.id}`;
    try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (e) {
        console.error("Could not retrieve from cache", e);
    }

    // A simple check for grammar topics to provide more detailed explanations
    const grammarKeywords = ['tense', 'perfect', 'continuous', 'modal', 'conditional', 'gerund', 'infinitive', 'passive', 'reported', 'adjectives', 'adverbs', 'clauses', 'prepositions', 'conjunctions', 'subjunctive', 'inversion', 'imperatives'];
    const isGrammarTopic = grammarKeywords.some(keyword => topic.title.toLowerCase().includes(keyword));

    const grammarExplanationInstruction = isGrammarTopic 
        ? "The 'explanation' should be exceptionally detailed, covering the rules of usage, how to form the grammatical structure (e.g., formula for verb tenses), and when to use it, with both an English 'target' and its Kazakh 'native' translation."
        : "A clear 'explanation' of the topic, with both an English 'target' and its Kazakh 'native' translation.";

    const prompt = `Generate a detailed English lesson for a ${level} level Kazakh-speaking learner on the topic "${topic.title}". The lesson must include:
1. ${grammarExplanationInstruction}
2. A list of 10 to 15 practical 'examples' in various contexts, with both the English sentence ('target') and its Kazakh translation ('native').
3. A list of 'warnings' about common mistakes, with each warning having an English 'target' and its Kazakh 'native' translation.
4. A list of 30 essential 'vocabulary' words related to the lesson, with English ('target'), Kazakh ('native'), and phonetic 'pronunciation' (using IPA format).
Provide the output in a single JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: lessonSchema
            }
        });
        
        const jsonStr = response.text.trim();
        const content = JSON.parse(jsonStr) as LessonContent;

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(content));
        } catch (e) {
            console.error("Could not save to cache", e);
        }

        return content;
    } catch (error) {
        console.error(`Error generating lesson content for topic ${topic.title}:`, error);
        throw new Error(`Failed to generate the lesson. Please try again.`);
    }
};

const comprehensivePracticeSchema = {
    type: Type.OBJECT,
    properties: {
        readingText: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
            },
            required: ['title', 'content']
        },
        comprehensionQuiz: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['multiple-choice'] }
                },
                required: ['question', 'options', 'correctAnswer', 'type']
            }
        },
        followUpTasks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    instruction: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    suggestedAnswer: { type: Type.STRING }
                },
                required: ['instruction', 'prompt', 'suggestedAnswer']
            }
        }
    },
    required: ['readingText', 'comprehensionQuiz', 'followUpTasks']
};


export const generateComprehensivePractice = async (level: Level, topic: Topic): Promise<ComprehensivePractice> => {
    const cacheKey = `comprehensive-practice-${level}-${topic.id}`;
     try {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (e) {
        console.error("Could not retrieve from cache", e);
    }

    const prompt = `Generate a comprehensive practice session in ENGLISH for a ${level} level Kazakh-speaking learner on the topic "${topic.title}". The session must be based on a single reading text. All generated content (titles, text, questions, options, tasks) must be in ENGLISH. The output should be a JSON object containing:
1. 'readingText': A single text object with a 'title' and 'content' in English, appropriate for the level (the text should be substantial, around 100-250 words depending on the level).
2. 'comprehensionQuiz': An array of 5 multiple-choice questions in English based *only* on the content of the reading text.
3. 'followUpTasks': An array of 20 "complete the sentence" style tasks in English based on the text or topic. The 'instruction' for each task should be "Complete the sentence:", the 'prompt' should be the sentence with a blank space (e.g., using '...'), and the 'suggestedAnswer' should be the word or phrase that correctly completes the sentence.
Provide the output in a single JSON object.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: comprehensivePracticeSchema
            }
        });

        const jsonStr = response.text.trim();
        const parsedContent = JSON.parse(jsonStr) as ComprehensivePractice;

        try {
            sessionStorage.setItem(cacheKey, JSON.stringify(parsedContent));
        } catch (e) {
            console.error("Could not save to cache", e);
        }

        return parsedContent;
    } catch (error) {
        console.error(`Error generating comprehensive practice for topic ${topic.title}:`, error);
        throw new Error(`Failed to generate practice session. Please try again.`);
    }
};

export const generateExam = async (): Promise<QuizQuestion[]> => {
    const prompt = `Generate a 25-question mixed-level English proficiency exam suitable for learners from A1 to B2. The questions should cover a variety of grammar and vocabulary topics from all levels. All questions, options, and explanations must be in ENGLISH. All questions must be multiple-choice with 4 options each. Include the correct answer and a brief explanation for each question. The type for each question should be 'multiple-choice'. Provide JSON output as an array of questions.`;

    const quizSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['multiple-choice'] }
            },
            required: ['question', 'options', 'correctAnswer', 'type']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: quizSchema
                    },
                    required: ['quiz']
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const parsedContent = JSON.parse(jsonStr);
        return parsedContent.quiz as QuizQuestion[];

    } catch (error) {
        console.error(`Error generating exam:`, error);
        throw new Error(`Failed to generate the exam. Please try again.`);
    }
};

export const checkUserAnswer = async (instruction: string, prompt: string, suggestedAnswer: string, userAnswer: string): Promise<{ feedback: string, isCorrect: boolean }> => {
    const apiPrompt = `You are an English teacher evaluating a Kazakh-speaking student's answer.
The task was: "${instruction}"
The specific prompt was: "${prompt}"
A correct answer could be: "${suggestedAnswer}"
The student's answer is: "${userAnswer}"

First, determine if the student's answer is correct. The answer doesn't have to be an exact match to the suggested answer, but it must be grammatically correct and accurately fulfill the prompt's instruction.
Second, provide a concise explanation for your evaluation in KAZAKH.
- If the answer is correct, praise the student in KAZAKH and briefly explain why it is correct.
- If the answer is incorrect, gently point out the mistakes and explain how to fix them in KAZAKH.

Return a JSON object with two keys:
1. 'isCorrect': a boolean value (true if the answer is correct, false otherwise).
2. 'feedback': a string containing your explanation in KAZAKH.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN, description: "Whether the user's answer is fundamentally correct." },
            feedback: { type: Type.STRING, description: "Constructive feedback and explanation for the user in Kazakh." }
        },
        required: ['isCorrect', 'feedback']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: apiPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr) as { feedback: string, isCorrect: boolean };

        // Ensure feedback is always in Kazakh, regardless of correctness
        const feedbackPromptKazakh = `Please provide the following feedback entirely in Kazakh: "${result.feedback}"`;
        if (result.isCorrect) {
             const correctResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `The student's answer "${userAnswer}" for the task "${prompt}" was correct. Provide positive feedback and a brief explanation in KAZAKH.`
             });
             result.feedback = correctResponse.text;
        } else {
             const improvementResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `The student's answer "${userAnswer}" for the task "${prompt}" needs improvement. The suggested correct answer is "${suggestedAnswer}". Provide a gentle explanation of the mistake in KAZAKH.`
             });
             result.feedback = improvementResponse.text;
        }

        return result;

    } catch (error) {
        console.error(`Error checking user answer:`, error);
        throw new Error(`Failed to get feedback. Please try again.`);
    }
};