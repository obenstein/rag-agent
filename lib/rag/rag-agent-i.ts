import { Document } from "langchain/document";
import { OpenAI } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";


interface GraphInterface {
    question: string,
    generatedAnswer: string,
    documents: Document[]
    model: OpenAI
}


const retrieveDocsFromAPI = async (url: string, question: string) => {
    try {
        const response = await fetch('/api/vector-store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, question }),
        });

        if (!response.ok) {
            throw new Error('Failed to retrieve documents');
        }

        const data = await response.json();
        printDocuments(data.documents.flat());
        return data.documents;
    } catch (error) {
        console.error('Error retrieving docs:', error);
        return [];
    }
};


async function VectorStore() {
    const urls = ['https://medium.com/gitconnected/smart-monorepos-determining-impact-from-deep-dependency-changes-in-typescript-a5516f34b471']
    const docs = await Promise.all(urls.map((url) => {
        const loader = new CheerioWebBaseLoader(url);
        return loader.load();
    }))
    printDocuments(docs.flat());
    console.log("Retrieved DOcs" + docs)
    const text_splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 250,
        chunkOverlap: 0,
    })
    const splitDocs = await text_splitter.splitDocuments(docs.flat());


    return await MemoryVectorStore.fromDocuments(
        splitDocs,
        new HuggingFaceTransformersEmbeddings({
            model: "Xenova/all-MiniLM-L6-v2",
        })
    )
}

function printDocuments(docs: Document[]) {
    docs.map((doc) => { console.log(doc.pageContent) });
}

async function generateAnswer() {
    const docs = await retrieveDocsFromAPI("https://levelup.gitconnected.com/smart-monorepos-determining-impact-from-deep-dependency-changes-in-typescript-a5516f34b471", "What is the capital of France?");
    console.log("State: " + docs)
}
export { generateAnswer };