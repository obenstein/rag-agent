import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { question } = req.body;
    const url =
        "https://www.forbes.com/sites/tonyaevans/2025/04/22/bitbonds-a-new-take-on-treasury-bonds-to-tackle-the-us-debt-crisis/";
    https://medium.com/data-science-collective/mastering-stacks-and-queues-key-data-structures-and-algorithms-for-data-science-40d1ba93ab00
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
