import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const chatSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

if (
  !PINECONE_API_KEY ||
  !PINECONE_ENVIRONMENT ||
  !PINECONE_INDEX ||
  !OPENAI_API_KEY
) {
  throw new Error("Missing Pinecone or OpenAI environment variables.");
}

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = chatSchema.parse(body);

    // 1. Embed the query using OpenAI
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. Query Pinecone for top 3 relevant docs
    const index = pinecone.index(PINECONE_INDEX);
    const searchRes = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });
    const contexts =
      searchRes.matches?.map((m) => m.metadata?.text || "").filter(Boolean) ||
      [];
    const contextText = contexts.join("\n---\n");

    // 3. Call OpenAI with context and user query
    const prompt = `You are a helpful assistant. Use the following context to answer the question.\n\nContext:\n${contextText}\n\nQuestion: ${query}\nAnswer:`;
    const chatRes = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that uses provided context.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });
    const answer =
      chatRes.choices[0]?.message?.content?.trim() ||
      "Sorry, I couldn't find an answer.";

    return NextResponse.json({ answer });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
