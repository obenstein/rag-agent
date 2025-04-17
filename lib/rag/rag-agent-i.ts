// lib/rag-agent.ts

import { Document } from "langchain/document";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { GRADER_TEMPLATE, ANSWER_GRADER_PROMPT_TEMPLATE } from "../../lib/rag/constants";
import * as hub from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/community/chat_models/ollama";



interface GraphInterface {
    question: string;
    generatedAnswer: string;
    documents: Document[];
    model: ChatOpenAI;
}

const graphChannel = {
    question: null,
    generatedAnswer: null,
    documents: {
        value: (x: Document[], y: Document[]) => y,
        default: () => [],
    },
    model: null,
};

const hasRelevantDocuments = async (state: GraphInterface) => {
    const docs = state.documents;
    return docs.length === 0 ? "no" : "yes";
};

const gradeGeneratedAnswer = async (state: GraphInterface) => {
    const gradePrompter = ChatPromptTemplate.fromTemplate(ANSWER_GRADER_PROMPT_TEMPLATE);
    const generatedAnswerGrader = gradePrompter.pipe(state.model);

    const graderResponse = await generatedAnswerGrader.invoke({
        question: state.question,
        generation: state.generatedAnswer,
    });
    console.log({ graderResponse });

    if (graderResponse.content.toLowerCase().includes("no")) {
        return {
            generatedAnswer: "Sorry, I cannot answer this question. Please try again with a different question.",
        };
    }
    return state;
};

const documentGrader = async (state: GraphInterface) => {
    const docs = state.documents;
    const relevantDocs = [];

    for (const doc of docs) {
        const gradePrompter = ChatPromptTemplate.fromTemplate(GRADER_TEMPLATE);
        const docGrader = gradePrompter.pipe(state.model);
        const docGraderResponse = await docGrader.invoke({
            question: state.question,
            content: doc.pageContent,
        });

        const cleanGraderResponse = docGraderResponse.content
        console.log({ cleanGraderResponse });
        if (cleanGraderResponse === "yes") {
            relevantDocs.push(doc);
        }
    }

    console.log({ relevantDocs });
    return { documents: relevantDocs };
};

const createModel = async (state: GraphInterface) => {
    const model = new ChatOllama({
        baseUrl: "http://172.208.52.162:11434", // 👈 Your Ollama local URL
        model: "llama3", // 👈 Match this with `ollama list` output
        temperature: 0,
    });

    return { model };
};

const retrieveDocsFromAPI = async (state: GraphInterface) => {


    const question = state.question;
    try {
        const response = await fetch("http://localhost:3000/api/vector-store", {
            // 👈 Adjust if your backend is hosted differently
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question }),
        });

        if (!response.ok) throw new Error("Failed to retrieve documents");

        const data = await response.json();
        console.log("docs retrieved")
        return { documents: data.documents };
    } catch (error) {
        console.error("Error retrieving docs:", error);
        return { documents: [] };
    }
};

async function generateAnswer(state: GraphInterface) {
    const ragPrompt = await hub.pull("rlm/rag-prompt");
    const ragChain = ragPrompt.pipe(state.model).pipe(new StringOutputParser());

    const generatedAnswer = await ragChain.invoke({
        context: state.documents,
        question: state.question,
    });
    console.log({ generatedAnswer });
    return { generatedAnswer };
}

const graph = new StateGraph<GraphInterface>({ channels: graphChannel })
    .addNode("retrieve_docs", retrieveDocsFromAPI)
    .addNode("create_model", createModel)
    .addNode("grade_document", documentGrader)
    .addNode("generate", generateAnswer)
    .addNode("grade_answer", gradeGeneratedAnswer)
    .addEdge(START, "retrieve_docs")
    .addEdge("retrieve_docs", "create_model")
    .addEdge("create_model", "grade_document")
    .addConditionalEdges("grade_document", hasRelevantDocuments, {
        yes: "generate",
        no: END,
    })
    .addEdge("generate", "grade_answer")
    .addEdge("grade_answer", END);

const app = graph.compile({
    checkpointer: new MemorySaver(),
});

async function execute(question: string) {

    const graphResponse = await app.invoke({ question }, { configurable: { thread_id: "1" } });
    return graphResponse;
}
export { execute }