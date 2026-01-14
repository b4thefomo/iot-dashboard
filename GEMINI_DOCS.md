### Consolidate Session Memories using Node.js, Google Generative AI, and ChromaDB

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/writing-hooks.md

This Node.js script consolidates session memories by reading interaction logs, extracting key learnings using the Google Generative AI API, and storing these learnings as embeddings in ChromaDB. It cleans up temporary files and provides feedback on saved learnings. Dependencies include '@google/generative-ai' and 'chromadb'.

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChromaClient } = require('chromadb');

async function main() {
  const input = JSON.parse(await readStdin());
  const projectDir = process.env.GEMINI_PROJECT_DIR;
  const sessionId = process.env.GEMINI_SESSION_ID;

  const tempFile = path.join(
    projectDir,
    '.gemini',
    'memory',
    `session-${sessionId}.jsonl`,
  );

  if (!fs.existsSync(tempFile)) {
    console.log(JSON.stringify({}));
    return;
  }

  // Read interactions
  const interactions = fs
    .readFileSync(tempFile, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  if (interactions.length === 0) {
    fs.unlinkSync(tempFile);
    console.log(JSON.stringify({}));
    return;
  }

  // Extract memories using LLM
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Extract important project learnings from this session.
Focus on: decisions, conventions, gotchas, patterns.
Return JSON array with: category, summary, keywords

Session interactions:
${JSON.stringify(interactions, null, 2)}

JSON:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?|\n?```/g, '');
    const memories = JSON.parse(text);

    // Store in ChromaDB
    const client = new ChromaClient({
      path: path.join(projectDir, '.gemini', 'chroma'),
    });
    const collection = await client.getCollection({ name: 'project_memories' });
    const embedModel = genai.getGenerativeModel({
      model: 'text-embedding-004',
    });

    for (const memory of memories) {
      const memoryText = `${memory.category}: ${memory.summary}`;
      const embedding = await embedModel.embedContent(memoryText);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await collection.add({
        ids: [id],
        embeddings: [embedding.embedding.values],
        documents: [memoryText],
        metadatas: [
          {
            category: memory.category || 'general',
            summary: memory.summary,
            keywords: (memory.keywords || []).join(','),
            timestamp: new Date().toISOString(),
          },
        ],
      });
    }

    fs.unlinkSync(tempFile);

    console.log(
      JSON.stringify({
        systemMessage: `🧠 ${memories.length} new learnings saved for future sessions`,
      }),
    );
  } catch (error) {
    console.error('Error consolidating memories:', error);
    fs.unlinkSync(tempFile);
    console.log(JSON.stringify({}));
  }
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

readStdin().then(main).catch(console.error);

```

--------------------------------

### Implement Caching for Data Retrieval (JavaScript)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Shows how to implement a caching mechanism using a `Map` to store and retrieve previously fetched data. This reduces redundant API calls or heavy computations, improving hook responsiveness.

```javascript
const cache = new Map();

async function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

--------------------------------

### Embed Local Content in Gemini CLI Custom Commands

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/changelogs/index.md

Embed local file or directory content directly into your custom command prompts in Gemini CLI using the `@{path}` syntax. This allows for dynamic inclusion of local resources within command arguments.

```shell
gemini my-custom-command @./my-local-file.txt
```

--------------------------------

### JavaScript: Functional Array Transformations

Source: https://github.com/google-gemini/gemini-cli/blob/main/GEMINI.md

Demonstrates the use of common JavaScript array methods like `.map()`, `.filter()`, and `.reduce()` for data manipulation. These methods promote immutability by returning new arrays and enhance code readability through declarative syntax, aligning with functional programming principles.

```javascript
const numbers = [1, 2, 3, 4, 5];

// Filter even numbers
const evenNumbers = numbers.filter(num => num % 2 === 0);

// Double each even number
const doubledEvenNumbers = evenNumbers.map(num => num * 2);

// Sum the doubled even numbers
const sumOfDoubledEvens = doubledEvenNumbers.reduce((sum, num) => sum + num, 0);

console.log(sumOfDoubledEvens); // Output: 12
```

--------------------------------

### search_file_content (SearchText) API

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/file-system.md

Searches for a regular expression pattern within the content of files, optionally filtering by a glob pattern. Returns matching lines with file paths and line numbers.

```APIDOC
## search_file_content (SearchText)

### Description
Searches for a regular expression pattern within the content of files in a specified directory. Can filter files by a glob pattern. Returns the lines containing matches, along with their file paths and line numbers.

### Method
Not applicable (Tool function)

### Endpoint
Not applicable (Tool function)

### Parameters
#### Tool Parameters
- **pattern** (string) - Required - The regular expression (regex) to search for (e.g., `"function\s+myFunction"`).
- **path** (string) - Optional - The absolute path to the directory to search within. Defaults to the current working directory.
- **include** (string) - Optional - A glob pattern to filter which files are searched (e.g., `"*.js"`, `"src/**/*.{ts,tsx}"`). If omitted, searches most files (respecting common ignores).

### Request Example
```json
{
  "tool_name": "search_file_content",
  "parameters": {
    "pattern": "myFunction",
    "path": ".",
    "include": "*.ts"
  }
}
```

### Response
#### Success Response (llmContent)
- **output** (string) - A formatted string of matches, including file path and line number for each occurrence.

#### Response Example
```json
{
  "llmContent": "Found 3 matches for pattern \"myFunction\" in path \".\" (filter: \"*.ts\"):\n---\nFile: src/utils.ts\nL15: export function myFunction() {\nL22:   myFunction.call();\n---\nFile: src/index.ts\nL5: import { myFunction } from './utils';\n---"
}
```
```

--------------------------------

### GEMINI.md Nested Import Example

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Illustrates how imported GEMINI.md files can themselves contain imports, creating a nested structure for organizing documentation components.

```markdown
# main.md

@./header.md @./content.md @./footer.md
```

```markdown
# header.md

# Project Header

@./shared/title.md
```

--------------------------------

### GenAI Metrics

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/telemetry.md

Metrics that comply with OpenTelemetry GenAI semantic conventions for standardized observability across GenAI applications.

```APIDOC
## GenAI Metrics

### Description
Metrics that comply with OpenTelemetry GenAI semantic conventions for standardized observability across GenAI applications.

### Metrics

#### `gen_ai.client.token.usage` (Histogram, token)
Number of input and output tokens used per operation.

- **Attributes**:
  - `gen_ai.operation.name` (string) - Required - The operation type (e.g., "generate_content", "chat")
  - `gen_ai.provider.name` (string) - Required - The GenAI provider ("gcp.gen_ai" or "gcp.vertex_ai")
  - `gen_ai.token.type` (string) - Required - The token type ("input" or "output")
  - `gen_ai.request.model` (string) - Optional - The model name used for the request
  - `gen_ai.response.model` (string) - Optional - The model name that generated the response
  - `server.address` (string) - Optional - GenAI server address
  - `server.port` (int) - Optional - GenAI server port

#### `gen_ai.client.operation.duration` (Histogram, s)
GenAI operation duration in seconds.

- **Attributes**:
  - `gen_ai.operation.name` (string) - Required - The operation type (e.g., "generate_content", "chat")
  - `gen_ai.provider.name` (string) - Required - The GenAI provider ("gcp.gen_ai" or "gcp.vertex_ai")
  - `gen_ai.request.model` (string) - Optional - The model name used for the request
  - `gen_ai.response.model` (string) - Optional - The model name that generated the response
  - `server.address` (string) - Optional - GenAI server address
  - `server.port` (int) - Optional - GenAI server port
  - `error.type` (string) - Optional - Error type if the operation failed

### Further Reading
- [OpenTelemetry GenAI semantic conventions]: https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-metrics.md
- [OpenTelemetry GenAI semantic conventions for events]: https://github.com/open-telemetry/semantic-conventions/blob/8b4f210f43136e57c1f6f47292eb6d38e3bf30bb/docs/gen-ai/gen-ai-events.md
```

--------------------------------

### Model Configuration

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md

This section details the configuration options related to models, including built-in aliases, custom aliases, and overrides.

```APIDOC
## Model Configuration

### Description
Configuration options for selecting and overriding model behaviors.

### Parameters
#### `modelConfigs.builtInAliases` (object)
- **Description:** Pre-defined named presets for model configurations. These are used by default.
- **Default:** `{
  "chat-compression-2-5-flash": {
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "chat-compression-2-5-flash-lite": {
    "modelConfig": {
      "model": "gemini-2.5-flash-lite"
    }
  },
  "chat-compression-default": {
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  }
}`

#### `modelConfigs.customAliases` (object)
- **Description:** Custom named presets for model configs. These are merged with (and override) the built-in aliases.
- **Default:** `{}`

#### `modelConfigs.customOverrides` (array)
- **Description:** Custom model config overrides. These are merged with (and added to) the built-in overrides.
- **Default:** `[]`

#### `modelConfigs.overrides` (array)
- **Description:** Apply specific configuration overrides based on matches, with a primary key of model (or alias). The most specific match will be used.
- **Default:** `[]`
```

--------------------------------

### Auto-Fix Linting Issues in Documentation

Source: https://github.com/google-gemini/gemini-cli/blob/main/CONTRIBUTING.md

Attempts to automatically fix linting issues found in documentation files. This is a convenient way to resolve common style and syntax problems.

```bash
npm run lint:fix
```

--------------------------------

### Project Root Finding Utility

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

The `findProjectRoot` function asynchronously locates the project's root directory by searching for a `.git` folder.

```APIDOC
## `findProjectRoot(startDir)`

### Description
Finds the project root by searching for a `.git` directory upwards from the
given start directory. Implemented as an **async** function using non-blocking
file system APIs to avoid blocking the Node.js event loop.

### Parameters
#### Path Parameters
- `startDir` (string) - Required - The directory to start searching from

### Returns
Promise&lt;string&gt; - The project root directory (or the start
directory if no `.git` is found)
```

--------------------------------

### Include Additional Directories in Workspace Context

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration-v1.md

Provides an array of absolute or relative paths to include in the Gemini CLI's workspace context. This allows the CLI to consider files and directories outside the current project directory.

```json
{
  "includeDirectories": [
    "/path/to/another/project"
  ]
}
```

--------------------------------

### Install Project Dependencies

Source: https://github.com/google-gemini/gemini-cli/blob/main/CONTRIBUTING.md

Installs all project dependencies, including those defined in `package.json` and root-level dependencies. This command should be run after cloning the repository.

```bash
npm install
```

--------------------------------

### Optimize JSON Parsing with Streaming

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Demonstrates how to parse large JSON inputs efficiently using streaming parsers to avoid memory issues. Contrasts the standard approach with a streaming method using JSONStream.

```javascript
const input = JSON.parse(await readStdin());
const content = input.tool_input.content;
```

```javascript
const { createReadStream } = require('fs');
const JSONStream = require('JSONStream');

const stream = createReadStream(0).pipe(JSONStream.parse('tool_input.content'));
let content = '';
stream.on('data', (chunk) => {
  content += chunk;
});
```

--------------------------------

### Format code with Prettier

Source: https://github.com/google-gemini/gemini-cli/blob/main/CONTRIBUTING.md

Formats the project's code according to the defined style guidelines using Prettier. This command should be executed from the project's root directory.

```bash
npm run format
```

--------------------------------

### LLMRequest Object Structure

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md

The `LLMRequest` object is used in `BeforeModel` and `BeforeToolSelection` hooks to define or override model interaction parameters. Note that in v1, non-text parts in `content` are simplified to their string representation.

```APIDOC
## `LLMRequest` Object Structure

### Description
Represents the request sent to the language model. It includes the model to use, the messages for the conversation, optional configuration parameters, and tool configuration.

### Usage
Used in `BeforeModel` and `BeforeToolSelection` hooks.

### Fields
- **model** (string) - The identifier of the model to be used.
- **messages** (Array) - An array of message objects, each with a `role` ('user', 'model', 'system') and `content` (string or Array of content parts).
  - **content** (string | Array<{ "type": string, [key: string]: any }>) - The actual message content. In v1, non-text parts are simplified to strings.
- **config** (object, optional) - Optional configuration for the model.
  - **temperature** (number, optional) - Controls randomness. Lower values make output more focused and deterministic.
  - **maxOutputTokens** (number, optional) - The maximum number of tokens to generate.
  - **topP** (number, optional) - Nucleus sampling parameter.
  - **topK** (number, optional) - Top-k sampling parameter.
- **toolConfig** (object, optional) - Configuration for tool usage.
  - **mode** ('AUTO' | 'ANY' | 'NONE', optional) - The mode for tool selection.
  - **allowedFunctionNames** (Array<string>, optional) - A list of function names that are allowed to be called.
```

--------------------------------

### glob (FindFiles) API

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/file-system.md

The glob tool finds files matching specific glob patterns, returning absolute paths sorted by modification time.

```APIDOC
## glob (FindFiles)

### Description
Finds files matching specific glob patterns (e.g., `src/**/*.ts`, `*.md`), returning absolute paths sorted by modification time (newest first).

### Method
Not applicable (Tool function)

### Endpoint
Not applicable (Tool function)

### Parameters
#### Tool Parameters
- **pattern** (string) - Required - The glob pattern to match against (e.g., `"*.py"`, `"src/**/*.js"`).
- **path** (string) - Optional - The absolute path to the directory to search within. If omitted, searches the tool's root directory.
- **case_sensitive** (boolean) - Optional - Whether the search should be case-sensitive. Defaults to `false`.
- **respect_git_ignore** (boolean) - Optional - Whether to respect .gitignore patterns when finding files. Defaults to `true`.

### Request Example
```json
{
  "tool_name": "glob",
  "parameters": {
    "pattern": "*.md",
    "path": "/path/to/project",
    "case_sensitive": false,
    "respect_git_ignore": true
  }
}
```

### Response
#### Success Response (llmContent)
- **output** (string) - A message listing found files and their paths, sorted by modification time.

#### Response Example
```json
{
  "llmContent": "Found 5 file(s) matching \"*.ts\" within src, sorted by modification time (newest first):\nsrc/file1.ts\nsrc/subdir/file2.ts..."
}
```
```

--------------------------------

### Inject Relevant Memories into Agent Prompt (JavaScript)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/writing-hooks.md

Injects relevant project memories into the agent's prompt before execution. It embeds the user's prompt using Google Generative AI and queries ChromaDB for similar memories, then formats them for context. This hook is intended for pre-agent events.

```javascript
#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChromaClient } = require('chromadb');
const path = require('path');

async function main() {
  const input = JSON.parse(await readStdin());
  const { prompt } = input;

  if (!prompt?.trim()) {
    console.log(JSON.stringify({}));
    return;
  }

  // Embed the prompt
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genai.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(prompt);

  // Search memories
  const projectDir = process.env.GEMINI_PROJECT_DIR;
  const client = new ChromaClient({
    path: path.join(projectDir, '.gemini', 'chroma'),
  });

  try {
    const collection = await client.getCollection({ name: 'project_memories' });
    const results = await collection.query({
      queryEmbeddings: [result.embedding.values],
      nResults: 3,
    });

    if (results.documents[0]?.length > 0) {
      const memories = results.documents[0]
        .map((doc, i) => {
          const meta = results.metadatas[0][i];
          return `- [${meta.category}] ${meta.summary}`;
        })
        .join('\n');

      console.log(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'BeforeAgent',
            additionalContext: `\n## Relevant Project Context\n\n${memories}\n`,
          },
          systemMessage: `💭 ${results.documents[0].length} memories recalled`,
        }),
      );
    } else {
      console.log(JSON.stringify({}));
    }
  } catch (error) {
    console.log(JSON.stringify({}));
  }
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });
}

