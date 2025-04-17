// pages/api/rag-agent.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { execute } from '@/lib/rag/rag-agent-i'; // keep this import — the compiled graph logic is still okay to call here

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { question } = req.body;

    try {
        const result = await execute(question); // pass the question dynamically
        res.status(200).json({ answer: result.generatedAnswer });
    } catch (error) {
        console.error("RAG agent error:", error);
        res.status(500).json({ error: "Failed to get answer from RAG agent" });
    }
}
