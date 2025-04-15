'use client';

import { useState, useRef } from 'react';
import { RAGAgent, createRAGAgent } from '../lib/rag/rag-agent';

export default function Home() {
  const [knowledgeText, setKnowledgeText] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [documentCount, setDocumentCount] = useState<number>(0);

  // Use a ref to store the agent instance
  const ragAgentRef = useRef<RAGAgent | null>(null);

  const initializeKnowledge = async () => {
    if (!knowledgeText.trim()) {
      alert('Please provide knowledge text');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, you'd handle this more securely with environment variables
      // Here we're using a prompt for demo purposes
      let apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

      if (!apiKey) {
        apiKey = prompt('Please enter your Groq API key:') || undefined;
        if (!apiKey) {
          setIsLoading(false);
          return;
        }
      }

      // Create the RAG agent
      ragAgentRef.current = createRAGAgent({ groqApiKey: apiKey });

      // Initialize the knowledge base
      await ragAgentRef.current.initializeKnowledge(knowledgeText);

      // Update state
      setIsInitialized(true);
      const stats = ragAgentRef.current.getStats();
      setDocumentCount(stats?.documentCount || 0);

      alert('Knowledge base initialized successfully!');
    } catch (error) {
      console.error('Error initializing knowledge:', error);
      alert('Failed to initialize knowledge base. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    if (!ragAgentRef.current || !ragAgentRef.current.isInitialized()) {
      alert('Knowledge base not initialized. Please add documents first.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ragAgentRef.current.query(query);
      setAnswer(result);
    } catch (error) {
      console.error('Error processing query:', error);
      setAnswer('Error processing your query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">RAG Agent Demo</h1>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Knowledge Base</h2>
        <textarea
          className="w-full h-48 p-2 border rounded"
          value={knowledgeText}
          onChange={(e) => setKnowledgeText(e.target.value)}
          placeholder="Paste your knowledge base text here..."
          disabled={isLoading || isInitialized}
        />
        <div className="flex justify-between items-center mt-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            onClick={initializeKnowledge}
            disabled={isLoading || isInitialized || !knowledgeText.trim()}
          >
            {isLoading ? 'Initializing...' : 'Initialize Knowledge Base'}
          </button>
          {isInitialized && (
            <span className="text-green-600">
              Initialized with {documentCount} chunks
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Query</h2>
        <textarea
          className="w-full h-24 p-2 border rounded mb-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading || !isInitialized}
        />
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
          onClick={handleQuery}
          disabled={isLoading || !isInitialized || !query.trim()}
        >
          {isLoading ? 'Processing...' : 'Submit Query'}
        </button>
      </div>

      {answer && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-2">Answer</h2>
          <div className="p-3 bg-white border rounded whitespace-pre-wrap">
            {answer}
          </div>
        </div>
      )}
    </main>
  );
}