readStdin().then(main).catch(console.error);

```

--------------------------------

### Context Configuration

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md

Options for managing context files, including file names, import formats, and directory settings.

```APIDOC
## Context Configuration

### Description
Settings related to how context information is loaded and managed.

### Parameters
#### `context.fileName` (string | string[])
- **Description:** The name of the context file or files to load into memory. Accepts either a single string or an array of strings.
- **Default:** `undefined`

#### `context.importFormat` (string)
- **Description:** The format to use when importing memory.
- **Default:** `undefined`

#### `context.discoveryMaxDirs` (number)
- **Description:** Maximum number of directories to search for memory.
- **Default:** `200`

#### `context.includeDirectories` (array)
- **Description:** Additional directories to include in the workspace context. Missing directories will be skipped with a warning.
- **Default:** `[]`

#### `context.loadMemoryFromIncludeDirectories` (boolean)
- **Description:** Controls how /memory refresh loads GEMINI.md files. When true, include directories are scanned; when false, only the current directory is used.
- **Default:** `false`
```

--------------------------------

### GEMINI.md Circular Import Detection Example

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Shows an example of circular imports between two GEMINI.md files, highlighting how the processor detects and prevents such recursive dependencies to avoid infinite loops.

```markdown
# file-a.md

@./file-b.md

