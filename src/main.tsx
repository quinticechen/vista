
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TranslationProvider } from './hooks/use-translation.tsx'

// Get API key from window object (if set in index.html)
const apiKey = (window as any).GOOGLE_TRANSLATE_API_KEY;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TranslationProvider apiKey={apiKey}>
      <App />
    </TranslationProvider>
  </React.StrictMode>
);
