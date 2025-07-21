import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
    const { lang, setLang, t } = useLanguage();

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('language')}</label>
            <div className="flex w-full rounded-lg bg-gray-800/60 p-1 border border-white/20">
                <button
                    onClick={() => setLang('en')}
                    className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'}`}
                >
                    English
                </button>
                <button
                    onClick={() => setLang('fa')}
                    className={`w-1/2 px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 ${lang === 'fa' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'}`}
                >
                    فارسی
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
