
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface OptionButton {
  id: number;
  text: string;
  defaultText: string;
}

interface PurposeInputProps {
  onPurposeSubmit: (purpose: string) => void;
  scrollProgress?: number;
  placeholder?: string;
  interactiveTitle?: string;
  interactiveSubtitle?: string;
  submitButtonText?: string;
  optionButtons?: OptionButton[];
}

const PurposeInput = ({ 
  onPurposeSubmit, 
  scrollProgress = 0, 
  placeholder,
  interactiveTitle,
  interactiveSubtitle,
  submitButtonText,
  optionButtons
}: PurposeInputProps) => {
  const [purpose, setPurpose] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // If the user clicks on a predefined button
  const handleOptionClick = (defaultText: string) => {
    setPurpose(defaultText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Focus the input when the component first renders
  useEffect(() => {
    if (scrollProgress > 0.8) {
      inputRef.current?.focus();
    }
  }, [scrollProgress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purpose.trim()) {
      onPurposeSubmit(purpose);
    }
  };

  const scale = scrollProgress < 0.1 ? 0.8 : 1;
  const opacity = scrollProgress < 0.1 ? 0 : 1;

  return (
    <div id="purpose-input" className="min-h-screen flex flex-col items-center justify-start pt-32 pb-32 px-6 bg-beige-50">
      <motion.div 
        className="w-full max-w-3xl"
        style={{ 
          scale, 
          opacity,
          transition: 'all 0.3s ease'
        }}
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-3">
            {interactiveTitle || "How Can I Help You Today?"}
          </h2>
          <p className="text-lg text-beige-700">
            {interactiveSubtitle || "Select a purpose or enter your own to see the most relevant information."}
          </p>
        </div>

        {optionButtons && optionButtons.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {optionButtons.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="border-beige-300 hover:border-beige-500 hover:bg-beige-100 text-beige-800"
                onClick={() => handleOptionClick(option.defaultText)}
              >
                {option.text}
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div 
            className={`bg-white rounded-lg shadow-lg p-2 transition-all ${
              isFocused ? 'ring-2 ring-beige-400 shadow-xl' : ''
            }`}
          >
            <textarea
              ref={inputRef}
              className="w-full p-4 text-lg text-beige-900 resize-none outline-none min-h-[120px] bg-transparent"
              placeholder={placeholder || "Tell me why you're visiting this website..."}
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoComplete="off"
            />
          </div>
          <div className="text-center">
            <Button
              type="submit"
              size="lg"
              className="bg-beige-800 hover:bg-beige-900 text-white px-12 py-6 text-lg h-auto"
            >
              {submitButtonText || "Submit"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PurposeInput;
