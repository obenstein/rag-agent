import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { formatDocumentsAsString } from "langchain/util/document";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export interface RAGAgentConfig {
    groqApiKey: string;
    modelName?: string;
}

export class RAGAgent {
    private llm: ChatGroq;
    private vectorStore: MemoryVectorStore | null = null;
    private embeddings: HuggingFaceTransformersEmbeddings;

    constructor(config: RAGAgentConfig) {
        this.llm = new ChatGroq({
            apiKey: config.groqApiKey,
            model: config.modelName || "llama3-8b-8192",
            temperature: 0.2,
        });

        // Using HuggingFace transformers with the correct import path
        this.embeddings = new HuggingFaceTransformersEmbeddings({
            model: "Xenova/all-MiniLM-L6-v2",
        });
    }

    // Initialize the vector store with documents
    async initializeKnowledge(content: string): Promise<void> {
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await textSplitter.createDocuments([content]);
        this.vectorStore = await MemoryVectorStore.fromDocuments(docs, this.embeddings);

        return Promise.resolve();
    }

    // Query the RAG system
    async query(question: string): Promise<string> {
        if (!this.vectorStore) {
            return "Knowledge base not initialized. Please add documents first.";
        }

        // Create the retrieval chain
        const retriever = this.vectorStore.asRetriever(4); // Get top 4 docs

        const prompt = ChatPromptTemplate.fromTemplate(`
      Answer the question based on the following context:
      
      Context: {context}
      
      Question: {question}
      
      If you don't know the answer based on the context, just say "I don't have enough information to answer this question."
      Always provide a concise answer based only on the provided context.
    `);

        // Create a chain that performs retrieval -> formatting -> generation
        const chain = RunnableSequence.from([
            {
                context: async (input: { question: string }) => {
                    const docs = await retriever.getRelevantDocuments(input.question);
                    return formatDocumentsAsString(docs);
                },
                question: (input: { question: string }) => input.question,
            },
            prompt,
            this.llm,
            new StringOutputParser(),
        ]);

        // Execute the chain
        const response = await chain.invoke({
            question,
        });

        return response;
    }

    // Check if knowledge base is initialized
    isInitialized(): boolean {
        return this.vectorStore !== null;
    }

    // Get stats about the knowledge base
    getStats(): { documentCount: number } | null {
        if (!this.vectorStore) {
            return null;
        }

        return {
            documentCount: this.vectorStore.memoryVectors.length,
        };
    }
}

// Utility function to create a RAG agent instance
export const createRAGAgent = (config: RAGAgentConfig): RAGAgent => {
    return new RAGAgent(config);
};