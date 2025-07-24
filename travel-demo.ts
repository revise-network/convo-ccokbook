import {
  StateGraph,
  START,
  END,
  Annotation,
  MemorySaver,
} from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { AIMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import {Convo} from "convo-sdk"


dotenv.config();

const convo = new Convo({apiKey: process.env.CONVO_API_KEY as string});
const checkpointer = convo.checkpointer();

const thread_id = await convo.newThread();
// const thread_id = "";
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

const tripPlanner = async (state: any) => {
	const prompt = `
		given the choice of destination: ${state.destination}, flight: ${state.selectedFlight}, hotel: ${state.selectedHotel}
		help plan a small trip
	`;
	const result = await llm.invoke(prompt);
	return { result: result.content };
};

const GraphState = Annotation.Root({
    destination: Annotation<string>,
		hotelOptions: Annotation<string>,
		flightOptions: Annotation<string>,
		selectedHotel: Annotation<string>,
		selectedFlight: Annotation<string>,
		result: Annotation<string>
});

const hotelsFinder = async (state: any) => {
	const prompt = `
	please help find a list of hotels for the user based on their choice of destination. ${state.destination}
	`
	const agent = createReactAgent({
		llm,
		tools,
		 name: "hotelsFinder"
	})
	const result = await agent.invoke({messages: [new AIMessage(prompt)]},);
	const lastMessageIndex = result.messages.length - 1
	return { hotelOptions: result.messages[lastMessageIndex].content };
};

const flightsFinder = async (state: any) => {
	const llmWithTools = llm.bindTools(tools);
	const prompt = `
	please help find a list of flights for the user based on their choice of destination from india mumbai. ${state.destination}
	`
	const agent = createReactAgent({
		llm,
		tools,
		 name: "hotelsFinder"
	})
	const result = await agent.invoke({messages: [new AIMessage(prompt)]},);
	const lastMessageIndex = result.messages.length - 1
	return { flightOptions: result.messages[lastMessageIndex].content };
};

const workflow = new StateGraph(GraphState)
	.addNode("flightsFinder", flightsFinder)
	.addNode("hotelsFinder", hotelsFinder)
	.addNode("tripPlanner", tripPlanner)
	.addEdge(START, "flightsFinder")
	.addEdge("flightsFinder", "hotelsFinder")
	.addEdge("hotelsFinder", "tripPlanner")
	.addEdge("tripPlanner", END)
	.compile({checkpointer})


const response = workflow.stream({destination: "Dubai"}, {configurable: {thread_id}, streamMode: "values", interruptAfter: ["hotelsFinder"]});

for await (const chunk of await response) {
	console.log(`--------------------------`);
	console.log(chunk);
}

// const checkpointsGenerator = await checkpointer.list({configurable: {thread_id}})
// for await(const checkpointObj of checkpointsGenerator) {
// 	if (checkpointObj.checkpoint.channel_values.flightsFinder === "flightsFinder") 
// 		console.log(checkpointObj.checkpoint.id);
// }

console.log(`=============== Interrupted ===============`);

// const resAfterInterrupt = workflow.stream({selectedHotel: "Hilton Dubai Al Habtoor City", selectedFlight: "From Dallas (DFW) to Dubai (DXB) from $1,120 for a round trip"}, {configurable: {thread_id}, streamMode: "values"});
// for await (const chunk of await resAfterInterrupt) {
// 	console.log(`--------------------------`);
// 	console.log(chunk);
// }