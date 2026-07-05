import { AIMessage, HumanMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import readline from "readline";
import { tool, createAgent } from "langchain"
import { ChatOllama } from "@langchain/ollama";
import z from "zod";
dotenv.config();

const tavilySearch = tool(
    async ({ query }) => {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query,
                max_results: 5,
            }),
        });
        const data = await response.json();
        // Return clean results the agent can read
        return data.results
            .map((r) => `${r.title}: ${r.content}`)
            .join("\n\n");
    },
    {
        name: "search_web",
        description: "Search the web for information about any topic",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);


// Create model
const model = new ChatOllama({
    model: "llama3.2:1b",
    temperature: 0.7,
});

const chatHistory = [];
const agent = createAgent({
    model,
    tools: [tavilySearch],
    systemPrompt: "You are an helpful assitant that can browse the web and answer users questions efficiently"
});

// Get user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion() {
    rl.question("User: ", async (input) => {
        const trimmed = input.trim()
        try {
            if (!trimmed) {
                console.log("System: ", "Invalid input");
                askQuestion();
                return;
            }

            const response = await agent.invoke({ messages: [{ role: "user", content: trimmed }] });
            const lastOutput = response.messages.at(-1)
            const content = lastOutput ? lastOutput.content : null;
            chatHistory.push(new HumanMessage(trimmed));
            chatHistory.push(new AIMessage(content));

            console.log("Agent: ", content);
            askQuestion();
        } catch (err) {
            console.error("Error:", err);
            console.log("I'm sorry, i could not fufill your request");

            // Ask the question again
            askQuestion();
        }
    })
}

askQuestion();


