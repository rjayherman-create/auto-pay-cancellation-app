import React, { useState } from 'react';
import { aiAPI } from '../services/api';
import { Sparkles } from 'lucide-react';

interface Props {
  onSuggest: (text: string) => void;
  occasion?: string;
}

const AISuggestion: React.FC<Props> = ({ onSuggest, occasion }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (!prompt.trim()) return;
    
    try {
      setLoading(true);
      const result = await aiAPI.getAISuggestion(prompt, occasion);
      setSuggestion(result.text);
      onSuggest(result.text);
    } catch (err) {
      console.error('Failed to get AI suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">AI Suggestion</h3>
      </div>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what you'd like the card to say..."
        className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg mb-3"
      />
      
      <button
        onClick={handleSuggest}
        disabled={loading || !prompt.trim()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Get Suggestion'}
      </button>

      {suggestion && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-900">{suggestion}</p>
        </div>
      )}
    </div>
  );
};

export default AISuggestion;