# file-b.md

@./file-a.md <!-- This will be detected and prevented -->
```

--------------------------------

### GEMINI.md Import Syntax Example

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Demonstrates the basic syntax for importing content from other GEMINI.md files using the '@' symbol followed by a relative or absolute path. This helps in modularizing documentation.

```markdown
# Main GEMINI.md file

This is the main content.

@./components/instructions.md

More content here.

@./shared/configuration.md
```

--------------------------------

### TypeScript Interface for MemoryFile

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Defines the structure for representing a file within the import tree, including its path and any direct imports it contains.

```typescript
interface MemoryFile {
  path: string; // The file path
  imports?: MemoryFile[]; // Direct imports, in the order they were imported
}
```

--------------------------------

### Protobuf Schema for Agent Thoughts

Source: https://github.com/google-gemini/gemini-cli/blob/main/packages/a2a-server/development-extension-rfc.md

Defines the structure for an agent's internal thought process, consisting of a concise subject and a more detailed description.

```protobuf
syntax = "proto3";

// Represents a thought with a subject and a detailed description.
message AgentThought {
  // A concise subject line or title for the thought.
  string subject = 1;

  // The description or elaboration of the thought itself.
  string description = 2;
}
```

--------------------------------

### LLMResponse Object Structure

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md

The `LLMResponse` object is used in `AfterModel` hooks to modify the model's response, or in `BeforeModel` hooks to provide a synthetic response, bypassing the actual model call.

```APIDOC
## `LLMResponse` Object Structure

