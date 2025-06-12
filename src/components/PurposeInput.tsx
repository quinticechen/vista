
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
  const navigate = useNavigate(); // A 檔案的 Hook
  const { toast } = useToast(); // A 檔案的 Hook
  const { urlParam } = useParams(); // A 檔案的 Hook

  // If the user clicks on a predefined button
  const handleOptionClick = (inputContent: string) => { // 沿用 A 檔案的命名
    setPurpose(inputContent);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // // Focus the input when the component first renders
  // useEffect(() => {
  //   if (scrollProgress > 0.8) {
  //     inputRef.current?.focus();
  //   }
  // }, [scrollProgress]);

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (purpose.trim()) {
  //     onPurposeSubmit(purpose);
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => { // 沿用 A 檔案的完整邏輯
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
  // const scale = scrollProgress < 0.1 ? 0.8 : 1;
  // const opacity = scrollProgress < 0.1 ? 0 : 1;

    // Handle textarea auto-resizing (來自 A 檔案)
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPurpose(e.target.value);

    // Auto-resize the textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Calculate background opacity based on scroll progress (來自 A 檔案)
  const backgroundOpacity = Math.min(1, 0.9 + (scrollProgress * 0.1));

//   return (
//     <div id="purpose-input" className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-32 px-6 bg-beige-50 overflow-hidden">
//       {/* Top Wave Transition */}
//       <WaveTransition scrollProgress={scrollProgress} position="top" color="fill-beige-100" />
      
//       {/* Floating animated shapes */}
//       <div className="absolute top-[100px] left-0 w-full">
//         <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" opacity={0.3} /> 
//       </div>
      
//       {/* Background overlay */}
//       <div className="absolute inset-0 bg-beige-100 z-0 opacity-20"></div>

//       <motion.div 
//         className="relative w-full max-w-3xl z-10"
//         style={{ 
//           scale, 
//           opacity,
//           transition: 'all 0.3s ease'
//         }}
//       >
//         <div className="text-center mb-10 animate-fade-up">
//           <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-3">
//             {interactiveTitle || "How Can I Help You Today?"}
//           </h2>
//           <p className="text-lg text-beige-700">
//             {interactiveSubtitle || "Select a purpose or enter your own to see the most relevant information."}
//           </p>
//         </div>

//         {optionButtons && optionButtons.length > 0 && (
//           <div className="flex flex-wrap justify-center gap-3 mb-8">
//             {optionButtons.map((option) => (
//               <Button
//                 key={option.id}
//                 variant="outline"
//                 className="border-beige-300 hover:border-beige-500 hover:bg-beige-100 text-beige-800"
//                 onClick={() => handleOptionClick(option.defaultText)}
//               >
//                 {option.text}
//               </Button>
//             ))}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div 
//             className={`bg-white rounded-lg shadow-lg p-2 transition-all ${
//               isFocused ? 'ring-2 ring-beige-400 shadow-xl' : ''
//             }`}
//           >
//             <textarea
//               ref={inputRef}
//               className="w-full p-4 text-lg text-beige-900 resize-none outline-none min-h-[120px] bg-transparent"
//               placeholder={placeholder || "Tell me why you're visiting this website..."}
//               value={purpose}
//               onChange={e => setPurpose(e.target.value)}
//               onFocus={() => setIsFocused(true)}
//               onBlur={() => setIsFocused(false)}
//               autoComplete="off"
//             />
//           </div>
//           <div className="text-center">
//             <Button
//               type="submit"
//               size="lg"
//               className="bg-beige-800 hover:bg-beige-900 text-white px-12 py-6 text-lg h-auto"
//             >
//               {submitButtonText || "Submit"}
//             </Button>
//           </div>
//         </form>
//       </motion.div>
      
//       {/* Bottom Wave Transition */}
//       <WaveTransition scrollProgress={scrollProgress} position="bottom" color="fill-beige-50" />
//     </div>
//   );
// };

// export default PurposeInput;
return (
    <motion.section
      id="purpose-input"
      className="min-h-screen flex items-center py-16 px-4 md:px-8 lg:px-16 relative"
      style={{
        transform: `translateY(${(1 - scrollProgress) * 50}px)`, // A 檔案的動畫
        position: "relative"
      }}
    >
      {/* Top Wave Transition with direct Tailwind class */}
      <WaveTransition scrollProgress={scrollProgress} position="top" color="fill-beige-100" />

      {/* Floating animated shapes with direct Tailwind class */}
      {/* A 檔案的 FloatingShapes 位置在 WaveTransition 之後 */}
      <div className="absolute top-[100px] left-0 w-full">
        <FloatingShapes scrollProgress={scrollProgress} position="top" color="fill-beige-100" />
      </div>

      {/* Background overlay with solid opacity (來自 A 檔案) */}
      <div className="absolute inset-0 bg-beige-100 z-0" style={{ opacity: backgroundOpacity }}></div>

      <div className="max-w-4xl mx-auto w-full z-10 relative">
        <div className="text-center mb-10 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-beige-900 mb-4">
            {interactiveTitle || "How Can I Help You Today?"} {/* 沿用 B 的可配置標題 */}
          </h2>
          <p className="text-beige-700">
            {interactiveSubtitle || "Select a purpose or enter your own to see the most relevant information."} {/* 沿用 B 的可配置副標題 */}
          </p>
        </div>

        {/* 使用 A 檔案的 button 結構和 class，但使用 B 檔案的 optionButtons 數據源 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {purposeOptions.map((option) => ( // 使用內部定義的 purposeOptions
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
            onChange={handleTextareaChange} // 使用 A 檔案的 auto-resize 邏輯
            placeholder={placeholder || "Tell me why you're visiting this website..."}
            rows={1} // A 檔案的 rows=1
            className="flex-grow bg-white border-beige-300 focus:border-beige-500 focus:ring-beige-500 text-beige-800 rounded-md p-2 min-h-[42px] resize-none" // A 檔案的 class
            style={{ overflow: 'hidden' }} // 配合 auto-resize
          />
          <Button
            type="submit"
            className="bg-beige-800 hover:bg-beige-700 text-white" // A 檔案的 class
            disabled={isSearching} // A 檔案的狀態
          >
            {isSearching ? 'Searching...' : (submitButtonText || 'Submit')} {/* 沿用 B 的可配置按鈕文字 */}
            {!isSearching && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>
      </div>

      {/* Bottom Wave Transition with direct Tailwind class */}
      <WaveTransition scrollProgress={scrollProgress} position="bottom" color="fill-beige-50" />
    </motion.section>
  );
};

export default PurposeInput;
