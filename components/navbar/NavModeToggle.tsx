import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface NavModeToggleProps {
    mode: 'directory' | 'rental';
    setMode: (mode: 'directory' | 'rental') => void;
}

export const NavModeToggle: React.FC<NavModeToggleProps> = ({ mode, setMode }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleModeSwitch = (newMode: 'directory' | 'rental') => {
        setMode(newMode);
        if (newMode === 'rental') {
            navigate('/services');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="grid grid-cols-2 items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-1 border border-slate-200 dark:border-slate-700/50 relative ml-2 sm:ml-4">
            <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded-full shadow-sm transition-all duration-300 ease-in-out ${
                    mode === 'directory' ? 'left-1' : 'left-[50%]'
                }`}
            />

            <button
                onClick={() => handleModeSwitch('directory')}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer z-10 w-full text-center ${
                    mode === 'directory'
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                {t('nav.directory') || 'Directory'}
            </button>
            <button
                onClick={() => handleModeSwitch('rental')}
                className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer z-10 w-full text-center ${
                    mode === 'rental'
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                {t('nav.rentals') || 'Rentals'}
            </button>
        </div>
    );
};
