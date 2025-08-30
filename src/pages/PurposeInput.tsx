import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { semanticSearch } from "@/services/adminService";
import WaveTransition from "@/components/WaveTransition";
import FloatingShapes from "@/components/FloatingShapes";

interface OptionButton {
  id: string;
  text: string;
  defaultText: string;
}

interface PurposeInputProps {
  onPurposeSubmit?: (purpose: string) => void;
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
  placeholder = "What do you want to learn about today?",
  interactiveTitle = "What can I help you discover?",
  interactiveSubtitle = "Share your interests or questions, and I'll find relevant content for you",
  submitButtonText = "Find Content",
  optionButtons = []
}: PurposeInputProps) => {
  const [purpose, setPurpose] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOptionClick = (inputContent: string) => {
    setPurpose(inputContent);
    const textarea = document.getElementById('purpose-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) return;

    setIsSearching(true);
    try {
      console.log('Starting semantic search for:', purpose);
      
      const results = await semanticSearch(purpose);
      console.log('Search results:', results);
      
      if (results && results.length > 0) {
        toast({
          title: "Search completed",
          description: `Found ${results.length} relevant results`
        });
        
        // Store search results in session storage for the results page
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        sessionStorage.setItem('searchQuery', purpose);
        
        // Navigate to Vista page with search results
        navigate('/vista', { 
          state: { 
            searchResults: results, 
            searchQuery: purpose 
          } 
        });
      } else {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }

    // Call the onPurposeSubmit callback if provided
    if (onPurposeSubmit) {
      onPurposeSubmit(purpose);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPurpose(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Calculate background opacity based on scroll
  const backgroundOpacity = Math.min(scrollProgress * 2, 0.7);

  return (
    <section 
      id="purpose-input"
      className="min-h-screen flex items-center justify-center relative py-24 px-6"
      style={{
        background: `rgba(var(--background), ${backgroundOpacity})`
      }}
    >
      <WaveTransition scrollProgress={scrollProgress} position="bottom" />
      <FloatingShapes scrollProgress={scrollProgress} position="bottom" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            {interactiveTitle}
          </h2>
          {interactiveSubtitle && (
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              {interactiveSubtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <Textarea
              id="purpose-textarea"
              value={purpose}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`w-full min-h-[120px] text-lg p-6 border-2 transition-all duration-300 resize-none ${
                isFocused 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}
              disabled={isSearching}
            />
          </div>

          <div className="text-center">
            <Button 
              type="submit" 
              size="lg" 
              className="px-8 py-4 text-lg"
              disabled={!purpose.trim() || isSearching}
            >
              {isSearching ? "Searching..." : submitButtonText}
            </Button>
          </div>
        </form>

        {/* Option buttons */}
        {optionButtons && optionButtons.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-6 text-center text-foreground">
              Or try one of these:
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {optionButtons.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  onClick={() => handleOptionClick(option.defaultText)}
                  className="h-auto p-4 text-left whitespace-normal max-w-xs"
                  disabled={isSearching}
                >
                  {option.text}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PurposeInput;