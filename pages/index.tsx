// index.tsx
import { useState, useEffect } from 'react';
import { generateAnswer } from '@/lib/rag/rag-agent-i';

export default function Home() {
  const [answer, setAnswer] = useState('');

  // Option 1: Run when component loads (for testing)
  useEffect(() => {
    const runRAG = async () => {
      const result = await generateAnswer();
      console.log("RAG Result:", result);
      setAnswer(JSON.stringify(result, null, 2));
    };

    runRAG();
  }, []);

  return (
    <div>
      <h1>RAG Agent</h1>
      <p>Ask me anything!</p>
      <pre>{answer}</pre>
    </div>
  );
}
