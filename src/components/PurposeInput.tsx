
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import WaveTransition from "./WaveTransition";
import FloatingShapes from "./FloatingShapes";

interface PurposeOption {
  id: string;
  buttonText: string;
  inputContent: string;
}

interface PurposeInputProps {
  onPurposeSubmit: (purpose: string) => void;
  scrollProgress: number;
}

const purposeOptions: PurposeOption[] = [
  {
    id: "hr-candidate",
    buttonText: "HR, Seek Candidate",
    inputContent: "I'm an HR professional in [___] field company, seeking an AI Product Manager expert in the latest technology"
  },
  {
    id: "owner-consultant",
    buttonText: "Company Owner, Seek Consultant",
    inputContent: "I'm a company owner, I'm seeking a consultant to help with AI implementation and team training"
  },
  {
    id: "owner-product",
    buttonText: "Company Owner, Seek Product Expert",
    inputContent: "I'm a company owner, I'm seeking a product expert to collaborate on a business"
  },
  {
    id: "designer-portfolio",
    buttonText: "Designer, Seek Portfolio Reference",
    inputContent: "I'm a website designer, I'm seeking an example portfolio website"
  },
  {
    id: "architect-reference",
    buttonText: "Architect, Seek Architecture Reference",
    inputContent: "I'm an architect, I'm seeking an architectural design reference"
  }
];

const PurposeInput = ({ onPurposeSubmit, scrollProgress }: PurposeInputProps) => {
  const [purpose, setPurpose] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleOptionClick = (inputContent: string) => {
    setPurpose(inputContent);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purpose.trim()) {
      onPurposeSubmit(purpose.trim());
      toast({
        title: "Purpose submitted",
        description: "Loading content tailored to your needs...",
      });
    } else {
      toast({
        title: "Please enter your purpose",
        description: "Tell us why you're visiting to see relevant content",
        variant: "destructive",
      });
    }
  };

  // Handle textarea auto-resizing
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPurpose(e.target.value);
    
    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Calculate background opacity based on scroll progress
  // Start with higher base opacity and increase to nearly opaque when fully scrolled
  const backgroundOpacity = Math.min(1, 0.9 + (scrollProgress * 0.1));

  return (
    <motion.section 
      id="purpose-input" 
      className="min-h-screen flex items-center py-16 px-4 md:px-8 lg:px-16 relative"
      style={{
        transform: `translateY(${(1 - scrollProgress) * 50}px)`,
        position: "relative"
      }}
    >
      {/* Top Wave Transition with direct Tailwind class */}
      <WaveTransition scrollProgress={scrollProgress} position="top" color="fill-beige-100" />
      
      {/* Floating animated shapes with direct Tailwind class */}
      {/* <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" /> */}
      <div 
        className="absolute top-0 left-0 w-full y+20"
      >
        <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" /> 
      </div>
      
      {/* Background overlay with solid opacity */}
      <div 
        className="absolute inset-0 bg-beige-100 z-0"
      ></div>
      
      <div className="max-w-4xl mx-auto w-full z-10 relative">
        <div className="text-center mb-10 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">How Can I Help You Today?</h2>
          <p className="text-beige-700">Select a purpose or enter your own to see the most relevant information.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {purposeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.inputContent)}
              className="button-purpose animate-fade-up bg-white hover:bg-opacity-100 transition-all p-3 rounded-md border border-beige-300 text-beige-800 hover:border-beige-500"
            >
              {option.buttonText}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 animate-fade-up">
          <textarea
            ref={inputRef}
            value={purpose}
            onChange={handleTextareaChange}
            placeholder="Tell me why you're visiting this website..."
            rows={1}
            className="flex-grow bg-white border-beige-300 focus:border-beige-500 focus:ring-beige-500 text-beige-800 rounded-md p-2 min-h-[42px] resize-none"
            style={{ overflow: 'hidden' }}
          />
          <Button 
            type="submit" 
            className="bg-beige-800 hover:bg-beige-700 text-white"
          >
            Submit
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>
      </div>
      
      {/* Bottom Wave Transition with direct Tailwind class */}
      <WaveTransition scrollProgress={scrollProgress} position="bottom" color="fill-beige-50" />
    </motion.section>
  );
};

export default PurposeInput;
