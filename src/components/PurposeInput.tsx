
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import TranslatedText from './TranslatedText';

interface PurposeInputProps {
  onPurposeSubmit: (purpose: string) => void;
  scrollProgress: number;
  placeholder?: string; // Add custom placeholder prop
}

const PurposeInput = ({ onPurposeSubmit, scrollProgress, placeholder }: PurposeInputProps) => {
  const [purpose, setPurpose] = useState('');
  
  const handleSubmit = () => {
    onPurposeSubmit(purpose);
  };
  
  return (
    <div 
      id="purpose-input"
      className={cn(
        "bg-gradient-to-b from-amber-50/80 to-white dark:from-gray-900/90 dark:to-gray-950 min-h-[70vh] px-4 py-16 md:py-24 transition-colors duration-500",
        scrollProgress >= 0.95 ? "from-white to-white dark:from-gray-950 dark:to-gray-950" : ""
      )}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            <TranslatedText keyword="purposeInput.title">What's your business purpose?</TranslatedText>
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            <TranslatedText keyword="purposeInput.subtitle">
              Tell us about your business and we'll generate tailored content for you.
            </TranslatedText>
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={placeholder || "e.g. We are a sustainable fashion brand focused on eco-friendly materials and ethical manufacturing..."}
            className="w-full h-32 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200"
          />
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <TranslatedText keyword="purposeInput.minChars">
                {purpose.length}/20 characters minimum
              </TranslatedText>
            </p>
            <button
              onClick={handleSubmit}
              disabled={purpose.length < 20}
              className={cn(
                "px-6 py-2 rounded-full font-medium transition-all duration-200",
                purpose.length < 20
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              <TranslatedText keyword="purposeInput.submit">Generate Content</TranslatedText>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurposeInput;