### Description
Represents the response received from the language model or a synthetic response provided by a hook.

### Usage
Used in `AfterModel` and as a synthetic response in `BeforeModel`.

### Fields
- **text** (string, optional) - The generated text from the model.
- **candidates** (Array) - An array of candidate responses from the model.
  - **content** (object) - The content of the candidate response.
    - **role** ('model') - The role of the sender, which is 'model'.
    - **parts** (Array<string>) - An array of string parts constituting the response.
  - **finishReason** ('STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER', optional) - The reason the model stopped generating.
  - **index** (number, optional) - The index of the candidate.
  - **safetyRatings** (Array, optional) - Safety ratings for the response.
    - **category** (string) - The safety category.
    - **probability** (string) - The probability of the content falling into this category.
    - **blocked** (boolean, optional) - Indicates if the content was blocked due to safety concerns.
- **usageMetadata** (object, optional) - Metadata about token usage.
  - **promptTokenCount** (number, optional) - The number of tokens in the prompt.
  - **candidatesTokenCount** (number, optional) - The number of tokens generated by the candidates.
  - **totalTokenCount** (number, optional) - The total number of tokens used.
```

--------------------------------

### Handle JSON String Interpolation Safely (JavaScript)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Demonstrates the correct way to handle user input within JSON strings to prevent security vulnerabilities like cross-site scripting. Using `JSON.stringify` automatically escapes special characters.

```javascript
// Bad: Unescaped string interpolation
const message = `User said: ${userInput}`;
console.log(JSON.stringify({ message }));

