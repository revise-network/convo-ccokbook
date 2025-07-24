import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import { Convo } from "convo-sdk"
import { MemorySaver } from "@langchain/langgraph-checkpoint";


dotenv.config();

const checkpointer = new MemorySaver();

const thread_id = "123-abc";
console.log(`Thread id: ${thread_id}`);


const llm = new ChatOpenAI({
	model: "gpt-4o",
	temperature: 0,
	openAIApiKey: process.env.OPENAI_API_KEY,
});

const webSearchTool = new TavilySearchResults({
	maxResults: 4,
	apiKey: process.env.TAVILY_API_KEY,
});

const tools = [webSearchTool];

const agent = createReactAgent({
	llm,
	tools,
	name: "searchAgent",
	checkpointer
})

const ans = await agent.invoke({messages: [new HumanMessage("Hi, who is Tom Cruise?")]}, {configurable: {thread_id}});
const ans1 = await agent.invoke({messages: [new HumanMessage("did i ask about Tom?")]}, {configurable: {thread_id}})

// console.log(ans.messages);
console.log(ans1.messages);
