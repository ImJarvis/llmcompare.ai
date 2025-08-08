
import React from 'react';
import { LLMResponse } from '../types';
import ResponseCard from './ResponseCard';

interface ResponseGridProps {
  responses: LLMResponse[];
}

const ResponseGrid: React.FC<ResponseGridProps> = ({ responses }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 flex-grow">
      {responses.map((response) => (
        <ResponseCard key={response.id} response={response} />
      ))}
    </div>
  );
};

export default ResponseGrid;
