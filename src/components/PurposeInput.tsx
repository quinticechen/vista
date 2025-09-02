
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
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { urlParam } = useParams();

  // Default purpose options if none provided
  const purposeOptions = optionButtons || [
    {
      id: 1,
      text: "HR, Seek Candidate",
      defaultText: "I'm an HR professional in [___] field company, seeking an AI Product Manager expert in the latest technology"
    },
    {
      id: 2,
      text: "Company Owner, Seek Consultant", 
      defaultText: "I'm a company owner, I'm seeking a consultant to help with AI implementation and team training"
    },
    {
      id: 3,
      text: "Company Owner, Seek Product Expert", 
      defaultText: "I'm a company owner, I'm seeking a product expert to collaborate on a business"
    }
  ];

  // If the user clicks on a predefined button
  const handleOptionClick = (inputContent: string) => {
    setPurpose(inputContent);
    if (inputRef.current) {
      inputRef.current.focus();
      // Auto-resize the textarea after setting content
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purpose.trim()) {
      try {
        setIsSearching(true);
        toast({
          title: "Searching for relevant content",
          description: "Please wait while we find what you're looking for...",
        });

        console.log("Starting search with query:", purpose.trim());

        const searchResults = await semanticSearch(purpose.trim());

        console.log(`Search completed. Found ${searchResults.length} results (50%+ similarity)`);

        if (searchResults.length === 0) {
          toast({
            title: "No matches found",
            description: "No content found with sufficient relevance (50%+). Try different keywords.",
            variant: "destructive"
          });
        }

        SearchCache.save({
          results: searchResults,
          query: purpose.trim(),
          timestamp: Date.now(),
          showingSearchResults: true,
          purpose: purpose.trim()
        }, urlParam);

        const targetRoute = urlParam ? `/${urlParam}/vista` : "/vista";
        console.log(`Navigating to ${targetRoute} with search results`);

        navigate(targetRoute, {
          state: {
            purpose: purpose.trim(),
            searchResults,
            searchQuery: Date.now()
          }
        });

        // Reset form state and textarea height
        if (e.target) {
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
      } catch (error) {
        console.error("Exception during search:", error);
        toast({
          title: "Search Error",
          description: "An error occurred during the search. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
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
  const backgroundOpacity = Math.min(1, 0.9 + (scrollProgress * 0.1));

  return (
    <motion.section
      id="purpose-input"
      className="min-h-screen flex items-center py-16 px-4 md:px-8 lg:px-16 relative pointer-events-auto"
      style={{
        transform: `translateY(${(1 - scrollProgress) * 50}px)`,
        position: "relative"
      }}
    >
      {/* Top Wave Transition */}
      <WaveTransition scrollProgress={scrollProgress} position="top" color="fill-beige-100" />

      {/* Floating animated shapes */}
      <div className="absolute top-[100px] left-0 w-full">
        <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" />
      </div>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-beige-100 z-0" style={{ opacity: backgroundOpacity }}></div>

      <div className="max-w-4xl mx-auto w-full z-30 relative">
        <div className="text-center mb-10 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">
            {interactiveTitle || "How Can I Help You Today?"}
          </h2>
          <p className="text-beige-700">
            {interactiveSubtitle || "Select a purpose or enter your own to see the most relevant information."}
          </p>
        </div>

        {/* Purpose option buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {purposeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.defaultText)}
              className="button-purpose animate-fade-up bg-white hover:bg-opacity-100 transition-all p-3 rounded-md border border-beige-300 text-beige-800 hover:border-beige-500"
            >
              {option.text}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 animate-fade-up">
          <textarea
            ref={inputRef}
            value={purpose}
            onChange={handleTextareaChange}
            placeholder={placeholder || "Tell me why you're visiting this website..."}
            rows={1}
            className="flex-grow bg-white border-beige-300 focus:border-beige-500 focus:ring-beige-500 text-beige-800 rounded-md p-2 min-h-[42px] resize-none"
            style={{ overflow: 'hidden' }}
          />
          <Button
            type="submit"
            className="bg-beige-800 hover:bg-beige-700 text-white"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : (submitButtonText || 'Submit')}
            {!isSearching && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>
      </div>

      {/* Bottom Wave Transition */}
      <WaveTransition scrollProgress={scrollProgress} position="bottom" color="fill-beige-50" />
    </motion.section>
  );
};

export default PurposeInput;
