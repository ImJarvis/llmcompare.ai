
import React from 'react';
import { LLMResponse } from '../types';
import { SynthesizerIcon, LinkIcon } from './Icons';

interface SummaryCardProps {
  response: LLMResponse;
}

const SkeletonLoader: React.FC = () => (
  <div className="space-y-4 animate-pulse-fast">
    <div className="h-4 bg-brand-secondary/50 rounded w-3/4"></div>
    <div className="h-4 bg-brand-secondary/50 rounded w-full"></div>
    <div className="h-4 bg-brand-secondary/50 rounded w-full"></div>
    <div className="h-4 bg-brand-secondary/50 rounded w-5/6"></div>
  </div>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ response }) => {
  const validSources = response.sources?.filter(source => source.web?.uri) ?? [];

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-primary/50 p-6 flex flex-col shadow-lg">
      <div className="flex items-center mb-4">
        <SynthesizerIcon className="w-7 h-7 mr-3 text-brand-primary" />
        <h2 className="text-xl font-semibold text-brand-text-primary">Consolidated Summary</h2>
      </div>
      <div className="flex-grow text-brand-text-secondary text-base leading-relaxed mb-4">
        {response.status === 'loading' && <SkeletonLoader />}
        {response.status === 'error' && <p className="text-red-400">{response.content}</p>}
        {response.status === 'success' && <p className="whitespace-pre-wrap">{response.content}</p>}
      </div>
      {response.status === 'success' && validSources.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary mb-3 border-t border-brand-secondary/20 pt-4">Verified Sources</h3>
          <ul className="space-y-2">
            {validSources.map((source, index) => (
              <li key={index} className="flex items-start">
                <LinkIcon className="w-4 h-4 mr-2 mt-1 text-brand-secondary flex-shrink-0" />
                <a 
                  href={source.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-brand-primary/90 hover:text-brand-primary hover:underline underline-offset-2 break-all"
                  aria-label={`Source: ${source.web.title || source.web.uri}`}
                >
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;