import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
import readline from "readline"
dotenv.config();

// Create model
const model = new ChatOpenAI({
    modelName: "nvidia/nemotron-3-ultra-550b-a55b:free",
    apiKey: process.env.OPENROUTER_API_KEY,
    verbose: false,
    temperature: 0.7,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Sales Agent",
        },
    },
});


const chatHistory = [];

// Create prompt
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant called Max"],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"]
]);

const chain = prompt.pipe(model); 

// Get user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion () {
    rl.question("User: ", async  (input) => {
        try {
            const response = await chain.invoke({ input, chat_history: chatHistory });
            chatHistory.push(new HumanMessage(input));
            chatHistory.push(new AIMessage(response.content));
    
            console.log("Agent: ", response.content);
            askQuestion();
        } catch {
            console.log("I'm sorry, i could not fufill your request");
        }
    })
}

askQuestion();


