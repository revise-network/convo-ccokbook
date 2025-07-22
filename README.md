# Convo SDK Cookbook - Quick Start Recipes

Transform your LangGraph TypeScript apps from stateless to stateful in minutes with cloud-based persistence.

## Why Convo SDK?

**The Problem**: LangGraph apps lose memory between runs. Setting up persistent checkpointers requires database setup, custom implementations, and maintenance overhead.

**The Solution**: Convo SDK is a drop-in replacement for LangGraph checkpointers that provides cloud-based persistence with zero setup.

```bash
npm install convo-sdk @langchain/langgraph @langchain/anthropic

```

Get your API key: [dashboard.convo.diy](https://dashboard.convo.diy/)

---

## Recipe 1: Hello World with Memory

Your first persistent LangGraph agent in under 10 lines of code.

```tsx
import { Convo } from "convo-sdk";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";

// Initialize Convo
const convo = new Convo();
await convo.init({ apiKey: "your-convo-api-key" });

// Create agent with persistent memory
const agent = createReactAgent({
  llm: new ChatAnthropic({ 
	  model: "claude-3-7-sonnet-latest",
	  anthropicApiKey: "your-anthropic-key"
	}),
  tools: [], // Add your tools here
  checkpointer: convo.checkpointer(), // Magic happens here!
});

// Create conversation thread
const threadId = await convo.newThread();

// Chat with memory
const response1 = await agent.invoke(
  { messages: [{ role: "user", content: "Hi, I'm Alice" }] },
  { configurable: { thread_id: threadId } }
);

const response2 = await agent.invoke(
  { messages: [{ role: "user", content: "What's my name?" }] },
  { configurable: { thread_id: threadId } }
);

console.log(response2); // Agent remembers: "Your name is Alice!"

```

**Key Points:**

- Replace any LangGraph checkpointer with `convo.checkpointer()`
- Memory persists across app restarts
- Each `thread_id` maintains separate conversation history

---

## Recipe 2: Multi-User Chat App

Handle multiple users with isolated conversation threads.

```tsx
import { Convo } from "convo-sdk";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

class ChatService {
  private convo: Convo;
  private agent: any;
	private threads: any;

  async initialize() {
    this.convo = new Convo();
    await this.convo.init({ apiKey: "CONVO_API_KEY" });

    // Using convo to create a thread
    this.threads = {
    	"alice": await this.convo.newThread(),
    	"bob": await this.convo.newThread()
    }

    // Create agent with tools
    this.agent = createReactAgent({
      llm: new ChatAnthropic({ model: "claude-3-7-sonnet-latest", apiKey: "ANTHROPIC_API_KEY" }),
      tools: [
        tool(
          async ({ query }: { query: string }) => `Search results for: ${query}`,
          {
            name: "search",
            description: "Search the web",
            schema: z.object({ query: z.string() }),
          }
        ),
      ],
      checkpointer: this.convo.checkpointer(),
    });
  }

  async chat(userId: string, message: string) {
    // Each user gets their own persistent thread
    const threadId = this.threads[userId];

    const result = await this.agent.invoke(
      { messages: [{ role: "user", content: message }] },
      { configurable: { thread_id: threadId } }
    );
		
		console.log(`${userId} asked: ${message}`);
		

    return result.messages[result.messages.length - 1].content;
  }

  async getChatHistory(userId: string) {
    const threadId = `user_${userId}`;
    return await this.convo.getThreadState(threadId);
  }
}

// Usage
const chatService = new ChatService();
await chatService.initialize();

// Alice's conversation
console.log("======================= Alice's conversations ==========================");

const alice_chat_1 = await chatService.chat("alice", "Search for Famous photographers");
console.log(alice_chat_1);

const alice_chat_2 = await chatService.chat("alice", "What did you find?"); // Remembers previous search
console.log(alice_chat_2);

// Bob's separate conversation
console.log("======================= Bob's conversations ==========================");

const bob_chat_1 = await chatService.chat("bob", "Hello, I need help with React");
console.log(bob_chat_1);

// Bob and Alice have completely separate conversation histories

```

**Key Features:**

- Automatic user isolation with thread naming
- Persistent conversation history per user
- Built-in conversation state retrieval

---

## Migration from Default Checkpointers

**Before (MemorySaver - loses data on restart):**

```tsx
import { MemorySaver } from "@langchain/langgraph-checkpoint";

const agent = createReactAgent({
  llm: model,
  tools: tools,
  checkpointer: new MemorySaver(), // ❌ Lost on restart
});

```

**After (Convo SDK - persistent):**

```tsx
import { Convo } from "convo-sdk";

const convo = new Convo();
await convo.init({ apiKey: process.env.CONVO_API_KEY });

const agent = createReactAgent({
  llm: model,
  tools: tools,
  checkpointer: convo.checkpointer(), // ✅ Persisted in cloud
});

```

**That's it!** One line change for persistent memory with zero database setup.

---

## Key Convo SDK Methods

| Method | Description |
| --- | --- |
| `await convo.init({ apiKey })` | Initialize SDK |
| `await convo.newThread()` | Create new conversation thread |
| `convo.checkpointer()` | Get LangGraph-compatible checkpointer |
| `convo.checkpointer({ thread_id })` | Bind checkpointer to specific thread |
| `convo.getThreadState(threadId)` | Get conversation history |
| `convo.listThreads()` | List all threads |

## Next Steps

1. Get your API key: [dashboard.convo.diy](https://dashboard.convo.diy/)
2. Try the Hello World recipe
3. Build your multi-user app with Recipe 2
4. Use advanced threading for complex scenarios

**Questions?** Check out the [NPM package](https://www.npmjs.com/package/convo-sdk) or explore [LangGraph documentation](https://langchain-ai.github.io/langgraphjs/). Or you can reach me at [anil@revise.network](mailto:anil@revise.network) 

---

*Transform your LangGraph apps from stateless to stateful in minutes. No database setup required.*
