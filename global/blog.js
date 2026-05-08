// Ported from /Users/donovanyohan/Documents/Programs/personal/belayer-guide/src/pages/Philosophy*.tsx
// Reframed as personal blog posts about how my thinking on agent orchestration evolved over time.

export const blogPosts = [
  {
    "slug": "context-is-the-constraint",
    "title": "Context Is the Constraint",
    "subtitle": "How my thinking moved from agent capability to context routing.",
    "date": "April 2026",
    "image": "/img/photos/blog/context-is-the-constraint.svg",
    "visualAlt": "Diagram of a context window filled with repo, memory, CI, diff, and docs blocks.",
    "quote": "The hard part isn't whether the model can do the work. It's what the model knows when it's doing it.",
    "sections": [
      {
        "heading": "Context is the constraint",
        "paragraphs": [
          "This is the latest version of the argument. I started out thinking the hard part was making agents stronger. The more I ran them, the more obvious it became that capability was not the bottleneck. Context routing was.",
          "The challenge of agent engineering isn't capability. Models can write code, review it, plan architecture, debug failures. The hard part is what the model knows when it's doing those things. What's loaded, what's forgotten, what's carried over from last time. Every architecture decision in this space flows from one question: how do you get the right context to the right task at the right time?"
        ],
        "bullets": []
      },
      {
        "heading": "Runs end before agents get dumb",
        "paragraphs": [
          "Context windows fill up. The more an agent reads, writes, and reasons, the worse it gets at all three. We call this the dumb zone — the point where adding more context degrades performance instead of improving it.",
          "The practical solution is discrete runs. Break work into bounded sessions. Let each one start relatively clean. This is what humans already do — you close the chat, open a new one, start the next task.",
          "But discrete runs create a new problem: amnesia. The agent that just spent 40 minutes understanding your architecture starts fresh next time, knowing nothing."
        ],
        "bullets": []
      },
      {
        "heading": "Three demands, one window",
        "paragraphs": [
          "The context problem splits into three competing needs that pull in different directions.",
          "Depth — implementation wants the plan, the architecture, the surrounding code all loaded. More relevant context means better code. The agent needs to hold the whole picture.",
          "Freshness — review needs a clean slate. Loading the implementation context creates confirmation bias. The reviewer should encounter the code the way a human reviewer would — without knowing what the author intended, only what the code does.",
          "Memory — learnings from past runs need to persist and surface when relevant. What broke last time. What patterns this repo follows. What was tried and didn't work. This needs to feed into both depth and freshness without crowding either one.",
          "A harness that serves all three is the hard problem. Most don't try."
        ],
        "bullets": []
      },
      {
        "heading": "Everything is moving at once",
        "paragraphs": [
          "The model that's best at orchestrating is different from the model that's best at reasoning through code, which is different from the model with the best vision processing. And that's just the model layer.",
          "At the harness level, new code review tools, planning frameworks, and QA systems ship weekly. Each one is better than the last at something specific. Locking into any single tool at any layer means watching the rest of the industry move past you. But constantly swapping tools means never building depth with any of them.",
          "This is the second tension: the ecosystem rewards experimentation, but production systems reward stability. Any architecture that doesn't account for this is either too rigid to grow or too loose to rely on."
        ],
        "bullets": []
      },
      {
        "heading": "Three layers of identity",
        "paragraphs": [
          "Agent identity can be understood in three layers: the model, the harness, and the repo context. Each has different owners, different lifecycles, and different jobs — but there's genuine disagreement in the industry about whether this separation is the right model, or whether these layers should be tightly woven together. Nobody denies that repo context matters for task quality. The debate is over how tightly it should couple with the harness — and whether separating them is a feature or a limitation."
        ],
        "bullets": []
      },
      {
        "heading": "Capability without opinion",
        "paragraphs": [
          "The model is stateless intelligence. It doesn't know your repo, your conventions, or what it did last run. It's a function: prompt in, completion out.",
          "Opus 4.6, GPT-5.4, Gemini 3 Pro — these are engines. They're good at different things and getting better at different rates. The model layer is where you want the most flexibility, because the best model for a task today might not be the best model for it next month. Your architecture should make model swaps boring, not terrifying."
        ],
        "bullets": []
      },
      {
        "heading": "The runtime that wraps the model",
        "paragraphs": [
          "Claude Code, Codex CLI, Cursor, OpenCode — these are agent runtimes. They give the model tools, file access, memory, and workflow. This is where discrete runs happen. Where context gets shaped. Where the decision is made about what the model sees and what it doesn't.",
          "The harness is also where the three competing demands collide. A code review tool that loads the full implementation plan before reviewing creates confirmation bias. A planning tool that doesn't load the codebase architecture produces plans that don't fit. The harness's job is to route the right context to the right task — and that job is harder than it looks."
        ],
        "bullets": []
      },
      {
        "heading": "The world the harness operates in",
        "paragraphs": [
          "CLAUDE.md. Architecture docs. Test conventions. The accumulated knowledge of how code gets written here. This is the layer you own as an engineer. It's what makes \"write a function\" become \"write a function that follows our patterns, uses our error handling, and respects our module boundaries.\"",
          "The repo context has a different lifecycle than the harness. You might switch from Claude Code to Cursor tomorrow — but your CLAUDE.md, your architecture docs, your conventions stay. This layer is yours. It should survive any tool swap."
        ],
        "bullets": []
      },
      {
        "heading": "Three phases, three contracts",
        "paragraphs": [
          "V2 established three orchestration phases: explore, climb, summit. Spec in, PR out, quality gate at the end. That still holds. But V2 treated the harness as \"bring your own\" — a black box that wasn't the orchestration layer's concern. That understated the hardest part. Each phase has a different relationship with context, and getting that wrong is how you get automation that ships confidently in the wrong direction."
        ],
        "bullets": []
      },
      {
        "heading": "Anything becomes a spec",
        "paragraphs": [
          "The input is whatever you've got. Figma files, tickets, brainstorming transcripts, screenshots. The output is a spec.md.",
          "Explore is where memory matters most. The agent writing specs needs to know what's been tried before, what patterns this repo follows, what the team's priorities are. Without long-term memory, every spec starts from zero — and specs that ignore history repeat it. This is the phase where persistent context earns its keep."
        ],
        "bullets": []
      },
      {
        "heading": "Spec becomes a PR",
        "paragraphs": [
          "The input is a spec.md. The output is a PR. This is where depth matters. The agent needs the plan, the surrounding architecture, the module boundaries, the test patterns — all loaded and close.",
          "Implementation is context-hungry by nature. But it's also where the dumb zone hits hardest, because the work is long. A complex feature can fill a context window before the code is done. The harness has to manage this tension: deep context, bounded runs, and continuity between them."
        ],
        "bullets": []
      },
      {
        "heading": "PRs become value",
        "paragraphs": [
          "The input is a PR. Monitor CI. Run a risk gate. Sweep for regressions on staging. Summit is where freshness matters.",
          "The agent evaluating the PR should not carry the implementation context. It shouldn't know what the author intended — only what the code does. Confirmation bias is the silent failure mode of automated review. A reviewer that loaded the plan will find what the plan said should be there. A reviewer that didn't will find what's actually there. That's the difference between validation and verification."
        ],
        "bullets": []
      },
      {
        "heading": "Shape what each task sees",
        "paragraphs": [
          "This is what V2 missed. The harness isn't just \"the thing that runs the agent.\" It's the layer that decides: explore gets memory. Climb gets depth. Summit gets a clean slate. Same underlying learnings, different projections into each context window.",
          "A harness that treats every task the same — loading everything it has into every run — is leaving performance on the table at best and introducing systematic bias at worst."
        ],
        "bullets": []
      },
      {
        "heading": "Tight integration vs. composability",
        "paragraphs": [
          "There are genuine, competing philosophies here — not just product preferences. On one side, projects like OpenCode, LangChain, and much of the open-source community advocate for clean separation between these layers. The harness loads context, the context lives in the repo, and the two remain composable. Memory is a capability the harness provides, not something the harness becomes.",
          "On the other, Anthropic's Claude Code has built a multi-level memory hierarchy directly into its harness. Letta — born from the MemGPT research project — argues the question itself is wrong: memory isn't a plugin you add to a harness, it is the harness. Their position is that managing context is the harness's core job, and treating it as a separable concern produces shallow systems. Randomlabs' Slate takes a similar stance — its Thread Weaving architecture treats memory management and orchestration as the same problem, inseparable by design."
        ],
        "bullets": []
      },
      {
        "heading": "Neither answer is winning",
        "paragraphs": [
          "The integrated camp makes a strong case. The harness does make invisible decisions that external plugins can't control — how instructions load into context, what survives compaction, how memory surfaces to the agent. Claude Code's memory system is a 3-layer bandwidth-aware hierarchy with background consolidation, staleness detection, and aggressive pruning — all built directly into the harness. Letta's Context Constitution codifies similar principles. These aren't superficial integrations. They're deeply engineered, and they work.",
          "But one observation is worth sitting with: the parties most heavily advocating for vertically integrated context — where the lines between repo context and agent harness blur — are also the ones with an economic incentive to keep you in their ecosystem. Tight coupling creates switching costs. Switching costs create lock-in. That doesn't make them wrong. But it makes the argument worth examining carefully.",
          "It's still unclear which approach wins. I’m currently leaning on composability and modularity over close integration — not because the integrated approach can't produce better results today, but because in a landscape moving this fast, the ability to swap any layer without rewriting the others is a bet we'd rather make than the alternative."
        ],
        "bullets": []
      },
      {
        "heading": "A language, not a runtime",
        "paragraphs": [
          "My current position is that the orchestration concern should be expressed as a declarative language. A YAML pipeline that says: run explore with this input, run climb with this spec, run summit with this PR. Each node is a black box. The pipeline defines sequence, contracts, and data flow. It doesn't define what's inside.",
          "If the language is right, any orchestrator can speak it. The pipeline becomes the spec that orchestrators implement, not an orchestrator you're locked into. The same way Docker Compose doesn't care what's in your container, The orchestration layer doesn't care what's in your node. It cares that spec.md goes in and a PR comes out."
        ],
        "bullets": []
      },
      {
        "heading": "Opinions about what, not how",
        "paragraphs": [
          "This is where the bring-your-own-harness stance gets refined. The orchestration layer still doesn't prescribe which harness you use. But it now has opinions about what a harness must support to be orchestratable:",
          "These aren't implementation requirements. They're interface requirements. How you build the memory system, how you shape context, how you handle events — that's yours. But if your harness can't do these three things, the pipeline can't route context correctly, and the orchestration falls apart."
        ],
        "bullets": [
          "▪ Long-term memory that persists across discrete runs",
          "▪ Context shaping per task type — not just \"load everything\"",
          "▪ Event-driven entry points — the orchestrator triggers work based on pipeline events, not interactive sessions"
        ]
      },
      {
        "heading": "You can't learn from what you can't see",
        "paragraphs": [
          "There's one more requirement that cuts across all three layers: telemetry. If you're going to swap models, swap harnesses, swap orchestrators — you need to know what changed and whether it made things better or worse.",
          "Without rich, queryable data on every run — what model wrote this code, what session produced this PR, what plan led to this outcome — you're flying blind. You can't run evals. You can't catch regressions. You can't answer \"did switching from Opus to Gemini for planning actually improve spec quality?\"",
          "This is what a telemetry layer would need: not a telemetry system, but a requirement that one exists. The data is already being produced — git history, session transcripts, model attribution. The missing piece is the join layer that connects code to the session that wrote it, the session to the model that ran it, the model to the pipeline that triggered it.",
          "A good telemetry layer doesn't have opinions about how you collect this data. It has opinions about what must be queryable: which agent wrote which lines, in what session, with what confidence. The rest — how you store it, how you visualize it, how you build evals on top — is yours. But if your system can't answer \"what happened and why,\" it can't learn. And a system that can't learn is just automation with a shelf life."
        ],
        "bullets": []
      },
      {
        "heading": "Here's where we are",
        "paragraphs": [
          "Context is the constraint. The harness is where it gets solved. The orchestrator declares what runs and in what order. If we get the contracts right — between model and harness, between harness and pipeline, between pipeline and orchestrator — then each layer can evolve independently. The model gets smarter. The harness gets better at context routing. The orchestrator gets better at scheduling and parallelism. None of them need to wait for the others. That's the bet. We don't know if it's right yet. But it's the direction we're walking, and this is what we're learning along the way."
        ],
        "bullets": []
      }
    ]
  },
  {
    "slug": "three-roles-three-phases",
    "title": "Three Roles, Three Phases",
    "subtitle": "A snapshot from when I started separating orchestration, repo practice, and model execution.",
    "date": "March 2026",
    "image": "/img/photos/blog/three-roles-three-phases.svg",
    "visualAlt": "Diagram connecting agent, harness, repo, explore, climb, and summit phases.",
    "quote": "Agentic engineering isn't one problem. It's three problems that keep getting mistaken for one.",
    "sections": [
      {
        "heading": "Three roles, one system",
        "paragraphs": [
          "This was the middle snapshot: the moment I stopped treating “AI coding” as one giant workflow and started separating the jobs. The names were still forming, but the split mattered: orchestration, repo-specific practice, and model execution are different layers.",
          "Agentic engineering isn't one problem. It's three. The orchestrator handles automation — the machinery that picks up work, runs it, and delivers results without you touching the terminal. The harness encodes your team's engineering practices — the why behind your architecture, your test strategy, your quality bar. The agent is the engine that writes code well — model selection, adversarial review, subagent coordination.",
          "Each role solves a fundamentally different problem. Conflating them is how you get automation that ships fast and breaks everything.",
          "Right now, all three are being rapidly developed — and the responsibilities are often tangled together. Tools try to be the orchestrator, the harness, and the agent all at once. Adopting them means adopting entire workflows. The clean separation of these roles lets each solution focus on a smaller problem, so you can mix and match and piece together exactly what you need."
        ],
        "bullets": []
      },
      {
        "heading": "Automation that runs without you",
        "paragraphs": [
          "The orchestrator is the nightshift. It automatically picks up work from your backlog, ingests bug tickets, reviews PRs by default, and stages results for your morning. You don't touch the terminal. You don't monitor the process.",
          "This is what people imagine when they think about \"AI engineering.\" But automation without guardrails is just fast destruction. The orchestrator's value is entirely dependent on what's underneath it."
        ],
        "bullets": []
      },
      {
        "heading": "Engineering practices for your repo",
        "paragraphs": [
          "Why is this function structured the way it is? What architecture should a new feature follow? What does \"quality\" mean here — test suites? Browser validation? Lighthouse scores?",
          "The harness is the answers to these questions, encoded for agents. It's a per-repo concern — what works for a React marketing site is different from what works for a Go microservice. The harness gives agents the context a senior engineer carries in their head: not just how to write code, but how to write code here."
        ],
        "bullets": []
      },
      {
        "heading": "How code gets written well",
        "paragraphs": [
          "The agent layer is the mechanics of code quality. Which model for which task? When do you use subagent-driven development to parallelize work? When do you run adversarial review — sending a separate model to challenge the first one's output?",
          "Claude for planning, Codex for independent review. Skills that encode proven workflows. The agent layer is where the LLM's raw capability gets shaped into reliable engineering output."
        ],
        "bullets": []
      },
      {
        "heading": "Where the lines fall",
        "paragraphs": [
          "The harness encapsulates everything you need to manually go from idea to finished code inside your terminal, on your checked-out branch. It's what a senior engineer does when they sit down to build something.",
          "The orchestrator encapsulates everything you need to automatically go from idea to finished code without ever touching the terminal. Same journey, different driver.",
          "That distinction — manual vs. automatic, attended vs. unattended — is where the boundary naturally falls. When you can clearly separate \"what I do at my desk\" from \"what should run while I sleep,\" you've found the line."
        ],
        "bullets": []
      },
      {
        "heading": "Three phases, three contracts",
        "paragraphs": [
          "Orchestration splits into three distinct phases. Each phase has one input and one output. Each phase doesn't need to know or care how the others work. Explore turns anything into a spec. Climb turns a spec into a PR. Summit turns PRs into deployed value. That's it. Three contracts. Everything else is implementation detail."
        ],
        "bullets": []
      },
      {
        "heading": "Anything becomes a spec",
        "paragraphs": [
          "The input to explore is whatever you've got. A Figma file. A Jira ticket. A brainstorming session with Claude. An article you saw online that inspired something. Screenshots of a SaaS app you want to steal ideas from.",
          "The output is always the same: a spec.md. One document that captures what needs to be built, why, and what success looks like. The explore phase doesn't care how the code will be written — it cares that the problem is well-defined."
        ],
        "bullets": []
      },
      {
        "heading": "Spec becomes a PR",
        "paragraphs": [
          "The input is a spec.md. The output is a PR. The per-repo pipeline runs identically whether you have one repo or ten: plan, implement, review, open the pull request.",
          "This is where we see the most divergence. Gstack, Superpowers, Symphony — dozens of variations on how code actually gets written, how you validate it, what kind of QA runs, how you persist context between sessions. The orchestration layer doesn't pick sides. Nodes are black boxes — your pipeline is defined in YAML, and each node can be Claude Code, Codex, OpenCode, or anything else that fulfills the contract.",
          "This is intentional. The orchestration layer is plumbing — an orchestration standard, not an agent that happens to orchestrate. You bring your own harness and agents. The only thing the orchestration layer needs is the entrypoint you configure in the prompt. Everything else is yours to decide."
        ],
        "bullets": []
      },
      {
        "heading": "PRs become value",
        "paragraphs": [
          "The input is a PR. What do you do with it?",
          "Monitor CI. Establish a risk gate that can auto-merge low-risk changes. Run regression sweeps or bug testing on a staging environment — and feed the bugs found back into explore as new specs. The summit phase is where the loop closes: finished code becomes deployed value, and any problems become new inputs."
        ],
        "bullets": []
      },
      {
        "heading": "They don't need to know each other",
        "paragraphs": [
          "Given that these three phases don't need to know or care how the others work, you can solve each problem in whatever way is best. Use Figma for explore and Jira for tracking. Use Gstack for climb and Vercel for deployment. Mix and match.",
          "For full automation, the only concern is how these three layers communicate. And the contracts are simple: spec.md in, PR out, quality gate at the end. the orchestration layer is an orchestration standard — like Docker Compose for agents. It routes artifacts between nodes. What happens inside each node is none of its business."
        ],
        "bullets": []
      },
      {
        "heading": "The meat of implementation",
        "paragraphs": [
          "Without the harness, the orchestrator's value is questionable — if not dangerous. An orchestrator that can automatically pick up tickets, write code, and push PRs sounds powerful. But if it doesn't understand your architecture, doesn't know your test strategy, can't distinguish \"this repo uses browser validation\" from \"this repo runs unit tests\" — it's just shipping fast in the wrong direction. The harness is what makes automation trustworthy."
        ],
        "bullets": []
      },
      {
        "heading": "Not a workflow, but principles",
        "paragraphs": [
          "The harness is not a prescribed workflow. It's the opinion that there are jobs to be done in a certain order, and that each job has a clear input and output.",
          "Output can be a spec file, a commit hash, or a quality gate. This roughly maps to plan, code, review — but the phases can be strung together in any combination, loop internally, and be tested however you like. Use whatever tool you want. The principle is sequence and accountability, not a specific tool."
        ],
        "bullets": []
      },
      {
        "heading": "Start from any step",
        "paragraphs": [
          "The core principle: if you were to manually write a spec, or a plan, or even some code, you could start a workflow from the next step and it would continue to work as though an agent had done everything prior.",
          "This is what makes the system composable rather than monolithic. Each step only cares about its input, not about who produced it. A human-written spec is indistinguishable from an AI-generated one. A manually crafted plan kicks off orchestration the same way an auto-generated one does. The seams are at the artifacts, not at the agents."
        ],
        "bullets": []
      },
      {
        "heading": "PR and review stay inside",
        "paragraphs": [
          "For ease of iteration, implementation includes PR creation and code review. The loop stays tight and internal: write code, open a PR, review it, address feedback, review again — all within the implementation phase.",
          "This keeps the feedback cycle fast. The orchestrator doesn't need to know that code review happened. It just sees a commit hash appear when implementation is done. The internal loops are the harness's concern."
        ],
        "bullets": []
      },
      {
        "heading": "Additive, not transformative",
        "paragraphs": [
          "The per-repo pipeline runs identically whether you have one repo or ten. Multi-repo doesn't change how work happens inside a repo — it adds two coordination layers on top: the setter decomposes a spec into per-repo specs (fan-out), and the spotter validates cross-repo alignment after all repos complete (fan-in).",
          "Neither changes the climb. Each repo still gets its own harness, its own agents, its own pipeline. The setter and spotter are just more nodes — black boxes with typed contracts. Spec.md in, per-repo specs out. N PRs in, gate score out."
        ],
        "bullets": []
      },
      {
        "heading": "Summit feeds back to explore",
        "paragraphs": [
          "The summit phase is where we close the loop. Low-risk changes and bug fixes get automatically merged. Regression sweeps run against staging environments to catch issues. And the bugs found? They feed back into explore as new specs.",
          "This is where automation pushes boundaries: not just shipping code, but monitoring what shipped and generating new work from what it finds. The system becomes self-correcting, with human oversight at the approval gates rather than at the keyboard."
        ],
        "bullets": []
      },
      {
        "heading": "Three contracts, one system",
        "paragraphs": [
          "That's it. Input to explore is whatever. Output is spec.md. Input to climb is spec.md. Output is a PR. Input to summit is a PR. Output is whatever comes next. My opinions end at these three contracts. Everything between them — how specs get written, how code gets built, how deploys get monitored — is decided by the nodes below. That's what makes the system composable: opinionated about boundaries, unopinionated about internals."
        ],
        "bullets": []
      }
    ]
  },
  {
    "slug": "three-hats-one-engineer",
    "title": "Three Hats, One Engineer",
    "subtitle": "The first version: small bounded tools, clear handoffs, and workflows composed from workflows.",
    "date": "March 2026",
    "image": "/img/photos/blog/three-hats-one-engineer.svg",
    "visualAlt": "Illustration of three engineer hats labeled plan, code, and review.",
    "quote": "Every engineer wears three hats: refinement and planning, implementation, and code review.",
    "sections": [
      {
        "heading": "Three hats, one engineer",
        "paragraphs": [
          "This was the first pass. I was still thinking from the human engineering loop upward: planning, implementation, review. The useful insight was not grand architecture. It was that each boundary needed a contract.",
          "Every engineer wears three hats in the software development lifecycle: refinement and planning, implementation, and code review. Agentic engineering breaks down workflow the same way we break down any system: by finding the boundaries."
        ],
        "bullets": []
      },
      {
        "heading": "Every tool needs a clear start and end",
        "paragraphs": [
          "If a tool that refines is also the tool that implements, context explodes. The agent tries to hold everything at once: the problem definition, the architecture, the code, the tests. Quality drops everywhere.",
          "A bounded tool knows exactly what it receives and exactly what it produces. No ambiguity about when it starts or when it's done. That constraint is what makes it reliable."
        ],
        "bullets": []
      },
      {
        "heading": "Crossing a boundary is its own tool",
        "paragraphs": [
          "The handoff between tools isn't just an arrow on a diagram. It's work: translating one tool's output into the next tool's input. Something great at planning, something great at implementing, and something that gets them talking.",
          "That's a system. Each boundary crossing has its own clear start and end, its own contract. When something breaks, you know exactly where to look."
        ],
        "bullets": []
      },
      {
        "heading": "Opening a PR",
        "paragraphs": [
          "The first problem we solved was tedious: writing good pull requests. It pulled you out of your code to restate work you'd already done. We built pr:author. Clear start (implementation done), clear end (PR link).",
          "Small scope made it obvious when it was working and when it wasn't. That's the first insight: start with a problem small enough to verify."
        ],
        "bullets": []
      },
      {
        "heading": "What comes next?",
        "paragraphs": [
          "If an agent can write PRs, it can review them too. pr:review catches issues against project conventions. pr:resolve addresses review feedback automatically.",
          "Each tool solves one problem well. But what happens when you connect them?"
        ],
        "bullets": []
      },
      {
        "heading": "Small tools, first cycle",
        "paragraphs": [
          "The PR cycle is the first composed workflow. Author writes the PR, review catches issues, resolve addresses them, review checks again. The loop runs until the PR is clean.",
          "When something goes wrong now, it's not a tool problem. It's a sequencing problem. That shift matters: with tested building blocks, you stop worrying about correctness and start thinking about orchestration."
        ],
        "bullets": []
      },
      {
        "heading": "Errors compound upstream",
        "paragraphs": [
          "A bad line of code is a bad line of code. But a bad line of plan could lead to hundreds of bad lines of code. A bad line of research, a misunderstanding of how the codebase works or where certain functionality lives, could land you with thousands of bad lines of code. If we can't make small tools reliable, or small loops reliable, it just amplifies at scale. Human attention belongs at the highest-leverage points: not reviewing output, but validating direction."
        ],
        "bullets": []
      },
      {
        "heading": "Two documents, two problems",
        "paragraphs": [
          "If errors compound upstream, you need to catch them upstream. The design doc validates that the problem is correct: are we solving the right thing? The plan catches hallucinations by reading every file before modifying any.",
          "Different tools for different problems. The design doc is exploratory and divergent. The plan is structured and convergent. Conflating them is how you get 10,000 wrong lines."
        ],
        "bullets": []
      },
      {
        "heading": "Agents need context beyond code",
        "paragraphs": [
          "Code alone isn't enough for informed decisions. An agent reading a function doesn't know why that function exists, what trade-off it represents, or what the team tried before.",
          "Agents need the same thing new engineers need: onboarding, product context, tribal knowledge. Persistent documentation captures the why: architecture decisions, design rationale, project goals. Every agent session starts informed instead of guessing."
        ],
        "bullets": []
      },
      {
        "heading": "Brainstorm and plan",
        "paragraphs": [
          "Brainstorm explores the problem space. What are we building? Why? What have we tried before? The output is a design doc that captures the thinking.",
          "Plan reads every file it will touch before writing a single line. The output is a structured implementation plan. Two documents, two checkpoints. The first validates the problem. The second validates the approach."
        ],
        "bullets": []
      },
      {
        "heading": "Orchestrate",
        "paragraphs": [
          "With a validated plan, agent teams execute using the same small, tested tools from earlier. Each task has a clear start, clear end, and a known-good tool to run it.",
          "The plan drives the work. The tools do the work. The orchestrator sequences them."
        ],
        "bullets": []
      },
      {
        "heading": "A fresh pair of eyes",
        "paragraphs": [
          "The review step uses a separate agent that reads only the output, not the plan that produced it. It's not anchored to the same assumptions the builder had.",
          "A code review from a context that never saw the plan catches different things than one that did. That independence is the point."
        ],
        "bullets": []
      },
      {
        "heading": "Check against the docs",
        "paragraphs": [
          "After review, the reflect step compares what was built against the project's persistent documentation. Did a design decision drift? Is there a new pattern that should be recorded?",
          "Reflect captures learnings and updates context so the next session starts with accurate information instead of stale docs."
        ],
        "bullets": []
      },
      {
        "heading": "The full loop",
        "paragraphs": [
          "That's the complete cycle. Brainstorm the design. Plan the implementation. Orchestrate agent teams to build it. Review with an independent context. Reflect to keep the docs honest. Each step is its own job because each step solves a different problem. The review step is what keeps agents honest. The reflect step is what keeps the knowledge alive."
        ],
        "bullets": []
      },
      {
        "heading": "What if the requirement is larger?",
        "paragraphs": [
          "Leads. Each lead runs a full harness loop: brainstorm, plan, orchestrate, review, reflect. Planned and executed independently per goal. A setter coordinates, decomposing a specification into independent climbs.",
          "Independent goals run simultaneously. Three leads working three features isn't three times as slow. It's roughly the same wall-clock time as one, with the setter ensuring they don't collide."
        ],
        "bullets": []
      },
      {
        "heading": "One feature, multiple repos",
        "paragraphs": [
          "Most real features don't live in one repo. A fullstack change needs a backend API, a frontend that calls it, and sometimes shared types or infrastructure between them. One engineer, multiple codebases, all needing to stay in sync.",
          "Leads solve this naturally. Each lead targets a repo with its own harness loop. A backend lead builds the API. A frontend lead builds the UI. They run simultaneously against separate codebases, each with its own plan, its own context, its own review cycle."
        ],
        "bullets": []
      },
      {
        "heading": "Anchors at the boundaries",
        "paragraphs": [
          "When leads work across repos, the integration surface becomes the risk. The API contract is the anchor: both sides agree on the shape of the data before either side writes a line of implementation.",
          "Code review shifts focus. Instead of reviewing every line in isolation, you review the integration points: does the frontend call match the backend contract? Do the types align? The anchor makes the review targeted and high-leverage instead of exhaustive."
        ],
        "bullets": []
      },
      {
        "heading": "4 projects. 2 days.",
        "paragraphs": [
          "A hackathon. Four separate features, each needing discovery, a working demo, and stakeholder feedback. The human spent most of those two days in conversations: understanding requirements, reviewing demos, iterating on feedback. The implementation happened in the background. When it was time to present, each project had a working prototype."
        ],
        "bullets": []
      },
      {
        "heading": "Start anywhere on the journey",
        "paragraphs": [
          "The stack meets engineers wherever they are. Start with the pr:author plugin to automate your PR workflow. Grow into harness commands for structured design-plan-execute cycles. Graduate to harness:loop for fully autonomous runs. Scale to belayer for multi-repo orchestration.",
          "Each layer is composed of workflows you already know work. No leap of faith required, just the next step up."
        ],
        "bullets": []
      },
      {
        "heading": "Workflows composed of workflows",
        "paragraphs": [
          "That's the meta-framework principle. Architecture doesn't come from grand upfront design. It comes from real needs, tested at each level. When something breaks, you know exactly where to look: the tool, the orchestration, or the specification. Each layer is built from the layer below."
        ],
        "bullets": []
      }
    ]
  }
];

export const latestPost = blogPosts[0];

export const getBlogPost = (slug) => blogPosts.find((post) => post.slug === slug);
