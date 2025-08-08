
import React from 'react';
import { LLMResponse } from '../types';
import { MODEL_CONFIGS } from '../constants';

interface ResponseCardProps {
  response: LLMResponse;
}

const SkeletonLoader: React.FC = () => (
  <div className="space-y-3 animate-pulse-fast">
    <div className="h-4 bg-brand-secondary/50 rounded w-3/4"></div>
    <div className="h-4 bg-brand-secondary/50 rounded w-full"></div>
    <div className="h-4 bg-brand-secondary/50 rounded w-5/6"></div>
     <div className="h-4 bg-brand-secondary/50 rounded w-1/2"></div>
  </div>
);

const ResponseCard: React.FC<ResponseCardProps> = ({ response }) => {
  const config = MODEL_CONFIGS.find(c => c.name === response.model);
  if (!config) return null;

  const { Icon } = config;

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-secondary/20 p-5 flex flex-col shadow-md">
      <div className="flex items-center mb-4">
        <Icon className="w-7 h-7 mr-3 text-brand-text-secondary" />
        <h2 className="text-xl font-semibold text-brand-text-primary">{response.model}</h2>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 text-brand-text-secondary text-base leading-relaxed">
        {response.status === 'loading' && <SkeletonLoader />}
        {response.status === 'error' && <p className="text-red-400">{response.content}</p>}
        {response.status === 'success' && <p className="whitespace-pre-wrap">{response.content}</p>}
      </div>
    </div>
  );
};

export default ResponseCard;
