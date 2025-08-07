
import React, { useState, useCallback } from 'react';
import { LLMResponse, LLM } from './types';
import { llmManager } from './services/llmManager';
import { MODEL_CONFIGS } from './constants';
import PromptInput from './components/PromptInput';
import ResponseGrid from './components/ResponseGrid';
import SummaryCard from './components/SummaryCard';
import { BrandIcon } from './components/Icons';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [responses, setResponses] = useState<LLMResponse[]>([]);
  const [summary, setSummary] = useState<LLMResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const initializeResponses = useCallback(() => {
    const initialResponses = MODEL_CONFIGS.map(config => ({
      model: config.name,
      content: '',
      status: 'loading' as const,
      id: `${config.name}-${Date.now()}`
    }));
    setResponses(initialResponses);
    setSummary(null);
  }, []);

  const handlePromptSubmit = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim() || isLoading) return;

    setIsLoading(true);
    initializeResponses();

    const responsePromises = llmManager.generateAllResponses(currentPrompt);
    const results = await Promise.allSettled(responsePromises);

    const finalResponses = results.map((result, index) => {
      const modelConfig = MODEL_CONFIGS[index];
      if (result.status === 'fulfilled') {
        return {
          model: modelConfig.name,
          content: result.value,
          status: 'success' as const,
          id: `${modelConfig.name}-${Date.now()}`
        };
      } else {
        console.error(`Error from ${modelConfig.name}:`, result.reason);
        return {
          model: modelConfig.name,
          content: 'An error occurred. Please check the console.',
          status: 'error' as const,
          id: `${modelConfig.name}-${Date.now()}`
        };
      }
    });
    setResponses(finalResponses);

    const successfulResponses = finalResponses
      .filter(r => r.status === 'success')
      .map(r => ({ model: r.model as LLM, content: r.content }));

    if (successfulResponses.length > 0) {
      setSummary({ id: 'summary-card', model: 'Synthesizer', content: '', status: 'loading' });
      try {
        const { summaryText, sources } = await llmManager.generateSummary(currentPrompt, successfulResponses);
        setSummary({
          id: 'summary-card',
          model: 'Synthesizer',
          content: summaryText,
          status: 'success',
          sources: sources
        });
      } catch (error) {
        console.error("Error generating summary:", error);
        setSummary({
          id: 'summary-card',
          model: 'Synthesizer',
          content: 'An error occurred while generating the summary.',
          status: 'error'
        });
      }
    }

    setIsLoading(false);
  }, [isLoading, initializeResponses]);

  const showWelcomeScreen = responses.length === 0 && !summary;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col font-sans">
      <header className="w-full p-4 flex items-center justify-center border-b border-brand-secondary/20 sticky top-0 bg-brand-bg/80 backdrop-blur-sm z-20">
        <div className="flex items-center space-x-3">
          <BrandIcon className="w-8 h-8 text-brand-primary" />
          <h1 className="text-2xl font-bold tracking-tight">LLM Response Comparator</h1>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        {showWelcomeScreen ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-bold mb-4">Compare LLMs Side-by-Side</h2>
            <p className="text-brand-text-secondary max-w-2xl">
              Enter a prompt below to send it to Gemini and other leading AI models simultaneously. 
              See how their responses differ, then get a fact-checked summary.
            </p>
          </div>
        ) : (
          <>
            {summary && <SummaryCard response={summary} />}
            <ResponseGrid responses={responses} />
          </>
        )}
      </main>

      <footer className="sticky bottom-0 w-full bg-brand-bg p-4 border-t border-brand-secondary/20">
        <div className="max-w-3xl mx-auto">
          <PromptInput
            prompt={prompt}
            setPrompt={setPrompt}
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