// Good: Automatic escaping
console.log(JSON.stringify({ message: `User said: ${userInput}` }));
```

--------------------------------

### replace Tool (Edit)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/file-system.md

Replaces text within a specified file. It can replace a single occurrence by default or multiple occurrences if `expected_replacements` is provided. This tool is designed for precise, targeted changes.

```APIDOC
## POST /tools/edit/replace

### Description
Replaces text within a file. By default, replaces a single occurrence, but can replace multiple occurrences when `expected_replacements` is specified. This tool is designed for precise, targeted changes and requires significant context around the `old_string` to ensure it modifies the correct location.

If `old_string` is empty, the tool attempts to create a new file at `file_path` with `new_string` as content.

### Method
POST

### Endpoint
`/tools/edit/replace`

### Parameters
#### Request Body
- **file_path** (string) - Required - The absolute path to the file to modify.
- **old_string** (string) - Required - The exact literal text to replace. This string must uniquely identify the single instance to change. It should include at least 3 lines of context _before_ and _after_ the target text, matching whitespace and indentation precisely. If `old_string` is empty, the tool attempts to create a new file at `file_path` with `new_string` as content.
- **new_string** (string) - Required - The exact literal text to replace `old_string` with.
- **expected_replacements** (number) - Optional - The number of occurrences to replace. Defaults to `1`.

### Request Example
```json
{
  "file_path": "/path/to/your/file.txt",
  "old_string": "// Old code block\nconsole.log('old');\n// End old code block",
  "new_string": "// New code block\nconsole.log('new');\n// End new code block",
  "expected_replacements": 1
}
```

### Response
#### Success Response (200)
- **message** (string) - A message indicating the success of the operation. Examples: `Successfully modified file: /path/to/file.txt (1 replacements).` or `Created new file: /path/to/new_file.txt with provided content.`

#### Response Example
```json
{
  "message": "Successfully modified file: /path/to/your/file.txt (1 replacements)."
}
```

#### Error Response (400/500)
- **error** (string) - An error message explaining the reason for failure. Examples: `Failed to edit, 0 occurrences found...`, `Failed to edit, expected 1 occurrences but found 2...`, `Invalid file path: /path/to/file.txt`

#### Error Response Example
```json
{
  "error": "Failed to edit, expected 1 occurrences but found 2..."
}
```

### Behavior Notes
- If `old_string` is empty and `file_path` does not exist, a new file is created.
- If `old_string` is provided, the tool attempts to find and replace exactly one occurrence. If multiple or zero occurrences are found, the operation may fail or enter a self-correction phase.
- The tool includes a multi-stage edit correction mechanism to handle imperfect `old_string` matches.

### Failure Conditions
- `file_path` is not absolute or is outside the root directory.
- `old_string` is not empty, but the `file_path` does not exist.
- `old_string` is empty, but the `file_path` already exists.
- `old_string` is not found after correction attempts.
- `old_string` is found multiple times, and the self-correction mechanism cannot resolve it to a single, unambiguous match.

