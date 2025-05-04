import { useState, useEffect } from "react";

export default function Home() {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const getAnswer = async (question: string) => {
      try {
        const response = await fetch("/api/rag-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });

        const data = await response.json();
        console.log(data.answer);
        setAnswer(data.answer);
      } catch (err) {
        console.error("Error fetching answer:", err);
        setAnswer("Error fetching answer.");
      }
    };

    getAnswer("What does this article say about Looming Wall of Debt?");
  }, []);


  return (
    <div>
      <h1>RAG Agent</h1>
      <p>Ask me anything!</p>
      <h3>{answer}</h3>
    </div>
  );
}
