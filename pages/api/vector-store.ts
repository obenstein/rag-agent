import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { question } = req.body;
    const url =
        "https://www.linkedin.com/pulse/data-structures-powering-our-database-part-2-saurav-prateek";

    try {
        if (typeof url !== "string") {
            throw new Error("Invalid URL: URL must be a string");
        }
        const loader = new CheerioWebBaseLoader(url);
        const docs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 0,
        });
        const splitDocs = await splitter.splitDocuments(docs);

        const vectorStore = await MemoryVectorStore.fromDocuments(
            splitDocs,
            new HuggingFaceTransformersEmbeddings({ model: "Xenova/all-MiniLM-L6-v2" })
        );
        const retriever = vectorStore.asRetriever();
        const retrievedDocs = await retriever.invoke(question);
        // Return the retrieved documents
        res.status(200).json({ documents: retrievedDocs });
    } catch (err) {
        console.error("Error scraping:", err);
        res.status(500).json({ error: "Failed to scrape or build vector store" });
    }
}