### Confirmation
Yes. Shows a diff of the proposed changes and asks for user approval before writing to the file.
```

--------------------------------

### Lint and Format Documentation Files

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/CONTRIBUTING.md

Provides commands to specifically run the linter and formatter on documentation files. 'lint' checks for issues, 'format' auto-formats, and 'lint:fix' attempts to auto-fix linting errors.

```bash
npm run lint
npm run format
npm run lint:fix
```

--------------------------------

### Configure Docker Server Execution

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration-v1.md

Sets up a Docker server to run. This configuration specifies the Docker command, arguments for running an image, and environment variables, including an API key passed securely.

```json
{
  "myDockerServer": {
    "command": "docker",
    "args": ["run", "-i", "--rm", "-e", "API_KEY", "ghcr.io/foo/bar"],
    "env": {
      "API_KEY": "$MY_API_TOKEN"
    }
  }
}
```

--------------------------------

### TypeScript Interface for ProcessImportsResult

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Defines the structure of the result returned by the `processImports` function, including the processed content and the import tree.

```typescript
interface ProcessImportsResult {
  content: string; // The processed content with imports resolved
  importTree: MemoryFile; // Tree structure showing the import hierarchy
}
```

--------------------------------

### Implement Hook Caching with File Storage in Node.js

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Caches the results of expensive hook operations to disk to avoid redundant computation across invocations. Uses a JSON file for storage and an hourly cache key.

```javascript
const fs = require('fs');
const path = require('path');

const CACHE_FILE = '.gemini/hook-cache.json';

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function main() {
  const cache = readCache();
  const cacheKey = `tool-list-${(Date.now() / 3600000) | 0}`; // Hourly cache

  if (cache[cacheKey]) {
    console.log(JSON.stringify(cache[cacheKey]));
    return;
  }

  // Expensive operation
  const result = await computeExpensiveResult();
  cache[cacheKey] = result;
  writeCache(cache);

  console.log(JSON.stringify(result));
}

```

--------------------------------

### Gemini CLI Hooks Input Schema (stdin)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/reference.md

Details the base JSON object and event-specific fields received by hooks via stdin.

```APIDOC
## Input Schema (`stdin`)

Every hook receives a base JSON object. Extra fields are added depending on the
specific event.

### Base Fields (All Events)

| Field             | Type     | Description                                           |
| :---------------- | :------- | :---------------------------------------------------- |
| `session_id`      | `string` | Unique identifier for the current CLI session.        |
| `transcript_path` | `string` | Path to the session's JSON transcript (if available). |
| `cwd`             | `string` | The current working directory.                        |
| `hook_event_name` | `string` | The name of the firing event (e.g., `BeforeTool`).    |
| `timestamp`       | `string` | ISO 8601 timestamp of the event.                      |

### Event-Specific Fields

#### Tool Events (`BeforeTool`, `AfterTool`)

- `tool_name`: (`string`) The internal name of the tool (e.g., `write_file`,
  `run_shell_command`).
- `tool_input`: (`object`) The arguments passed to the tool.
- `tool_response`: (`object`, **AfterTool only**) The raw output from the tool
  execution.

#### Agent Events (`BeforeAgent`, `AfterAgent`)

- `prompt`: (`string`) The user's submitted prompt.
- `prompt_response`: (`string`, **AfterAgent only**) The final response text
  from the model.
- `stop_hook_active`: (`boolean`, **AfterAgent only**) Indicates if a stop hook
  is already handling a continuation.

#### Model Events (`BeforeModel`, `AfterModel`, `BeforeToolSelection`)

