
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import WaveTransition from "./WaveTransition";
import FloatingShapes from "./FloatingShapes";
import { semanticSearch } from "@/services/adminService";
import { SearchCache } from "@/utils/searchCache";

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
    <div id="purpose-input" className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-32 px-6 bg-beige-50 overflow-hidden">
      {/* Top Wave Transition */}
      <WaveTransition scrollProgress={scrollProgress} position="top" color="fill-beige-100" />
      
      {/* Floating animated shapes */}
      <div className="absolute top-[100px] left-0 w-full">
        <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" opacity={0.3} /> 
      </div>
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-beige-100 z-0 opacity-20"></div>

      <motion.div 
        className="relative w-full max-w-3xl z-10"
        style={{ 
          scale, 
          opacity,
          transition: 'all 0.3s ease'
        }}
      >
        <div className="text-center mb-10 animate-fade-up">
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
      
      {/* Bottom Wave Transition */}
      <WaveTransition scrollProgress={scrollProgress} position="bottom" color="fill-beige-50" />
    </div>
  );
};

export default PurposeInput;
