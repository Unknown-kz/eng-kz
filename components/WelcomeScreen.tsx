import React, { useState, useRef } from 'react';
import { User } from '../types';

interface WelcomeScreenProps {
  onLogin: (name: string, pass: string) => Promise<void>;
  onSignUp: (user: Omit<User, 'progress' | 'examHistory'>, pass: string) => Promise<void>;
}

const UserPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
    </svg>
);


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onSignUp }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleModeToggle = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError(null);
    setName('');
    setPassword('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !password.trim()) {
        setError("Username and password are required.");
        return;
    }
    
    setIsLoading(true);
    try {
        if (mode === 'login') {
            await onLogin(name, password);
        } else {
            await onSignUp({ name, level: 'A1', avatar }, password);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Aǵylshyn Tili Úiren!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
             {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
             <div className="flex justify-center">
                <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                ref={fileInputRef}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                    {avatar ? (
                        <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <UserPlusIcon />
                    )}
                </button>
            </div>
          )}

          <div>
            <label htmlFor="name" className="sr-only">Username</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Username"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-lg text-gray-800 dark:text-gray-200 outline-none transition duration-300"
              required
            />
          </div>
           <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 rounded-lg text-gray-800 dark:text-gray-200 outline-none transition duration-300"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading || !name.trim() || !password.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
         <p className="text-center mt-6 text-sm">
            <button onClick={handleModeToggle} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                 {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
        </p>
      </div>
    </div>
  );
};