- `llm_request`: (`LLMRequest`) A stable representation of the outgoing request.
  See [Stable Model API](#stable-model-api).
- `llm_response`: (`LLMResponse`, **AfterModel only**) A stable representation
  of the incoming response.

#### Session & Notification Events

- `source`: (`startup` | `resume` | `clear`, **SessionStart only**) The trigger
  source.
- `reason`: (`exit` | `clear` | `logout` | `prompt_input_exit` | `other`,
  **SessionEnd only**) The reason for session end.
- `trigger`: (`manual` | `auto`, **PreCompress only**) What triggered the
  compression event.
- `notification_type`: (`ToolPermission`, **Notification only**) The type of
  notification being fired.
- `message`: (`string`, **Notification only**) The notification message.
- `details`: (`object`, **Notification only**) Payload-specific details for the
  notification.
```

--------------------------------

### Default Model Configuration Aliases (JSON)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md

Defines default named presets for model configurations, allowing for inheritance through the 'extends' property. This JSON structure outlines various aliases for different Gemini models and their specific generation settings.

```json
{
  "base": {
    "modelConfig": {
      "generateContentConfig": {
        "temperature": 0,
        "topP": 1
      }
    }
  },
  "chat-base": {
    "extends": "base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "includeThoughts": true
        },
        "temperature": 1,
        "topP": 0.95,
        "topK": 64
      }
    }
  },
  "chat-base-2.5": {
    "extends": "chat-base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingBudget": 8192
        }
      }
    }
  },
  "chat-base-3": {
    "extends": "chat-base",
    "modelConfig": {
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingLevel": "HIGH"
        }
      }
    }
  },
  "gemini-3-pro-preview": {
    "extends": "chat-base-3",
    "modelConfig": {
      "model": "gemini-3-pro-preview"
    }
  },
  "gemini-3-flash-preview": {
    "extends": "chat-base-3",
    "modelConfig": {
      "model": "gemini-3-flash-preview"
    }
  },
  "gemini-2.5-pro": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "gemini-2.5-flash": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "gemini-2.5-flash-lite": {
    "extends": "chat-base-2.5",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite"
    }
  },
  "gemini-2.5-flash-base": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  },
  "classifier": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 1024,
        "thinkingConfig": {
          "thinkingBudget": 512
        }
      }
    }
  },
  "prompt-completion": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "temperature": 0.3,
        "maxOutputTokens": 16000,
        "thinkingConfig": {
          "thinkingBudget": 0
        }
      }
    }
  },
  "edit-corrector": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "thinkingConfig": {
          "thinkingBudget": 0
        }
      }
    }
  },
  "summarizer-default": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 2000
      }
    }
  },
  "summarizer-shell": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-flash-lite",
      "generateContentConfig": {
        "maxOutputTokens": 2000
      }
    }
  },
  "web-search": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {
      "generateContentConfig": {
        "tools": [
          {
            "googleSearch": {}
          }
        ]
      }
    }
  },
  "web-fetch": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {
      "generateContentConfig": {
        "tools": [
          {
            "urlContext": {}
          }
        ]
      }
    }
  },
  "web-fetch-fallback": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "loop-detection": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "loop-detection-double-check": {
    "extends": "base",
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "llm-edit-fixer": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "next-speaker-checker": {
    "extends": "gemini-2.5-flash-base",
    "modelConfig": {}
  },
  "chat-compression-3-pro": {
    "modelConfig": {
      "model": "gemini-3-pro-preview"
    }
  },
  "chat-compression-3-flash": {
    "modelConfig": {
      "model": "gemini-3-flash-preview"
    }
  },
  "chat-compression-2.5-pro": {
    "modelConfig": {
      "model": "gemini-2.5-pro"
    }
  },
  "chat-compression-2.5-flash": {
    "modelConfig": {
      "model": "gemini-2.5-flash"
    }
  }
}
```

--------------------------------

### Lint code with ESLint

Source: https://github.com/google-gemini/gemini-cli/blob/main/CONTRIBUTING.md

Lints the project's code to ensure adherence to coding standards and identify potential issues. This command is executed from the project's root directory.

```bash
npm run lint
```

--------------------------------

### GEMINI.md with Imports for Modular Context

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md

Demonstrates how to use the '@file.md' syntax within a GEMINI.md file to import content from other Markdown files, allowing for modular and organized context management.

```markdown
# Main GEMINI.md file

This is the main content.

@./components/instructions.md

More content here.

@../shared/style-guide.md
```

--------------------------------

### Validate Import Path

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

Validates an import path against a base directory and a list of allowed directories to ensure it's safe and within the permitted scope. It takes the import path, base path, and an array of allowed directory paths as input and returns a boolean indicating validity.

```typescript
function validateImportPath(importPath, basePath, allowedDirectories) {
  // Implementation details for path validation
}
```

--------------------------------

### Robust JSON Parsing with jq

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Contrasts fragile text-based parsing of JSON with robust parsing using the `jq` command-line JSON processor. The 'Good' example shows how to reliably extract the `tool_name` using `jq`.

```bash
# Fragile text parsing
tool_name=$(echo "$input" | grep -oP '"tool_name":\s*"\K[^"]+')
```

```bash
# Robust JSON parsing
tool_name=$(echo "$input" | jq -r '.tool_name')
```

--------------------------------

### Path Validation Utility

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/core/memport.md

The `validateImportPath` function checks if a given import path is valid and resides within specified allowed directories.

```APIDOC
## `validateImportPath(importPath, basePath, allowedDirectories)`

### Description
Validates import paths to ensure they are safe and within allowed directories.

### Parameters
#### Path Parameters
- `importPath` (string) - Required - The import path to validate
- `basePath` (string) - Required - The base directory for resolving relative paths
- `allowedDirectories` (string[]) - Required - Array of allowed directory paths

