import React, { useState } from 'react';
import { CountryInfo } from '../types';

interface IpInputFormProps {
  onAdd: (rawInput: string, countryIso: string) => void;
  isLoading: boolean;
  countries: CountryInfo[];
}

const IpInputForm: React.FC<IpInputFormProps> = ({ onAdd, isLoading, countries }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && selectedCountry) {
      onAdd(inputValue, selectedCountry);
      setInputValue('');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row-reverse gap-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="آدرس‌های IP یا محدوده‌های CIDR را وارد کنید...&#10;مثال: 8.8.8.8&#10;1.1.1.1&#10;2001:4860:4860::8888"
            className="w-full h-32 sm:h-24 flex-grow bg-black/30 text-gray-200 placeholder-gray-500 border border-white/20 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-y text-right"
            disabled={isLoading}
          />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full sm:w-64 bg-gray-900/70 text-gray-200 border border-white/20 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
            style={{ colorScheme: 'dark' }}
            disabled={isLoading}
          >
            <option value="" disabled>یک کشور انتخاب کنید</option>
            {countries.map(country => (
              <option 
                key={country.iso} 
                value={country.iso}
                className="bg-gray-800 text-white font-sans"
              >
                {country.name} {country.emoji}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim() || !selectedCountry}
          className="w-full px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : 'افزودن آدرس‌ها'}
        </button>
      </form>
    </div>
  );
};

export default IpInputForm;