### Returns
boolean - Whether the import path is valid
```

--------------------------------

### Configure Streamable HTTP Server for MCP Communication

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration-v1.md

Sets up a Streamable HTTP server for MCP communication. It specifies the HTTP URL for streaming data and includes an API key in the headers for authentication. This is useful for continuous data streams.

```json
{
  "myStreamableHttpServer": {
    "httpUrl": "http://localhost:8082/stream",
    "headers": {
      "X-API-Key": "$MY_HTTP_API_KEY"
    },
    "description": "An example Streamable HTTP-based MCP server."
  }
}
```

--------------------------------

### File Filtering Configuration

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md

Settings that control how files are searched and filtered within the project context.

```APIDOC
## File Filtering Configuration

### Description
Options to control file searching and filtering behavior.

### Parameters
#### `context.fileFiltering.respectGitIgnore` (boolean)
- **Description:** Respect .gitignore files when searching.
- **Default:** `true`
- **Requires restart:** Yes

#### `context.fileFiltering.respectGeminiIgnore` (boolean)
- **Description:** Respect .geminiignore files when searching.
- **Default:** `true`
- **Requires restart:** Yes

#### `context.fileFiltering.enableRecursiveFileSearch` (boolean)
- **Description:** Enable recursive file search functionality when completing @ references in the prompt.
- **Default:** `true`
- **Requires restart:** Yes

#### `context.fileFiltering.disableFuzzySearch` (boolean)
- **Description:** Disable fuzzy search when searching for files.
- **Default:** `false`
- **Requires restart:** Yes
```

--------------------------------

### Document Hook Behavior with JSON and Comments

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

Provides examples of documenting hook behavior using both JSON configuration files and inline comments within scripts. The JSON example defines hook matching and command execution, while the JavaScript example uses JSDoc comments for description, performance, and dependencies.

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "name": "secret-scanner",
            "type": "command",
            "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/block-secrets.sh",
            "description": "Scans code changes for API keys, passwords, and other secrets before writing"
          }
        ]
      }
    ]
  }
}
```

```javascript
#!/usr/bin/env node
/**
 * RAG Tool Filter Hook
 *
 * This hook reduces the tool space from 100+ tools to ~15 relevant ones
 * by extracting keywords from the user's request and filtering tools
 * based on semantic similarity.
 *
 * Performance: ~500ms average, cached tool embeddings
 * Dependencies: @google/generative-ai
 */
```

--------------------------------

### Inject Extended Thinking Budget for Specific Agent (JSON)

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/generation-settings.md

Provides a JSON configuration for overriding model parameters to enforce an extended thinking budget (4096) specifically for the 'codebaseInvestigator' agent.

```json
{
  "modelConfigs": {
    "overrides": [
      {
        "match": {
          "overrideScope": "codebaseInvestigator"
        },
        "modelConfig": {
          "generateContentConfig": {
            "thinkingConfig": { "thinkingBudget": 4096 }
          }
        }
      }
    ]
  }
}
```

--------------------------------

### TypeScript: Safely Process Unknown Values with Type Narrowing

Source: https://github.com/google-gemini/gemini-cli/blob/main/GEMINI.md

Demonstrates how to safely handle values of unknown type in TypeScript by using type narrowing techniques such as `typeof` checks. This prevents runtime errors by ensuring operations are only performed when the type is known and compatible. Avoids the 'any' type for better type safety.

```typescript
function processValue(value: unknown) {
  if (typeof value === 'string') {
    // value is now safely a string
    console.log(value.toUpperCase());
  } else if (typeof value === 'number') {
    // value is now safely a number
    console.log(value * 2);
  }
  // Without narrowing, you cannot access properties or methods on 'value'
  // console.log(value.someProperty); // Error: Object is of type 'unknown'.
}
```

--------------------------------

### Run Project Linting and Preflight Checks

Source: https://github.com/google-gemini/gemini-cli/blob/main/CONTRIBUTING.md

Performs a comprehensive check of code quality, formatting, and consistency. This command runs ESLint, Prettier, all tests, and other checks defined in `package.json`.

```bash
npm run preflight
```

--------------------------------

### Sanitize Sensitive Data in JavaScript Hooks

Source: https://github.com/google-gemini/gemini-cli/blob/main/docs/hooks/best-practices.md

This JavaScript function sanitizes an object by removing specific sensitive fields and redacting patterns like API keys within string content. It's crucial for preventing sensitive information from being logged or exposed in hook outputs. Ensure the input `data` is an object and `hookOutput` is defined in the scope.

```javascript
function sanitizeOutput(data) {
  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.apiKey;
  delete sanitized.password;

  // Redact sensitive strings
  if (sanitized.content) {
    sanitized.content = sanitized.content.replace(
      /api[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi,
      '[REDACTED]',
    );
  }

  return sanitized;
}

console.log(JSON.stringify(sanitizeOutput(hookOutput)));
```
