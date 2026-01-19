### Go - Code Execution Example

Source: https://ai.google.dev/gemini-api/docs/code-execution

Go example demonstrating code execution setup with the Gemini API. Shows client initialization, configuration, and response handling in Go.

```APIDOC
## Go Code Execution Implementation

### Description
Demonstrates enabling code execution using the Go Gemini API client library.

### Example Code
```go
package main

import (
    "context"
    "fmt"
    "os"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}}
        }
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50."),
        config
    )

    fmt.Println(result.Text())
    fmt.Println(result.ExecutableCode())
    fmt.Println(result.CodeExecutionResult())
}
```

### Key Points
- Initialize client with context
- Create GenerateContentConfig with Tools slice
- Include ToolCodeExecution in the Tools array
- Use PascalCase methods: ExecutableCode() and CodeExecutionResult()
```

--------------------------------

### Install Google GenAI SDK via pip - Python

Source: https://ai.google.dev/gemini-api/docs/quickstart

Install the google-genai package for Python 3.9+ using pip package manager. This is the first step to use Gemini API in Python applications.

```bash
pip install -q -U google-genai
```

--------------------------------

### Install PyAudio for audio streaming with pip

Source: https://ai.google.dev/gemini-api/docs/live

Install PyAudio library required for streaming audio from microphone. Additional system-level dependencies like portaudio may be required depending on your operating system.

```bash
pip install pyaudio
```

--------------------------------

### Upload multiple images for multi-image prompting - Python

Source: https://ai.google.dev/gemini-api/docs/image-understanding

Python example demonstrating setup for multi-image prompting. Uploads first image via File API and prepares second image as inline data by reading image bytes from file path.

```python
from google import genai
from google.genai import types

client = genai.Client()

# Upload the first image
image1_path = "path/to/image1.jpg"
uploaded_file = client.files.upload(file=image1_path)

# Prepare the second image as inline data
image2_path = "path/to/image2.png"
with open(image2_path, 'rb') as f:
    img2_bytes = f.read()
```

--------------------------------

### JavaScript - Code Execution Example

Source: https://ai.google.dev/gemini-api/docs/code-execution

JavaScript example showing how to enable code execution using the Gemini API. Demonstrates client configuration, request setup, and response part handling.

```APIDOC
## JavaScript Code Execution Implementation

### Description
Demonstrates enabling code execution using the JavaScript Gemini API client library.

### Example Code
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

let response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    "What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50."
  ],
  config: {
    tools: [{ codeExecution: {} }]
  }
});

const parts = response?.candidates?.[0]?.content?.parts || [];
parts.forEach((part) => {
  if (part.text) {
    console.log(part.text);
  }
  if (part.executableCode && part.executableCode.code) {
    console.log(part.executableCode.code);
  }
  if (part.codeExecutionResult && part.codeExecutionResult.output) {
    console.log(part.codeExecutionResult.output);
  }
});
```

### Key Points
- Import GoogleGenAI from @google/genai package
- Configure tools with codeExecution object
- Use camelCase naming: executableCode and codeExecutionResult
- Access response using optional chaining and nullish coalescing
```

--------------------------------

### Initialize and Start Live Audio Application - JavaScript

Source: https://ai.google.dev/gemini-api/docs/live

Entry point function that starts both the message processing loop and audio playback loop concurrently, then initiates the Gemini Live API connection. Handles errors at the top level and manages the complete lifecycle of the real-time audio streaming application.

```javascript
// Start loops
messageLoop();
playbackLoop();

live().catch(console.error);
```

--------------------------------

### Generate Content - Java SDK Example

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=ru&lang=python

Example implementation using the Google Gemini Java client library to generate content with configuration settings. Shows basic setup and model invocation.

```APIDOC
## Java SDK - Generate Content

### Description
Implements content generation using the official Google Gemini Java client library with custom generation configuration.

### Code Example
```java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;

public class GenerateContentWithConfig {
  public static void main(String[] args) {
    Client client = new Client();

    GenerateContentConfig config = GenerateContentConfig.builder()
      .temperature(0.1f)
      .build();

    GenerateContentResponse response =
      client.models.generateContent(
        "gemini-2.5-flash",
        "Explain how AI works",
        config
      );

    System.out.println(response.text());
  }
}
```

### Configuration Parameters Used
- **Temperature**: 0.1 - Lower randomness for more deterministic responses
```

--------------------------------

### Initialize Node.js Audio Queues and Speaker Setup

Source: https://ai.google.dev/gemini-api/docs/live

This snippet initializes arrays to act as queues for incoming API responses and outgoing audio data. It also defines helper functions, `waitMessage` to asynchronously retrieve messages from a queue, and `createSpeaker` to set up and manage the audio speaker with error handling. This is part of the main `live` function for Node.js.

```javascript
const responseQueue = [];
  const audioQueue = [];
  let speaker;

  async function waitMessage() {
    while (responseQueue.length === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    return responseQueue.shift();
  }

  function createSpeaker() {
    if (speaker) {
      process.stdin.unpipe(speaker);
      speaker.end();
    }
    speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 24000,
    });
    speaker.on('error', (err) => console.error('Speaker error:', err));
    process.stdin.pipe(speaker);
  }
```

--------------------------------

### Establish connection to Gemini Live API

Source: https://ai.google.dev/gemini-api/docs/live-guide

This example demonstrates how to create an asynchronous connection to the Gemini Live API using an API key. It initializes the client, specifies the model and response modalities (AUDIO), and opens a session for interaction.

```Python
import asyncio
from google import genai

client = genai.Client()

model = "gemini-2.5-flash-native-audio-preview-12-2025"
config = {"response_modalities": ["AUDIO"]}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        print("Session started")
        # Send content...

if __name__ == "__main__":
    asyncio.run(main())

```

```JavaScript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = { responseModalities: [Modality.AUDIO] };

async function main() {

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        console.debug(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });

  console.debug("Session started");
  // Send content...

  session.close();
}

main();

```

--------------------------------

### Lyria RealTime Prompt Examples

Source: https://ai.google.dev/gemini-api/docs/music-generation

Comprehensive guide for prompting Lyria RealTime with supported instruments, music genres, and mood descriptions. Use descriptive language combining multiple prompt elements for optimal results.

```APIDOC
## POST /session/generateMusic

### Description
Generate music using Lyria RealTime with descriptive prompts. Prompts can include instruments, music genres, and mood/description elements. Be descriptive and iterative for best results.

### Supported Prompt Elements

#### Instruments
303 Acid Bass, 808 Hip Hop Beat, Accordion, Alto Saxophone, Bagpipes, Balalaika Ensemble, Banjo, Bass Clarinet, Bongos, Boomy Bass, Bouzouki, Buchla Synths, Cello, Charango, Clavichord, Conga Drums, Didgeridoo, Dirty Synths, Djembe, Drumline, Dulcimer, Fiddle, Flamenco Guitar, Funk Drums, Glockenspiel, Guitar, Hang Drum, Harmonica, Harp, Harpsichord, Hurdy-gurdy, Kalimba, Koto, Lyre, Mandolin, Maracas, Marimba, Mbira, Mellotron, Metallic Twang, Moog Oscillations, Ocarina, Persian Tar, Pipa, Precision Bass, Ragtime Piano, Rhodes Piano, Shamisen, Shredding Guitar, Sitar, Slide Guitar, Smooth Pianos, Spacey Synths, Steel Drum, Synth Pads, Tabla, TR-909 Drum Machine, Trumpet, Tuba, Vibraphone, Viola Ensemble, Warm Acoustic Guitar, Woodwinds

#### Music Genres
Acid Jazz, Afrobeat, Alternative Country, Baroque, Bengal Baul, Bhangra, Bluegrass, Blues Rock, Bossa Nova, Breakbeat, Celtic Folk, Chillout, Chiptune, Classic Rock, Contemporary R&B, Cumbia, Deep House, Disco Funk, Drum & Bass, Dubstep, EDM, Electro Swing, Funk Metal, G-funk, Garage Rock, Glitch Hop, Grime, Hyperpop, Indian Classical, Indie Electronic, Indie Folk, Indie Pop, Irish Folk, Jam Band, Jamaican Dub, Jazz Fusion, Latin Jazz, Lo-Fi Hip Hop, Marching Band, Merengue, New Jack Swing, Minimal Techno, Moombahton, Neo-Soul, Orchestral Score, Piano Ballad, Polka, Post-Punk, 60s Psychedelic Rock, Psytrance, R&B, Reggae, Reggaeton, Renaissance Music, Salsa, Shoegaze, Ska, Surf Rock, Synthpop, Techno, Trance, Trap Beat, Trip Hop, Vaporwave, Witch house

#### Mood/Description
Acoustic Instruments, Ambient, Bright Tones, Chill, Crunchy Distortion, Danceable, Dreamy, Echo, Emotional, Ethereal Ambience, Experimental, Fat Beats, Funky, Glitchy Effects, Huge Drop, Live Performance, Lo-fi, Ominous Drone, Psychedelic, Rich Orchestration, Saturated Tones, Subdued Melody, Sustained Chords, Swirling Phasers, Tight Groove, Unsettling, Upbeat, Virtuoso, Weird Noises

### Prompting Best Practices
- **Be descriptive**: Use adjectives describing mood, genre, and instrumentation
- **Iterate gradually**: Rather than completely changing the prompt, add or modify elements to morph the music smoothly
- **Use WeightedPrompt**: Experiment with weight parameter to influence how strongly a new prompt affects the ongoing generation

### Example Prompts
- "Upbeat Jazz Fusion with bright tones and tight groove"
- "Lo-fi Hip Hop with chill ambient vibes and acoustic instruments"
- "EDM with huge drop and crunchy distortion"
```

--------------------------------

### Few-Shot Prompt for Concise Explanation Selection - Gemini API

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Demonstrates a few-shot prompting technique that provides two examples to guide the Gemini model toward selecting concise explanations. By showing examples where shorter explanations are preferred, the model learns the pattern and applies it to new questions, producing more concise responses than zero-shot prompts.

```text
Below are some examples showing a question, explanation, and answer format:

Question: Why is the sky blue?
Explanation1: The sky appears blue because of Rayleigh scattering, which causes
shorter blue wavelengths of light to be scattered more easily than longer red
wavelengths, making the sky look blue.
Explanation2: Due to Rayleigh scattering effect.
Answer: Explanation2

Question: What is the cause of earthquakes?
Explanation1: Sudden release of energy in the Earth's crust.
Explanation2: Earthquakes happen when tectonic plates suddenly slip or break
apart, causing a release of energy that creates seismic waves that can shake the
ground and cause damage.
Answer: Explanation1

Now, Answer the following question given the example formats above:

Question: How is snow formed?
Explanation1: Snow is formed when water vapor in the air freezes into ice
crystals in the atmosphere, which can combine and grow into snowflakes as they
fall through the atmosphere and accumulate on the ground.
Explanation2: Water vapor freezes into ice crystals forming snow.
Answer:
```

--------------------------------

### Extract Only Ordered Items to JSON - Gemini with Example Prefix

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies

Uses a response prefix and example to guide the model to output only ordered items in the JSON response, omitting fields with zero quantities. This reduces response size and improves clarity by showing the model the desired format through an example.

```json
{
  "hamburger": 2,
  "drink": 1,
  "fries": 1
}
```

--------------------------------

### Import Gemini API and Audio Modules in Node.js

Source: https://ai.google.dev/gemini-api/docs/live_example=mic-stream

Imports the required modules for interacting with the Google Gemini API and for handling audio input/output in Node.js. This sets up the environment for building real-time audio applications using the `@google/genai`, `mic`, and `speaker` libraries.

```javascript
import { GoogleGenAI, Modality } from '@google/genai';
import mic from 'mic';
import Speaker from 'speaker';
```

--------------------------------

### Guide Conversational Response Style with System Instruction (Gemini API)

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

This snippet demonstrates using a system instruction to establish a consistent response format and tone for the model. The instruction guides the model to provide comprehensive, detailed answers unless explicitly asked for conciseness, as shown by the detailed business advice generated.

```text
All questions should be answered comprehensively with details, unless the user requests a concise response specifically.
```

```text
What is a smart way to make a business that sells DVD's in 2025?
```

```text
Starting a business selling DVDs in 2025 presents significant challenges due to the overwhelming dominance of digital streaming and on-demand services; a "smart" approach would therefore require a highly specialized niche, a strong value proposition beyond just the disc, and likely a focus on community or collector markets rather than mainstream consumption.

Here's a breakdown of what a smart DVD business in 2025 would likely entail:

1. Extreme Niche Specialization: You cannot compete with streaming libraries. Your business must focus on what digital doesn't offer easily or at all. This could include:

    * Out-of-Print & Rare Titles: Sourcing films or TV shows that have never been released digitally or are currently unavailable on major streaming platforms.
    ....
```

--------------------------------

### Python - Code Execution Example

Source: https://ai.google.dev/gemini-api/docs/code-execution

Python example demonstrating how to enable and use code execution with the Gemini API client. Shows how to configure the code execution tool and process the response parts.

```APIDOC
## Python Code Execution Implementation

### Description
Demonstrates enabling code execution using the Python Gemini API client library.

### Example Code
```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.",
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    if part.executable_code is not None:
        print(part.executable_code.code)
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)
```

### Key Points
- Import `genai` and `types` from the google.genai module
- Configure `GenerateContentConfig` with `tools` parameter
- Include `ToolCodeExecution` in the tools array
- Access response parts: `text`, `executable_code`, and `code_execution_result`
```

--------------------------------

### Start Chat and Send Messages - Python

Source: https://ai.google.dev/gemini-api/docs/migrate

Initialize a chat session and send multiple messages to the Gemini model. The before example uses the older SDK with GenerativeModel, while the after example uses the new genai.Client API with simplified syntax.

```python
import google.generativeai as genai

model = genai.GenerativeModel('gemini-2.0-flash')
chat = model.start_chat()

response = chat.send_message(
    "Tell me a story in 100 words")
response = chat.send_message(
    "What happened after that?")
```

```python
from google import genai

client = genai.Client()

chat = client.chats.create(model='gemini-2.0-flash')

response = chat.send_message(
    message='Tell me a story in 100 words')
response = chat.send_message(
    message='What happened after that?')
```

--------------------------------

### Python: Initialize Gemini Client and Prepare Style Transfer Inputs

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ko

This Python snippet demonstrates the initial steps for performing an image style transfer using the Google GenAI library. It imports necessary modules, initializes a `genai.Client`, loads a local image file (`city_image`), and constructs a detailed text prompt (`text_input`) that describes the desired style transfer operation, specifically applying Van Gogh's 'Starry Night' style to a city street image. This setup prepares the arguments for an subsequent API call.

```python
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

# Base image prompt: "A photorealistic, high-resolution photograph of a busy city street in New York at night, with bright neon signs, yellow taxis, and tall skyscrapers."
city_image = Image.open('/path/to/your/city.png')
text_input = """Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."""
```

--------------------------------

### Product Mockup Image Generation Prompt Templates

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

These plaintext snippets provide examples of prompts used to generate high-quality product photographs. The first is a general template with placeholders for customizable details, and the second is a specific, detailed example for generating an image of a minimalist ceramic coffee mug.

```plaintext
A high-resolution, studio-lit product photograph of a [product description]
on a [background surface/description]. The lighting is a [lighting setup,
e.g., three-point softbox setup] to [lighting purpose]. The camera angle is
a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp
focus on [key detail]. [Aspect ratio].
```

```plaintext
A high-resolution, studio-lit product photograph of a minimalist ceramic
coffee mug in matte black, presented on a polished concrete surface. The
lighting is a three-point softbox setup designed to create soft, diffused
highlights and eliminate harsh shadows. The camera angle is a slightly
elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with
sharp focus on the steam rising from the coffee. Square image.
```

--------------------------------

### Initialize Node.js Gemini Client and Speaker Setup

Source: https://ai.google.dev/gemini-api/docs/live_example=mic-stream&hl=sq

Initializes the `GoogleGenAI` client for API interaction and defines utility functions (`waitMessage`, `createSpeaker`) to manage asynchronous message queues and set up the audio output speaker for real-time playback. The `live()` function encapsulates the main logic for the Node.js audio interaction.

```javascript
import { GoogleGenAI, Modality } from '@google/genai';
import mic from 'mic';
import Speaker from 'speaker';

const ai = new GoogleGenAI({});
// WARNING: Do not use API keys in client-side (browser based) applications
// Consider using Ephemeral Tokens instead
// More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

async function live() {
  const responseQueue = [];
  const audioQueue = [];
  let speaker;

  async function waitMessage() {
    while (responseQueue.length === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    return responseQueue.shift();
  }

  function createSpeaker() {
    if (speaker) {
      process.stdin.unpipe(speaker);
      speaker.end();
    }
    speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 24000,
    });
    speaker.on('error', (err) => console.error('Speaker error:', err));
    process.stdin.pipe(speaker);
```

--------------------------------

### Gemini API Client - Go

Source: https://ai.google.dev/gemini-api/docs/quickstart

Initialize the Gemini API client in Go and generate content from a text prompt. The client automatically retrieves the API key from the GEMINI_API_KEY environment variable.

```APIDOC
## Go Client Example

### Description
Demonstrates how to use the Go Gemini API client to generate content.

### Usage
```go
package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("Explain how AI works in a few words"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

### Method Signature
- **client.Models.GenerateContent(ctx, model, content, options)** - Generates content using the specified model
  - **ctx** (context.Context) - Required - Context for the request
  - **model** (string) - Required - The model identifier (e.g., "gemini-2.5-flash")
  - **content** (genai.Part) - Required - The content to send (use genai.Text() for text)
  - **options** (interface{}) - Optional - Additional options

### Returns
- **result.Text()** (string) - The generated text response from the model
```

--------------------------------

### Generate Video from Image using Gemini API (Python, JavaScript)

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=pl

This example illustrates a two-step process: first, generating an initial image using the `gemini-2.5-flash-image` model, and then using that generated image as a starting frame to produce a video with the `veo-3.1-generate-preview` model. The script then polls the video generation operation until completion and downloads the final MP4 file. This workflow demonstrates combining different Gemini models for advanced content creation.

```python
import time
from google import genai

client = genai.Client()

prompt = "Panning wide shot of a calico kitten sleeping in the sunshine"

# Step 1: Generate an image with Nano Banana.
image = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=prompt,
    config={"response_modalities":['IMAGE']}
)

# Step 2: Generate video with Veo 3.1 using the image.
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=image.parts[0].as_image(),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3_with_image_input.mp4")
print("Generated video saved to veo3_with_image_input.mp4")
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = "Panning wide shot of a calico kitten sleeping in the sunshine";

// Step 1: Generate an image with Nano Banana.
const imageResponse = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  prompt: prompt,
});

// Step 2: Generate video with Veo 3.1 using the image.
let operation = await ai.models.generateVideos({
  model: "veo-3.1-generate-preview",
  prompt: prompt,
  image: {
    imageBytes: imageResponse.generatedImages[0].image.imageBytes,
    mimeType: "image/png",
  },
});

// Poll the operation status until the video is ready.
while (!operation.done) {
  console.log("Waiting for video generation to complete...")
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({
    operation: operation,
  });
}

// Download the video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "veo3_with_image_input.mp4",
});
console.log(`Generated video saved to veo3_with_image_input.mp4`);
```

--------------------------------

### Generate Content - Go SDK Example

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=ru&lang=python

Example implementation using the Google Gemini Go SDK to generate content with custom configuration parameters. Demonstrates setting temperature, topP, topK, and response MIME type.

```APIDOC
## Go SDK - Generate Content

### Description
Implements content generation using the official Google Gemini Go client library with custom generation configuration.

### Code Example
```go
temp := float32(0.9)
topP := float32(0.5)
topK := float32(20.0)

config := &genai.GenerateContentConfig{
  Temperature:      &temp,
  TopP:             &topP,
  TopK:             &topK,
  ResponseMIMEType: "application/json",
}

result, _ := client.Models.GenerateContent(
  ctx,
  "gemini-2.5-flash",
  genai.Text("What is the average size of a swallow?"),
  config,
)

fmt.Println(result.Text())
```

### Configuration Parameters Used
- **Temperature**: 0.9 - Moderate randomness
- **TopP**: 0.5 - Nucleus sampling at 50% probability mass
- **TopK**: 20.0 - Consider top 20 tokens
- **ResponseMIMEType**: "application/json" - JSON formatted response
```

--------------------------------

### Configure Gemini Live API client with PyAudio for microphone streaming

Source: https://ai.google.dev/gemini-api/docs/live

Initialize Gemini client and configure PyAudio settings for real-time microphone audio streaming. Sets audio format to 16-bit PCM, 16kHz mono for input and 24kHz for received audio. This server-side example streams audio from the microphone and plays returned audio responses.

```Python
import asyncio
from google import genai
import pyaudio

client = genai.Client()

# --- pyaudio config ---
FORMAT = pyaudio.paInt16
CHANNELS = 1
SEND_SAMPLE_RATE = 16000
RECEIVE_SAMPLE_RATE = 24000
CHUNK_SIZE = 1024

pya = pyaudio.PyAudio()
```

--------------------------------

### Install Google GenAI SDK - Legacy vs New Libraries

Source: https://ai.google.dev/gemini-api/docs/migrate

Installation commands for migrating from legacy google-generativeai packages to the new google-genai SDK across multiple programming languages. The new SDK provides a streamlined installation process with simplified package names.

```python-legacy
pip install -U -q "google-generativeai"
```

```python-new
pip install -U -q "google-genai"
```

```javascript-legacy
npm install @google/generative-ai
```

```javascript-new
npm install @google/genai
```

```go-legacy
go get github.com/google/generative-ai-go
```

```go-new
go get google.golang.org/genai
```

--------------------------------

### Generate Text using Gemini API (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/quickstart_hl=ar

This snippet illustrates how to interact with the Google Gemini API to generate text based on a user-provided prompt. It demonstrates initializing the Gemini client (or making direct API calls), specifying the 'gemini-2.5-flash' model, and passing the prompt 'Explain how AI works in a few words'. The examples cover various programming languages and command-line tools, showcasing how to retrieve and print the generated text, assuming the API key is sourced from an environment variable like `GEMINI_API_KEY`.

```python
# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash", contents="Explain how AI works in a few words"
)
print(response.text)
```

```javascript
import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();
```

```go
package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("Explain how AI works in a few words"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

```java
package com.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GenerateTextFromTextInput {
  public static void main(String[] args) {
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    Client client = new Client();

    GenerateContentResponse response =
        client.models.generateContent(
            "gemini-2.5-flash",
            "Explain how AI works in a few words",
            null);

    System.out.println(response.text());
  }
}
```

```csharp
using System.Threading.Tasks;
using Google.GenAI;
using Google.GenAI.Types;

public class GenerateContentSimpleText {
  public static async Task main() {
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    var client = new Client();
    var response = await client.Models.GenerateContentAsync(
      model: "gemini-2.5-flash", contents: "Explain how AI works in a few words"
    );
    Console.WriteLine(response.Candidates[0].Content.Parts[0].Text);
  }
}
```

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works in a few words' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

--------------------------------

### Go Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Example implementation using the Go client library for Gemini.

```APIDOC
## Go Example

### Description
This Go code snippet shows how to generate an image from a sketch using the Gemini API.

### Method
POST

### Endpoint
Uses the /v1beta/models/gemini-3-pro-image-preview:generateContent endpoint.

### Parameters
- The code reads an image from a file and provides a text prompt.

### Request Example
```go
imgData, _ := os.ReadFile("/path/to/your/car_sketch.png")

parts := []*genai.Part{
  &genai.Part{
    InlineData: &genai.Blob{
      MIMEType: "image/png",
      Data:     imgData,
    },
  },
  genai.NewPartFromText("Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting."),
}

contents := []*genai.Content{
  genai.NewContentFromParts(parts, genai.RoleUser),
}

result, _ := client.Models.GenerateContent(
  ctx,
  "gemini-3-pro-image-preview",
  contents,
)
```

### Response
- The code iterates through the response and saves the image to a file.

### Response Example
```go
for _, part := range result.Candidates[0].Content.Parts {
  if part.Text != "" {
    fmt.Println(part.Text)
  } else if part.InlineData != nil {
    imageBytes := part.InlineData.Data
    outputFilename := "car_photo.png"
    _ = os.WriteFile(outputFilename, imageBytes, 0644)
  }
}
```
```

--------------------------------

### Upload Audio File - Go Implementation

Source: https://ai.google.dev/gemini-api/docs/audio

Upload an audio file and generate content using the Gemini API with the Go SDK. This example shows context-based initialization and error handling.

```APIDOC
## Go: Upload and Process Audio with Gemini

### Code Example
```go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  // Upload audio file from path
  localAudioPath := "/path/to/sample.mp3"
  uploadedFile, _ := client.Files.UploadFromPath(
      ctx,
      localAudioPath,
      nil,
  )

  // Create parts: text prompt and file reference
  parts := []*genai.Part{
      genai.NewPartFromText("Describe this audio clip"),
      genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
  }
  
  // Create content from parts
  contents := []*genai.Content{
      genai.NewContentFromParts(parts, genai.RoleUser),
  }

  // Generate content
  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash",
      contents,
      nil,
  )

  fmt.Println(result.Text())
}
```

### Steps
1. Create background context
2. Initialize Gemini client with context
3. Upload file using `UploadFromPath()`
4. Create parts array with text and file URI
5. Create content from parts with user role
6. Call `GenerateContent()` with context, model, and contents
7. Output result using `Text()`

### Requirements
- Google GenAI Go SDK
- Valid Gemini API key in environment
```

--------------------------------

### Initialize Gemini API and Configure Live Session in Node.js

Source: https://ai.google.dev/gemini-api/docs/live_example=mic-stream

Initializes the GoogleGenAI client and defines the model and configuration for a real-time Gemini API session, including response modalities (audio) and system instructions. It also includes an important security warning about using API keys in client-side applications.

```javascript
const ai = new GoogleGenAI({});
// WARNING: Do not use API keys in client-side (browser based) applications
// Consider using Ephemeral Tokens instead
// More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

// --- Live API config ---
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: "You are a helpful and friendly AI assistant.",
};
```

--------------------------------

### Format Essay Outline with Completion Strategy - Gemini API

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Demonstrates how to prompt the Gemini model to create an essay outline by starting the outline format and letting the model complete it based on the initiated pattern. This shows how providing a partial structure guides the model to continue in the same format. The example creates an outline for an essay about hummingbirds.

```text
Create an outline for an essay about hummingbirds.
I. Introduction
   *
```

--------------------------------

### Start Chat and Send Messages - JavaScript

Source: https://ai.google.dev/gemini-api/docs/migrate

Initialize a chat session with optional conversation history and send messages. The before example uses GoogleGenerativeAI SDK, while the after example uses the updated GoogleGenAI SDK with a different initialization pattern.

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});
let result = await chat.sendMessage("I have 2 dogs in my house.");
console.log(result.response.text());
result = await chat.sendMessage("How many paws are in my house?");
console.log(result.response.text());
```

```javascript
import {GoogleGenAI} from '@google/genai';

const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });
const chat = ai.chats.create({
  model: "gemini-2.0-flash",
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

const response1 = await chat.sendMessage({
  message: "I have 2 dogs in my house.",
});
console.log("Chat response 1:", response1.text);

const response2 = await chat.sendMessage({
  message: "How many paws are in my house?",
});
console.log("Chat response 2:", response2.text);
```

--------------------------------

### Enable Model Audio Input Transcription - Python and JavaScript

Source: https://ai.google.dev/gemini-api/docs/live-guide

Configure the Gemini API to receive transcriptions of the user's audio input by setting `input_audio_transcription` in the setup config. The example loads audio data from a PCM file, sends it to the model via a live session, and retrieves the transcription of the input audio.

```python
import asyncio
from pathlib import Path
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-2.5-flash-native-audio-preview-12-2025"

config = {
    "response_modalities": ["AUDIO"],
    "input_audio_transcription": {}
}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        audio_data = Path("16000.pcm").read_bytes()

        await session.send_realtime_input(
            audio=types.Blob(data=audio_data, mime_type='audio/pcm;rate=16000')
        )

        async for msg in session.receive():
            if msg.server_content.input_transcription:
                print('Transcript:', msg.server_content.input_transcription.text)

if __name__ == "__main__":
    asyncio.run(main())
```

```javascript
import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from "node:fs";
import pkg from 'wavefile';
const { WaveFile } = pkg;

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

const config = {
  responseModalities: [Modality.AUDIO],
  inputAudioTranscription: {}
};

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turns;
  }
```

--------------------------------

### Setup for Gemini API Image Editing Request in Python

Source: https://ai.google.dev/gemini-api/docs/image-generation

This Python code snippet demonstrates how to set up an image manipulation request using the `google-generativeai` library. It initializes the client, loads input images using PIL, and defines a comprehensive text prompt to guide the image editing process. This is the preparatory step before making the actual API call.

```python
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

# Base image prompts:
# 1. Woman: "A professional headshot of a woman with brown hair and blue eyes, wearing a plain black t-shirt, against a neutral studio background."
# 2. Logo: "A simple, modern logo with the letters 'G' and 'A' in a white circle."
woman_image = Image.open('/path/to/your/woman.png')
logo_image = Image.open('/path/to/your/logo.png')
text_input = """Take the first image of the woman with brown hair, blue eyes, and a neutral
expression. Add the logo from the second image onto her black t-shirt.
Ensure the woman's face and features remain completely unchanged. The logo
should look like it's naturally printed on the fabric, following the folds
of the shirt."""
```

--------------------------------

### Initialize Google Gemini API Client in Python

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

This Python snippet demonstrates the basic setup for interacting with the Google Gemini API. It imports the necessary `google.genai` library and `PIL` for image handling, then initializes the Gemini API client, preparing it for subsequent API calls.

```python
from google import genai
from PIL import Image

client = genai.Client()
```

--------------------------------

### Gemini API Client - C#

Source: https://ai.google.dev/gemini-api/docs/quickstart

Initialize the Gemini API client in C# and asynchronously generate content from a text prompt. The client automatically retrieves the API key from the GEMINI_API_KEY environment variable.

```APIDOC
## C# Client Example

### Description
Demonstrates how to use the C# Gemini API client to generate content asynchronously.

### Usage
```csharp
using System.Threading.Tasks;
using Google.GenAI;
using Google.GenAI.Types;

public class GenerateContentSimpleText {
  public static async Task Main() {
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    var client = new Client();
    var response = await client.Models.GenerateContentAsync(
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in a few words"
    );
    Console.WriteLine(response.Candidates[0].Content.Parts[0].Text);
  }
}
```

### Method Signature
- **client.Models.GenerateContentAsync(model, contents)** - Asynchronously generates content using the specified model
  - **model** (string) - Required - The model identifier (e.g., "gemini-2.5-flash")
  - **contents** (string) - Required - The text prompt to send to the model

### Returns
- **response.Candidates[0].Content.Parts[0].Text** (string) - The generated text response from the model
```

--------------------------------

### Gemini API Client - Python

Source: https://ai.google.dev/gemini-api/docs/quickstart

Initialize the Gemini API client in Python and generate content from a text prompt. The client automatically retrieves the API key from the GEMINI_API_KEY environment variable.

```APIDOC
## Python Client Example

### Description
Demonstrates how to use the Python Gemini API client to generate content.

### Usage
```python
import genai

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Explain how AI works in a few words"
)
print(response.text)
```

### Method Signature
- **client.models.generate_content(model, contents)** - Generates content using the specified model
  - **model** (string) - Required - The model identifier (e.g., "gemini-2.5-flash")
  - **contents** (string) - Required - The text prompt to send to the model

### Returns
- **response.text** (string) - The generated text response from the model
```

--------------------------------

### Generate Content with Gemini API - Multi-Language Implementation

Source: https://ai.google.dev/gemini-api/docs/index

Complete implementation for generating text content from a text prompt using Google's Gemini API across multiple programming languages. Each example initializes a client, sends a content generation request with a text prompt to the specified Gemini model, and outputs the generated response text. Requires appropriate API authentication (API key for REST/most SDKs, implicit for some client libraries).

```python
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain how AI works in a few words",
)

print(response.text)
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();
```

```go
package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("Explain how AI works in a few words"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

```java
package com.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GenerateTextFromTextInput {
  public static void main(String[] args) {
    Client client = new Client();

    GenerateContentResponse response =
        client.models.generateContent(
            "gemini-2.5-flash",
            "Explain how AI works in a few words",
            null);

    System.out.println(response.text());
  }
}
```

```csharp
using System.Threading.Tasks;
using Google.GenAI;
using Google.GenAI.Types;

public class GenerateContentSimpleText {
  public static async Task main() {
    var client = new Client();
    var response = await client.Models.GenerateContentAsync(
      model: "gemini-2.5-flash", contents: "Explain how AI works in a few words"
    );
    Console.WriteLine(response.Candidates[0].Content.Parts[0].Text);
  }
}
```

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

--------------------------------

### Configure Gemini API for Live Audio Streaming

Source: https://ai.google.dev/gemini-api/docs/live

This snippet defines the model and configuration for connecting to the Gemini API with live audio capabilities. It specifies the model version, response modalities (AUDIO), and a system instruction for the AI assistant. This configuration is used for both Python and Node.js implementations.

```python
MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"
CONFIG = {
    "response_modalities": ["AUDIO"],
    "system_instruction": "You are a helpful and friendly AI assistant.",
}
```

```javascript
const ai = new GoogleGenAI({});
// WARNING: Do not use API keys in client-side (browser based) applications
// Consider using Ephemeral Tokens instead
// More information at: https://ai.google.dev/gemini-api/docs/ephemeral-tokens

// --- Live API config ---
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: "You are a helpful and friendly AI assistant.",
};
```

--------------------------------

### Video Generation Implementation Examples

Source: https://ai.google.dev/gemini-api/docs/video_hl=vi

Complete code examples demonstrating how to generate videos using the Gemini API across multiple programming languages and platforms, including handling polling and downloading the generated video.

```APIDOC
## Video Generation Implementation Examples

### Python Implementation
```python
from google.genai import Client

client = Client()

# Generate video
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="A cinematic shot of a majestic lion in the savannah.",
    config={
        "aspect_ratio": "16:9",
        "negative_prompt": "cartoon, drawing, low quality"
    }
)

# Poll operation status
while not operation.done:
    print("Waiting for video generation to complete...")
    import time
    time.sleep(10)
    operation = client.operations.get_videos_operation(operation=operation)

# Download the generated video
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("parameters_example.mp4")
print("Generated video saved to parameters_example.mp4")
```

### JavaScript Implementation
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

let operation = await ai.models.generateVideos({
  model: "veo-3.1-generate-preview",
  prompt: "A cinematic shot of a majestic lion in the savannah.",
  config: {
    aspectRatio: "16:9",
    negativePrompt: "cartoon, drawing, low quality"
  }
});

// Poll the operation status until the video is ready
while (!operation.done) {
  console.log("Waiting for video generation to complete...")
  await new Promise((resolve) => setTimeout(resolve, 10000));
  operation = await ai.operations.getVideosOperation({
    operation: operation
  });
}

// Download the generated video
ai.files.download({
  file: operation.response.generatedVideos[0].video,
  downloadPath: "parameters_example.mp4"
});
console.log(`Generated video saved to parameters_example.mp4`);
```

### Go Implementation
```go
package main

import (
    "context"
    "log"
    "os"
    "time"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    videoConfig := &genai.GenerateVideosConfig{
        AspectRatio: "16:9",
        NegativePrompt: "cartoon, drawing, low quality",
    }

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        "A cinematic shot of a majestic lion in the savannah.",
        nil,
        videoConfig,
    )

    // Poll the operation status until the video is ready
    for !operation.Done {
        log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "parameters_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

### cURL Implementation
```bash
#!/bin/bash

BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
      "prompt": "A cinematic shot of a majestic lion in the savannah."
    }],
    "parameters": {
      "aspectRatio": "16:9",
      "negativePrompt": "cartoon, drawing, low quality"
    }
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"
    curl -L -o parameters_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  sleep 10
done
```

### Key Implementation Notes
- All implementations follow the same pattern: generate → poll → download
- Poll interval is 10 seconds in examples
- Aspect ratio options: "16:9", "9:16", "1:1"
- Negative prompts help exclude unwanted content types
- Use appropriate error handling in production code
```

--------------------------------

### Gemini API Client - Java

Source: https://ai.google.dev/gemini-api/docs/quickstart

Initialize the Gemini API client in Java and generate content from a text prompt. The client automatically retrieves the API key from the GEMINI_API_KEY environment variable.

```APIDOC
## Java Client Example

### Description
Demonstrates how to use the Java Gemini API client to generate content.

### Usage
```java
package com.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GenerateTextFromTextInput {
  public static void main(String[] args) {
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    Client client = new Client();

    GenerateContentResponse response =
        client.models.generateContent(
            "gemini-2.5-flash",
            "Explain how AI works in a few words",
            null);

    System.out.println(response.text());
  }
}
```

### Method Signature
- **client.models.generateContent(model, contents, options)** - Generates content using the specified model
  - **model** (String) - Required - The model identifier (e.g., "gemini-2.5-flash")
  - **contents** (String) - Required - The text prompt to send to the model
  - **options** (Object) - Optional - Additional options

### Returns
- **response.text()** (String) - The generated text response from the model
```

--------------------------------

### Instruct Gemini for Self-Critique of Generated Output

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies

This example shows how to prompt Gemini 3 to self-critique its generated output against original user constraints. It guides the model to review for intent fulfillment and tone authenticity before finalizing its response.

```plaintext
Before returning your final response, review your generated output against the user's original constraints.
1. Did I answer the user's *intent*, not just their literal words?
2. Is the tone authentic to the requested persona?

```

--------------------------------

### Enable Model Audio Output Transcription - Python and JavaScript

Source: https://ai.google.dev/gemini-api/docs/live-guide

Configure the Gemini API to receive transcriptions of the model's audio responses. Requires setting `output_audio_transcription` in the setup config, with transcription language automatically inferred from the model's response. The example establishes a live session, sends a text message, and receives both model output and its transcription.

```python
import asyncio
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-2.5-flash-native-audio-preview-12-2025"

config = {
    "response_modalities": ["AUDIO"],
    "output_audio_transcription": {}
}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        message = "Hello? Gemini are you there?"

        await session.send_client_content(
            turns={"role": "user", "parts": [{"text": message}]}, turn_complete=True
        )

        async for response in session.receive():
            if response.server_content.model_turn:
                print("Model turn:", response.server_content.model_turn)
            if response.server_content.output_transcription:
                print("Transcript:", response.server_content.output_transcription.text)

if __name__ == "__main__":
    asyncio.run(main())
```

```javascript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

const config = {
  responseModalities: [Modality.AUDIO],
  outputAudioTranscription: {}
};

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turns;
  }

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        responseQueue.push(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      }
    },
    config: config
  });

  const inputTurns = 'Hello how are you?';
  session.sendClientContent({ turns: inputTurns });

  const turns = await handleTurn();

  for (const turn of turns) {
    if (turn.serverContent && turn.serverContent.outputTranscription) {
      console.debug('Received output transcription: %s\n', turn.serverContent.outputTranscription.text);
    }
  }

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
```

--------------------------------

### Generate Concise JSON Object for Order (Gemini API)

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

This snippet illustrates how to guide the model with an example and a response prefix to produce a more concise JSON output. It demonstrates omitting fields that were not ordered, reducing the size of the response by only including relevant items.

```text
Valid fields are cheeseburger, hamburger, fries, and drink.
Order: Give me a cheeseburger and fries
Output:
```
{
  "cheeseburger": 1,
  "fries": 1
}
```
Order: I want two burgers, a drink, and fries.
Output:
```

```json
{
  "hamburger": 2,
  "drink": 1,
  "fries": 1
}
```

--------------------------------

### Scene Description - Environmental Context Setup

Source: https://ai.google.dev/gemini-api/docs/speech-generation

Template for establishing the scene context including location, mood, time, and environmental details. The scene provides crucial context that guides the acting performance in an organic way and establishes the overall tone and vibe of the interaction.

```markdown
## THE SCENE: The London Studio
It is 10:00 PM in a glass-walled studio overlooking the moonlit London skyline,
but inside, it is blindingly bright. The red "ON AIR" tally light is blazing.
Jaz is standing up, not sitting, bouncing on the balls of their heels to the
rhythm of a thumping backing track. Their hands fly across the faders on a
massive mixing desk. It is a chaotic, caffeine-fueled cockpit designed to
wake up an entire nation.
```

```markdown
## THE SCENE: Homegrown Studio
A meticulously sound-treated bedroom in a suburban home. The space is
deadened by plush velvet curtains and a heavy rug, but there is a
distinct "proximity effect."
```

--------------------------------

### Generate image from text prompt with Gemini API

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

These examples demonstrate how to use the Gemini API's `generateContent` method with the `gemini-2.5-flash-image` model. They take an input image and a text prompt, then process the API response to save the generated image to a file and print any accompanying text output. Ensure you have the necessary Google GenAI client libraries installed and your API key configured.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[city_image, text_input],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("city_style_transfer.png")
```

```java
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class StyleTransfer {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.5-flash-image",
          Content.fromParts(
              Part.fromBytes(
                  Files.readAllBytes(
                      Path.of("/path/to/your/city.png")),
                  "image/png"),
              Part.fromText("""
                  Transform the provided photograph of a modern city
                  street at night into the artistic style of
                  Vincent van Gogh's 'Starry Night'. Preserve the
                  original composition of buildings and cars, but
                  render all elements with swirling, impasto
                  brushstrokes and a dramatic palette of deep blues
                  and bright yellows.
                  """)),
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("city_style_transfer.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const imagePath = "/path/to/your/city.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
    { text: "Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("city_style_transfer.png", buffer);
      console.log("Image saved as city_style_transfer.png");
    }
  }
}

main();
```

```go
package main

import (
  "context"
  "fmt"
  "log"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  imagePath := "/path/to/your/city.png"
  imgData, _ := os.ReadFile(imagePath)

  parts := []*genai.Part{
    &genai.Part{
      InlineData: &genai.Blob{
        MIMEType: "image/png",
        Data:     imgData,
      },
    },
    genai.NewPartFromText("Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."),
  }

  contents := []*genai.Content{
    genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash-image",
      contents,
  )

  for _, part := range result.Candidates[0].Content.Parts {
      if part.Text != "" {
          fmt.Println(part.Text)
      } else if part.InlineData != nil {
          imageBytes := part.InlineData.Data
          outputFilename := "city_style_transfer.png"
          _ = os.WriteFile(outputFilename, imageBytes, 0644)
      }
  }
}
```

```curl
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
```

--------------------------------

### Structured Prompting with Markdown for Gemini Models

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies

This example demonstrates using Markdown headings for structured prompting, enabling Gemini models to clearly identify different sections like identity, constraints, and output format. This approach improves prompt parsing and adherence to specific instructions.

```markdown
# Identity
You are a senior solution architect.

# Constraints
- No external libraries allowed.
- Python 3.11+ syntax only.

# Output format
Return a single code block.

```

--------------------------------

### Configure Code Execution Tool - Go

Source: https://ai.google.dev/gemini-api/docs/code-execution

Create a Gemini client and set up code execution by adding a ToolCodeExecution to the GenerateContentConfig. Call GenerateContent with the model name and text prompt, then access the result's text, executable code, and execution results.

```Go
package main

import (
    "context"
    "fmt"
    "os"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}},
        },
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("What is the sum of the first 50 prime numbers? " +
                  "Generate and run code for the calculation, and make sure you get all 50."),
        config,
    )

    fmt.Println(result.Text())
    fmt.Println(result.ExecutableCode())
    fmt.Println(result.CodeExecutionResult())
}
```

--------------------------------

### Generate Product Mockup Image using Gemini API

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

This collection of code examples demonstrates how to use the Gemini API across different programming languages to generate a product mockup image. It sends a detailed prompt to the `gemini-2.5-flash-image` model and then processes the multi-part response, printing any text or saving the generated image data to a file. Note: The Go example provided is incomplete.

```Python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents="A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image.",
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("product_mockup.png")
```

```Java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class ProductMockup {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.5-flash-image",
          """
          A high-resolution, studio-lit product photograph of a minimalist
          ceramic coffee mug in matte black, presented on a polished
          concrete surface. The lighting is a three-point softbox setup
          designed to create soft, diffused highlights and eliminate harsh
          shadows. The camera angle is a slightly elevated 45-degree shot
          to showcase its clean lines. Ultra-realistic, with sharp focus
          on the steam rising from the coffee. Square image.
          """,
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("product_mockup.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```JavaScript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const prompt =
    "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image.";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("product_mockup.png", buffer);
      console.log("Image saved as product_mockup.png");
    }
  }
}

main();
```

```Go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash-image",

```

--------------------------------

### Detailed Example Prompt for Logo Integration on an Image

Source: https://ai.google.dev/gemini-api/docs/image-generation

This prompt provides a concrete example of how to instruct the Gemini API to add a logo to a person's t-shirt while maintaining the subject's original features. It details the subject's appearance and the desired integration of the logo, showcasing how specificity helps achieve high-fidelity results.

```plaintext
"Take the first image of the woman with brown hair, blue eyes, and a neutral
expression. Add the logo from the second image onto her black t-shirt.
Ensure the woman's face and features remain completely unchanged. The logo
should look like it's naturally printed on the fabric, following the folds
of the shirt."
```

--------------------------------

### Start Customer Support Analysis Crew Execution (Python)

Source: https://ai.google.dev/gemini-api/docs/crewai-example_hl=ar

This snippet initiates the execution of the defined CrewAI crew. It prints a starting message and is designed to run the configured agents and tasks. The 'inputs' dictionary can be used to provide initial context if required by the first task in the workflow, though it's commented out in this example.

```python
# Start the crew's work
print("--- Starting Customer Support Analysis Crew ---")
# The 'inputs' dictionary provides initial context if needed by the first task.
```

--------------------------------

### Probability Distribution Output Example

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Example output showing how a generative model produces a probability distribution of likely next tokens/words given an input prompt. This demonstrates the deterministic first stage where the model calculates probabilities for potential next words.

```text
[("fence", 0.77), ("ledge", 0.12), ("blanket", 0.03), ...]
```

--------------------------------

### Generate Content using Gemini Developer API and Vertex AI (Go)

Source: https://ai.google.dev/gemini-api/docs/migrate-to-cloud

This Go example demonstrates generating text content with the `google.golang.org/genai` library, comparing implementations for the Gemini Developer API and Vertex AI Gemini API. The Vertex AI client initialization includes project, location, and backend configuration, while the Developer API uses a simpler client setup.

```go
import (
  "context"
  "encoding/json"
  "fmt"
  "log"
  "google.golang.org/genai"
)

// Your Google API key
const apiKey = "your-api-key"

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  // Call the GenerateContent method.
  result, err := client.Models.GenerateContent(ctx, "gemini-2.0-flash", genai.Text("Tell me about New York?"), nil)

}

```

```go
import (
  "context"
  "encoding/json"
  "fmt"
  "log"
  "google.golang.org/genai"
)

// Your GCP project
const project = "your-project"

// A GCP location like "us-central1"
const location = "some-gcp-location"

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, &genai.ClientConfig
  {
        Project:  project,
      Location: location,
      Backend:  genai.BackendVertexAI,
  })

  // Call the GenerateContent method.
  result, err := client.Models.GenerateContent(ctx, "gemini-2.0-flash", genai.Text("Tell me about New York?"), nil)

}

```

--------------------------------

### GET {video_uri}

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=pl

Downloads the generated video file from the provided URI. Requires API key authentication and supports HTTP redirects for file retrieval.

```APIDOC
## GET {video_uri}

### Description
Downloads the generated video file from the URI provided in the operation response. This endpoint supports redirect following for proper video file retrieval.

### Method
GET

### Endpoint
`{video_uri}`

### Headers
- **x-goog-api-key** (string) - Required - Google API key for authentication

### Query Parameters
None

### Response
#### Success Response (200)
- **Content-Type** (string) - video/mp4 or appropriate video MIME type
- **Content-Length** (string) - Size of the video file in bytes
- **Body** (binary) - The video file content

### Notes
- Supports HTTP 301/302 redirects
- Video file is returned as binary data
- Save response body directly to file with .mp4 extension
```

--------------------------------

### Configure Gemini API for Code Execution in Go

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=bn

This Go example illustrates how to set up the Gemini API client to activate the code execution feature. It queries the `gemini-2.5-flash` model with a request that requires computation, attaching a `ToolCodeExecution` configuration, and prints the generated text, executable code, and code execution results from the model's response.

```go
package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}},
        },
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("What is the sum of the first 50 prime numbers? " +
                  "Generate and run code for the calculation, and make sure you get all 50."),
        config,
    )

    fmt.Println(result.Text())
    fmt.Println(result.ExecutableCode())
    fmt.Println(result.CodeExecutionResult())
}
```

--------------------------------

### Install AI SDK and Dependencies with npm/pnpm/yarn

Source: https://ai.google.dev/gemini-api/docs/vercel-ai-sdk-example

Install the AI SDK, Google Generative AI provider, and supporting libraries including TypeScript, type definitions, and utilities. Includes comment guidance for tsconfig.json configuration.

```bash
npm install ai @ai-sdk/google zod
npm install -D @types/node tsx typescript && npx tsc --init
```

```bash
pnpm add ai @ai-sdk/google zod
pnpm add -D @types/node tsx typescript
```

```bash
yarn add ai @ai-sdk/google zod
yarn add -D @types/node tsx typescript && yarn tsc --init
```

--------------------------------

### Example Image Generation Prompt

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ar

A concrete example prompt demonstrating how to generate a professional logo with specific text, font, and design requirements for a coffee shop brand using the Gemini API.

```text
Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.
```

--------------------------------

### Install Playwright dependencies for Gemini Computer Use (Bash)

Source: https://ai.google.dev/gemini-api/docs/computer-use

This command-line snippet shows how to install the necessary Python packages and browser binaries for using Playwright with the Gemini Computer Use model. It ensures the environment is ready for browser automation tasks.

```Bash
pip install google-genai playwright
playwright install chromium
```

--------------------------------

### Gemini API - JSON Mode Setup (Go)

Source: https://ai.google.dev/gemini-api/docs/structured-output_hl=hi

Configure and use the Gemini API with JSON mode in Go applications. This example shows how to set up the client, define response schemas, and call the GenerateContent method with structured JSON responses.

```APIDOC
## Go - JSON Mode Configuration

### Description
Initialize the Google Generative AI client in Go and configure JSON mode with a custom response schema. Demonstrates proper error handling and structured response parsing.

### Setup
#### Required Imports
```go
import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)
```

### Parameters
#### Client Configuration
- **ctx** (context.Context) - Background context for API calls
- **model** (string) - Model identifier: "gemini-2.5-flash"

#### GenerateContentConfig
- **ResponseMIMEType** (string) - Set to "application/json"
- **ResponseJsonSchema** (map[string]any) - Schema defining response structure
- **ResponseJsonSchema.type** (string) - Schema type, typically "object"
- **ResponseJsonSchema.properties** (map) - Object properties with type and description
- **ResponseJsonSchema.required** (array) - Required field names

### Request Example
```go
config := &genai.GenerateContentConfig{
    ResponseMIMEType: "application/json",
    ResponseJsonSchema: map[string]any{
        "type": "object",
        "properties": map[string]any{
            "recipe_name": map[string]any{
                "type": "string",
                "description": "The name of the recipe"
            },
            "ingredients": map[string]any{
                "type": "array",
                "items": map[string]any{
                    "type": "object",
                    "properties": map[string]any{
                        "name": map[string]any{"type": "string"},
                        "quantity": map[string]any{"type": "string"}
                    },
                    "required": []string{"name", "quantity"}
                }
            },
            "instructions": map[string]any{
                "type": "array",
                "items": map[string]any{"type": "string"}
            }
        },
        "required": []string{"recipe_name", "ingredients", "instructions"}
    }
}

result, err := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash",
    genai.Text(prompt),
    config
)
```

### Error Handling
- Check for errors from **NewClient()** for connection issues
- Check for errors from **GenerateContent()** for API failures
- Log fatal errors and terminate gracefully

### Response
- **result.Text()** (string) - JSON-formatted response matching the schema
```

--------------------------------

### Define Prompts for Stylized Image Generation

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=zh-tw

These examples demonstrate how to construct effective text prompts for generating stylized illustrations or stickers. The first prompt provides a generic template for specifying style, subject, characteristics, color palette, line style, shading style, and background. The second is a concrete example applying this template to generate a specific image. Clear and detailed prompts are crucial for guiding the image generation model.

```text
A [style] sticker of a [subject], featuring [key characteristics] and a
[color palette]. The design should have [line style] and [shading style].
The background must be transparent.

```

```text
A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's
munching on a green bamboo leaf. The design features bold, clean outlines,
simple cel-shading, and a vibrant color palette. The background must be white.

```

--------------------------------

### Test Google API access with curl using ADC

Source: https://ai.google.dev/gemini-api/docs/oauth

This `curl` command verifies the ADC setup by first retrieving an access token from `gcloud` and then using it to make an authenticated GET request to the Generative Language API. It lists available models, confirming successful authentication.

```bash
access_token=$(gcloud auth application-default print-access-token)
project_id=<MY PROJECT ID>
curl -X GET https://generativelanguage.googleapis.com/v1/models \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${access_token}" \
    -H "x-goog-user-project: ${project_id}" | grep '"name"'
```

--------------------------------

### Generate and Save Images using Gemini 3 Pro Image with Grounding

Source: https://ai.google.dev/gemini-api/docs/gemini-3

These code examples demonstrate how to generate high-fidelity images using the Gemini 3 Pro Image model. They utilize the `google_search` tool for grounded generation, specify aspect ratio and resolution, and save the generated image to a local file. The Python example also includes displaying the image, while JavaScript uses `node:fs` to write to a file, and the cURL example makes a direct REST API call.

```Python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents="Generate an infographic of the current weather in Tokyo.",
    config=types.GenerateContentConfig(
        tools=[{"google_search": {}}],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="4K"
        )
    )
)

image_parts = [part for part in response.parts if part.inline_data]

if image_parts:
    image = image_parts[0].as_image()
    image.save('weather_tokyo.png')
    image.show()
```

```JavaScript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

async function run() {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: "Generate a visualization of the current weather in Tokyo.",
    config: {
      tools: [{ googleSearch: {} }],
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "4K"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("weather_tokyo.png", buffer);
    }
  }
}

run();
```

```REST
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "Generate a visualization of the current weather in Tokyo."}]
    }],
    "tools": [{"googleSearch": {}}],
    "generationConfig": {
        "imageConfig": {
          "aspectRatio": "16:9",
          "image_size": "4K"
      }
    }
  }'
```

--------------------------------

### Gemini API Client - JavaScript

Source: https://ai.google.dev/gemini-api/docs/quickstart

Initialize the Gemini API client in JavaScript/TypeScript and generate content from a text prompt. The client automatically retrieves the API key from the GEMINI_API_KEY environment variable.

```APIDOC
## JavaScript Client Example

### Description
Demonstrates how to use the JavaScript Gemini API client to generate content asynchronously.

### Usage
```javascript
import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words"
  });
  console.log(response.text);
}

main();
```

### Method Signature
- **ai.models.generateContent(options)** - Asynchronously generates content using the specified model
  - **model** (string) - Required - The model identifier (e.g., "gemini-2.5-flash")
  - **contents** (string) - Required - The text prompt to send to the model

### Returns
- **response.text** (string) - The generated text response from the model
```

--------------------------------

### Node.js Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Example implementation using the Node.js client library for Gemini.

```APIDOC
## Node.js Example

### Description
This Node.js example demonstrates image generation from an image file and a text prompt using the Gemini API.

### Method
POST

### Endpoint
Uses the /v1beta/models/gemini-3-pro-image-preview:generateContent endpoint.

### Parameters
- The code reads an image from a file and provides a text prompt.

### Request Example
```javascript
const imagePath = "/path/to/your/car_sketch.png";
const imageData = fs.readFileSync(imagePath);
const base64Image = imageData.toString("base64");

const prompt = [
  {
    inlineData: {
      mimeType: "image/png",
      data: base64Image,
    },
  },
  { text: "Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting." },
];

const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: prompt,
});
```

### Response
- The code iterates through the response and saves the image to a file.

### Response Example
```javascript
for (const part of response.candidates[0].content.parts) {
  if (part.text) {
    console.log(part.text);
  } else if (part.inlineData) {
    const imageData = part.inlineData.data;
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync("car_photo.png", buffer);
    console.log("Image saved as car_photo.png");
  }
}
```
```

--------------------------------

### Close Reading Protocol User Prompt Example

Source: https://ai.google.dev/gemini-api/docs/learnlm

An example user prompt showing how a student initiates interaction with the close reading tutor, demonstrating the conversational entry point for the 4 A's protocol learning activity.

```text
hey
```

--------------------------------

### Generate images with Imagen model using Go

Source: https://ai.google.dev/gemini-api/docs/imagen

Demonstrates image generation using the Imagen model in Go. The example creates a client, configures generation parameters, and saves generated images as PNG files to the filesystem.

```go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  config := &genai.GenerateImagesConfig{
      NumberOfImages: 4,
  }

  response, _ := client.Models.GenerateImages(
      ctx,
      "imagen-4.0-generate-001",
      "Robot holding a red skateboard",
      config,
  )

  for n, image := range response.GeneratedImages {
      fname := fmt.Sprintf("imagen-%d.png", n)
          _ = os.WriteFile(fname, image.Image.ImageBytes, 0644)
  }
}
```

--------------------------------

### Go - Enable Code Execution

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=bn

Go example demonstrating how to use the Google GenAI Go client to enable code execution. Shows initialization, configuration, content generation, and result extraction.

```APIDOC
## Go Code Execution Example

### Description
Use the Go Google GenAI client library to enable code execution and process model responses.

### Setup
```go
import (
    "context"
    "fmt"
    "os"
    "google.golang.org/genai"
)
```

### Implementation
```go
package main

import (
    "context"
    "fmt"
    "os"
    "google.golang.org/genai"
)

func main() {
    // Initialize context
    ctx := context.Background()
    
    // Create client
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    // Configure with code execution enabled
    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {
                CodeExecution: &genai.ToolCodeExecution{},
            },
        },
    }

    // Generate content
    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("What is the sum of the first 50 prime numbers? " +
                  "Generate and run code for the calculation, and make sure you get all 50."),
        config,
    )

    // Process results
    fmt.Println(result.Text())
    fmt.Println(result.ExecutableCode())
    fmt.Println(result.CodeExecutionResult())
}
```

### Response Methods
- **result.Text()**: Returns model-generated explanation
- **result.ExecutableCode()**: Returns generated code
- **result.CodeExecutionResult()**: Returns code execution output
```

--------------------------------

### Python Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Example implementation using the Python client library for Gemini.

```APIDOC
## Python Example

### Description
This code snippet demonstrates how to use the Gemini API in Python to generate an image from a sketch and a text prompt.

### Method
POST

### Endpoint
Uses the /v1beta/models/gemini-3-pro-image-preview:generateContent endpoint.

### Parameters
- The image path to your car sketch, and a text prompt for the image generation.

### Request Example
```python
sketch_image = Image.open('/path/to/your/car_sketch.png')
text_input = """Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting."""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[sketch_image, text_input],
)

```

### Response
- The code iterates through the parts of the response and saves the generated image.

### Response Example
```python
for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("car_photo.png")
```
```

--------------------------------

### Python: Initialize Gemini Client with Google Search Retrieval

Source: https://ai.google.dev/gemini-api/docs/grounding

Python implementation for initializing the Gemini client and configuring the google_search retrieval tool with dynamic retrieval settings. Demonstrates how to set up the tool and make API calls with web search augmentation.

```APIDOC
## Google Search Retrieval Tool - Python Client

### Description
Initializes the Gemini API Python client and configures the google_search_retrieval tool with dynamic retrieval configuration for intelligent search-based response grounding.

### Implementation

### Setup
```python
import os
from google import genai
from google.genai import types

# Initialize client
client = genai.Client()
```

### Configure Retrieval Tool
```python
retrieval_tool = types.Tool(
    google_search_retrieval=types.GoogleSearchRetrieval(
        dynamic_retrieval_config=types.DynamicRetrievalConfig(
            mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamic_threshold=0.7  # Only search if confidence > 70%
        )
    )
)

config = types.GenerateContentConfig(
    tools=[retrieval_tool]
)
```

### Generate Content with Search
```python
response = client.models.generate_content(
    model='gemini-1.5-flash',
    contents="Who won the euro 2024?",
    config=config,
)

print(response.text)

# Check if response was grounded in search results
if not response.candidates[0].grounding_metadata:
    print("\nModel answered from its own knowledge.")
```

### Parameters
- **model** (string) - The Gemini model to use (e.g., "gemini-1.5-flash")
- **contents** (string) - The prompt or question for the model
- **config** (GenerateContentConfig) - Configuration including tools
- **dynamic_threshold** (float) - Confidence threshold (0.0-1.0) for triggering web search
```

--------------------------------

### POST /session/set_weighted_prompts - Configure Initial Music Prompts

Source: https://ai.google.dev/gemini-api/docs/music-generation

Sets weighted prompts to guide the initial direction of music generation. Multiple prompts can be combined with different weights to influence the generated music style and characteristics.

```APIDOC
## POST /session/set_weighted_prompts

### Description
Configures weighted prompts that guide music generation. Prompts are applied with numerical weights to influence the generated music. Can be called during initialization or updated in real-time while streaming.

### Method
POST

### Endpoint
`session.set_weighted_prompts()` (Python) / `session.setWeightedPrompts()` (JavaScript)

### Request Body
#### Python
- **prompts** (array) - Required - Array of WeightedPrompt objects or dictionaries
  - **text** (string) - Required - The prompt text describing desired music style
  - **weight** (float) - Required - Weight value (any value except 0; 1.0 is typical starting point)

#### JavaScript
- **weightedPrompts** (array) - Required - Array of weighted prompt objects
  - **text** (string) - Required - The prompt text describing desired music style
  - **weight** (number) - Required - Weight value (any value except 0; 1.0 is typical)

### Request Example
#### Python
```python
await session.set_weighted_prompts(
  prompts=[
    types.WeightedPrompt(text='minimal techno', weight=1.0),
  ]
)
```

#### Python (Multiple Prompts)
```python
from google.genai import types

await session.set_weighted_prompts(
  prompts=[
    {"text": "Piano", "weight": 2.0},
    types.WeightedPrompt(text="Meditation", weight=0.5),
    types.WeightedPrompt(text="Live Performance", weight=1.0),
  ]
)
```

#### JavaScript
```javascript
await session.setWeightedPrompts({
  weightedPrompts: [
    { text: "Minimal techno with deep bass, sparse percussion, and atmospheric synths", weight: 1.0 },
  ],
});
```

#### JavaScript (Real-time Update)
```javascript
await session.setWeightedPrompts({
  weightedPrompts: [
    { text: 'Harmonica', weight: 0.3 },
    { text: 'Afrobeat', weight: 0.7 }
  ],
});
```

### Response
#### Success Response (200)
- **status** (string) - Confirmation that prompts were applied
- **prompts_applied** (array) - List of prompts that were set

### Notes
- Weight values can be any number except 0
- 1.0 is recommended as a starting point
- For smooth transitions, implement cross-fading by sending intermediate weight values
- Abrupt prompt changes may cause abrupt model transitions
```

--------------------------------

### Initialize Lyria RealTime Session and Start Music Generation

Source: https://ai.google.dev/gemini-api/docs/music-generation

This code initializes a Lyria RealTime session, sets an initial weighted prompt and music generation configuration (like BPM and temperature), then starts streaming music. It includes a background task or callback to continuously receive and process audio chunks from the model.

```python
  import asyncio
  from google import genai
  from google.genai import types

  client = genai.Client(http_options={'api_version': 'v1alpha'})

  async def main():
      async def receive_audio(session):
        """Example background task to process incoming audio."""
        while True:
          async for message in session.receive():
            audio_data = message.server_content.audio_chunks[0].data
            # Process audio...
            await asyncio.sleep(10**-12)

      async with (
        client.aio.live.music.connect(model='models/lyria-realtime-exp') as session,
        asyncio.TaskGroup() as tg,
      ):
        # Set up task to receive server messages.
        tg.create_task(receive_audio(session))

        # Send initial prompts and config
        await session.set_weighted_prompts(
          prompts=[
            types.WeightedPrompt(text='minimal techno', weight=1.0),
          ]
        )
        await session.set_music_generation_config(
          config=types.LiveMusicGenerationConfig(bpm=90, temperature=1.0)
        )

        # Start streaming music
        await session.play()
  if __name__ == "__main__":
      asyncio.run(main())

```

```javascript
import { GoogleGenAI } from "@google/genai";
import Speaker from "speaker";
import { Buffer } from "buffer";

const client = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
    apiVersion: "v1alpha" ,
});

async function main() {
  const speaker = new Speaker({
    channels: 2,       // stereo
    bitDepth: 16,      // 16-bit PCM
    sampleRate: 44100, // 44.1 kHz
  });

  const session = await client.live.music.connect({
    model: "models/lyria-realtime-exp",
    callbacks: {
      onmessage: (message) => {
        if (message.serverContent?.audioChunks) {
          for (const chunk of message.serverContent.audioChunks) {
            const audioBuffer = Buffer.from(chunk.data, "base64");
            speaker.write(audioBuffer);
          }
        }
      },
      onerror: (error) => console.error("music session error:", error),
      onclose: () => console.log("Lyria RealTime stream closed."),
    },
  });

  await session.setWeightedPrompts({
    weightedPrompts: [
      { text: "Minimal techno with deep bass, sparse percussion, and atmospheric synths", weight: 1.0 },
    ],
  });

  await session.setMusicGenerationConfig({
    musicGenerationConfig: {
      bpm: 90,
      temperature: 1.0,
      audioFormat: "pcm16",  // important so we know format
      sampleRateHz: 44100,
    },
  });

  await session.play();
}

main().catch(console.error);

```

--------------------------------

### Generate Video from an Image Frame with Python

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=it

This Python snippet demonstrates how to generate a video using an initial image frame. It first generates an image from a text prompt using the `gemini-2.5-flash-image` model (also known as Nano Banana). Subsequently, this generated image is used as the starting point for video generation with the `veo-3.1-generate-preview` model. The code includes a polling mechanism to wait for the video generation to complete before proceeding.

```python
import time
from google import genai

client = genai.Client()

prompt = "Panning wide shot of a calico kitten sleeping in the sunshine"

# Step 1: Generate an image with Nano Banana.
image = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=prompt,
    config={"response_modalities":['IMAGE']}
)

# Step 2: Generate video with Veo 3.1 using the image.
operation = client.models.generateVideos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=image.parts[0].as_image(),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)
```

--------------------------------

### Generate and Download Video with Gemini API (Node.js, Go, Shell)

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=fr

These examples demonstrate the complete workflow for generating a video from a text prompt using the Gemini API, polling for its completion, and then downloading the final video file. They cover client initialization, sending a prompt to the video generation model, implementing a polling mechanism to wait for the operation to finish, and finally, downloading the generated video to a local file. Different language-specific client libraries or direct REST API calls are utilized.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready.
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

```shell
# Note: This script uses jq to parse the JSON response.
# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video and capture the operation name into a variable.
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That\'s the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Start Chat and Send Messages - Go

Source: https://ai.google.dev/gemini-api/docs/migrate

Initialize a chat session with optional conversation history and send messages using the Go SDK. Demonstrates error handling and context management required for Go implementations.

```go
ctx := context.Background()
client, err := genai.NewClient(ctx, option.WithAPIKey("GEMINI_API_KEY"))
if err != nil {
    log.Fatal(err)
}
defer client.Close()

model := client.GenerativeModel("gemini-2.0-flash")
cs := model.StartChat()

cs.History = []*genai.Content{
    {
        Parts: []genai.Part{
            genai.Text("Hello, I have 2 dogs in my house."),
        },
        Role: "user",
    },
    {
        Parts: []genai.Part{
            genai.Text("Great to meet you. What would you like to know?"),
        },
        Role: "model",
    },
}

res, err := cs.SendMessage(ctx, genai.Text("How many paws are in my house?"))
if err != nil {
    log.Fatal(err)
}
printResponse(res) // utility for printing the response
```

```go
ctx := context.Background()
client, err := genai.NewClient(ctx, nil)
if err != nil {
    log.Fatal(err)
}

chat, err := client.Chats.Create(ctx, "gemini-2.0-flash", nil, nil)
if err != nil {
    log.Fatal(err)
}

result, err := chat.SendMessage(ctx, genai.Part{Text: "Hello, I have 2 dogs in my house."})
if err != nil {
    log.Fatal(err)
}
debugPrint(result) // utility for printing result

result, err = chat.SendMessage(ctx, genai.Part{Text: "How many paws are in my house?"})
if err != nil {
    log.Fatal(err)
}
debugPrint(result) // utility for printing result
```

--------------------------------

### Install Python libraries for programmatic credential management

Source: https://ai.google.dev/gemini-api/docs/oauth

This `pip` command installs the necessary Python libraries (`google-api-python-client`, `google-auth-httplib2`, `google-auth-oauthlib`, and `google-generativeai`) required for programmatically managing Google API credentials within a Python application, including OAuth 2.0 flows.

```bash
pip install --upgrade -q google-api-python-client google-auth-httplib2 google-auth-oauthlib
pip install google-generativeai
```

--------------------------------

### Upload Audio File - Python Implementation

Source: https://ai.google.dev/gemini-api/docs/audio

Upload an audio file and generate content using the Gemini API with the Python SDK. This example shows the simplest way to upload files and process them.

```APIDOC
## Python: Upload and Process Audio with Gemini

### Code Example
```python
from google import genai

client = genai.Client()

# Upload audio file
myfile = client.files.upload(file="path/to/sample.mp3")

# Generate content with the uploaded file
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=["Describe this audio clip", myfile]
)

print(response.text)
```

### Steps
1. Initialize the Gemini client
2. Upload audio file using `client.files.upload()`
3. Call `generate_content()` with model name, text prompt, and file reference
4. Access the generated text from `response.text`

### Requirements
- Google GenAI Python SDK
- Valid Gemini API key configured in environment
```

--------------------------------

### Install LangGraph and Google GenAI libraries

Source: https://ai.google.dev/gemini-api/docs/langgraph-example

This command installs the necessary Python packages, including `langgraph`, `langchain-google-genai`, `geopy` for geolocation, and `requests` for HTTP requests, required to build and run the ReAct agent.

```bash
pip install langgraph langchain-google-genai geopy requests
```

--------------------------------

### Basic Gemini Text Generation with AI SDK

Source: https://ai.google.dev/gemini-api/docs/vercel-ai-sdk-example

Create a basic TypeScript application that uses the AI SDK to connect with Gemini 2.5 Flash model and generate text responses. This example serves as a quick setup verification before adding market research functionality.

```typescript
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

async function main() {
  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: 'What is plant-based milk?',
  });

  console.log(text);
}

main().catch(console.error);
```

--------------------------------

### Install Google Generative AI Python client library

Source: https://ai.google.dev/gemini-api/docs/oauth

This `pip` command installs the `google-generativeai` Python client library. This library is essential for interacting with the Google Generative Language API from a Python application.

```bash
pip install google-generativeai
```

--------------------------------

### Video Generation - Go Implementation

Source: https://ai.google.dev/gemini-api/docs/video

Complete Go example demonstrating video generation using the genai package, with polling logic and file I/O operations for downloading the generated video.

```APIDOC
## Go: Video Generation Workflow

### Description
Implements the complete video generation workflow in Go with context management and file operations.

### Implementation Steps

#### 1. Initialize Client and Submit Request
```go
package main

import (
    "context"
    "log"
    "os"
    "time"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )
```

#### 2. Poll Until Complete
```go
    for !operation.Done {
        log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }
```

#### 3. Download Generated Video
```go
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```
```

--------------------------------

### Go: Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=ru

Complete Go example demonstrating video generation using the Google GenAI Go client library with operation polling and file download.

```APIDOC
## Go Video Generation Example

### Description
Go implementation using the Google GenAI SDK for video generation with context and error handling.

### Prerequisites
- Install: `go get google.golang.org/genai`
- Set GOOGLE_API_KEY environment variable

### Code Example
```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready
    for !operation.Done {
        log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

### Key Functions
- `genai.NewClient()` - Initializes the client with context
- `client.Models.GenerateVideos()` - Initiates video generation
- `client.Operations.GetVideosOperation()` - Polls operation status
- `client.Files.Download()` - Downloads the generated video
- `os.WriteFile()` - Saves video to local filesystem
```

--------------------------------

### GET /operations/{operation_name}

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=pl

Polls the status of a video generation operation. Returns the current operation status and, when complete, includes the generated video URI for download.

```APIDOC
## GET /operations/{operation_name}

### Description
Retrieves the current status of a video generation operation. Should be polled periodically until the operation completes. When done, the response includes the generated video URI.

### Method
GET

### Endpoint
`/operations/{operation_name}`

### Path Parameters
- **operation_name** (string) - Required - The operation name returned from the initial video generation request (format: operations/{operation_id})

### Headers
- **x-goog-api-key** (string) - Required - Google API key for authentication

### Response
#### Success Response (200)
- **name** (string) - The operation name
- **done** (boolean) - Indicates if the operation is complete
- **response** (object) - Present only when done=true
  - **generateVideoResponse** (object) - Video generation response
    - **generatedSamples** (array) - Array of generated videos
      - **video** (object) - Video object
        - **uri** (string) - Download URI for the generated video

#### Response Example (In Progress)
```json
{
  "name": "operations/abc123def456",
  "done": false
}
```

#### Response Example (Complete)
```json
{
  "name": "operations/abc123def456",
  "done": true,
  "response": {
    "generateVideoResponse": {
      "generatedSamples": [{
        "video": {
          "uri": "https://storage.googleapis.com/videos/generated_video.mp4"
        }
      }]
    }
  }
}
```
```

--------------------------------

### Python Gemini API Mobile Agent Setup with Custom Tools and System Prompt

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=he

This Python code demonstrates setting up a Gemini API agent for controlling an Android phone. It includes initializing the client, defining a detailed `SYSTEM_PROMPT` to guide the agent's behavior and constraints within a mobile environment, and implementing custom functions (`open_app`, `long_press_at`, `go_home`) as tools for the agent to interact with the device beyond standard browser actions. These custom tools return JSON payloads for the model to interpret.

```python
from typing import Optional, Dict, Any

from google import genai
from google.genai import types
from google.genai.types import Content, Part

client = genai.Client()

SYSTEM_PROMPT = """You are operating an Android phone. Today's date is October 15, 2023, so ignore any other date provided.
* To provide an answer to the user, *do not use any tools* and output your answer on a separate line. IMPORTANT: Do not add any formatting or additional punctuation/text, just output the answer by itself after two empty lines.
* Make sure you scroll down to see everything before deciding something isn't available.
* You can open an app from anywhere. The icon doesn't have to currently be on screen.
* Unless explicitly told otherwise, make sure to save any changes you make.
* If text is cut off or incomplete, scroll or click into the element to get the full text before providing an answer.
* IMPORTANT: Complete the given task EXACTLY as stated. DO NOT make any assumptions that completing a similar task is correct.  If you can't find what you're looking for, SCROLL to find it.
* If you want to edit some text, ONLY USE THE `type` tool. Do not use the onscreen keyboard.
* Quick settings shouldn't be used to change settings. Use the Settings app instead.
* The given task may already be completed. If so, there is no need to do anything.
"""

def open_app(app_name: str, intent: Optional[str] = None) -> Dict[str, Any]:
    """Opens an app by name.

    Args:
        app_name: Name of the app to open (any string).
        intent: Optional deep-link or action to pass when launching, if the app supports it.

    Returns:
        JSON payload acknowledging the request (app name and optional intent).
    """
    return {"status": "requested_open", "app_name": app_name, "intent": intent}

def long_press_at(x: int, y: int) -> Dict[str, int]:
    """Long-press at a specific screen coordinate.

    Args:
        x: X coordinate (absolute), scaled to the device screen width (pixels).
        y: Y coordinate (absolute), scaled to the device screen height (pixels).

    Returns:
        Object with the coordinates pressed and the duration used.
    """
    return {"x": x, "y": y}

def go_home() -> Dict[str, str]:
    """Navigates to the device home screen.

    Returns:
        A small acknowledgment payload.
    """
    return {"status": "home_requested"}
```

--------------------------------

### Direct Imagen Models to Generate Photographs

Source: https://ai.google.dev/gemini-api/docs/imagen

Illustrates a core technique to guide Imagen models to produce images with a photographic style. By explicitly starting prompts with 'A photo of...', users can ensure the generated output resembles a realistic, camera-captured image, influencing the AI's rendering towards photographic qualities.

```Natural Language
A photo of...
```

--------------------------------

### Implement Async Audio Playback Loop - JavaScript

Source: https://ai.google.dev/gemini-api/docs/live

Manages continuous playback of audio from a queue with dynamic speaker initialization and cleanup. The function monitors the audio queue, creates speakers on-demand, writes audio chunks asynchronously, and properly destroys the speaker when the queue is empty to prevent library warnings.

```javascript
async function playbackLoop() {
  // Plays audio from the audio queue.
  while (true) {
    if (audioQueue.length === 0) {
      if (speaker) {
        // Destroy speaker if no more audio to avoid warnings from speaker library
        process.stdin.unpipe(speaker);
        speaker.end();
        speaker = null;
      }
      await new Promise((resolve) => setImmediate(resolve));
    } else {
      if (!speaker) createSpeaker();
      const chunk = audioQueue.shift();
      await new Promise((resolve) => {
        speaker.write(chunk, () => resolve());
      });
    }
  }
}
```

--------------------------------

### Java Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Example implementation using the Java client library for Gemini.

```APIDOC
## Java Example

### Description
This Java code snippet shows how to generate an image from a sketch using the Gemini API.

### Method
POST

### Endpoint
Uses the /v1beta/models/gemini-3-pro-image-preview:generateContent endpoint.

### Parameters
- The code reads an image from a file and provides a text prompt.

### Request Example
```java
GenerateContentResponse response = client.models.generateContent(
    "gemini-3-pro-image-preview",
    Content.fromParts(
        Part.fromBytes(
            Files.readAllBytes(
                Path.of("/path/to/your/car_sketch.png")),
            "image/png"),
        Part.fromText("""
            Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting.
            """)),
    config);
```

### Response
- The code iterates through the response parts and saves the image to a file.

### Response Example
```java
for (Part part : response.parts()) {
  if (part.text().isPresent()) {
    System.out.println(part.text().get());
  } else if (part.inlineData().isPresent()) {
    var blob = part.inlineData().get();
    if (blob.data().isPresent()) {
      Files.write(Paths.get("car_photo.png"), blob.data().get());
    }
  }
}
```
```

--------------------------------

### Connect to Gemini Live API with WebSocket - JavaScript

Source: https://ai.google.dev/gemini-api/docs/live

Establishes a WebSocket connection to Google's Gemini Live API with configuration and event callbacks. Sets up handlers for connection open, incoming messages, errors, and closure events. Returns a session object for sending real-time input to the model.

```javascript
const session = await ai.live.connect({
  model: model,
  config: config,
  callbacks: {
    onopen: () => console.log('Connected to Gemini Live API'),
    onmessage: (message) => responseQueue.push(message),
    onerror: (e) => console.error('Error:', e.message),
    onclose: (e) => console.log('Closed:', e.reason),
  },
});
```

--------------------------------

### Upload Local PDF and Generate Content with Gemini (Python, JavaScript, Go)

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=it

This section provides examples in Python, JavaScript, and Go for uploading a local PDF file to the Gemini API and then using that file to generate content. It covers the process of uploading the file via the client library, handling file processing status (if applicable), and then passing the uploaded file reference along with a text prompt to the `generateContent` method. The examples use the `gemini-2.5-flash` model.

```python
from google import genai
from google.genai import types
import pathlib
import httpx

client = genai.Client()

# Retrieve and encode the PDF byte
file_path = pathlib.Path('large_file.pdf')

# Upload the PDF using the File API
sample_file = client.files.upload(
  file=file_path,
)

prompt=\"Summarize this document\"

response = client.models.generate_content(
  model=\"gemini-2.5-flash\",
  contents=[sample_file, \"Summarize this document\"])
print(response.text)
```

```javascript
import { createPartFromUri, GoogleGenAI } from \"@google/genai\";

const ai = new GoogleGenAI({ apiKey: \"GEMINI_API_KEY\" });

async function main() {
    const file = await ai.files.upload({
        file: 'path-to-localfile.pdf',
        config: {
            displayName: 'A17_FlightPlan.pdf',
        },
    });

    // Wait for the file to be processed.
    let getFile = await ai.files.get({ name: file.name });
    while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: file.name });
        console.log(`current file status: ${getFile.state}`);
        console.log('File is still processing, retrying in 5 seconds');

        await new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });
    }
    if (file.state === 'FAILED') {
        throw new Error('File processing failed.');
    }

    // Add the file to the contents.
    const content = [
        'Summarize this document',
    ];

    if (file.uri && file.mimeType) {
        const fileContent = createPartFromUri(file.uri, file.mimeType);
        content.push(fileContent);
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
    });

    console.log(response.text);

}

main();
```

```go
package main

import (
    \"context\"
    \"fmt\"
    \"os\"
    \"google.golang.org/genai\"
)

func main() {

    ctx := context.Background()
    client, _ := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey:  os.Getenv(\"GEMINI_API_KEY\"),
        Backend: genai.BackendGeminiAPI,
    })
    localPdfPath := \"/path/to/file.pdf\"

    uploadConfig := &genai.UploadFileConfig{MIMEType: \"application/pdf\"}
    uploadedFile, _ := client.Files.UploadFromPath(ctx, localPdfPath, uploadConfig)

    promptParts := []*genai.Part{
        genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
        genai.NewPartFromText(\"Give me a summary of this pdf file.\"),
    }
    contents := []*genai.Content{
        genai.NewContentFromParts(promptParts, genai.RoleUser),
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        \"gemini-2.5-flash\",
        contents,
        nil,
    )

    fmt.Println(result.Text())
}
```

--------------------------------

### Generate Content with Gemini API in Java

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=es-419

This Java example illustrates how to use the `com.google.genai` library to generate content with the Gemini API. It initializes a `Client` and configures the generation using `GenerateContentConfig.builder().temperature(0.1f).build()`. The code sends a prompt 'Explain how AI works' to the 'gemini-2.5-flash' model and prints the resulting text.

```java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;

public class GenerateContentWithConfig {
  public static void main(String[] args) {

    Client client = new Client();

    GenerateContentConfig config = GenerateContentConfig.builder().temperature(0.1f).build();

    GenerateContentResponse response =
        client.models.generateContent("gemini-2.5-flash", "Explain how AI works", config);

    System.out.println(response.text());
  }
}
```

--------------------------------

### Upload Audio File - JavaScript Implementation

Source: https://ai.google.dev/gemini-api/docs/audio

Upload an audio file and generate content using the Gemini API with the JavaScript SDK. This example demonstrates async/await patterns for file handling.

```APIDOC
## JavaScript: Upload and Process Audio with Gemini

### Code Example
```javascript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  // Upload audio file with MIME type
  const myfile = await ai.files.upload({
    file: "path/to/sample.mp3",
    config: { mimeType: "audio/mp3" },
  });

  // Generate content with the uploaded file
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Describe this audio clip",
    ]),
  });
  
  console.log(response.text);
}

await main();
```

### Steps
1. Import required classes from @google/genai
2. Initialize GoogleGenAI instance
3. Upload file with `ai.files.upload()` specifying MIME type
4. Create user content with `createUserContent()` and `createPartFromUri()`
5. Call `generateContent()` with model and contents
6. Access results from `response.text`

### Requirements
- Google GenAI JavaScript SDK
- Valid Gemini API key configured in environment
```

--------------------------------

### Configure LLM with Google Search and custom functions (Python/JavaScript)

Source: https://ai.google.dev/gemini-api/docs/live-tools

This example shows how to set up a language model with a combination of built-in Google Search capabilities and custom function declarations. The configuration allows the model to process prompts that require both information retrieval and execution of predefined functions, enhancing the model's interaction with external systems and user requests.

```python
prompt = """
Hey, I need you to do two things for me.

1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
2. Then turn on the lights

Thanks!
"""

tools = [
    {"google_search": {}},
    {"function_declarations": [turn_on_the_lights, turn_off_the_lights]},
]

config = {"response_modalities": ["AUDIO"], "tools": tools}

# ... remaining model call
```

```javascript
const prompt = `Hey, I need you to do two things for me.

1. Use Google Search to look up information about the largest earthquake in California the week of Dec 5 2024?
2. Then turn on the lights

Thanks!
`

const tools = [
  { googleSearch: {} },
  { functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }
]

const config = {
  responseModalities: [Modality.AUDIO],
  tools: tools
}

// ... remaining model call
```

--------------------------------

### Initialize Client for Retrieving Generative AI Batch Job Results in Python

Source: https://ai.google.dev/gemini-api/docs/batch-api_batch=file

This snippet demonstrates the initial setup for retrieving results from a completed Generative AI batch job using the Python client library. It imports necessary modules and initializes the Generative AI client. Note: The provided code is an incomplete example for demonstrating the full result retrieval process.

```Python
import json
from google import genai

client = genai.Client()

# Use the name of the job you want to check
```

--------------------------------

### Gemini API Prompt Templates for Image Refinement

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=zh-tw

These examples provide templates and specific instances for crafting prompts to guide the Gemini API in image refinement tasks. The first is a general template for turning sketches into styled photos, allowing for customization of medium, subject, style, and details. The second offers a concrete example for transforming a pencil sketch of a car into a polished concept car photo, detailing specific features to retain and add new elements.

```Natural Language
Turn this rough [medium] sketch of a [subject] into a [style description]
photo. Keep the [specific features] from the sketch but add [new details/materials].
```

```Natural Language
"Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting."
```

--------------------------------

### GET /v1beta/interactions/{id}

Source: https://ai.google.dev/gemini-api/docs/deep-research_hl=bn

Resumes an existing interaction stream from a specified event ID. This allows clients to recover from connection interruptions and continue receiving events without starting a new interaction.

```APIDOC
## GET /v1beta/interactions/{id}

### Description
This endpoint allows you to resume an ongoing interaction stream from a specified `last_event_id`. It enables robust handling of connection interruptions, ensuring that clients can pick up where they left off without losing progress.

### Method
GET

### Endpoint
/v1beta/interactions/{id}

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the interaction to resume.

#### Query Parameters
- **stream** (boolean) - Required - Must be `true` to enable streaming of events.
- **last_event_id** (string) - Required - The ID of the last event successfully received before the connection interruption.
- **alt** (string) - Optional - Specifies the response format. Set to `sse` for Server-Sent Events streaming.

### Request Example
```text
curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID?stream=true&last_event_id=LAST_EVENT_ID&alt=sse" \
-H "x-goog-api-key: $GEMINI_API_KEY"
```

### Response
#### Success Response (200 - Stream of Server-Sent Events)
- **event_type** (string) - The type of event (e.g., `content.delta`, `interaction.complete`, `error`).
- **event_id** (string) - A unique identifier for the event. Events will start from the one *after* `last_event_id`.
- **delta** (object) - Included in `content.delta` event.
  - **type** (string) - Type of content delta (e.g., `text`, `thought_summary`).
  - **text** (string) - The actual content delta.

#### Response Example
```text
event: content.delta\ndata: { "event_type": "content.delta", "event_id": "<EVENT_ID_AFTER_LAST>", "delta": { "type": "text", "text": "Continuing the research..." } }\n\n... (additional events) ...\n\nevent: interaction.complete\ndata: { "event_type": "interaction.complete", "event_id": "<FINAL_EVENT_ID>" }\n```
```

--------------------------------

### Process Inline Audio Data and Buffer to Queue - JavaScript

Source: https://ai.google.dev/gemini-api/docs/live

Extracts base64-encoded audio data from API response parts and converts them to Buffer objects for queuing. This processes incoming audio chunks from the Gemini Live API response and prepares them for playback through the speaker system.

```javascript
if (part.inlineData && part.inlineData.data) {
  audioQueue.push(Buffer.from(part.inlineData.data, 'base64'));
}
```

--------------------------------

### Upload Audio File and Generate Content - Go

Source: https://ai.google.dev/gemini-api/docs/audio

Uploads an audio file and generates content description using the Go genai package. Creates parts with text and file URI, constructs content with user role, and calls GenerateContent with gemini-2.5-flash model. Returns formatted text output.

```go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  localAudioPath := "/path/to/sample.mp3"
  uploadedFile, _ := client.Files.UploadFromPath(
      ctx,
      localAudioPath,
      nil,
  )

  parts := []*genai.Part{
      genai.NewPartFromText("Describe this audio clip"),
      genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
  }
  contents := []*genai.Content{
      genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash",
      contents,
      nil,
  )

  fmt.Println(result.Text())
}
```

--------------------------------

### Initialize Node.js Project with npm/pnpm/yarn

Source: https://ai.google.dev/gemini-api/docs/vercel-ai-sdk-example

Create and initialize a new Node.js project directory for the market trend application. This setup is compatible with npm, pnpm, and yarn package managers.

```bash
mkdir market-trend-app
cd market-trend-app
npm init -y
```

```bash
mkdir market-trend-app
cd market-trend-app
pnpm init
```

```bash
mkdir market-trend-app
cd market-trend-app
yarn init -y
```

--------------------------------

### Gemini API - JSON Mode Setup (JavaScript/TypeScript)

Source: https://ai.google.dev/gemini-api/docs/structured-output_hl=hi

Configure and use the Gemini API with JSON mode in JavaScript or TypeScript applications. This example demonstrates setting up a schema using Zod and calling the generateContent method with structured output enforcement.

```APIDOC
## JavaScript/TypeScript - JSON Mode Configuration

### Description
Initialize the Gemini API client and configure JSON mode with schema validation using Zod. This approach ensures type-safe schema definitions and automatic response parsing.

### Setup
#### Required Imports
- Google Generative AI library
- Zod for schema definition and validation
- Zod-to-JSON-Schema converter

### Parameters
#### Schema Definition (Zod)
- **recipeSchema** (ZodSchema) - Zod schema defining the expected response structure
- **model** (string) - Model identifier, e.g., "gemini-2.5-flash"
- **responseMimeType** (string) - Set to "application/json"
- **responseJsonSchema** (JSON Schema) - Converted Zod schema to JSON Schema format

### Request Example
```javascript
const recipeSchema = z.object({
  recipe_name: z.string().describe("The name of the recipe"),
  prep_time_minutes: z.number().optional(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.string()
    })
  ),
  instructions: z.array(z.string())
});

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(recipeSchema)
  }
});
```

### Response Handling
#### Parse Response
```javascript
const recipe = recipeSchema.parse(JSON.parse(response.text));
console.log(recipe);
```

#### Response Structure
- **recipe_name** (string) - Name of extracted recipe
- **prep_time_minutes** (number, optional) - Preparation time
- **ingredients** (array) - List of ingredients with name and quantity
- **instructions** (array) - Step-by-step cooking instructions
```

--------------------------------

### Homework Help User Prompt Example - Probability Problem

Source: https://ai.google.dev/gemini-api/docs/learnlm

An example user prompt demonstrating a student requesting homework help with a probability problem about rotten pears. This shows the type of mathematical problem that can be addressed through the homework tutor system.

```text
In a box of pears, the probability of a pear being rotten is 20%. If 3
pears were rotten, find the total number of pears in the box.
```

--------------------------------

### Python - Enable Code Execution

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=bn

Python example showing how to configure code execution with the Google GenAI library. This demonstrates sending a prompt that requires code generation and execution, then processing the response to extract text, generated code, and execution results.

```APIDOC
## Python Code Execution Example

### Description
Use the Python Google GenAI client library to enable code execution and process multi-part responses.

### Setup
```python
from google import genai
from google.genai import types
```

### Implementation
```python
from google import genai
from google.genai import types

# Initialize the client
client = genai.Client()

# Generate content with code execution enabled
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50.",
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)

# Process response parts
for part in response.candidates[0].content.parts:
    # Handle text responses
    if part.text is not None:
        print(part.text)
    
    # Handle generated code
    if part.executable_code is not None:
        print(part.executable_code.code)
    
    # Handle code execution results
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)
```

### Response Structure
- **response.candidates[0].content.parts**: Array of content parts
  - **text**: Model-generated explanation
  - **executable_code.code**: Generated Python code
  - **code_execution_result.output**: Output from code execution
```

--------------------------------

### Generate Video with Multiple Reference Images - Python

Source: https://ai.google.dev/gemini-api/docs/video_hl=zh-tw

Generates a video using Veo 3.1 with multiple reference images to guide content generation. Supports up to 3 reference images with 'asset' reference type to preserve subject appearance. Includes polling and file download.

```python
import time
from google import genai

client = genai.Client()

prompt = "The video opens with a medium, eye-level shot of a beautiful woman with dark hair and warm brown eyes. She wears a magnificent, high-fashion flamingo dress with layers of pink and fuchsia feathers, complemented by whimsical pink, heart-shaped sunglasses. She walks with serene confidence through the crystal-clear, shallow turquoise water of a sun-drenched lagoon. The camera slowly pulls back to a medium-wide shot, revealing the breathtaking scene as the dress's long train glides and floats gracefully on the water's surface behind her. The cinematic, dreamlike atmosphere is enhanced by the vibrant colors of the dress against the serene, minimalist landscape, capturing a moment of pure elegance and high-fashion fantasy."

dress_reference = types.VideoGenerationReferenceImage(
  image=dress_image,
  reference_type="asset"
)

sunglasses_reference = types.VideoGenerationReferenceImage(
  image=glasses_image,
  reference_type="asset"
)

woman_reference = types.VideoGenerationReferenceImage(
  image=woman_image,
  reference_type="asset"
)

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    config=types.GenerateVideosConfig(
      reference_images=[dress_reference, glasses_reference, woman_reference],
    ),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3.1_with_reference_images.mp4")
print("Generated video saved to veo3.1_with_reference_images.mp4")
```

--------------------------------

### cURL - Code Execution Example

Source: https://ai.google.dev/gemini-api/docs/code-execution

REST API example using cURL to enable code execution with the Gemini API. Shows the raw HTTP request format and required headers.

```APIDOC
## cURL Code Execution Implementation

### Description
Demonstrates enabling code execution using cURL and the REST API endpoint.

### Example Request
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "tools": [{"code_execution": {}}],
    "contents": {
      "parts": {
        "text": "What is the sum of the first 50 prime numbers? Generate and run code for the calculation, and make sure you get all 50."
      }
    }
  }'
```

### Key Points
- Use POST method to the generateContent endpoint
- Include x-goog-api-key header with your API key
- Set Content-Type to application/json
- Include tools array with code_execution object
- Provide contents with text prompt in parts array
```

--------------------------------

### cURL Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Example of calling the Gemini API using cURL.

```APIDOC
## cURL Example

### Description
This example demonstrates how to call the Gemini API using cURL, providing an image and a text prompt to generate content.

### Method
POST

### Endpoint
Uses the /v1beta/models/gemini-3-pro-image-preview:generateContent endpoint.

### Parameters
- Includes a base64 encoded image and a text prompt in the request body.
  - Replace `$GEMINI_API_KEY` with your actual API key.

### Request Example
```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
        \"parts\":[
            {
              \"inline_data\": {
                \"mimeType\": \"image/png\",
                \"data\": \"<base64_encoded_image>\"
              }
            },
            {
              \"text\": \"Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting.\"
            }
          ]
  }]
}"
```

### Response
- The response includes generated text and potentially generated image data.

### Response Example
```json
{
  "candidates": [{
    "content": {
      "parts": [
        {
          "text": "Generated text description or other text output."
        },
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "<base64_encoded_image>"
          }
        }
      ]
    }
  }]
}
```
```

--------------------------------

### Generate Content with Thinking Budget (Python)

Source: https://ai.google.dev/gemini-api/docs/thinking

Python SDK example demonstrating how to configure thinking budget when generating content with the Gemini 2.5 Flash model.

```APIDOC
## Python: Generate Content with Thinking Budget

### Code Example
```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Provide a list of 3 famous physicists and their key contributions",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=1024)
    ),
)

print(response.text)
```

### Configuration Variations

**Turn off thinking:**
```python
thinking_config=types.ThinkingConfig(thinking_budget=0)
```

**Turn on dynamic thinking:**
```python
thinking_config=types.ThinkingConfig(thinking_budget=-1)
```

### Parameters
- **model** (string) - The model identifier (e.g., "gemini-2.5-flash")
- **contents** (string) - The prompt text
- **thinking_budget** (integer) - Token budget for reasoning (0 to disable, -1 for dynamic, or specific count)
```

--------------------------------

### Install Puppeteer and Chart.js Dependencies with npm/pnpm/yarn

Source: https://ai.google.dev/gemini-api/docs/vercel-ai-sdk-example

Install third-party packages for chart rendering and PDF generation. Puppeteer requires downloading Chromium browser, which may require user approval during installation.

```bash
npm install puppeteer chart.js
npm install -D @types/chart.js
```

```bash
pnpm add puppeteer chart.js
pnpm add -D @types/chart.js
```

```bash
yarn add puppeteer chart.js
yarn add -D @types/chart.js
```

--------------------------------

### Playwright Browser Setup and Initialization

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=pl

Initializes Playwright, launches a headless Chromium browser, and creates a new page with a predefined viewport size. This setup is crucial for simulating user interactions on a webpage.

```python
SCREEN_WIDTH = 1440
SCREEN_HEIGHT = 900

print("Initializing browser...")
playwright = sync_playwright().start()
browser = playwright.chromium.launch(headless=False)
context = browser.new_context(viewport={"width": SCREEN_WIDTH, "height": SCREEN_HEIGHT})
page = context.new_page()
```

--------------------------------

### Send text messages to Gemini Live API session

Source: https://ai.google.dev/gemini-api/docs/live-guide

This example demonstrates how to send a simple text message to an active Live API session. It uses the appropriate client method to transmit the text, signaling that the turn is complete.

```Python
message = "Hello, how are you?"
await session.send_client_content(turns=message, turn_complete=True)

```

```JavaScript
const message = 'Hello, how are you?';
session.sendClientContent({ turns: message, turnComplete: true });

```

--------------------------------

### Java: Generate Grounded Images with Google Search

Source: https://ai.google.dev/gemini-api/docs/image-generation

Java implementation using the Google GenAI SDK to generate images with Google Search grounding. Demonstrates configuration setup, response handling, and image file writing.

```APIDOC
## Java Implementation

### Description
Use the Google GenAI Java client library to generate images grounded with Google Search results.

### Code Example
```java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GoogleSearch;
import com.google.genai.types.ImageConfig;
import com.google.genai.types.Part;
import com.google.genai.types.Tool;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class SearchGrounding {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .imageConfig(ImageConfig.builder()
              .aspectRatio("16:9")
              .build())
          .tools(Tool.builder()
              .googleSearch(GoogleSearch.builder().build())
              .build())
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-3-pro-image-preview", """
              Visualize the current weather forecast for the next 5 days 
              in San Francisco as a clean, modern weather chart. 
              Add a visual on what I should wear each day
              """,
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("weather.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

### Key Components
- **GenerateContentConfig**: Builder pattern for configuration
- **responseModalities**: Set to "TEXT", "IMAGE" for both types
- **imageConfig**: Configure aspect ratio (e.g., "16:9")
- **GoogleSearch**: Enable grounding with search tool

### Response Processing
- Iterate through response.parts()
- Check part.text().isPresent() for text responses
- Check part.inlineData().isPresent() for image data
- Use Files.write() to save image bytes to PNG file
```

--------------------------------

### Example Computer Use Model FunctionCall Response

Source: https://ai.google.dev/gemini-api/docs/computer-use

This JSON object illustrates a typical response from the Computer Use model, containing text content and a function call for UI interaction. It demonstrates how the model suggests typing text into a specific coordinate with an optional 'press_enter' action, and serves as an input example for processing.

```json
{
  "content": {
    "parts": [
      {
        "text": "I will type the search query into the search bar. The search bar is in the center of the page."
      },
      {
        "function_call": {
          "name": "type_text_at",
          "args": {
            "x": 371,
            "y": 470,
            "text": "highly rated smart fridges with touchscreen, 2 doors, around 25 cu ft, priced below 4000 dollars on Google Shopping",
            "press_enter": true
          }
        }
      }
    ]
  }
}
```

--------------------------------

### Generate Content with Thinking Budget (Go)

Source: https://ai.google.dev/gemini-api/docs/thinking

Go SDK example for configuring thinking budget when generating content with Gemini 2.5 Flash model.

```APIDOC
## Go: Generate Content with Thinking Budget

### Code Example
```go
package main

import (
  "context"
  "fmt"
  "google.golang.org/genai"
  "os"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
    log.Fatal(err)
  }

  thinkingBudgetVal := int32(1024)

  contents := genai.Text("Provide a list of 3 famous physicists and their key contributions")
  model := "gemini-2.5-flash"
  resp, _ := client.Models.GenerateContent(ctx, model, contents, &genai.GenerateContentConfig{
    ThinkingConfig: &genai.ThinkingConfig{
      ThinkingBudget: &thinkingBudgetVal,
    },
  })

  fmt.Println(resp.Text())
}
```

### Configuration Variations

**Turn off thinking:**
```go
ThinkingBudget: int32(0)
```

**Turn on dynamic thinking:**
```go
ThinkingBudget: int32(-1)
```

### Parameters
- **model** (string) - The model identifier (e.g., "gemini-2.5-flash")
- **contents** (genai.Text) - The prompt text
- **ThinkingBudget** (int32 pointer) - Token budget for reasoning (0 to disable, -1 for dynamic, or specific count)
```

--------------------------------

### Generate Gemini Image with Google Search Grounding

Source: https://ai.google.dev/gemini-api/docs/image-generation

These code examples demonstrate how to use the Gemini API with the `gemini-3-pro-image-preview` model to generate images grounded in real-time information via the Google Search tool. Each example takes a natural language prompt, specifies an aspect ratio for the image, and retrieves both textual and image outputs from the model. The generated image, often a visualization like a weather chart, is saved locally.

```python
from google import genai
prompt = "Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day"
aspect_ratio = "16:9" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=['Text', 'Image'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
        ),
        tools=[{"google_search": {}}]
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("weather.png")
```

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const prompt = 'Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day';
  const aspectRatio = '16:9';
  const resolution = '2K';

const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("image.png", buffer);
      console.log("Image saved as image.png");
    }
  }

}

main();
```

```java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.GoogleSearch;
import com.google.genai.types.ImageConfig;
import com.google.genai.types.Part;
import com.google.genai.types.Tool;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class SearchGrounding {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .imageConfig(ImageConfig.builder()
              .aspectRatio("16:9")
              .build())
          .tools(Tool.builder()
              .googleSearch(GoogleSearch.builder().build())
              .build())
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-3-pro-image-preview", """
              Visualize the current weather forecast for the next 5 days 
              in San Francisco as a clean, modern weather chart. 
              Add a visual on what I should wear each day
              """,
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("weather.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```curl
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day"}]}],
    "tools": [{"google_search": {}}],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {"aspectRatio": "16:9"}
    }
  }'
```

--------------------------------

### Get File Metadata from Gemini API

Source: https://ai.google.dev/gemini-api/docs/prompting_with_media_lang=python

This section provides code examples for retrieving metadata of a file previously uploaded to the Gemini API. It demonstrates how to verify successful uploads and fetch details using the 'files.get' method or equivalent API calls in different programming languages.

```python
from google import genai

client = genai.Client()

myfile = client.files.upload(file='path/to/sample.mp3')
file_name = myfile.name
myfile = client.files.get(name=file_name)
print(myfile)

```

```javascript
import {
  GoogleGenAI,
} from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const myfile = await ai.files.upload({
    file: "path/to/sample.mp3",
    config: { mimeType: "audio/mpeg" },
  });

  const fileName = myfile.name;
  const fetchedFile = await ai.files.get({ name: fileName });
  console.log(fetchedFile);
}

await main();

```

```go
file, err := client.Files.UploadFromPath(ctx, "path/to/sample.mp3", nil)
if err != nil {
    log.Fatal(err)
}

gotFile, err := client.Files.Get(ctx, file.Name)
if err != nil {
    log.Fatal(err)
}
fmt.Println("Got file:", gotFile.Name)

```

```bash
# file_info.json was created in the upload example
name=$(jq ".file.name" file_info.json)
# Get the file of interest to check state
curl https://generativelanguage.googleapis.com/v1beta/files/$name \
-H "x-goog-api-key: $GEMINI_API_KEY" > file_info.json
# Print some information about the file you got
name=$(jq ".file.name" file_info.json)
echo name=$name
file_uri=$(jq ".file.uri" file_info.json)
echo file_uri=$file_uri

```

--------------------------------

### Define Prompts for Minimalist Image Generation

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=de

These prompts guide the Gemini API in generating minimalist image compositions with significant negative space, suitable for overlaying text. The first example is a general template with placeholders for customization, while the second provides a concrete, ready-to-use prompt for a specific image.

```text
A minimalist composition featuring a single [subject] positioned in the
[bottom-right/top-left/etc.] of the frame. The background is a vast, empty
[color] canvas, creating significant negative space. Soft, subtle lighting.
[Aspect ratio].
```

```text
A minimalist composition featuring a single, delicate red maple leaf
positioned in the bottom-right of the frame. The background is a vast, empty
off-white canvas, creating significant negative space for text. Soft,
diffused lighting from the top left. Square image.
```

--------------------------------

### Complete Director's Notes Example

Source: https://ai.google.dev/gemini-api/docs/speech-generation

Full example combining multiple director's note elements including style, pacing, and accent for a complete performance specification. This demonstrates how to layer multiple performance characteristics together for comprehensive guidance.

```markdown
### DIRECTOR'S NOTES

Style: Enthusiastic and Sassy GenZ beauty YouTuber

Pacing: Speaks at an energetic pace, keeping up with the extremely fast, rapid
delivery influencers use in short form videos.

Accent: Southern california valley girl from Laguna Beach
```

--------------------------------

### Define Tool, Send Request, and Handle Tool Call (JavaScript)

Source: https://ai.google.dev/gemini-api/docs/interactions_hl=ar

This JavaScript example illustrates the full flow of using function calls with the Gemini API. It shows how to define a function tool, send an initial prompt that triggers a tool call, and then process the tool call by executing a mocked function and sending the result back to the API to get the final response.

```javascript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({});

// 1. Define the tool
const weatherTool = {
    type: 'function',
    name: 'get_weather',
    description: 'Gets the weather for a given location.',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' }
        },
        required: ['location']
    }
};

// 2. Send the request with tools
let interaction = await client.interactions.create({
    model: 'gemini-3-flash-preview',
    input: 'What is the weather in Paris?',
    tools: [weatherTool]
});

// 3. Handle the tool call
for (const output of interaction.outputs) {
    if (output.type === 'function_call') {
        console.log(`Tool Call: ${output.name}(${JSON.stringify(output.arguments)})`);

        // Execute tool (Mocked)
        const result = `The weather in ${output.arguments.location} is sunny.`;

        // Send result back
        interaction = await client.interactions.create({
            model: 'gemini-3-flash-preview',
            previous_interaction_id:interaction.id,
            input: [{
                type: 'function_result',
                name: output.name,
                call_id: output.id,
                result: result
            }]
        });
        console.log(`Response: ${interaction.outputs[interaction.outputs.length - 1].text}`);
    }
}
```

--------------------------------

### Install Google GenAI SDK for Gemini API

Source: https://ai.google.dev/gemini-api/docs/libraries

These code snippets provide the installation commands for the official Google GenAI SDK across various programming languages. This SDK is the recommended, production-ready library for interacting with the Gemini API, ensuring access to the latest features and optimal performance.

```python
pip install google-genai
```

```javascript
npm install @google/genai
```

```go
go get google.golang.org/genai
```

```java
<dependencies>
  <dependency>
    <groupId>com.google.genai</groupId>
    <artifactId>google-genai</artifactId>
    <version>1.0.0</version>
  </dependency>
</dependencies>
```

```csharp
dotnet add package Google.GenAI
```

--------------------------------

### Prompt Template for Image Refinement from Sketch

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

This template provides a flexible structure for prompting the Gemini API to refine a rough sketch or drawing into a polished image. It guides users to specify the original medium, subject, desired style, features to retain, and new details to add, facilitating creative image generation.

```text
Turn this rough [medium] sketch of a [subject] into a [style description]
photo. Keep the [specific features] from the sketch but add [new details/materials].
```

--------------------------------

### Install Model Context Protocol (MCP) SDK for Python

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial

This command installs the Model Context Protocol (MCP) Python SDK using `pip`. The MCP SDK is essential for integrating AI models with external tools and data sources, enabling functionalities like automatic tool calling.

```bash
pip install mcp
```

--------------------------------

### Design Prompts for Multi-Panel Comic Generation

Source: https://ai.google.dev/gemini-api/docs/image-generation

These prompts guide the Gemini model to create multi-panel comics, specifying artistic style, number of panels, and scene details. The second example provides a more detailed, specific prompt for a gritty noir style, enhancing the model's ability to generate specific visual outputs.

```plaintext
Make a 3 panel comic in a [style]. Put the character in a [type of scene].
```

```plaintext
Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humurous scene.
```

--------------------------------

### Semantic Masking Example Prompt for Sofa Editing

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=zh-tw

Concrete example prompt demonstrating semantic masking for editing a specific furniture element in a living room image. Shows how to structure detailed instructions for targeted modifications while maintaining image context and lighting.

```text
Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged.
```

--------------------------------

### Python: Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=ru

Complete Python example demonstrating video generation using the Google GenAI library. Shows initialization, prompt submission, operation polling, and video file download.

```APIDOC
## Python Video Generation Example

### Description
Python implementation using the Google GenAI SDK for generating videos and downloading the results.

### Prerequisites
- Install: `pip install google-genai`
- Set GOOGLE_API_KEY environment variable

### Code Example
```python
from google.genai import Client

client = Client()

prompt = """A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"""

# Generate video (long-running operation)
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
)

# Poll the operation status until the video is ready
while not operation.done:
    print("Waiting for video generation to complete...")
    # Wait 10 seconds before checking again
    import time
    time.sleep(10)
    operation = client.operations.get_videos_operation(
        operation=operation,
    )

# Download the generated video
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("dialogue_example.mp4")
print("Generated video saved to dialogue_example.mp4")
```

### Key Methods
- `client.models.generate_videos()` - Initiates video generation
- `client.operations.get_videos_operation()` - Polls operation status
- `client.files.download()` - Downloads the generated video file
- `video.save()` - Saves video to local filesystem
```

--------------------------------

### Install MCP SDK via npm

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial

Installs the Model Context Protocol SDK package from npm. Required for JavaScript/TypeScript projects to enable MCP server communication.

```bash
npm install @modelcontextprotocol/sdk
```

--------------------------------

### Compose Images with Detail Preservation Prompt Template

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ko

Provides a reusable prompt template for image composition tasks that emphasizes preserving critical details like facial features and logos. This template guides the API to seamlessly integrate elements from multiple images while maintaining visual integrity and natural appearance.

```Text
Using the provided images, place [element from image 2] onto [element from image 1]. Ensure that the features of [element from image 1] remain completely unchanged. The added element should [description of how the element should integrate].
```

--------------------------------

### Process Incoming Gemini API Messages in Node.js (`messageLoop`)

Source: https://ai.google.dev/gemini-api/docs/live_example=mic-stream

An asynchronous function that continuously processes messages received from the Gemini API. It handles interruptions by clearing the `audioQueue` to stop playback and extracts audio parts from `modelTurn` responses, preparing them for playback. The provided snippet is incomplete.

```javascript
  async function messageLoop() {
    // Puts incoming messages in the audio queue.
    while (true) {
      const message = await waitMessage();
      if (message.serverContent && message.serverContent.interrupted) {
        // Empty the queue on interruption to stop playback
        audioQueue.length = 0;
        continue;
      }
      if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
        for (const part of message.serverContent.modelTurn.parts) {

```

--------------------------------

### Capture Microphone Input and Send as Base64 PCM - JavaScript

Source: https://ai.google.dev/gemini-api/docs/live

Configures microphone input at 16kHz sampling rate with 16-bit width and mono channel, then streams audio data to the Gemini Live API session. Converts raw PCM audio to base64 encoding and sends it with proper MIME type specification for real-time processing.

```javascript
const micInstance = mic({
  rate: '16000',
  bitwidth: '16',
  channels: '1',
});
const micInputStream = micInstance.getAudioStream();

micInputStream.on('data', (data) => {
  // API expects base64 encoded PCM data
  session.sendRealtimeInput({
    audio: {
      data: data.toString('base64'),
      mimeType: "audio/pcm;rate=16000"
    }
  });
});

micInputStream.on('error', (err) => {
  console.error('Microphone error:', err);
});

micInstance.start();
console.log('Microphone started. Speak now...');
```

--------------------------------

### Install Audio Streaming Dependencies with npm

Source: https://ai.google.dev/gemini-api/docs/live_example=mic-stream&hl=bn

Installs required Node.js packages for microphone capture and speaker output. Additional system-level dependencies may be needed depending on platform (sox for Mac/Windows, ALSA for Linux).

```bash
npm install mic speaker
```

--------------------------------

### POST /session/set_music_generation_config - Configure Music Generation Parameters

Source: https://ai.google.dev/gemini-api/docs/music-generation

Sets configuration parameters for music generation including tempo (BPM), temperature for randomness, audio format, and sample rate. Applied to guide the generation characteristics.

```APIDOC
## POST /session/set_music_generation_config

### Description
Configures music generation parameters such as tempo, temperature (creativity level), audio format, and sample rate. These settings control the technical aspects of the generated music output.

### Method
POST

### Endpoint
`session.set_music_generation_config()` (Python) / `session.setMusicGenerationConfig()` (JavaScript)

### Request Body
#### Python
- **config** (LiveMusicGenerationConfig) - Required - Configuration object
  - **bpm** (integer) - Optional - Beats per minute for the generated music
  - **temperature** (float) - Optional - Controls randomness/creativity (0.0-2.0, typically 1.0)

#### JavaScript
- **musicGenerationConfig** (object) - Required - Configuration object
  - **bpm** (integer) - Optional - Beats per minute for the generated music
  - **temperature** (number) - Optional - Controls randomness/creativity
  - **audioFormat** (string) - Optional - Audio encoding format (e.g., 'pcm16')
  - **sampleRateHz** (integer) - Optional - Sample rate in Hz (e.g., 44100)

### Request Example
#### Python
```python
from google.genai import types

await session.set_music_generation_config(
  config=types.LiveMusicGenerationConfig(bpm=90, temperature=1.0)
)
```

#### JavaScript
```javascript
await session.setMusicGenerationConfig({
  musicGenerationConfig: {
    bpm: 90,
    temperature: 1.0,
    audioFormat: "pcm16",
    sampleRateHz: 44100,
  },
});
```

### Response
#### Success Response (200)
- **status** (string) - Confirmation that configuration was applied
- **config** (object) - Echo of applied configuration parameters

### Configuration Parameters Reference
- **bpm** - Typical range: 60-180 beats per minute
- **temperature** - Typical range: 0.5-1.5 (higher = more creative/random)
- **audioFormat** - 'pcm16' recommended for compatibility
- **sampleRateHz** - Common values: 44100, 48000
```

--------------------------------

### Install CrewAI with tools and dependencies

Source: https://ai.google.dev/gemini-api/docs/crewai-example

Install the CrewAI framework with optional tools support using pip. This command sets up all necessary dependencies for building multi-agent systems.

```bash
pip install "crewai[tools]"
```

--------------------------------

### Prepare Initial Content with Screenshot for Gemini API

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=ar

Captures an initial page screenshot and creates a Content object with user prompt text and PNG image data. This prepares the initial message to send to the Gemini API, combining textual instructions with visual context of the current browser state.

```python
initial_screenshot = page.screenshot(type="png")
USER_PROMPT = "Go to ai.google.dev/gemini-api/docs and search for pricing."

contents = [
    Content(role="user", parts=[
        Part(text=USER_PROMPT),
        Part.from_bytes(data=initial_screenshot, mime_type='image/png')
    ])
]
```

--------------------------------

### Example Recipe Response with Structured Output

Source: https://ai.google.dev/gemini-api/docs/structured-output_example=recipe

Example JSON response from the Gemini API containing a complete recipe with ingredients and instructions. This demonstrates the expected output format when using the recipe schema for structured generation.

```json
{
  "recipe_name": "Delicious Chocolate Chip Cookies",
  "ingredients": [
    {
      "name": "all-purpose flour",
      "quantity": "2 and 1/4 cups"
    },
    {
      "name": "baking soda",
      "quantity": "1 teaspoon"
    },
    {
      "name": "salt",
      "quantity": "1 teaspoon"
    },
    {
      "name": "unsalted butter (softened)",
      "quantity": "1 cup"
    },
    {
      "name": "granulated sugar",
      "quantity": "3/4 cup"
    },
    {
      "name": "packed brown sugar",
      "quantity": "3/4 cup"
    },
    {
      "name": "vanilla extract",
      "quantity": "1 teaspoon"
    },
    {
      "name": "large eggs",
      "quantity": "2"
    },
    {
      "name": "semisweet chocolate chips",
      "quantity": "2 cups"
    }
  ],
  "instructions": [
    "Preheat the oven to 375°F (190°C).",
    "In a small bowl, whisk together the flour, baking soda, and salt.",
    "In a large bowl, cream together the butter, granulated sugar, and brown sugar until light and fluffy.",
    "Beat in the vanilla and eggs, one at a time.",
    "Gradually beat in the dry ingredients until just combined.",
    "Stir in the chocolate chips.",
    "Drop by rounded tablespoons onto ungreased baking sheets and bake for 9 to 11 minutes."
  ]
}

```

--------------------------------

### Real-time Music Steering - Update Prompts During Generation

Source: https://ai.google.dev/gemini-api/docs/music-generation

Demonstrates how to dynamically update weighted prompts while music generation is active. The model smoothly transitions the generated music based on new prompt inputs sent during streaming.

```APIDOC
## Real-time Music Steering

### Description
While the Lyria RealTime stream is active and playing, you can send new weighted prompt messages at any time to alter the generated music. The model smoothly transitions based on the new input, allowing dynamic control over the music generation.

### Method
POST (During Active Session)

### Endpoint
`session.set_weighted_prompts()` (called during active play)

### Prompt Format Requirements
- **text** (string) - Required - The actual prompt describing desired music characteristics
- **weight** (number) - Required - Weight value influencing prompt strength
  - Cannot be 0
  - 1.0 is recommended as starting point
  - Higher values increase influence of that prompt
  - Lower values (0.3-0.5) create subtle effects

### Request Example - Real-time Update
#### Python
```python
# During active generation, update prompts
await session.set_weighted_prompts(
  prompts=[
    {"text": "Piano", "weight": 2.0},
    types.WeightedPrompt(text="Meditation", weight=0.5),
    types.WeightedPrompt(text="Live Performance", weight=1.0),
  ]
)
```

#### JavaScript
```javascript
// During active generation, update prompts
await session.setWeightedPrompts({
  weightedPrompts: [
    { text: 'Harmonica', weight: 0.3 },
    { text: 'Afrobeat', weight: 0.7 }
  ],
});
```

### Transition Behavior
- Model smoothly transitions to new prompt directions
- Abrupt changes may cause noticeable transitions in generated music
- Recommended approach: Use intermediate weight values for smooth cross-fading

### Best Practices for Smooth Transitions
1. **Implement Cross-fading**: Send multiple updates with intermediate weight values
2. **Gradual Changes**: Avoid drastic prompt changes in single update
3. **Weight Adjustment**: Use incremental weight modifications over multiple calls

### Cross-fade Example
```python
# Smooth transition from Techno to Jazz
# Step 1: Reduce techno, introduce jazz
await session.set_weighted_prompts(prompts=[
  {"text": "minimal techno", "weight": 0.7},
  {"text": "jazz", "weight": 0.3}
])
# Step 2: Further shift
await session.set_weighted_prompts(prompts=[
  {"text": "minimal techno", "weight": 0.3},
  {"text": "jazz", "weight": 0.7}
])
# Step 3: Complete transition
await session.set_weighted_prompts(prompts=[
  {"text": "jazz", "weight": 1.0}
])
```
```

--------------------------------

### Define Function Tool and Initiate Interaction for Client-Side Handling (Python)

Source: https://ai.google.dev/gemini-api/docs/interactions_hl=fa

This Python example shows how to define a custom function tool, such as `schedule_meeting`, and prepare an initial interaction with the Gemini API. It includes setting up interaction history and providing the defined tool, enabling the model to generate a function call that the client application would then intercept and process. This setup is useful when managing all interaction states on the client side.

```python
from google import genai
client = genai.Client()

functions = [
    {
        "type": "function",
        "name": "schedule_meeting",
        "description": "Schedules a meeting with specified attendees at a given time and date.",
        "parameters": {
            "type": "object",
            "properties": {
                "attendees": {"type": "array", "items": {"type": "string"}},
                "date": {"type": "string", "description": "Date of the meeting (e.g., 2024-07-29)"},
                "time": {"type": "string", "description": "Time of the meeting (e.g., 15:00)"},
                "topic": {"type": "string", "description": "The subject of the meeting."}
            },
            "required": ["attendees", "date", "time", "topic"]
        }
    }
]

history = [{"role": "user","content": [{"type": "text", "text": "Schedule a meeting for 2025-11-01 at 10 am with Peter and Amir about the Next Gen API."}]}]

# 1. Model decides to call the function
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input=history,
    tools=functions
)
```

--------------------------------

### Function Calling Implementation Guide

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial_hl=th

Complete guide for implementing function calling with the Gemini API across multiple programming languages and environments. Demonstrates how to define functions, send requests, and process function call responses.

```APIDOC
## Function Calling Implementation

### Overview
Function calling allows the Gemini model to determine which functions should be executed based on user input. The model returns the function name and arguments, which your application then executes.

### Implementation Steps

#### 1. Define Function Declarations
Create a function declaration object that describes the function to the model:
- **name**: Unique identifier for the function
- **description**: Clear explanation of what the function does
- **parameters**: Schema defining the function's parameters with types and requirements

#### 2. Send Request with Function Declarations
Include the function declarations in the `tools` array when calling the API.

#### 3. Process Function Call Response
Check the response for function calls and execute them with the provided arguments.

### Python Implementation

```python
if response.candidates[0].content.parts[0].function_call:
    function_call = response.candidates[0].content.parts[0].function_call
    print(f"Function to call: {function_call.name}")
    print(f"Arguments: {function_call.args}")
    # Execute the function with the provided arguments
    # result = schedule_meeting(**function_call.args)
else:
    print("No function call found in the response.")
    print(response.text)
```

### JavaScript Implementation

```javascript
const ai = new GoogleGenAI({});

const scheduleMeetingFunctionDeclaration = {
  name: 'schedule_meeting',
  description: 'Schedules a meeting with specified attendees at a given time and date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      attendees: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of people attending the meeting.'
      },
      date: {
        type: Type.STRING,
        description: 'Date of the meeting (e.g., "2024-07-29")'
      },
      time: {
        type: Type.STRING,
        description: 'Time of the meeting (e.g., "15:00")'
      },
      topic: {
        type: Type.STRING,
        description: 'The subject or topic of the meeting.'
      }
    },
    required: ['attendees', 'date', 'time', 'topic']
  }
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Schedule a meeting with Bob and Alice for 03/27/2025 at 10:00 AM about the Q3 planning.',
  config: {
    tools: [{
      functionDeclarations: [scheduleMeetingFunctionDeclaration]
    }]
  }
});

if (response.functionCalls && response.functionCalls.length > 0) {
  const functionCall = response.functionCalls[0];
  console.log(`Function to call: ${functionCall.name}`);
  console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
  // const result = await scheduleMeeting(functionCall.args);
} else {
  console.log("No function call found in the response.");
  console.log(response.text);
}
```

### Best Practices
- Always validate function arguments before execution
- Provide clear, descriptive function names and descriptions
- Define all required parameters in the function declaration
- Handle cases where no function call is returned
- Implement proper error handling for function execution failures
```

--------------------------------

### Clip video with start and end offsets using Gemini API

Source: https://ai.google.dev/gemini-api/docs/video-understanding

Set clipping intervals on video content by specifying videoMetadata with start_offset and end_offset parameters. This allows you to process only a specific portion of a video file or URL. The example shows how to clip a YouTube video and request a summary of the specified segment.

```python
from google import genai
from google.genai import types

client = genai.Client()
response = client.models.generate_content(
    model='models/gemini-2.5-flash',
    contents=types.Content(
        parts=[
            types.Part(
                file_data=types.FileData(file_uri='https://www.youtube.com/watch?v=XEzRZ35urlk'),
                video_metadata=types.VideoMetadata(
                    start_offset='1250s',
                    end_offset='1570s'
                )
            ),
            types.Part(text='Please summarize the video in 3 sentences.')
        ]
    )
)
```

```javascript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash';

async function main() {
  const contents = [
    {
      role: 'user',
      parts: [
        {
          fileData: {
            fileUri: 'https://www.youtube.com/watch?v=9hE5-98ZeCg',
            mimeType: 'video/*',
          },
          videoMetadata: {
            startOffset: '40s',
            endOffset: '80s',
          }
        },
        {
          text: 'Please summarize the video in 3 sentences.',
        },
      ],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
  });

  console.log(response.text)
}

await main();
```

--------------------------------

### Prompt Content Ordering Variations

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Illustrates three different arrangements of prompt content components (examples, context, and input). The order can affect model responses, so experimenting with different orderings may improve results.

```text
Version 1:
[examples]
[context]
[input]

Version 2:
[input]
[examples]
[context]

Version 3:
[examples]
[input]
[context]
```

--------------------------------

### Initialize Multi-PDF Processing with Python `google-generativeai`

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=zh-tw

Provides the initial setup for a Python script intended to process multiple PDF documents using the Gemini API. It includes necessary library imports (`google.genai`, `io`, `httpx`) and defines URLs for two academic PDF papers, outlining the starting point for a multi-document processing workflow.

```python
from google import genai
import io
import httpx

client = genai.Client()

doc_url_1 = "https://arxiv.org/pdf/2312.11805"
doc_url_2 = "https://arxiv.org/pdf/2403.05530"
```

--------------------------------

### Generate and Poll Gemini Video Operation with cURL and jq

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=pl

This Bash script demonstrates how to initiate a video generation request using the Gemini API via `curl`. It then continuously polls the operation's status using `curl` and `jq` until the video generation is complete. Once done, it extracts the video URI and downloads the generated MP4 file. This script requires `curl` and `jq` to be installed.

```bash
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That'\''s the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Python Implementation - Google Search Retrieval with Gemini

Source: https://ai.google.dev/gemini-api/docs/grounding_hl=he

Complete Python implementation example showing how to initialize the Gemini client, configure the Google Search retrieval tool with dynamic threshold settings, and handle the response including grounding metadata validation.

```APIDOC
## Python Implementation Example

### Description
Python example demonstrating the initialization and usage of the Gemini API client with Google Search retrieval capabilities. Shows proper configuration of dynamic retrieval with confidence threshold settings.

### Code
```python
import os
from google import genai
from google.genai import types

# Initialize the Gemini client
client = genai.Client()

# Configure the Google Search retrieval tool
retrieval_tool = types.Tool(
    google_search_retrieval=types.GoogleSearchRetrieval(
        dynamic_retrieval_config=types.DynamicRetrievalConfig(
            mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamic_threshold=0.7  # Only search if confidence > 70%
        )
    )
)

# Set up the generation configuration with the retrieval tool
config = types.GenerateContentConfig(
    tools=[retrieval_tool]
)

# Generate content with Google Search retrieval enabled
response = client.models.generate_content(
    model='gemini-1.5-flash',
    contents="Who won the euro 2024?",
    config=config,
)

# Print the generated response
print(response.text)

# Check if the model used its own knowledge or performed a web search
if not response.candidates[0].grounding_metadata:
    print("\nModel answered from its own knowledge.")
else:
    print("\nModel performed a web search to answer the question.")
```

### Key Components
- **genai.Client()** - Creates a new Gemini API client instance
- **GoogleSearchRetrieval** - Configures web search capabilities
- **DynamicRetrievalConfig** - Sets the retrieval strategy and confidence threshold
- **MODE_DYNAMIC** - Enables conditional searching based on model confidence
- **dynamic_threshold** - Confidence score threshold (0.7 = 70%)
- **generate_content()** - Sends the request with search capabilities enabled
- **grounding_metadata** - Indicates whether web search was performed

### Required Imports
```python
from google import genai
from google.genai import types
```

### Dependencies
- google-genai Python package
- Valid GEMINI_API_KEY environment variable or client credentials
```

--------------------------------

### Video Generation - Python Implementation

Source: https://ai.google.dev/gemini-api/docs/video

Complete Python example demonstrating how to generate a video using the Google Generative AI library, poll for completion, and download the resulting video file.

```APIDOC
## Python: Video Generation Workflow

### Description
Implements the complete video generation workflow in Python, including initialization, request submission, polling, and file download.

### Implementation Steps

#### 1. Initialize Client and Submit Request
```python
from google.genai import client

prompt = "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"

operation = client.models.generateVideos(
    model="veo-3.1-generate-preview",
    prompt=prompt
)
```

#### 2. Poll Until Complete
```python
while not operation.done:
    # Wait before checking status
    import time
    time.sleep(10)
    operation = client.operations.getVideosOperation(
        operation=operation
    )
```

#### 3. Download Generated Video
```python
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("dialogue_example.mp4")
print("Generated video saved to dialogue_example.mp4")
```
```

--------------------------------

### Process Gemini API Messages in Node.js (Partial)

Source: https://ai.google.dev/gemini-api/docs/live

This partial asynchronous function outlines the message processing loop for the Node.js implementation. It waits for messages from the Gemini API, handles interruptions by clearing the audio queue, and begins to extract audio parts from model turns. The full implementation would continue processing these parts for playback.

```javascript
async function messageLoop() {
    // Puts incoming messages in the audio queue.
    while (true) {
      const message = await waitMessage();
      if (message.serverContent && message.serverContent.interrupted) {
        // Empty the queue on interruption to stop playback
        audioQueue.length = 0;
        continue;
      }
      if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
        for (const part of message.serverContent.modelTurn.parts) {

```

--------------------------------

### Python: Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_hl=sq

Complete Python example demonstrating video generation using the Gemini API client library, including operation polling and file download functionality.

```APIDOC
## Python Video Generation Example

### Description
Complete Python implementation for generating a video from a text prompt, polling for completion, and downloading the result.

### Code
```python
from google.genai import Client

client = Client()

prompt = "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"

# Initiate video generation
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt
)

# Poll until video generation completes
while not operation.done:
    print("Waiting for video generation to complete...")
    operation = client.operations.get_videos_operation(
        operation=operation
    )

# Download the generated video
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("dialogue_example.mp4")
print("Generated video saved to dialogue_example.mp4")
```

### Key Steps
1. Initialize the Gemini client
2. Call generate_videos() with model and prompt
3. Poll get_videos_operation() until operation.done is True
4. Download and save the video file
```

--------------------------------

### Advanced Image Combination Prompts and Python Implementation

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=fa

This section illustrates the concept of advanced image combination using text prompts to guide AI models in creating new compositions from multiple source images. It provides a generic prompt template, a specific fashion-themed example, and Python code demonstrating how to set up the GenAI client and load source images for such multimodal generative tasks, ideal for mockups or creative collages.

```Plain Text
Create a new image by combining the elements from the provided images. Take\nthe [element from image 1] and place it with/on the [element from image 2].\nThe final image should be a [description of the final scene].
```

```Plain Text
\"Create a professional e-commerce fashion photo. Take the blue floral dress\nfrom the first image and let the woman from the second image wear it.\nGenerate a realistic, full-body shot of the woman wearing the dress, with\nthe lighting and shadows adjusted to match the outdoor environment.\"
```

```Python
from google import genai\nfrom google.genai import types\nfrom PIL import Image\n\nclient = genai.Client()\n\n# Base image prompts:\n# 1. Dress: \"A professionally shot photo of a blue floral summer dress on a plain white background, ghost mannequin style.\"\n# 2. Model: \"Full-body shot of a woman with her hair in a bun, smiling, standing against a neutral grey studio background.\"\ndress_image = Image.open('/path/to/your/dress.png')\nmodel_image = Image.open('/path/to/your/model.png')\n\ntext_input = \"\"\"Create a professional e-commerce fashion photo. Take the blue floral dress from the first image and let the woman from the second image wear it. Generate a realistic, full-body shot of the woman wearing the dress, with the lighting and shadows adjusted to match the outdoor environment.\"\"\"
```

--------------------------------

### Count Tokens for Text and Inline Image Input (Python)

Source: https://ai.google.dev/gemini-api/docs/tokens_hl=sq&lang=python

This Python example demonstrates how to count tokens for a combined input consisting of text and an inline image using the Gemini API. It shows how to use `client.models.count_tokens` to get an initial token count and how to retrieve detailed `prompt_token_count`, `candidates_token_count`, and `total_token_count` from the `usage_metadata` attribute of the response after calling `generate_content`.

```python
from google import genai
import PIL.Image

client = genai.Client()
prompt = "Tell me about this image"
your_image_file = PIL.Image.open(media / "organ.jpg")

# Count tokens for combined text and inline image.
print(
    client.models.count_tokens(
        model="gemini-2.0-flash", contents=[prompt, your_image_file]
    )
)

response = client.models.generate_content(
    model="gemini-2.0-flash", contents=[prompt, your_image_file]
)
print(response.usage_metadata)
```

--------------------------------

### Initialize Generative Model - Legacy Pattern (Go)

Source: https://ai.google.dev/gemini-api/docs/migrate

Legacy Go implementation using separate client instantiation for genai and fileman packages. Demonstrates distributed pattern requiring multiple client initializations with different API keys for various services.

```go
import (
      "github.com/google/generative-ai-go/genai"
      "github.com/google/generative-ai-go/genai/fileman"
      "google.golang.org/api/option"
)

client, err := genai.NewClient(ctx, option.WithAPIKey("GEMINI_API_KEY"))
fileClient, err := fileman.NewClient(ctx, option.WithAPIKey("GEMINI_API_KEY"))

model := client.GenerativeModel("gemini-2.0-flash")
resp, err := model.GenerateContent(...)
cs := model.StartChat()

uploadedFile, err := fileClient.UploadFile(...)
```

--------------------------------

### Stream Gemini API Responses for Real-time Content Generation

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=zh-tw&lang=python

These examples demonstrate how to use the Gemini API's streaming capability to receive `GenerateContentResponse` instances progressively. This allows for a more interactive user experience by displaying generated content as it becomes available. Each example sends a text-only prompt to the `streamGenerateContent` endpoint and iterates through the received chunks to print the text output.

```python
from google import genai

client = genai.Client()

response = client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents=["Explain how AI works"]
)
for chunk in response:
    print(chunk.text, end="")
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });

  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

await main();
```

```go
package main

import (
  "context"
  "fmt"
  "os"
  "log"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  stream := client.Models.GenerateContentStream(
      ctx,
      "gemini-2.5-flash",
      genai.Text("Write a story about a magic backpack."),
      nil,
  )

  for chunk, _ := range stream {
      part := chunk.Candidates[0].Content.Parts[0]
      fmt.Print(part.Text)
  }
}
```

```java
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;

public class GenerateContentStream {
  public static void main(String[] args) {

    Client client = new Client();

    ResponseStream<GenerateContentResponse> responseStream =
      client.models.generateContentStream(
          "gemini-2.5-flash", "Write a story about a magic backpack.", null);

    for (GenerateContentResponse res : responseStream) {
      System.out.print(res.text());
    }

    // To save resources and avoid connection leaks, it is recommended to close the response
    // stream after consumption (or using try block to get the response stream).
    responseStream.close();
  }
}
```

```shell
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  --no-buffer \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ]
  }'
```

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

--------------------------------

### Generate and Download Video with Gemini API

Source: https://ai.google.dev/gemini-api/docs/video_hl=id

These code examples demonstrate how to use the Gemini API to generate a video from a text prompt and then download the resulting video file. The process involves initiating a video generation operation, polling its status until completion, and finally saving the video content locally. Each example uses a specific programming language or shell environment and its corresponding client libraries or direct API calls.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready.
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

```bash
# Note: This script uses jq to parse the JSON response.
# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video and capture the operation name into a variable.
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \'This must be it. That'\''s the secret code.\' The woman looks at him and whispering excitedly, \'What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Generate Multi-Speaker TTS Audio and Save as WAV in Python

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=he

This Python code uses the Gemini API to perform Text-to-Speech on a given conversation, assigning specific pre-built voices ('Kore' for Joe, 'Puck' for Jane) to different speakers. It then saves the resulting audio data as a standard WAV file. Ensure you have the `google-generativeai` library installed and a `wave` module for audio handling.

```python
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

client = genai.Client()

prompt = """TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?"""

response = client.models.generate_content(
   model="gemini-2.5-flash-preview-tts",
   contents=prompt,
   config=types.GenerateContentConfig(
      response_modalities=["AUDIO"],
      speech_config=types.SpeechConfig(
         multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=[
               types.SpeakerVoiceConfig(
                  speaker='Joe',
                  voice_config=types.VoiceConfig(
                     prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Kore',
                     )
                  )
               ),
               types.SpeakerVoiceConfig(
                  speaker='Jane',
                  voice_config=types.VoiceConfig(
                     prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Puck',
                     )
                  )
               ),
            ]
         )
      )
   )
)

data = response.candidates[0].content.parts[0].inline_data.data

file_name='out.wav'
wave_file(file_name, data) # Saves the file to current directory
```

--------------------------------

### Generate Content - Google Apps Script Example

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=ru&lang=python

Example implementation using Google Apps Script to call the Gemini API via REST. Demonstrates API key management and payload construction for content generation.

```APIDOC
## Google Apps Script - Generate Content

### Description
Implements content generation using Google Apps Script with REST API calls to the Gemini endpoint. Shows secure API key management and response parsing.

### Code Example
```javascript
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    responseMimeType: 'text/plain',
  };

  const payload = {
    generationConfig,
    contents: [
      {
        parts: [
          { text: 'Explain how AI works in a few words' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

### Configuration Parameters Used
- **temperature**: 1 - Default randomness
- **topP**: 0.95 - High diversity via nucleus sampling
- **topK**: 40 - Consider top 40 tokens
- **responseMimeType**: 'text/plain' - Plain text response format

### Security Note
API key is stored in Script Properties for secure access without hardcoding credentials.
```

--------------------------------

### Perform Resumable File Upload to Gemini API using cURL (Shell)

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=ko

This example illustrates how to perform a resumable upload of a PDF file to the Gemini File API using shell commands. It includes downloading a PDF with `wget`, determining its MIME type and size, initiating a resumable upload with `curl` to get an upload URL, and then uploading the file's binary content.

```shell
PDF_PATH="https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_FlightPlan.pdf"
DISPLAY_NAME="A17_FlightPlan"
PROMPT="Summarize this document"

# Download the PDF from the provided URL
wget -O "${DISPLAY_NAME}.pdf" "${PDF_PATH}"

MIME_TYPE=$(file -b --mime-type "${DISPLAY_NAME}.pdf")
NUM_BYTES=$(wc -c < "${DISPLAY_NAME}.pdf")

echo "MIME_TYPE: ${MIME_TYPE}"
echo "NUM_BYTES: ${NUM_BYTES}"

tmp_header_file=upload-header.tmp

# Initial resumable request defining metadata.
# The upload url is in the response headers dump them to a file.
curl "${BASE_URL}/upload/v1beta/files?key=${GOOGLE_API_KEY}" \
  -D upload-header.tmp \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Header-Content-Type: ${MIME_TYPE}" \
  -H "Content-Type: application/json" \
  -d "{'file': {'display_name': '${DISPLAY_NAME}'}}" 2> /dev/null

upload_url=$(grep -i "x-goog-upload-url: " "${tmp_header_file}" | cut -d" " -f2 | tr -d "\r")
rm "${tmp_header_file}"

# Upload the actual bytes.
curl "${upload_url}" \
  -H "Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Offset: 0" \
  -H "X-Goog-Upload-Command: upload, finalize" \
  --data-binary "@${DISPLAY_NAME}.pdf" 2> /dev/null > file_info.json

file_uri=$(jq ".file.uri" file_info.json)
echo "file_uri: ${file_uri}"
```

--------------------------------

### Send Real-time Audio to Google Gemini Live API and Get Text Response

Source: https://ai.google.dev/gemini-api/docs/live-guide

This snippet demonstrates how to establish a live connection with the Google Gemini API, send an audio stream in PCM format, and asynchronously receive text responses. It showcases handling the session lifecycle, sending audio blobs, and processing the streamed output. Dependencies include `google-generativeai` for Python and `@google/genai` with `node:fs` for Node.js.

```python
# !wget -q $URL -O sample.pcm
import asyncio
from pathlib import Path
from google import genai
from google.genai import types

client = genai.Client()
model = "gemini-live-2.5-flash-preview"

config = {"response_modalities": ["TEXT"]}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        audio_bytes = Path("sample.pcm").read_bytes()

        await session.send_realtime_input(
            audio=types.Blob(data=audio_bytes, mime_type="audio/pcm;rate=16000")
        )

        # if stream gets paused, send:
        # await session.send_realtime_input(audio_stream_end=True)

        async for response in session.receive():
            if response.text is not None:
                print(response.text)

if __name__ == "__main__":
    asyncio.run(main())
```

```javascript
// example audio file to try:
// URL = "https://storage.googleapis.com/generativeai-downloads/data/hello_are_you_there.pcm"
// !wget -q $URL -O sample.pcm
import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from "node:fs";

const ai = new GoogleGenAI({});
const model = 'gemini-live-2.5-flash-preview';
const config = { responseModalities: [Modality.TEXT] };

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      }
    }
    return turns;
  }

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        responseQueue.push(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });

  // Send Audio Chunk
  const fileBuffer = fs.readFileSync("sample.pcm");
  const base64Audio = Buffer.from(fileBuffer).toString('base64');

  session.sendRealtimeInput(
    {
      audio: {
        data: base64Audio,
        mimeType: "audio/pcm;rate=16000"
      }
    }

  );

  // if stream gets paused, send:
  // session.sendRealtimeInput({ audioStreamEnd: true })

  const turns = await handleTurn();
  for (const turn of turns) {
    if (turn.text) {
      console.debug('Received text: %s\n', turn.text);
    }
    else if (turn.data) {
      console.debug('Received inline data: %s\n', turn.data);
    }
  }

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
```

--------------------------------

### Generate, Poll, and Download AI Video (Node.js, Go, Shell)

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue

These examples show the complete workflow for generating a video using the Gemini API's Veo model: initiating video creation from a text prompt, continuously polling the operation status until the video is ready, and finally downloading the generated video to a local file. Examples are provided for Node.js, Go, and Shell (using `curl` and `jq`).

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready.
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

```shell
# Note: This script uses jq to parse the JSON response.
# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video and capture the operation name into a variable.
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That's the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Structured Prompting with XML for Gemini Models

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies

This example illustrates using XML tags for structured prompting to help Gemini models distinguish between instructions, context, and tasks. It defines roles, constraints, context, and tasks clearly for better interpretation and adherence to specific directives.

```xml
<role>
You are a helpful assistant.
</role>

<constraints>
1. Be objective.
2. Cite sources.
</constraints>

<context>
[Insert User Input Here - The model knows this is data, not instructions]
</context>

<task>
[Insert the specific user request here]
</task>

```

--------------------------------

### Call Gemini API to Extract Recipe with JSON Schema

Source: https://ai.google.dev/gemini-api/docs/structured-output_example=recipe&hl=es-419

These code examples demonstrate how to call the Gemini API's `generateContent` method to extract a recipe from a given text prompt. Each example specifies a `responseMimeType` of `application/json` and provides a `responseJsonSchema` to ensure the generated content adheres to a structured JSON format for the recipe details. The JavaScript example uses Zod for schema definition and parsing, the Go example defines the schema inline, and the cURL example makes a direct HTTP POST request.

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(recipeSchema),
  },
});

const recipe = recipeSchema.parse(JSON.parse(response.text));
console.log(recipe);
```

```go
package main

import (
    "context"
    "fmt"
    "log"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `
  Please extract the recipe from the following text.
  The user wants to make delicious chocolate chip cookies.
  They need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,
  1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,
  3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.
  For the best part, they'll need 2 cups of semisweet chocolate chips.
  First, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,
  baking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar
  until light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry
  ingredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons
  onto ungreased baking sheets and bake for 9 to 11 minutes.
  `
    config := &genai.GenerateContentConfig{
        ResponseMIMEType: "application/json",
        ResponseJsonSchema: map[string]any{
            "type": "object",
            "properties": map[string]any{
                "recipe_name": map[string]any{
                    "type":        "string",
                    "description": "The name of the recipe.",
                },
                "prep_time_minutes": map[string]any{
                    "type":        "integer",
                    "description": "Optional time in minutes to prepare the recipe.",
                },
                "ingredients": map[string]any{
                    "type": "array",
                    "items": map[string]any{
                        "type": "object",
                        "properties": map[string]any{
                            "name": map[string]any{
                                "type":        "string",
                                "description": "Name of the ingredient.",
                            },
                            "quantity": map[string]any{
                                "type":        "string",
                                "description": "Quantity of the ingredient, including units.",
                            },
                        },
                        "required": []string{"name", "quantity"},
                    },
                },
                "instructions": map[string]any{
                    "type":  "array",
                    "items": map[string]any{"type": "string"},
                },
            },
            "required": []string{"recipe_name", "ingredients", "instructions"},
        },
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text(prompt),
        config,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

```curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -X POST \
    -d '{
      "contents": [{
        "parts":[
          { "text": "Please extract the recipe from the following text.\nThe user wants to make delicious chocolate chip cookies.\nThey need 2 and 1/4 cups of all-purpose flour, 1 teaspoon of baking soda,\n1 teaspoon of salt, 1 cup of unsalted butter (softened), 3/4 cup of granulated sugar,\n3/4 cup of packed brown sugar, 1 teaspoon of vanilla extract, and 2 large eggs.\nFor the best part, they will need 2 cups of semisweet chocolate chips.\nFirst, preheat the oven to 375°F (190°C). Then, in a small bowl, whisk together the flour,\nbaking soda, and salt. In a large bowl, cream together the butter, granulated sugar, and brown sugar\nuntil light and fluffy. Beat in the vanilla and eggs, one at a time. Gradually beat in the dry\ningredients until just combined. Finally, stir in the chocolate chips. Drop by rounded tablespoons\nonto ungreased baking sheets and bake for 9 to 11 minutes." }
        ]
      }],
      "generationConfig": {
        "responseMimeType": "application/json",
        "responseJsonSchema": {
          "type": "object",
          "properties": {
            "recipe_name": {
              "type": "string",
              "description": "The name of the recipe."
            }

```

--------------------------------

### Initiate and Resume API Streaming Interactions via cURL

Source: https://ai.google.dev/gemini-api/docs/deep-research_hl=pt-br

These cURL commands illustrate how to directly interact with the streaming API for both initial connection and reconnection. The first command sends a POST request to start a new interaction, enabling streaming. The second command demonstrates how to resume an interrupted stream using a GET request, providing the `INTERACTION_ID` and `LAST_EVENT_ID` obtained from previous events.

```bash
# 1. Start the research task (Initial Stream)
# Watch for event: interaction.start to get the INTERACTION_ID
# Watch for "event_id" fields to get the LAST_EVENT_ID
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse" \
-H "Content-Type: application/json" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-d '{
    "input": "Compare golang SDK test frameworks",
    "agent": "deep-research-pro-preview-12-2025",
    "background": true,
    "stream": true,
    "agent_config": {
        "type": "deep-research",
        "thinking_summaries": "auto"
    }
}'
```

```bash
# 2. Reconnect (Resume Stream)
# Pass the INTERACTION_ID and the LAST_EVENT_ID you saved.
curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID?stream=true&last_event_id=LAST_EVENT_ID&alt=sse" \
-H "x-goog-api-key: $GEMINI_API_KEY"
```

--------------------------------

### Gemini API: Go Generate Content with Image and Code Execution

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=pl

This Go example demonstrates how to use the Google Gemini API to generate content from an image and a text prompt. It downloads an image, configures the `codeExecution` tool, and sends the request to the `gemini-3-flash-preview` model. The code then iterates through the candidate parts to print text, executable code with its language, and code execution results with their outcome.

```go
package main

import (
    "context"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    // Initialize Client (Reads GEMINI_API_KEY from env)
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    // 1. Download the image
    imageResp, err := http.Get("https://goo.gle/instrument-img")
    if err != nil {
        log.Fatal(err)
    }
    defer imageResp.Body.Close()

    imageBytes, err := io.ReadAll(imageResp.Body)
    if err != nil {
        log.Fatal(err)
    }

    // 2. Configure Code Execution Tool
    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}},
        },
    }

    // 3. Generate Content
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-3-flash-preview",
        []*genai.Content{
            {
                Parts: []*genai.Part{
                    {InlineData: &genai.Blob{MIMEType: "image/jpeg", Data: imageBytes}},
                    {Text: "Zoom into the expression pedals and tell me how many pedals are there?"},
                },
                Role: "user",
            },
        },
        config,
    )
    if err != nil {
        log.Fatal(err)
    }

    // 4. Parse Response (Text, Code, Output)
    for _, cand := range result.Candidates {
        for _, part := range cand.Content.Parts {
            if part.Text != "" {
                fmt.Println("Text:", part.Text)
            }
            if part.ExecutableCode != nil {
                fmt.Printf("\nGenerated Code (%s):\n%s\n", 
                    part.ExecutableCode.Language, 
                    part.ExecutableCode.Code)
            }
            if part.CodeExecutionResult != nil {
                fmt.Printf("\nExecution Output (%s):\n%s\n", 
                    part.CodeExecutionResult.Outcome, 
                    part.CodeExecutionResult.Output)
            }
        }
    }
}
```

--------------------------------

### Generate Gemini API content with text and multiple images (JavaScript)

Source: https://ai.google.dev/gemini-api/docs/image-understanding_hl=bn

This JavaScript example illustrates how to interact with the Gemini API using the `@google/genai` library. It first uploads an image using `ai.files.upload`, then prepares a second image as inline data. Finally, it calls `ai.models.generateContent` with a text prompt, a URI reference to the uploaded file, and the inline image data to get a text response.

```javascript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});

async function main() {
  // Upload the first image
  const image1_path = "path/to/image1.jpg";
  const uploadedFile = await ai.files.upload({
    file: image1_path,
    config: { mimeType: "image/jpeg" },
  });

  // Prepare the second image as inline data
  const image2_path = "path/to/image2.png";
  const base64Image2File = fs.readFileSync(image2_path, {
    encoding: "base64",
  });

  // Create the prompt with text and multiple images

  const response = await ai.models.generateContent({

    model: "gemini-2.5-flash",
    contents: createUserContent([
      "What is different between these two images?",
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image2File,
        },
      },
    ]),
  });
  console.log(response.text);
}

await main();
```

--------------------------------

### Generate and Download Video with Go Gemini API

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=fa

This Go example illustrates the full process of generating a video using the Gemini API's Veo 3.1 model. It involves initializing the client, submitting a text prompt for video generation, continuously polling the operation for completion, and then downloading and saving the generated video to a local file.

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

--------------------------------

### Go - Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_hl=fr

Complete Go example using the Google GenAI SDK to generate a video, poll for operation completion with 10-second intervals, and save the video file.

```APIDOC
## Go Video Generation Example

### Description
Complete workflow for generating a video using Go. Demonstrates client initialization, video generation submission, operation polling with time delays, and video file persistence.

### Code
```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready
    for !operation.Done {
        log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```
```

--------------------------------

### Implement Gemini API Live Session with Audio and Tool Calling (Python, JavaScript)

Source: https://ai.google.dev/gemini-api/docs/live-tools_hl=hi

These code examples demonstrate how to create a live, bi-directional streaming session with the Gemini API, enabling real-time interactions. The session is configured to handle audio responses and to invoke predefined tools, such as 'turn_on_the_lights' or 'turn_off_the_lights'. The code sends a text prompt, processes incoming audio data to be saved as a WAV file, detects and responds to tool calls, and manages the session lifecycle.

```python
turn_on_the_lights = {"name": "turn_on_the_lights"}
turn_off_the_lights = {"name": "turn_off_the_lights"}

tools = [{"function_declarations": [turn_on_the_lights, turn_off_the_lights]}]
config = {"response_modalities": ["AUDIO"], "tools": tools}

async def main():
    async with client.aio.live.connect(model=model, config=config) as session:
        prompt = "Turn on the lights please"
        await session.send_client_content(turns={"parts": [{"text": prompt}]})

        wf = wave.open("audio.wav", "wb")
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000)  # Output is 24kHz

        async for response in session.receive():
            if response.data is not None:
                wf.writeframes(response.data)
            elif response.tool_call:
                print("The tool was called")
                function_responses = []
                for fc in response.tool_call.function_calls:
                    function_response = types.FunctionResponse(
                        id=fc.id,
                        name=fc.name,
                        response={ "result": "ok" } # simple, hard-coded function response
                    )
                    function_responses.append(function_response)

                await session.send_tool_response(function_responses=function_responses)

        wf.close()

if __name__ == "__main__":
    asyncio.run(main())
```

```javascript
import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from "node:fs";
import pkg from 'wavefile';  // npm install wavefile
const { WaveFile } = pkg;

const ai = new GoogleGenAI({});
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Simple function definitions
const turn_on_the_lights = { name: "turn_on_the_lights" } // , description: '...', parameters: { ... }
const turn_off_the_lights = { name: "turn_off_the_lights" }

const tools = [{ functionDeclarations: [turn_on_the_lights, turn_off_the_lights] }]

const config = {
  responseModalities: [Modality.AUDIO],
  tools: tools
}

async function live() {
  const responseQueue = [];

  async function waitMessage() {
    let done = false;
    let message = undefined;
    while (!done) {
      message = responseQueue.shift();
      if (message) {
        done = true;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    return message;
  }

  async function handleTurn() {
    const turns = [];
    let done = false;
    while (!done) {
      const message = await waitMessage();
      turns.push(message);
      if (message.serverContent && message.serverContent.turnComplete) {
        done = true;
      } else if (message.toolCall) {
        done = true;
      }
    }
    return turns;
  }

  const session = await ai.live.connect({
    model: model,
    callbacks: {
      onopen: function () {
        console.debug('Opened');
      },
      onmessage: function (message) {
        responseQueue.push(message);
      },
      onerror: function (e) {
        console.debug('Error:', e.message);
      },
      onclose: function (e) {
        console.debug('Close:', e.reason);
      },
    },
    config: config,
  });

  const inputTurns = 'Turn on the lights please';
  session.sendClientContent({ turns: inputTurns });

  let turns = await handleTurn();

  for (const turn of turns) {
    if (turn.toolCall) {
      console.debug('A tool was called');
      const functionResponses = [];
      for (const fc of turn.toolCall.functionCalls) {
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: { result: "ok" } // simple, hard-coded function response
        });
      }

      console.debug('Sending tool response...\n');
      session.sendToolResponse({ functionResponses: functionResponses });
    }
  }

  // Check again for new messages
  turns = await handleTurn();

  // Combine audio data strings and save as wave file
  const combinedAudio = turns.reduce((acc, turn) => {
      if (turn.data) {
          const buffer = Buffer.from(turn.data, 'base64');
          const intArray = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Int16Array.BYTES_PER_ELEMENT);
          return acc.concat(Array.from(intArray));
      }
      return acc;
  }, []);

  const audioBuffer = new Int16Array(combinedAudio);

  const wf = new WaveFile();
  wf.fromScratch(1, 24000, '16', audioBuffer);  // output is 24kHz
  fs.writeFileSync('audio.wav', wf.toBuffer());

  session.close();
}

async function main() {
  await live().catch((e) => console.error('got error', e));
}

main();
```

--------------------------------

### Configure Automatic Voice Activity Detection (VAD) for Gemini Live API

Source: https://ai.google.dev/gemini-api/docs/live-guide

This configuration example shows how to fine-tune the automatic Voice Activity Detection (VAD) behavior for real-time audio input in the Google Gemini API. It allows adjustments to `start_of_speech_sensitivity`, `end_of_speech_sensitivity`, `prefix_padding_ms`, and `silence_duration_ms` to control when speech activity is detected. This provides more granular control over the API's responsiveness to speech. The default for `disabled` is `false`.

```python
from google.genai import types

config = {
    "response_modalities": ["TEXT"],
    "realtime_input_config": {
        "automatic_activity_detection": {
            "disabled": False, # default
            "start_of_speech_sensitivity": types.StartSensitivity.START_SENSITIVITY_LOW,
            "end_of_speech_sensitivity": types.EndSensitivity.END_SENSITIVITY_LOW,
            "prefix_padding_ms": 20,
            "silence_duration_ms": 100,
        }
    }
}
```

```javascript
import { GoogleGenAI, Modality, StartSensitivity, EndSensitivity } from '@google/genai';

const config = {
  responseModalities: [Modality.TEXT],
  realtimeInputConfig: {
    automaticActivityDetection: {
      disabled: false, // default
      startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
      endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
      prefixPaddingMs: 20,
      silenceDurationMs: 100,
    }
  }
};
```

--------------------------------

### Generate Multimodal Content (Image and Text) with Gemini API

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=ar

These examples illustrate how to construct a JSON payload containing both a text prompt and base64-encoded image data, then send it to the Google Gemini API's `generateContent` endpoint. The first example uses a shell script with `curl` for direct API interaction, handling temporary files for the payload. The second example uses Google Apps Script (JavaScript) to fetch an image, encode it, and make the API call using `UrlFetchApp`, highlighting API key management through `PropertiesService`.

```bash
TEMP_JSON=$(mktemp)
trap 'rm -f "$TEMP_JSON"' EXIT

cat > "$TEMP_JSON" << EOF
{
  "contents": [
    {
      "parts": [
        {
          "text": "Tell me about this instrument"
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "$(cat "$TEMP_B64")"
          }
        }
      ]
    }
  ]
}
EOF

curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "@$TEMP_JSON"
```

```javascript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const imageUrl = 'http://image/url';
  const image = getImageData(imageUrl);
  const payload = {
    contents: [
      {
        parts: [
          { image },
          { text: 'Tell me about this instrument' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}

function getImageData(url) {
  const blob = UrlFetchApp.fetch(url).getBlob();

  return {
    mimeType: blob.getContentType(),
    data: Utilities.base64Encode(blob.getBytes())
  };
}
```

--------------------------------

### Call Gemini API with Code Execution for Image Analysis

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=pt-br

This collection of snippets demonstrates how to interact with the Gemini API using multimodal input (image and text prompt) and enable its code execution capabilities. It shows how to send an image, ask a question about it, and process the API's response including generated code and its execution results across various programming languages like Python, Node.js, Go, and cURL. Note that the cURL example provided is truncated, showing the setup for the API call.

```python
client = genai.Client(api_key="GEMINI_API_KEY")

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=[image, "Zoom into the expression pedals and tell me how many pedals are there?"],
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    if part.executable_code is not None:
        print(part.executable_code.code)
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)
    if part.as_image() is not None:
        # display() is a standard function in Jupyter/Colab notebooks
        display(Image.open(io.BytesIO(part.as_image().image_bytes)))
```

```javascript
async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // 1. Prepare Image Data
  const imageUrl = "https://goo.gle/instrument-img";
  const response = await fetch(imageUrl);
  const imageArrayBuffer = await response.arrayBuffer();
  const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');

  // 2. Call the API with Code Execution enabled
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        },
      },
      { text: "Zoom into the expression pedals and tell me how many pedals are there?" }
    ],
    config: {
      tools: [{ codeExecution: {} }],
    },
  });

  // 3. Process the response (Text, Code, and Execution Results)
  const candidates = result.response.candidates;
  if (candidates && candidates[0].content.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        console.log("Text:", part.text);
      }
      if (part.executableCode) {
        console.log(`\nGenerated Code (${part.executableCode.language}):\n`, part.executableCode.code);
      }
      if (part.codeExecutionResult) {
        console.log(`\nExecution Output (${part.codeExecutionResult.outcome}):\n`, part.codeExecutionResult.output);
      }
    }
  }
}

main();
```

```go
package main

import (
    "context"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    // Initialize Client (Reads GEMINI_API_KEY from env)
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    // 1. Download the image
    imageResp, err := http.Get("https://goo.gle/instrument-img")
    if err != nil {
        log.Fatal(err)
    }
    defer imageResp.Body.Close()

    imageBytes, err := io.ReadAll(imageResp.Body)
    if err != nil {
        log.Fatal(err)
    }

    // 2. Configure Code Execution Tool
    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}},
        },
    }

    // 3. Generate Content
    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-3-flash-preview",
        []*
```

--------------------------------

### Implement Client-Side Function Calling with Gemini API

Source: https://ai.google.dev/gemini-api/docs/interactions_hl=ru

This code demonstrates how to handle function calls entirely on the client side using the Gemini API. It shows how to define a function, pass it to the model as a tool, capture the model's function_call output, simulate the function execution, and feed the result back into the model interaction to get a final response. This approach avoids server-side state management for function calls.

```python
from google import genai
client = genai.Client()

functions = [
    {
        "type": "function",
        "name": "schedule_meeting",
        "description": "Schedules a meeting with specified attendees at a given time and date.",
        "parameters": {
            "type": "object",
            "properties": {
                "attendees": {"type": "array", "items": {"type": "string"}},
                "date": {"type": "string", "description": "Date of the meeting (e.g., 2024-07-29)"},
                "time": {"type": "string", "description": "Time of the meeting (e.g., 15:00)"},
                "topic": {"type": "string", "description": "The subject of the meeting."},
            },
            "required": ["attendees", "date", "time", "topic"],
        },
    }
]

history = [{"role": "user","content": [{"type": "text", "text": "Schedule a meeting for 2025-11-01 at 10 am with Peter and Amir about the Next Gen API."}]}]

# 1. Model decides to call the function
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input=history,
    tools=functions
)

# add model interaction back to history
history.append({"role": "model", "content": interaction.outputs})

for output in interaction.outputs:
    if output.type == "function_call":
        print(f"Function call: {output.name} with arguments {output.arguments}")

        # 2. Execute the function and get a result
        # In a real app, you would call your function here.
        # call_result = schedule_meeting(**json.loads(output.arguments))
        call_result = "Meeting scheduled successfully."

        # 3. Send the result back to the model
        history.append({"role": "user", "content": [{"type": "function_result", "name": output.name, "call_id": output.id, "result": call_result}]})

        interaction2 = client.interactions.create(
            model="gemini-3-flash-preview",
            input=history,
        )
        print(f"Final response: {interaction2.outputs[-1].text}")
    else:
        print(f"Output: {output}")
```

```javascript
// 1. Define the tool
const functions = [
    {
        type: 'function',
        name: 'schedule_meeting',
        description: 'Schedules a meeting with specified attendees at a given time and date.',
        parameters: {
            type: 'object',
            properties: {
                attendees: { type: 'array', items: { type: 'string' } },
                date: { type: 'string', description: 'Date of the meeting (e.g., 2024-07-29)' },
                time: { type: 'string', description: 'Time of the meeting (e.g., 15:00)' },
                topic: { type: 'string', description: 'The subject of the meeting.' },
            },
            required: ['attendees', 'date', 'time', 'topic'],
        },
    },
];

const history = [
    { role: 'user', content: [{ type: 'text', text: 'Schedule a meeting for 2025-11-01 at 10 am with Peter and Amir about the Next Gen API.' }] }
];

// 2. Model decides to call the function
let interaction = await client.interactions.create({
    model: 'gemini-3-flash-preview',
    input: history,
    tools: functions
});

// add model interaction back to history
history.push({ role: 'model', content: interaction.outputs });

for (const output of interaction.outputs) {
    if (output.type === 'function_call') {
        console.log(`Function call: ${output.name} with arguments ${JSON.stringify(output.arguments)}`);

        // 3. Send the result back to the model
        history.push({ role: 'user', content: [{ type: 'function_result', name: output.name, call_id: output.id, result: 'Meeting scheduled successfully.' }] });

        const interaction2 = await client.interactions.create({
            model: 'gemini-3-flash-preview',
            input: history,
        });
        console.log(`Final response: ${interaction2.outputs[interaction2.outputs.length - 1].text}`);
    }
}
```

--------------------------------

### Start CrewAI Workflow Execution (Python)

Source: https://ai.google.dev/gemini-api/docs/crewai-example_hl=bn

This snippet demonstrates how to initiate the execution of a defined CrewAI workflow. The `print` statement indicates the start of the process, and a comment highlights where initial inputs for the crew can be provided, especially if the first task requires external context. This is the final step to run the automated customer support analysis and optimization process.

```python
# Start the crew's work
print("--- Starting Customer Support Analysis Crew ---")
# The 'inputs' dictionary provides initial context if needed by the first task.
```

--------------------------------

### GET /files/{name} - Get File

Source: https://ai.google.dev/gemini-api/docs/migrate

Retrieves the details of a specific file by its filename.

```APIDOC
## GET /files/{name}

### Description
Retrieves a specific file by its name.

### Method
GET

### Endpoint
/files/{name}

### Parameters
#### Path Parameters
- **name** (string) - Required - The name of the file to retrieve.

### Request Example
None

### Response
#### Success Response (200)
- **file.name** (string) - Name of the file.

#### Response Example
```json
{
  "name": "a11.txt"
}
```
```

--------------------------------

### Generate Gemini Image Content with Aspect Ratio and Size Configuration

Source: https://ai.google.dev/gemini-api/docs/image-generation

These examples demonstrate how to generate image-based content using the Gemini API for `gemini-2.5-flash-image` and `gemini-3-pro-image-preview` models. It shows how to configure the output image's aspect ratio and, for supported models like `gemini-3-pro-image-preview`, the image size. The response object will contain the generated image data.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt],
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
        )
    )
)

# For gemini-3-pro-image-preview
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[prompt],
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="2K",
        )
    )
)
```

```javascript
// For gemini-2.5-flash-image
const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    }
  });

// For gemini-3-pro-image-preview
const response_gemini3 = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K",
      },
    }
  });
```

```go
// For gemini-2.5-flash-image
result, _ := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash-image",
    genai.Text("Create a picture of a nano banana dish in a " +
                " fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
        },
    }
  )

// For gemini-3-pro-image-preview
result_gemini3, _ := client.Models.GenerateContent(
    ctx,
    "gemini-3-pro-image-preview",
    genai.Text("Create a picture of a nano banana dish in a " +
                " fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
          ImageSize: "2K",
        },
    }
  )
```

```java
// For gemini-2.5-flash-image
response = client.models.generateContent(
    "gemini-2.5-flash-image",
    prompt,
    GenerateContentConfig.builder()
        .imageConfig(ImageConfig.builder()
            .aspectRatio("16:9")
            .build())
        .build());

// For gemini-3-pro-image-preview
response_gemini3 = client.models.generateContent(
    "gemini-3-pro-image-preview",
    prompt,
    GenerateContentConfig.builder()
        .imageConfig(ImageConfig.builder()
            .aspectRatio("16:9")
            .imageSize("2K")
            .build())
        .build());
```

```bash
# For gemini-2.5-flash-image
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
      ]
    }],
    "generationConfig": {
      "imageConfig": {
        "aspectRatio": "16:9"
      }
    }
  }'

# For gemini-3-pro-image-preview
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [
        {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
      ]
    }],
    "generationConfig": {
      "imageConfig": {
        "aspectRatio": "16:9",
        "imageSize": "2K"
      }
    }
  }'
```

--------------------------------

### Function Calling Workflow - JavaScript Implementation

Source: https://ai.google.dev/gemini-api/docs/interactions_hl=vi

Complete JavaScript implementation demonstrating function calling workflow using the Google GenAI SDK.

```APIDOC
## Function Calling Workflow - JavaScript

### Description
Step-by-step implementation of function calling in JavaScript using the Google GenAI client library.

### Step 1: Initialize Client and Define Tool
Set up the client and create tool definition:

```javascript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({});

const weatherTool = {
    type: 'function',
    name: 'get_weather',
    description: 'Gets the weather for a given location.',
    parameters: {
        type: 'object',
        properties: {
            location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' }
        },
        required: ['location']
    }
};
```

### Step 2: Create Interaction with Tools
Send initial request with tool definitions:

```javascript
let interaction = await client.interactions.create({
    model: 'gemini-3-flash-preview',
    input: 'What is the weather in Paris?',
    tools: [weatherTool]
});
```

### Step 3: Handle Tool Calls and Send Results
Process outputs and send function results back:

```javascript
for (const output of interaction.outputs) {
    if (output.type === 'function_call') {
        console.log(`Tool Call: ${output.name}(${JSON.stringify(output.arguments)})`);
        
        // Execute tool (mocked here)
        const result = `The weather in ${output.arguments.location} is sunny.`;
        
        // Send result back
        interaction = await client.interactions.create({
            model: 'gemini-3-flash-preview',
            previous_interaction_id: interaction.id,
            input: [{
                type: 'function_result',
                name: output.name,
                call_id: output.id,
                result: result
            }]
        });
        console.log(`Response: ${interaction.outputs[interaction.outputs.length - 1].text}`);
    }
}
```

### Key Points
- Use async/await for API calls
- Check output.type to identify function calls
- Pass previous_interaction_id to link results to original request
- Function results complete the interaction loop
```

--------------------------------

### Prompt Iteration - Alternative Phrasing Examples

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Demonstrates how rephrasing the same question in different ways can yield varied responses from the model. All three versions ask for pie baking guidance but use different wording structures to potentially elicit different response styles.

```text
Version 1:
How do I bake a pie?

Version 2:
Suggest a recipe for a pie.

Version 3:
What's a good pie recipe?
```

--------------------------------

### Concrete Prompt Example for Van Gogh Style Transfer

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ko

This specific example illustrates how to populate the generic style transfer template to transform a modern city street image into the artistic style of Vincent van Gogh's 'Starry Night'. It details preserving the original composition while rendering elements with 'swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows', showcasing a complete, actionable style transfer request.

```text
"Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."
```

--------------------------------

### POST /session/play - Start Music Generation Stream

Source: https://ai.google.dev/gemini-api/docs/music-generation

Initiates the music generation stream. After calling this method, the model begins generating audio chunks which are sent through the WebSocket connection.

```APIDOC
## POST /session/play

### Description
Starts the music generation streaming process. Audio chunks are generated and sent through the WebSocket connection after this method is called.

### Method
POST

### Endpoint
`session.play()` (Python) / `session.play()` (JavaScript)

### Request Example
#### Python
```python
await session.play()
```

#### JavaScript
```javascript
await session.play();
```

### Response
#### Success Response (200)
- **status** (string) - 'playing' - Confirms music generation has started

### Server-Sent Data
Once playing, the server sends audio chunks through the WebSocket:

#### Python Receive Pattern
```python
async def receive_audio(session):
    """Process incoming audio chunks."""
    while True:
        async for message in session.receive():
            audio_data = message.server_content.audio_chunks[0].data
            # Process audio_data (write to file, speaker, etc.)
            await asyncio.sleep(10**-12)
```

#### JavaScript Callback Pattern
```javascript
callbacks: {
  onmessage: (message) => {
    if (message.serverContent?.audioChunks) {
      for (const chunk of message.serverContent.audioChunks) {
        const audioBuffer = Buffer.from(chunk.data, "base64");
        speaker.write(audioBuffer);
      }
    }
  },
}
```

### Audio Data Structure
- **server_content** (object) - Container for server response
  - **audio_chunks** (array) - Array of audio data chunks
    - **data** (bytes/base64) - The encoded audio data
```

--------------------------------

### Manage Streaming Interactions with State Tracking and Reconnection in Node.js

Source: https://ai.google.dev/gemini-api/docs/deep-research_hl=th

This Node.js (JavaScript) example illustrates how to handle streaming interactions from an API. It tracks `lastEventId` and `interactionId` to allow for stream resumption. The code includes an initial request to start the interaction and a loop to reconnect and continue processing events if the stream is interrupted, ensuring robust communication.

```javascript
let lastEventId;
let interactionId;
let isComplete = false;

// Helper to handle the event logic
const handleStream = async (stream) => {
    for await (const chunk of stream) {
        if (chunk.event_type === 'interaction.start') {
            interactionId = chunk.interaction.id;
        }
        if (chunk.event_id) lastEventId = chunk.event_id;

        if (chunk.event_type === 'content.delta') {
            if (chunk.delta.type === 'text') {
                process.stdout.write(chunk.delta.text);
            } else if (chunk.delta.type === 'thought_summary') {
                console.log(`Thought: ${chunk.delta.content.text}`);
            }
        } else if (chunk.event_type === 'interaction.complete') {
            isComplete = true;
        }
    }
};

// 1. Start the task with streaming
try {
    const stream = await client.interactions.create({
        input: 'Compare golang SDK test frameworks',
        agent: 'deep-research-pro-preview-12-2025',
        background: true,
        stream: true,
        agent_config: {
            type: 'deep-research',
            thinking_summaries: 'auto'
        }
    });
    await handleStream(stream);
} catch (e) {
    console.log('\nInitial stream interrupted.');
}

// 2. Reconnect Loop
while (!isComplete && interactionId) {
    console.log(`\nReconnecting to interaction ${interactionId} from event ${lastEventId}...`);
    try {
        const stream = await client.interactions.get(interactionId, {
            stream: true,
            last_event_id: lastEventId
        });
        await handleStream(stream);
    } catch (e) {
        console.log('Reconnection failed, retrying in 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
```

--------------------------------

### Gemini API: Prompts for Image Style Transfer (Template & Example)

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=de

This snippet provides both a generic template and a concrete example for applying artistic style transfer to an image using text prompts with the Gemini API. The template outlines key parameters like subject, target style, and stylistic elements, while the example demonstrates transforming a city scene into a Van Gogh-like painting.

```Text
Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].
```

```Text
"Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."
```

--------------------------------

### Perform Chat with Code Execution in Gemini API

Source: https://ai.google.dev/gemini-api/docs/code-execution

These examples demonstrate how to initiate a chat session with the Gemini API, enabling the model to generate and execute code. The common use case shown is asking the model to calculate the sum of the first 50 prime numbers, showcasing its ability to perform complex computations.

```python
from google import genai
from google.genai import types

client = genai.Client()

chat = client.chats.create(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)

response = chat.send_message("I have a math question for you.")
print(response.text)

response = chat.send_message(
    "What is the sum of the first 50 prime numbers? "
    "Generate and run code for the calculation, and make sure you get all 50."
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    if part.executable_code is not None:
        print(part.executable_code.code)
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)

```

```javascript
import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({});

const chat = ai.chats.create({
  model: "gemini-2.5-flash",
  history: [
    {
      role: "user",
      parts: [{ text: "I have a math question for you:" }],
    },
    {
      role: "model",
      parts: [{ text: "Great! I'm ready for your math question. Please ask away." }],
    },
  ],
  config: {
    tools: [{codeExecution:{}}],

```

--------------------------------

### Set Thinking Level for Gemini 3 Content Generation

Source: https://ai.google.dev/gemini-api/docs/gemini-3

This snippet demonstrates how to configure the `thinking_level` parameter when generating content with Gemini 3 models. Setting `thinking_level` to 'low' prioritizes faster, lower-latency responses, while 'high' maximizes reasoning depth for more complex tasks. The examples show how to apply this configuration in Python, JavaScript, and via the REST API.

```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-preview",
    contents="How does AI work?",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level="low")
    ),
)

print(response.text)

```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: "How does AI work?",
    config: {
      thinkingConfig: {
        thinkingLevel: "low",
      }
    },
  });

console.log(response.text);

```

```rest
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{"text": "How does AI work?"}]
    }],
    "generationConfig": {
      "thinkingConfig": {
        "thinkingLevel": "low"
      }
    }
  }'

```

--------------------------------

### Generate Speech and Save to WAV in Python

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=he

This Python snippet demonstrates how to use the `gemini-2.5-flash-preview-tts` model to convert text to speech. It includes a helper function `wave_file` to save the raw audio data received from the API into a standard WAV format file. The `Kore` voice is specified for the speech output, and necessary imports are included for a runnable example.

```python
import wave
import google.generativeai as genai
from google.generativeai import types

# Set up the wave file to save the output:
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

client = genai.Client()

response = client.models.generate_content(
   model="gemini-2.5-flash-preview-tts",
   contents="Say cheerfully: Have a wonderful day!",
   config=types.GenerateContentConfig(
      response_modalities=["AUDIO"],
      speech_config=types.SpeechConfig(
         voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
               voice_name='Kore',
            )
         )
      ),
   )
)

data = response.candidates[0].content.parts[0].inline_data.data

file_name='out.wav'
wave_file(file_name, data) # Saves the file to current directory
```

--------------------------------

### Example Prompt: Refining a Car Sketch into a Polished Photo

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

This is a concrete example demonstrating the application of an image refinement prompt template. It instructs the Gemini API to transform a pencil sketch of a futuristic car into a showroom-quality photo, specifying details to preserve (sleek lines, low profile) and new elements to introduce (metallic blue paint, neon rim lighting).

```text
"Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting."
```

--------------------------------

### Start and Process a Deep Research Stream (Python, JavaScript, REST)

Source: https://ai.google.dev/gemini-api/docs/deep-research

Initiate a Deep Research task with streaming enabled and process real-time updates. This example demonstrates how to capture the `interaction_id` from the `interaction.start` event and track the `event_id` for potential stream reconnection. Enabling `thinking_summaries: "auto"` is crucial for receiving intermediate thought processes.

```python
stream = client.interactions.create(
    input="Research the history of Google TPUs.",
    agent="deep-research-pro-preview-12-2025",
    background=True,
    stream=True,
    agent_config={
        "type": "deep-research",
        "thinking_summaries": "auto"
    }
)

interaction_id = None
last_event_id = None

for chunk in stream:
    if chunk.event_type == "interaction.start":
        interaction_id = chunk.interaction.id
        print(f"Interaction started: {interaction_id}")

    if chunk.event_id:
        last_event_id = chunk.event_id

    if chunk.event_type == "content.delta":
        if chunk.delta.type == "text":
            print(chunk.delta.text, end="", flush=True)
        elif chunk.delta.type == "thought_summary":
            print(f"Thought: {chunk.delta.content.text}", flush=True)

    elif chunk.event_type == "interaction.complete":
        print("\nResearch Complete")
```

```javascript
const stream = await client.interactions.create({
    input: 'Research the history of Google TPUs.',
    agent: 'deep-research-pro-preview-12-2025',
    background: true,
    stream: true,
    agent_config: {
        type: 'deep-research',
        thinking_summaries: 'auto'
    }
});

let interactionId;
let lastEventId;

for await (const chunk of stream) {
    // 1. Capture Interaction ID
    if (chunk.event_type === 'interaction.start') {
        interactionId = chunk.interaction.id;
        console.log(`Interaction started: ${interactionId}`);
    }

    // 2. Track IDs for potential reconnection
    if (chunk.event_id) lastEventId = chunk.event_id;

    // 3. Handle Content
    if (chunk.event_type === 'content.delta') {
        if (chunk.delta.type === 'text') {
            process.stdout.write(chunk.delta.text);
        } else if (chunk.delta.type === 'thought_summary') {
            console.log(`Thought: ${chunk.delta.content.text}`);
        }
    } else if (chunk.event_type === 'interaction.complete') {
        console.log('\nResearch Complete');
    }
}
```

```rest
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse" \
-H "Content-Type: application/json" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-d '{
    "input": "Research the history of Google TPUs.",
    "agent": "deep-research-pro-preview-12-2025",
    "background": true,
    "stream": true,
    "agent_config": {
        "type": "deep-research",
        "thinking_summaries": "auto"
    }
}'
# Note: Look for the 'interaction.start' event to get the interaction ID.
```

--------------------------------

### cURL/Bash: Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=ru

Complete bash script example using cURL to generate videos and poll operation status. Demonstrates REST API usage with JSON parsing using jq.

```APIDOC
## Bash/cURL Video Generation Example

### Description
Bash script implementation using cURL for REST API calls and jq for JSON parsing. Demonstrates complete workflow from video generation to download.

### Prerequisites
- `curl` - Command-line HTTP client
- `jq` - JSON processor (for parsing responses)
- Set GEMINI_API_KEY environment variable

### Code Example
```bash
#!/bin/bash

# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Step 1: Send request to generate video and capture the operation name
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That\'s the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

echo "Operation started: $operation_name"

# Step 2: Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Step 3: Download the video using the URI and follow redirects
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    echo "Generated video saved to dialogue_example.mp4"
    break
  fi
  
  # Wait for 10 seconds before checking again
  echo "Waiting for video generation to complete..."
  sleep 10
done
```

### Key Commands
- `curl -s` - Make silent HTTP request
- `jq -r .name` - Extract operation name from JSON response
- `jq .done` - Check if operation is complete
- `curl -L` - Follow redirects for video download
- `sleep 10` - Wait before next poll
```

--------------------------------

### Configure Batch Requests with System Instructions

Source: https://ai.google.dev/gemini-api/docs/batch-api_batch=file

Create inline batch requests with system instructions to customize model behavior. This example shows how to specify a system instruction for individual requests within a batch, allowing per-request customization of the model's role and behavior.

```Python
inline_requests_list = [
    {'contents': [{'parts': [{'text': 'Write a short poem about a cloud.'}]}]},
    {'contents': [{
        'parts': [{
            'text': 'Write a short poem about a cat.'
            }]
        }],
    'config': {
        'system_instruction': {'parts': [{'text': 'You are a cat. Your name is Neko.'}]}
    }
    }
]
```

```JavaScript
inlineRequestsList = [
    {contents: [{parts: [{text: 'Write a short poem about a cloud.'}]}]},
    {contents: [{parts: [{text: 'Write a short poem about a cat.'}]}],
     config: {systemInstruction: {parts: [{text: 'You are a cat. Your name is Neko.'}]}}}
]
```

--------------------------------

### Configure Content Generation with GenerateContentConfig in Go

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=sq

Demonstrates setting up generation configuration parameters including temperature, topP, topK, and responseMimeType before calling the GenerateContent method with the Gemini API client in Go. This example configures the model to return JSON-formatted responses.

```go
if err != nil {
    log.Fatal(err)
}

temp := float32(0.9)
topP := float32(0.5)
topK := float32(20.0)

config := &genai.GenerateContentConfig{
  Temperature:       &temp,
  TopP:              &topP,
  TopK:              &topK,
  ResponseMIMEType:  "application/json",
}

result, _ := client.Models.GenerateContent(
  ctx,
  "gemini-2.5-flash",
  genai.Text("What is the average size of a swallow?"),
  config,
)

fmt.Println(result.Text())
```

--------------------------------

### JavaScript/TypeScript: Generate and Download Video

Source: https://ai.google.dev/gemini-api/docs/video_example=dialogue&hl=ru

Complete JavaScript example using the Google GenAI SDK demonstrating video generation, operation polling with async/await, and file download.

```APIDOC
## JavaScript/TypeScript Video Generation Example

### Description
JavaScript/TypeScript implementation using the Google GenAI SDK for video generation with async/await pattern.

### Prerequisites
- Install: `npm install @google/genai`
- Set GOOGLE_API_KEY environment variable

### Code Example
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

### Key Methods
- `ai.models.generateVideos()` - Initiates video generation
- `ai.operations.getVideosOperation()` - Polls operation status
- `ai.files.download()` - Downloads the generated video file
- `setTimeout()` - Implements polling delay
```

--------------------------------

### Go Client - Generate Content with Configuration

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=de

SDK implementation for generating content using the Go client library. Demonstrates how to configure generation parameters like temperature, topP, topK, and response MIME type when calling the GenerateContent method.

```APIDOC
## Go SDK - GenerateContent Method

### Description
Uses the Google Generative AI Go client to generate content with customized generation configuration parameters.

### Implementation
```go
import "github.com/google/generative-ai-go/genai"

// Create generation config
temp := float32(0.7)
topP := float32(0.95)
topK := float32(20.0)

config := &genai.GenerateContentConfig{
  Temperature:      &temp,
  TopP:             &topP,
  TopK:             &topK,
  ResponseMIMEType: "application/json",
}

// Call GenerateContent
result, err := client.Models.GenerateContent(
  ctx,
  "gemini-2.5-flash",
  genai.Text("What is the average size of a swallow?"),
  config,
)

// Process response
if err != nil {
  log.Fatal(err)
}
fmt.Println(result.Text())
```

### Configuration Parameters
- **Temperature** (float32) - Controls output randomness (0.0-2.0)
- **TopP** (float32) - Nucleus sampling parameter (0.0-1.0)
- **TopK** (float32) - Top-k sampling parameter
- **ResponseMIMEType** (string) - Format for response (e.g., "application/json")
```

--------------------------------

### Generate Structured JSON Output with Gemini API

Source: https://ai.google.dev/gemini-api/docs/structured-output_example=recipe&hl=pt-br

These examples demonstrate how to instruct the Gemini API to generate structured JSON output directly, rather than free-form text. By specifying `responseMimeType` as `application/json` and providing a detailed `responseJsonSchema`, the model is guided to produce a JSON object conforming to the desired structure, such as a recipe. This capability is useful for programmatic data extraction and integration.

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {

```

--------------------------------

### Integrate Google Search Retrieval Tool with Gemini API (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/google-search_hl=th

This collection of code examples demonstrates how to configure and use the `google_search` retrieval tool with the Gemini 1.5 Flash model across different programming languages and tools. It includes setting up dynamic retrieval with a confidence threshold (e.g., 0.7) to ensure searches only occur for high-confidence queries. Examples cover Python, JavaScript (noting a legacy approach), and direct API calls via cURL, illustrating the request structure and how to interpret the model's response regarding grounding metadata.

```python
import os
from google import genai
from google.genai import types

client = genai.Client()

retrieval_tool = types.Tool(
    google_search_retrieval=types.GoogleSearchRetrieval(
        dynamic_retrieval_config=types.DynamicRetrievalConfig(
            mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamic_threshold=0.7 # Only search if confidence > 70%
        )
    )
)

config = types.GenerateContentConfig(
    tools=[retrieval_tool]
)

response = client.models.generate_content(
    model='gemini-1.5-flash',
    contents="Who won the euro 2024?",
    config=config,
)
print(response.text)
if not response.candidates[0].grounding_metadata:
  print("\nModel answered from its own knowledge.")
```

```javascript
// Note: This is a legacy approach for Gemini 1.5 models.
// The 'googleSearch' tool is recommended for all new development.
import { GoogleGenAI, DynamicRetrievalConfigMode } from "@google/genai";

const ai = new GoogleGenAI({});

const retrievalTool = {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
      dynamicThreshold: 0.7, // Only search if confidence > 70%
    },
  },
};

const config = {
  tools: [retrievalTool],
};

const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Who won the euro 2024?",
  config,
});

console.log(response.text);
if (!response.candidates?.[0]?.groundingMetadata) {
  console.log("\nModel answered from its own knowledge.");
}
```

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \

  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [
      {"parts": [{"text": "Who won the euro 2024?"}]}
    ],
    "tools": [{
      "google_search_retrieval": {
        "dynamic_retrieval_config": {
          "mode": "MODE_DYNAMIC",
          "dynamic_threshold": 0.7
        }
      }
    }]
  }'
```

--------------------------------

### Light Control with Function Declarations

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial

Demonstrates how to define function schemas for light control and pass them as tools to the Gemini API. This example shows how to set up function declarations and request the model to execute Python code that controls lights.

```APIDOC
## Function Declarations for Tool Control

### Description
Define function schemas that the Gemini API can call to control external systems like lights.

### Python Example
```python
from google.genai import types

# Define light control function schemas
turn_on_the_lights_schema = {'name': 'turn_on_the_lights'}
turn_off_the_lights_schema = {'name': 'turn_off_the_lights'}

# Create prompt requesting light control
prompt = """Hey, can you write run some python code to turn on the lights, wait 10s and then turn off the lights?"""

# Configure tools with code execution and function declarations
tools = [
    {'code_execution': {}},
    {'function_declarations': [turn_on_the_lights_schema, turn_off_the_lights_schema]}
]

# Execute with audio modality
await run(prompt, tools=tools, modality="AUDIO")
```

### JavaScript Example
```javascript
// Define light control function schemas
const turnOnTheLightsSchema = { name: 'turn_on_the_lights' };
const turnOffTheLightsSchema = { name: 'turn_off_the_lights' };

const prompt = `Hey, can you write run some python code to turn on the lights, wait 10s and then turn off the lights?`;

// Configure tools with code execution and function declarations
const tools = [
  { codeExecution: {} },
  { functionDeclarations: [turnOnTheLightsSchema, turnOffTheLightsSchema] }
];

await run(prompt, tools=tools, modality="AUDIO");
```
```

--------------------------------

### Example JSON Prompt for Targeted Object Style Change

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ko

This JSON-formatted string serves as an example prompt for the Gemini API, instructing the model to perform a highly specific style modification. It demonstrates how to target a single object within an image (a blue sofa) and change its style to a 'vintage, brown leather chesterfield' while explicitly preserving all other elements like pillows and lighting. This level of detail allows for precise image manipulation using text commands.

```json
{\"text\": \"Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged.\"}
```

--------------------------------

### Stream AI Model Responses using Gemini API

Source: https://ai.google.dev/gemini-api/docs/system-instructions

This collection of code examples demonstrates how to use streaming with the Gemini API to receive incremental `GenerateContentResponse` instances. By processing the generated content in chunks, applications can provide a more fluid and responsive user experience instead of waiting for the entire generation process to complete. Each example shows client initialization, calling the `generateContentStream` method, and iterating over the response chunks.

```python
from google import genai

client = genai.Client()

response = client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents=["Explain how AI works"]
)
for chunk in response:
    print(chunk.text, end="")
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works",
  });

  for await (const chunk of response) {
    console.log(chunk.text);
  }
}

await main();
```

```go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  stream := client.Models.GenerateContentStream(
      ctx,
      "gemini-2.5-flash",
      genai.Text("Write a story about a magic backpack."),
      nil,
  )

  for chunk, _ := range stream {
      part := chunk.Candidates[0].Content.Parts[0]
      fmt.Print(part.Text)
  }
}
```

```java
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;

public class GenerateContentStream {
  public static void main(String[] args) {

    Client client = new Client();

    ResponseStream<GenerateContentResponse> responseStream =
      client.models.generateContentStream(
          "gemini-2.5-flash", "Write a story about a magic backpack.", null);

    for (GenerateContentResponse res : responseStream) {
      System.out.print(res.text());
    }

    // To save resources and avoid connection leaks, it is recommended to close the response
    // stream after consumption (or using try block to get the response stream).
    responseStream.close();
  }
}
```

```rest
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  --no-buffer \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ]
  }'
```

```apps-script
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        parts: [
          { text: 'Explain how AI works' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

--------------------------------

### Manage File Search Stores using Python, JavaScript, and REST APIs

Source: https://ai.google.dev/gemini-api/docs/file-search

This snippet demonstrates how to perform common CRUD operations (Create, List, Get, Delete) on File Search stores using various programming languages and the REST API. File Search stores act as persistent containers for document embeddings, enabling semantic search functionalities. The examples illustrate how to programmatically manage these vital components of the File Search service.

```Python
file_search_store = client.file_search_stores.create(config={'display_name': 'my-file_search-store-123'})

for file_search_store in client.file_search_stores.list():
    print(file_search_store)

my_file_search_store = client.file_search_stores.get(name='fileSearchStores/my-file_search-store-123')

client.file_search_stores.delete(name='fileSearchStores/my-file_search-store-123', config={'force': True})
```

```JavaScript
const fileSearchStore = await ai.fileSearchStores.create({
  config: { displayName: 'my-file_search-store-123' }
});

const fileSearchStores = await ai.fileSearchStores.list();
for await (const store of fileSearchStores) {
  console.log(store);
}

const myFileSearchStore = await ai.fileSearchStores.get({
  name: 'fileSearchStores/my-file_search-store-123'
});

await ai.fileSearchStores.delete({
  name: 'fileSearchStores/my-file_search-store-123',
  config: { force: true }
});
```

```REST
curl -X POST \"https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${GEMINI_API_KEY}\" \
    -H \"Content-Type: application/json\" \
    -d '{ \"displayName\": \"My Store\" }'\n\ncurl \"https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=${GEMINI_API_KEY}\" \\
\ncurl \"https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123?key=${GEMINI_API_KEY}\"\n\ncurl -X DELETE \"https://generativelanguage.googleapis.com/v1beta/fileSearchStores/my-file_search-store-123?key=${GEMINI_API_KEY}\"
```

--------------------------------

### JavaScript - Enable Code Execution

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=bn

JavaScript example using the Google GenAI library for Node.js. Shows how to configure code execution, send prompts, and process the response containing generated code and execution results.

```APIDOC
## JavaScript Code Execution Example

### Description
Use the JavaScript Google GenAI library to enable code execution and handle multi-part responses.

### Setup
```javascript
import { GoogleGenAI } from "@google/genai";
```

### Implementation
```javascript
import { GoogleGenAI } from "@google/genai";

// Initialize the AI instance
const ai = new GoogleGenAI({});

// Generate content with code execution enabled
let response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    "What is the sum of the first 50 prime numbers? " +
      "Generate and run code for the calculation, and make sure you get all 50.",
  ],
  config: {
    tools: [{ codeExecution: {} }],
  },
});

// Extract and process response parts
const parts = response?.candidates?.[0]?.content?.parts || [];
parts.forEach((part) => {
  // Handle text responses
  if (part.text) {
    console.log(part.text);
  }

  // Handle generated code
  if (part.executableCode && part.executableCode.code) {
    console.log(part.executableCode.code);
  }

  // Handle code execution results
  if (part.codeExecutionResult && part.codeExecutionResult.output) {
    console.log(part.codeExecutionResult.output);
  }
});
```

### Response Structure
- **response.candidates[0].content.parts**: Array of content parts
  - **text**: Model-generated explanation
  - **executableCode.code**: Generated JavaScript/Python code
  - **codeExecutionResult.output**: Output from code execution
```

--------------------------------

### POST /v1beta/models/{model}:generateContent

Source: https://ai.google.dev/gemini-api/docs/quickstart

Generate content from text input using the Gemini API. This endpoint accepts a text prompt and returns an AI-generated response. The model parameter specifies which Gemini model to use (e.g., gemini-2.5-flash).

```APIDOC
## POST /v1beta/models/{model}:generateContent

### Description
Generates content using the specified Gemini model. This endpoint accepts text input and returns AI-generated text responses.

### Method
POST

### Endpoint
https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent

### Parameters
#### Path Parameters
- **model** (string) - Required - The model identifier (e.g., "gemini-2.5-flash")

#### Headers
- **x-goog-api-key** (string) - Required - API key from GEMINI_API_KEY environment variable
- **Content-Type** (string) - Required - Set to "application/json"

#### Request Body
- **contents** (array) - Required - Array of content objects containing the prompt
  - **parts** (array) - Required - Array of content parts
    - **text** (string) - Required - The text prompt to send to the model

### Request Example
{
  "contents": [
    {
      "parts": [
        {
          "text": "Explain how AI works in a few words"
        }
      ]
    }
  ]
}

### Response
#### Success Response (200)
- **candidates** (array) - Array of generated content candidates
  - **content** (object) - The generated content
    - **parts** (array) - Array of content parts in the response
      - **text** (string) - The generated text response

#### Response Example
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI works by processing data through neural networks that learn patterns and make predictions based on that learned information."
          }
        ]
      }
    }
  ]
}

### cURL Example
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

--------------------------------

### Configure and Generate Content with Gemini API (Older SDK)

Source: https://ai.google.dev/gemini-api/docs/migrate

Demonstrates how to initialize the Gemini API model and generate content using older SDK versions. This approach typically involves passing generation parameters directly during model instantiation or as separate setter methods on the model object. Examples include Python's `google.generativeai`, JavaScript's `@google-ai/generative-ai`, and Go's `genai` packages.

```python
import google.generativeai as genai

model = genai.GenerativeModel(
  'gemini-2.0-flash',
    system_instruction='you are a story teller for kids under 5 years old',
    generation_config=genai.GenerationConfig(
      max_output_tokens=400,
      top_k=2,
      top_p=0.5,
      temperature=0.5,
      response_mime_type='application/json',
      stop_sequences=['\n'],
    )
)
response = model.generate_content('tell me a story in 100 words')
```

```javascript
import { GoogleGenerativeAI } from "@google-ai/generative-ai";

const genAI = new GoogleGenerativeAI("GEMINI_API_KEY");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    candidateCount: 1,
    stopSequences: ["x"],
    maxOutputTokens: 20,
    temperature: 1.0,
  },
});

const result = await model.generateContent(
  "Tell me a story about a magic backpack.",
);
console.log(result.response.text())
```

```go
ctx := context.Background()
client, err := genai.NewClient(ctx, option.WithAPIKey("GEMINI_API_KEY"))
if err != nil {
    log.Fatal(err)
}
defer client.Close()

model := client.GenerativeModel("gemini-2.0-flash")
model.SetTemperature(0.5)
model.SetTopP(0.5)
model.SetTopK(2.0)
model.SetMaxOutputTokens(100)
model.ResponseMIMEType = "application/json"
resp, err := model.GenerateContent(ctx, genai.Text("Tell me about New York"))
if err != nil {
    log.Fatal(err)
}
printResponse(resp) // utility for printing response
```

--------------------------------

### Generate Gemini API Content with Python, JavaScript, and REST

Source: https://ai.google.dev/gemini-api/docs/gemini-for-research

This example demonstrates how to make a request to the Gemini API to generate content from a text prompt. It provides implementations in Python, JavaScript (Node.js), and a direct REST call using cURL. Users need to ensure they have an API key and, for the REST example, replace `$GEMINI_API_KEY`.

```python
from google import genai

client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="How large is the universe?",
)

print(response.text)

```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "How large is the universe?",
  });
  console.log(response.text);
}

await main();

```

```rest
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-X POST \
-d '{
  "contents": [{
    "parts":[{"text": "How large is the universe?"}]
    }]
   }'

```

--------------------------------

### Python: Generate Content with Function Declarations

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial_hl=fr

Use the Python client library to send requests with function declarations to the Gemini API. This example demonstrates how to configure the client, define functions, and handle function call responses.

```APIDOC
## Python Implementation: Function Calling with Gemini

### Description
Implement function calling in Python using the Google Gemini client library. This approach provides a higher-level interface for defining functions and processing model responses.

### Method
Python SDK - client.models.generate_content()

### Basic Usage

#### Import and Initialize
```python
from google.genai import Client

client = Client(api_key="YOUR_GEMINI_API_KEY")
```

#### Define Function Declaration
```python
from google.genai import types

schedule_meeting_function = types.FunctionDeclaration(
    name="schedule_meeting",
    description="Schedules a meeting with specified attendees at a given time and date.",
    parameters=types.Schema(
        type="object",
        properties={
            "attendees": types.Schema(
                type="array",
                items=types.Schema(type="string"),
                description="List of people attending the meeting."
            ),
            "date": types.Schema(
                type="string",
                description="Date of the meeting (e.g., '2024-07-29')"
            ),
            "time": types.Schema(
                type="string",
                description="Time of the meeting (e.g., '15:00')"
            ),
            "topic": types.Schema(
                type="string",
                description="The subject or topic of the meeting."
            )
        },
        required=["attendees", "date", "time", "topic"]
    )
)
```

#### Configure and Send Request
```python
config = types.GenerateContentConfig(
    tools=[types.Tool(function_declarations=[schedule_meeting_function])]
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Schedule a meeting with Bob and Alice for 03/14/2025 at 10:00 AM about the Q3 planning.",
    config=config,
)
```

#### Handle Function Call Response
```python
if response.candidates[0].content.parts[0].function_call:
    function_call = response.candidates[0].content.parts[0].function_call
    print(f"Function to call: {function_call.name}")
    print(f"Arguments: {function_call.args}")
    # In a real app, call your function:
    # result = schedule_meeting(**function_call.args)
else:
    print("No function call found in the response.")
    print(response.text)
```

### Response Structure
- **response.candidates** - List of response candidates
- **response.candidates[0].content.parts[0].function_call.name** - Function name to invoke
- **response.candidates[0].content.parts[0].function_call.args** - Function arguments as dictionary
```

--------------------------------

### Configure Gemini Image Generation with Go

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=fa

This Go example demonstrates how to use the Gemini API client to generate content with specific image configurations. It covers setting `AspectRatio` for `gemini-2.5-flash-image` and adding `ImageSize` for `gemini-3-pro-image-preview` through the `GenerateContentConfig` struct.

```go
// For gemini-2.5-flash-image
result, _ := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash-image",
    genai.Text("Create a picture of a nano banana dish in a " +
                " fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
        },
    }
  )

// For gemini-3-pro-image-preview
result_gemini3, _ := client.Models.GenerateContent(
    ctx,
    "gemini-3-pro-image-preview",
    genai.Text("Create a picture of a nano banana dish in a " +
                " fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
          ImageSize: "2K",
        },
    }
  )
```

--------------------------------

### Go Client - Generate Content Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

Go implementation using the Google Generative AI client library to generate images from text prompts and save them to the filesystem.

```APIDOC
## Go Client Library - GenerateContent()

### Description
Generate images using the Go Google Generative AI client library. This method accepts text prompts and returns image data that can be written to files.

### Method
Function: `client.Models.GenerateContent(ctx, model, content)`

### Endpoint
Client method: `GenerateContent(context.Context, string, ...genai.Content) (*GenerateContentResponse, error)`

### Parameters
- **ctx** (context.Context) - Required - Context for the request
- **model** (string) - Required - Model identifier ("gemini-2.5-flash-image")
- **content** (genai.Content) - Required - Content with text prompt
  - **genai.Text(string)** - Text prompt for image generation

### Usage Example
```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash-image",
        genai.Text("A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop with pottery wheels and shelves of clay pots in the background. The scene is illuminated by soft, golden hour light streaming through a window, highlighting the fine texture of the clay and the fabric of his apron. Captured with an 85mm portrait lens, resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful."),
    )

    for _, part := range result.Candidates[0].Content.Parts {
        if part.Text != "" {
            fmt.Println(part.Text)
        } else if part.InlineData != nil {
            imageBytes := part.InlineData.Data
            outputFilename := "photorealistic_example.png"
            _ = os.WriteFile(outputFilename, imageBytes, 0644)
        }
    }
}
```

### Response
- **GenerateContentResponse** - Response object
  - **Candidates** ([]Candidate) - Array of generated candidates
    - **Content** (Content) - Generated content
      - **Parts** ([]Part) - Response parts
        - **Text** (string) - Optional text content
        - **InlineData** (*Blob) - Optional inline image data
          - **Data** ([]byte) - Raw image bytes
          - **MimeType** (string) - Image MIME type

### Error Handling
- Check error return value from GenerateContent()
- Verify Candidates array length before access
- Check InlineData nil status before processing
```

--------------------------------

### Initialize Gemini API client and prepare inpainting prompt in Python

Source: https://ai.google.dev/gemini-api/docs/image-generation

This Python code snippet initializes the Google Gemini API client and prepares the inputs for an image inpainting task. It uses the Pillow (PIL) library to load a local image file. A multi-line text prompt is then defined, specifying the precise modification to be applied to the image's elements.

```python
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

# Base image prompt: "A wide shot of a modern, well-lit living room with a prominent blue sofa in the center. A coffee table is in front of it and a large window is in the background."
living_room_image = Image.open('/path/to/your/living_room.png')
text_input = """Using the provided image of a living room, change only the blue sofa to be
a vintage, brown leather chesterfield sofa. Keep the rest of the room,
including the pillows on the sofa and the lighting, unchanged."""
```

--------------------------------

### Gemini API - Go Implementation

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=ja

Go implementation using the google.golang.org/genai package. Demonstrates image download, client initialization, content generation, and response parsing.

```APIDOC
## Go SDK Implementation

### Description
Implementation of Gemini API calls using Go with the genai package. Shows image downloading, client setup, content generation with code execution, and response handling.

### Imports
```go
import (
    "context"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "google.golang.org/genai"
)
```

### Client Initialization
```go
ctx := context.Background()
client, err := genai.NewClient(ctx, nil)
if err != nil {
    log.Fatal(err)
}
```

### Download Image
```go
imageResp, err := http.Get("https://goo.gle/instrument-img")
if err != nil {
    log.Fatal(err)
}
defer imageResp.Body.Close()

imageBytes, err := io.ReadAll(imageResp.Body)
if err != nil {
    log.Fatal(err)
}
```

### Configure Code Execution
```go
config := &genai.GenerateContentConfig{
    Tools: []*genai.Tool{
        {CodeExecution: &genai.ToolCodeExecution{}}
    }
}
```

### Generate Content Request
```go
result, err := client.Models.GenerateContent(
    ctx,
    "gemini-3-flash-preview",
    []*genai.Content{
        {
            Parts: []*genai.Part{
                {InlineData: &genai.Blob{MIMEType: "image/jpeg", Data: imageBytes}},
                {Text: "Zoom into the expression pedals and tell me how many pedals are there?"}
            },
            Role: "user"
        }
    },
    config
)
if err != nil {
    log.Fatal(err)
}
```

### Response Processing
```go
for _, cand := range result.Candidates {
    for _, part := range cand.Content.Parts {
        if part.Text != "" {
            fmt.Println("Text:", part.Text)
        }
        if part.ExecutableCode != nil {
            fmt.Printf("Generated Code (%s):\n%s\n", 
                part.ExecutableCode.Language, 
                part.ExecutableCode.Code)
        }
        if part.CodeExecutionResult != nil {
            fmt.Printf("Execution Output (%s):\n%s\n", 
                part.CodeExecutionResult.Outcome, 
                part.CodeExecutionResult.Output)
        }
    }
}
```

### Notes
- Client initialization reads GEMINI_API_KEY from environment
- Image data must be provided as bytes with correct MIME type
- Content role should be set to "user" for user messages
```

--------------------------------

### JavaScript: Generate Content with Function Declarations

Source: https://ai.google.dev/gemini-api/docs/function-calling/tutorial_hl=fr

Implement function calling in JavaScript using the Google GenAI client library. This example shows how to define function declarations, make API requests, and process function calls in a Node.js environment.

```APIDOC
## JavaScript Implementation: Function Calling with Gemini

### Description
Implement function calling in JavaScript using the @google/genai library. This provides an async/await interface for working with the Gemini API and handling function declarations.

### Method
JavaScript SDK - ai.models.generateContent()

### Installation
```bash
npm install @google/genai
```

#### Import and Initialize
```javascript
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({});
```

#### Define Function Declaration
```javascript
const scheduleMeetingFunctionDeclaration = {
  name: 'schedule_meeting',
  description: 'Schedules a meeting with specified attendees at a given time and date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      attendees: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'List of people attending the meeting.',
      },
      date: {
        type: Type.STRING,
        description: 'Date of the meeting (e.g., "2024-07-29")',
      },
      time: {
        type: Type.STRING,
        description: 'Time of the meeting (e.g., "15:00")',
      },
      topic: {
        type: Type.STRING,
        description: 'The subject or topic of the meeting.',
      },
    },
    required: ['attendees', 'date', 'time', 'topic'],
  },
};
```

#### Send Request with Function Declarations
```javascript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Schedule a meeting with Bob and Alice for 03/27/2025 at 10:00 AM about the Q3 planning.',
  config: {
    tools: [{
      functionDeclarations: [scheduleMeetingFunctionDeclaration]
    }],
  },
});
```

#### Handle Function Call Response
```javascript
if (response.functionCalls && response.functionCalls.length > 0) {
  const functionCall = response.functionCalls[0];
  console.log(`Function to call: ${functionCall.name}`);
  console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
  // In a real app, call your actual function:
  // const result = await scheduleMeeting(functionCall.args);
} else {
  console.log("No function call found in the response.");
  console.log(response.text);
}
```

### Response Structure
- **response.functionCalls** - Array of function calls returned by the model
- **response.functionCalls[0].name** - Name of the function to invoke
- **response.functionCalls[0].args** - Object containing function arguments
- **response.text** - Plain text response when no function call is made
```

--------------------------------

### Provide Gemini API Key Explicitly (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/api-key

These code examples illustrate how to explicitly provide the Gemini API key directly within your application code for various programming languages. This method is useful when environment variables are not supported, for making REST calls, or when fine-grained control over API key usage is preferred.

```python
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

response = client.models.generate_content(
    model="gemini-2.5-flash", contents="Explain how AI works in a few words"
)
print(response.text)
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "YOUR_API_KEY" });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

main();
```

```go
package main

import (
    "context"
    "fmt"
    "log"
    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey:  "YOUR_API_KEY",
        Backend: genai.BackendGeminiAPI,
    })
    if err != nil {
        log.Fatal(err)
    }

    result, err := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("Explain how AI works in a few words"),
        nil,
    )
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(result.Text())
}
```

```java
package com.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GenerateTextFromTextInput {
  public static void main(String[] args) {
    Client client = Client.builder().apiKey("YOUR_API_KEY").build();

    GenerateContentResponse response =
        client.models.generateContent(
            "gemini-2.5-flash",
            "Explain how AI works in a few words",
            null);

    System.out.println(response.text());
  }
}
```

```curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  -H 'Content-Type: application/json' \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'
```

--------------------------------

### Thinking Budget Configuration Reference

Source: https://ai.google.dev/gemini-api/docs/thinking

Complete reference guide for thinking budget settings across all Gemini model variants, including default behavior, valid ranges, and special values.

```APIDOC
## Thinking Budget Configuration Reference

### Special Values
- **thinkingBudget: 0** - Disables thinking (not available for Gemini 2.5 Pro)
- **thinkingBudget: -1** - Enables dynamic thinking (model adjusts budget based on request complexity)
- **thinkingBudget: [positive integer]** - Fixed token budget for reasoning

### Model Configuration Table

| Model | Default Setting | Valid Range | Disable Thinking | Dynamic Thinking |
|-------|-----------------|-------------|------------------|------------------|
| Gemini 2.5 Pro | Dynamic thinking | 128 to 32768 | N/A: Cannot disable | thinkingBudget = -1 (Default) |
| Gemini 2.5 Flash | Dynamic thinking | 0 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 (Default) |
| Gemini 2.5 Flash Preview | Dynamic thinking | 0 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 (Default) |
| Gemini 2.5 Flash Lite | Model does not think | 512 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 |
| Gemini 2.5 Flash Lite Preview | Model does not think | 512 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 |
| Robotics-ER 1.5 Preview | Dynamic thinking | 0 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 (Default) |
| Gemini 2.5 Flash Live Native Audio Preview (09-2025) | Dynamic thinking | 0 to 24576 | thinkingBudget = 0 | thinkingBudget = -1 (Default) |

### Important Notes
- **Gemini 3 Models**: Use `thinkingLevel` parameter instead of `thinkingBudget`. Using `thinkingBudget` with Gemini 3 Pro may result in suboptimal performance.
- **Token Overflow/Underflow**: Depending on the prompt complexity, the model might overflow or underflow the token budget.
- **Dynamic Thinking Default**: Most models have dynamic thinking enabled by default when `thinkingBudget` is not explicitly set.

### Usage Recommendations
- Set a specific budget (e.g., 1024) for consistent reasoning behavior
- Use -1 for dynamic thinking when optimal resource usage is desired
- Set to 0 when thinking is not needed (available on Flash models)
- Monitor token usage as prompts affecting thinking behavior may exceed budget
```

--------------------------------

### System Instructions Template for Agent Reasoning and Planning

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies_hl=bn

A comprehensive prompt template that establishes nine core reasoning principles for AI agents to follow before taking any action (tool calls or user responses). It enforces systematic analysis of logical dependencies, constraints, risk factors, and information sources while maintaining adaptive reasoning and persistence.

```text
You are a very strong reasoner and planner. Use these critical instructions to structure your plans, thoughts, and responses.

Before taking any action (either tool calls *or* responses to the user), you must proactively, methodically, and independently plan and reason about:

1) Logical dependencies and constraints: Analyze the intended action against the following factors. Resolve conflicts in order of importance:
    1.1) Policy-based rules, mandatory prerequisites, and constraints.
    1.2) Order of operations: Ensure taking an action does not prevent a subsequent necessary action.
        1.2.1) The user may request actions in a random order, but you may need to reorder operations to maximize successful completion of the task.
    1.3) Other prerequisites (information and/or actions needed).
    1.4) Explicit user constraints or preferences.

2) Risk assessment: What are the consequences of taking the action? Will the new state cause any future issues?
    2.1) For exploratory tasks (like searches), missing *optional* parameters is a LOW risk. **Prefer calling the tool with the available information over asking the user, unless** your `Rule 1` (Logical Dependencies) reasoning determines that optional information is required for a later step in your plan.

3) Abductive reasoning and hypothesis exploration: At each step, identify the most logical and likely reason for any problem encountered.
    3.1) Look beyond immediate or obvious causes. The most likely reason may not be the simplest and may require deeper inference.
    3.2) Hypotheses may require additional research. Each hypothesis may take multiple steps to test.
    3.3) Prioritize hypotheses based on likelihood, but do not discard less likely ones prematurely. A low-probability event may still be the root cause.

4) Outcome evaluation and adaptability: Does the previous observation require any changes to your plan?
    4.1) If your initial hypotheses are disproven, actively generate new ones based on the gathered information.

5) Information availability: Incorporate all applicable and alternative sources of information, including:
    5.1) Using available tools and their capabilities
    5.2) All policies, rules, checklists, and constraints
    5.3) Previous observations and conversation history
    5.4) Information only available by asking the user

6) Precision and Grounding: Ensure your reasoning is extremely precise and relevant to each exact ongoing situation.
    6.1) Verify your claims by quoting the exact applicable information (including policies) when referring to them.

7) Completeness: Ensure that all requirements, constraints, options, and preferences are exhaustively incorporated into your plan.
    7.1) Resolve conflicts using the order of importance in #1.
    7.2) Avoid premature conclusions: There may be multiple relevant options for a given situation.
        7.2.1) To check for whether an option is relevant, reason about all information sources from #5.
        7.2.2) You may need to consult the user to even know whether something is applicable. Do not assume it is not applicable without checking.
    7.3) Review applicable sources of information from #5 to confirm which are relevant to the current state.

8) Persistence and patience: Do not give up unless all the reasoning above is exhausted.
    8.1) Don't be dissuaded by time taken or user frustration.
    8.2) This persistence must be intelligent: On *transient* errors (e.g. please try again), you *must* retry **unless an explicit retry limit (e.g., max x tries) has been reached**. If such a limit is hit, you *must* stop. On *other* errors, you must change your strategy or arguments, not repeat the same failed call.

9) Inhibit your response: only take an action after all the above reasoning is completed. Once you've taken an action, you cannot take it back.
```

--------------------------------

### Generate and Edit Images with Gemini API (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/image-generation

These examples demonstrate how to send an image along with a text prompt to the Gemini API's `gemini-2.5-flash-image` model to perform image generation or inpainting. The input consists of an initial image (e.g., `living_room_image` or a file path) and a textual instruction for modification. The output is parsed to extract either text descriptions or the modified image data, which is then saved to a file.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[living_room_image, text_input],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("living_room_edited.png")
```

```java
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Inpainting {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.5-flash-image",
          Content.fromParts(
              Part.fromBytes(
                  Files.readAllBytes(
                      Path.of("/path/to/your/living_room.png")),
                  "image/png"),
              Part.fromText("""
                  Using the provided image of a living room, change
                  only the blue sofa to be a vintage, brown leather
                  chesterfield sofa. Keep the rest of the room,
                  including the pillows on the sofa and the lighting,
                  unchanged.
                  """)),
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("living_room_edited.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const imagePath = "/path/to/your/living_room.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
    { text: "Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("living_room_edited.png", buffer);
      console.log("Image saved as living_room_edited.png");
    }
  }
}

main();
```

```go
package main

import (
  "context"
  "fmt"
  "log"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  imagePath := "/path/to/your/living_room.png"
  imgData, _ := os.ReadFile(imagePath)

  parts := []*genai.Part{
    &genai.Part{
      InlineData: &genai.Blob{
        MIMEType: "image/png",
        Data:     imgData,
      },
    },
    genai.NewPartFromText("Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged."),
  }

  contents := []*genai.Content{
    genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash-image",
      contents,
  )

  for _, part := range result.Candidates[0].Content.Parts {
      if part.Text != "" {
          fmt.Println(part.Text)
      } else if part.InlineData != nil {
          imageBytes := part.InlineData.Data
          outputFilename := "living_room_edited.png"
          _ = os.WriteFile(outputFilename, imageBytes, 0644)
      }
  }
}
```

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
        \"parts\":[
            {
              \"inline_data\": {
                \"mime_type\":\"image/png\",
                \"data\": \"<BASE64_IMAGE_DATA>\"
              }
            },
```

--------------------------------

### Upload Audio File and Generate Content - Python

Source: https://ai.google.dev/gemini-api/docs/audio

Uploads an audio file using the Gemini Files API and generates content description using the gemini-2.5-flash model. Requires the google-genai library. Returns the generated text response describing the audio clip.

```python
from google import genai

client = genai.Client()

myfile = client.files.upload(file="path/to/sample.mp3")

response = client.models.generate_content(
    model="gemini-2.5-flash", contents=["Describe this audio clip", myfile]
)

print(response.text)
```

--------------------------------

### Prompt Gemini for Explicit Planning Before Responding

Source: https://ai.google.dev/gemini-api/docs/prompting-strategies

This example demonstrates how to prompt Gemini 3 to perform explicit planning steps before generating a final answer. It instructs the model to parse goals, check input completeness, and create an outline to improve response quality for complex tasks.

```plaintext
Before providing the final answer, please:
1. Parse the stated goal into distinct sub-tasks.
2. Check if the input information is complete.
3. Create a structured outline to achieve the goal.

```

--------------------------------

### Python Example - Extract Recipe with Gemini API

Source: https://ai.google.dev/gemini-api/docs/structured-output_hl=es-419

This Python example demonstrates how to call the Gemini API's generateContent method using the `ai.models.generateContent` function to extract recipe details. It utilizes a predefined `recipeSchema` (Zod in this context) to enforce the output format.

```APIDOC
## Python Example - Extract Recipe with Gemini API\n\n### Description\nThis Python example demonstrates how to call the Gemini API's `generateContent` method using the `ai.models.generateContent` function to extract recipe details. It utilizes a predefined `recipeSchema` (Zod in this context) to enforce the output format.\n\n### Method\nGemini API SDK Call: `ai.models.generateContent`\n\n### Endpoint\nInternal SDK call to Gemini API for content generation.\n\n### Parameters\n#### Request Body\n- **model** (string) - Required - The Gemini model to use (e.g., "gemini-2.5-flash").\n- **contents** (array of objects) - Required - The input prompt for content generation.\n- **config** (object) - Optional - Configuration for content generation.\n    - **responseMimeType** (string) - Required - Specifies the desired MIME type for the response (e.g., "application/json").\n    - **responseJsonSchema** (object) - Required - A JSON schema object to enforce the structure of the generated JSON output.\n\n### Request Example\n```json\n{\n  "model": "gemini-2.5-flash",\n  "contents": [\n    {\
```

--------------------------------

### GET /files/list - List Files

Source: https://ai.google.dev/gemini-api/docs/migrate

Retrieves a list of all files uploaded to the Gemini API.

```APIDOC
## GET /files/list

### Description
Lists all uploaded files.

### Method
GET

### Endpoint
/files/list

### Parameters
None

### Request Example
None

### Response
#### Success Response (200)
- **file.name** (string) - Name of the file.

#### Response Example
```json
[
  {
    "name": "a11.txt"
  }
]
```
```

--------------------------------

### Generate content using explicit caching with the Gemini API (Python)

Source: https://ai.google.dev/gemini-api/docs/caching

This Python code demonstrates how to create and utilize an explicit cache with the Gemini API for content generation. It begins by downloading a video file and uploading it using the Files API, ensuring it's processed. Subsequently, it creates an explicit cache (`client.caches.create`) configured with a specific Gemini model, a display name, a system instruction for video analysis, the uploaded video file, and a 300-second Time-To-Live (TTL). This setup allows for efficient reuse of the video content and system instruction in subsequent model calls, optimizing for cost and performance.

```python
import os
import pathlib
import requests
import time

from google import genai
from google.genai import types

client = genai.Client()

# Download video file
url = 'https://storage.googleapis.com/generativeai-downloads/data/SherlockJr._10min.mp4'
path_to_video_file = pathlib.Path('SherlockJr._10min.mp4')
if not path_to_video_file.exists():
  with path_to_video_file.open('wb') as wf:
    response = requests.get(url, stream=True)
    for chunk in response.iter_content(chunk_size=32768):
      wf.write(chunk)

# Upload the video using the Files API
video_file = client.files.upload(file=path_to_video_file)

# Wait for the file to finish processing
while video_file.state.name == 'PROCESSING':
  print('Waiting for video to be processed.')
  time.sleep(2)
  video_file = client.files.get(name=video_file.name)

print(f'Video processing complete: {video_file.uri}')

# You must use an explicit version suffix: "-flash-001", not just "-flash".
model='models/gemini-2.0-flash-001'

# Create a cache with a 5 minute TTL
cache = client.caches.create(
    model=model,
    config=types.CreateCachedContentConfig(
      display_name='sherlock jr movie', # used to identify the cache
      system_instruction=(
          'You are an expert video analyzer, and your job is to answer '
          'the user\'s query based on the video file you have access to.'
      ),
      contents=[video_file],
      ttl="300s",
  )
)
```

--------------------------------

### Configure Gemini Robotics-ER 1.5 for Code Execution (Python)

Source: https://ai.google.dev/gemini-api/docs/robotics-overview

This Python example shows how to set up the `google.genai` client to interact with the `gemini-robotics-er-1.5-preview` model. It demonstrates loading an image, crafting a prompt that requests code execution for image manipulation (e.g., zooming), and configuring the model with `ToolCodeExecution`. The output processing loop illustrates how to handle different parts of the model's response, including text, generated executable code, and results from that code.

```python
from google import genai
from google.genai import types

client = genai.Client()

# Load your image and set up your prompt
with open('path/to/image-of-object.jpg', 'rb') as f:
    image_bytes = f.read()
prompt = """
          What is the air quality reading? Using the code execution feature,
          zoom in on the image to take a closer look.
        """

response = client.models.generate_content(
    model="gemini-robotics-er-1.5-preview",
    contents=[
        types.Part.from_bytes(
            data=image_bytes,
            mime_type='image/jpeg',
        ),
        prompt
    ],
    config = types.GenerateContentConfig(
        temperature=0.5,
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    )
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    if part.executable_code is not None:
        print(part.executable_code.code)
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)

```

--------------------------------

### Initialize Gemini Client for Files API with URL (Python)

Source: https://ai.google.dev/gemini-api/docs/document-processing

This Python snippet demonstrates the initial setup for using the Gemini Files API to process large PDF files from a given URL. It shows how to import necessary libraries, initialize the `genai.Client`, and define the path to a remote PDF. This approach is recommended for improved latency and bandwidth utilization compared to direct embedding.

```python
from google import genai
from google.genai import types
import io
import httpx

client = genai.Client()

long_context_pdf_path = "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_FlightPlan.pdf"
```

--------------------------------

### Start Background Research Task and Poll Results - REST API

Source: https://ai.google.dev/gemini-api/docs/deep-research

Initiates a background research task using the Gemini Deep Research Agent via HTTP POST request to the Interactions API endpoint, returning an interaction ID. Subsequent GET requests poll the interaction status by ID until completion or failure. Requires GEMINI_API_KEY environment variable and curl utility.

```bash
# 1. Start the research task
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
-H "Content-Type: application/json" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-d '{
    "input": "Research the history of Google TPUs.",
    "agent": "deep-research-pro-preview-12-2025",
    "background": true
}'

# 2. Poll for results (Replace INTERACTION_ID)
# curl -X GET "https://generativelanguage.googleapis.com/v1beta/interactions/INTERACTION_ID" \
# -H "x-goog-api-key: $GEMINI_API_KEY"
```

--------------------------------

### Configure Thinking Budget for Gemini API Native Audio Model

Source: https://ai.google.dev/gemini-api/docs/live-guide

This snippet demonstrates how to configure the `gemini-2.5-flash-native-audio-preview-12-2025` model's 'thinkingBudget' using the Gemini API. The `thinkingBudget` parameter guides the model on the number of thinking tokens to use, with a value of 0 disabling thinking. This configuration is part of establishing a live audio session.

```python
model = "gemini-2.5-flash-native-audio-preview-12-2025"

config = types.LiveConnectConfig(
    response_modalities=["AUDIO"],
    thinking_config=types.ThinkingConfig(
        thinking_budget=1024,
    )
)

async with client.aio.live.connect(model=model, config=config) as session:
    # Send audio input and receive audio
```

```javascript
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = {
  responseModalities: [Modality.AUDIO],
  thinkingConfig: {
    thinkingBudget: 1024,
  },
};

async function main() {

  const session = await ai.live.connect({
    model: model,
    config: config,
    callbacks: ...,
  });

  // Send audio input and receive audio

  session.close();
}

main();
```

--------------------------------

### Configure Gemini Model with Computer Use and Thinking

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=ar

Configures the GenerateContentConfig for the Gemini 2.5 computer-use model with computer_use tool enabled for browser environment and thinking configuration to include model reasoning. This setup enables the model to interact with the browser and provide transparent reasoning.

```python
config = types.GenerateContentConfig(
    tools=[types.Tool(computer_use=types.ComputerUse(
        environment=types.Environment.ENVIRONMENT_BROWSER
    ))],
    thinking_config=types.ThinkingConfig(include_thoughts=True),
)
```

--------------------------------

### Generate Content with Configuration Parameters - Go

Source: https://ai.google.dev/gemini-api/docs/text-generation

Demonstrates generating content using Gemini 2.5 Flash model with custom generation configuration including temperature, topP, topK, and responseMimeType settings. The example sends a text query and returns formatted JSON response.

```go
result, _ := client.Models.GenerateContent(
  ctx,
  "gemini-2.5-flash",
  genai.Text("What is the average size of a swallow?"),
  config,
)

fmt.Println(result.Text())
```

--------------------------------

### Check Gemini API Batch Job Status and Get Results in JavaScript

Source: https://ai.google.dev/gemini-api/docs/batch-api_batch=file&hl=hi

This JavaScript (Node.js) example shows how to query the status of a Gemini API batch job and extract its output. It retrieves the job using `ai.batches.get`, checks for a successful state, and then either downloads a result file or processes inline responses, including specific handling for inlined embedding results and general errors.

```javascript
// Use the name of the job you want to check
// e.g., inlinedBatchJob.name from the previous step
const jobName = "YOUR_BATCH_JOB_NAME";

try {
    const batchJob = await ai.batches.get({ name: jobName });

    if (batchJob.state === 'JOB_STATE_SUCCEEDED') {
        console.log('Found completed batch:', batchJob.displayName);
        console.log(batchJob);

        // If batch job was created with a file destination
        if (batchJob.dest?.fileName) {
            const resultFileName = batchJob.dest.fileName;
            console.log(`Results are in file: ${resultFileName}`);

            console.log("Downloading result file content...");
            const fileContentBuffer = await ai.files.download({ file: resultFileName });

            // Process fileContentBuffer (Buffer) as needed
            console.log(fileContentBuffer.toString('utf-8'));
        }

        // If batch job was created with inline responses
        else if (batchJob.dest?.inlinedResponses) {
            console.log("Results are inline:");
            for (let i = 0; i < batchJob.dest.inlinedResponses.length; i++) {
                const inlineResponse = batchJob.dest.inlinedResponses[i];
                console.log(`Response ${i + 1}:`);
                if (inlineResponse.response) {
                    // Accessing response, structure may vary.
                    if (inlineResponse.response.text !== undefined) {
                        console.log(inlineResponse.response.text);
                    } else {
                        console.log(inlineResponse.response); // Fallback
                    }
                } else if (inlineResponse.error) {
                    console.error(`Error: ${inlineResponse.error}`);
                }
            }
        }

        // If batch job was an embedding batch with inline responses
        else if (batchJob.dest?.inlinedEmbedContentResponses) {
            console.log("Embedding results found inline:");
            for (let i = 0; i < batchJob.dest.inlinedEmbedContentResponses.length; i++) {
                const inlineResponse = batchJob.dest.inlinedEmbedContentResponses[i];
                console.log(`Response ${i + 1}:`);
                if (inlineResponse.response) {
                    console.log(inlineResponse.response);
                } else if (inlineResponse.error) {
                    console.error(`Error: ${inlineResponse.error}`);
                }
            }
        } else {
            console.log("No results found (neither file nor inline).");
        }
    } else {
        console.log(`Job did not succeed. Final state: ${batchJob.state}`);
        if (batchJob.error) {
            console.error(`Error: ${typeof batchJob.error === 'string' ? batchJob.error : batchJob.error.message || JSON.stringify(batchJob.error)}`);
        }
    }
} catch (error) {
    console.error(`An error occurred while processing job ${jobName}:`, error);
}
```

--------------------------------

### Generate, Poll, and Download Video from Prompt (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/video_hl=pt-br

These code examples demonstrate the full workflow for creating a video from a descriptive text prompt using the Gemini API's `veo-3.1-generate-preview` model. The process involves sending a generation request, continuously polling the API for the operation's status until completion, and finally downloading the generated video file to a local MP4 file. The prompt describes a specific scene with dialogue.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.\nA man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt,
});

// Poll the operation status until the video is ready.
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation,
    });
}

// Download the generated video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4",
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

```bash
# Note: This script uses jq to parse the JSON response.
# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video and capture the operation name into a variable.
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That's the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Python Client Example - Multi-Speaker TTS

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=sq

Python implementation demonstrating how to use the Google AI Python client library to generate multi-speaker audio content and save it as a WAV file.

```APIDOC
## Python Client Implementation

### Description
Implements Text-to-Speech functionality using the Google AI Python SDK with multi-speaker voice configuration and WAV file output.

### Code Example
```python
import wave
import google.generativeai as genai
from google.generativeai import types

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
    """Save PCM audio data to a WAV file."""
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)

client = genai.Client()

prompt = """TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?"""

response = client.models.generate_content(
    model="gemini-2.5-flash-preview-tts",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker='Joe',
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name='Kore',
                            )
                        )
                    ),
                    types.SpeakerVoiceConfig(
                        speaker='Jane',
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name='Puck',
                            )
                        )
                    ),
                ]
            )
        )
    )
)

data = response.candidates[0].content.parts[0].inline_data.data
file_name = 'out.wav'
wave_file(file_name, data)
```

### Key Components
- **wave_file()** - Helper function to write PCM audio data to WAV format
- **genai.Client()** - Initialize the Google AI client
- **generate_content()** - Call the TTS model with configuration
- **response.candidates[0].content.parts[0].inline_data.data** - Extract audio data from response
```

--------------------------------

### Handle Function Call and Execute Tool

Source: https://ai.google.dev/gemini-api/docs/function-calling_example=meeting&hl=hi

Processes the model's function call request, extracts parameters, and executes the tool logic. This example extracts the requested item name from the function call arguments and prepares to call an external service.

```python
# Handle the function call
function_call = response_1.candidates[0].content.parts[0]
requested_item = function_call.args['item_name']
print(f'Model wants to call: {function_call.name}')

# Execute your tool (e.g., call an API)
print(f'Calling external tool for: {requested_item}')

function_response_data = {
  'image_ref': { '$ref': 'instrument.jpg' }
}
```

```javascript
// Handle the function call
const functionCall = response1.functionCalls[0];
const requestedItem = functionCall.args.item_name;
console.log(`Model wants to call: ${functionCall.name}`);

// Execute your tool (e.g., call an API)
console.log(`Calling external tool for: ${requestedItem}`);

const functionResponseData = {
  image_ref: { $ref: 'instrument.jpg' }
};
```

--------------------------------

### Example Prompt for Kawaii Red Panda Sticker

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

This specific prompt demonstrates how to request a 'kawaii-style' sticker of a red panda. It details the subject's appearance, actions, design elements like outlines and shading, and specifies a white background.

```Prompt Example
A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's
munching on a green bamboo leaf. The design features bold, clean outlines,
simple cel-shading, and a vibrant color palette. The background must be white.

```

--------------------------------

### Define Light Control Function Schemas and Invoke with Gemini API

Source: https://ai.google.dev/gemini-api/docs/function-calling

This snippet demonstrates how to define simple function schemas for controlling lights (turning on/off) and how to invoke the Gemini API with a prompt and these tools. It shows the setup for passing a natural language prompt that implies these actions, along with the defined tools, to the `run` function with audio modality.

```python
turn_on_the_lights_schema = {'name': 'turn_on_the_lights'}
turn_off_the_lights_schema = {'name': 'turn_off_the_lights'}

prompt = """
  Hey, can you write run some python code to turn on the lights, wait 10s and then turn off the lights?
  """

tools = [
    {'code_execution': {}},
    {'function_declarations': [turn_on_the_lights_schema, turn_off_the_lights_schema]}
]

await run(prompt, tools=tools, modality="AUDIO")
```

```javascript
// Light control schemas
const turnOnTheLightsSchema = { name: 'turn_on_the_lights' };
const turnOffTheLightsSchema = { name: 'turn_off_the_lights' };

const prompt = `
  Hey, can you write run some python code to turn on the lights, wait 10s and then turn off the lights?
`;

const tools = [
  { codeExecution: {} },
  { functionDeclarations: [turnOnTheLightsSchema, turnOffTheLightsSchema] }
];

await run(prompt, tools=tools, modality="AUDIO")
```

--------------------------------

### Generate Multi-Modal Content (Text + Image) with Gemini API

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=he

This set of examples illustrates how to perform multi-modal content generation with the Gemini API, combining both text prompts and image inputs. It shows how to pass image data (either inline or via URI) along with textual queries to the `generateContent` method. The response from the Gemini model is then extracted and printed.

```Python
from PIL import Image
from google import genai

client = genai.Client()

image = Image.open("/path/to/organ.png")
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[image, "Tell me about this instrument"]
)
print(response.text)
```

```JavaScript
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const image = await ai.files.upload({
    file: "/path/to/organ.png",
  });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      createUserContent([
        "Tell me about this instrument",
        createPartFromUri(image.uri, image.mimeType),
      ]),
    ],
  });
  console.log(response.text);
}

await main();
```

```Go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      fmt.Printf("Error creating client: %v\n", err)
      return
  }

  imagePath := "/path/to/organ.jpg"
  imgData, _ := os.ReadFile(imagePath)

  parts := []*genai.Part{
      genai.NewPartFromText("Tell me about this instrument"),
      &genai.Part{
          InlineData: &genai.Blob{
              MIMEType: "image/jpeg",
              Data:     imgData,
          },
      },
  }

  contents := []*genai.Content{
      genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash",
      contents,
      nil,
  )

  fmt.Println(result.Text())
}
```

```Java
import com.google.genai.Client;
import com.google.genai.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

public class GenerateContentWithMultiModalInputs {
  public static void main(String[] args) {

    Client client = new Client();

    Content content =
      Content.fromParts(
          Part.fromText("Tell me about this instrument"),
          Part.fromUri("/path/to/organ.jpg", "image/jpeg"));

    GenerateContentResponse response =
        client.models.generateContent("gemini-2.5-flash", content, null);

    System.out.println(response.text());
  }
}
```

--------------------------------

### Generate Content with Thinking Budget (JavaScript)

Source: https://ai.google.dev/gemini-api/docs/thinking

JavaScript SDK example for configuring thinking budget when generating content with Gemini 2.5 Flash model.

```APIDOC
## JavaScript: Generate Content with Thinking Budget

### Code Example
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Provide a list of 3 famous physicists and their key contributions",
    config: {
      thinkingConfig: {
        thinkingBudget: 1024,
      },
    },
  });

  console.log(response.text);
}

main();
```

### Configuration Variations

**Turn off thinking:**
```javascript
thinkingBudget: 0
```

**Turn on dynamic thinking:**
```javascript
thinkingBudget: -1
```

### Parameters
- **model** (string) - The model identifier (e.g., "gemini-2.5-flash")
- **contents** (string) - The prompt text
- **thinkingBudget** (integer) - Token budget for reasoning (0 to disable, -1 for dynamic, or specific count)
```

--------------------------------

### Full Workflow with Consolidated Gemini API Client (Python)

Source: https://ai.google.dev/gemini-api/docs/migrate_hl=zh-tw

This example demonstrates using the `genai.Client()` for a streamlined interaction with the Gemini API. It covers checking model capabilities, downloading and uploading files, creating cached content with configuration, and generating content using the cached data.

```python
import requests
import pathlib
from google import genai
from google.genai import types

client = genai.Client()

# Check which models support caching.
for m in client.models.list():
  for action in m.supported_actions:
    if action == "createCachedContent":
      print(m.name)
      break

# Download file
response = requests.get(
    'https://storage.googleapis.com/generativeai-downloads/data/a11.txt')
pathlib.Path('a11.txt').write_text(response.text)

# Upload file
document = client.files.upload(file='a11.txt')

# Create cache
model='gemini-2.0-flash-001'
apollo_cache = client.caches.create(
      model=model,
      config={
          'contents': [document],
          'system_instruction': 'You are an expert at analyzing transcripts.',
      },
  )

# Generate response
response = client.models.generate_content(
    model=model,
    contents='Find a lighthearted moment from this transcript',
    config=types.GenerateContentConfig(
        cached_content=apollo_cache.name,
    )
)
```

--------------------------------

### Perform image style transfer with Gemini API using text prompts

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ar

These examples illustrate how to interact with the `gemini-2.5-flash-image` model to upload an image and a text prompt, then process the API response to either print generated text or save a new image. The code showcases reading an input image, constructing the request payload, calling the `generateContent` method, and handling the multimodal output. Note that the cURL example is truncated and provides only the beginning of a request.

```python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[city_image, text_input],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("city_style_transfer.png")
```

```java
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class StyleTransfer {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.5-flash-image",
          Content.fromParts(
              Part.fromBytes(
                  Files.readAllBytes(
                      Path.of("/path/to/your/city.png")), "image/png"),
              Part.fromText(
                  """
                  Transform the provided photograph of a modern city
                  street at night into the artistic style of
                  Vincent van Gogh's 'Starry Night'. Preserve the
                  original composition of buildings and cars, but
                  render all elements with swirling, impasto
                  brushstrokes and a dramatic palette of deep blues
                  and bright yellows.
                  """)),
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("city_style_transfer.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const imagePath = "/path/to/your/city.png";
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
    { text: "Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("city_style_transfer.png", buffer);
      console.log("Image saved as city_style_transfer.png");
    }
  }
}

main();
```

```go
package main

import (
  "context"
  "fmt"
  "log"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  imagePath := "/path/to/your/city.png"
  imgData, _ := os.ReadFile(imagePath)

  parts := []*genai.Part{
    &genai.Part{
      InlineData: &genai.Blob{
        MIMEType: "image/png",
        Data:     imgData,
      },
    },
    genai.NewPartFromText("Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."),
  }

  contents := []*genai.Content{
    genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash-image",
      contents,
  )

  for _, part := range result.Candidates[0].Content.Parts {
      if part.Text != "" {
          fmt.Println(part.Text)
      } else if part.InlineData != nil {
          imageBytes := part.InlineData.Data
          outputFilename := "city_style_transfer.png"
          _ = os.WriteFile(outputFilename, imageBytes, 0644)
      }
  }
}
```

```curl
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
    -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d "{
      \"contents\": [{
```

--------------------------------

### Authenticate with Google GenAI SDK using API key (New SDK)

Source: https://ai.google.dev/gemini-api/docs/migrate

Explains how to authenticate with the new Google GenAI SDK. It covers setting the `GEMINI_API_KEY` environment variable (preferred) or passing the API key explicitly during client instantiation in Python and JavaScript. For Go, it shows client creation with `ClientConfig` to specify the backend.

```shell
export GEMINI_API_KEY="YOUR_API_KEY"
```

```python
from google import genai

client = genai.Client() # Set the API key using the GEMINI_API_KEY env var.
                        # Alternatively, you could set the API key explicitly:
                        # client = genai.Client(api_key="YOUR_API_KEY")
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: "GEMINI_API_KEY"});
```

```go
import "google.golang.org/genai"

client, err := genai.NewClient(ctx, &genai.ClientConfig{
        Backend:  genai.BackendGeminiAPI,
})
```

--------------------------------

### Generate Content with Gemini API in Go

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=es-419

This Go snippet demonstrates how to configure and make a content generation request to the Gemini API using the `genai` client library. It sets parameters such as `Temperature`, `TopP`, `TopK`, and `ResponseMIMEType` to control the output format and style. The snippet queries 'What is the average size of a swallow?' and prints the text response, assuming `client`, `ctx`, and `temp` are defined in the surrounding context.

```go
  topP := float32(0.5)
  topK := float32(20.0)

  config := &genai.GenerateContentConfig{
    Temperature:       &temp,
    TopP:              &topP,
    TopK:              &topK,
    ResponseMIMEType:  "application/json",
  }

  result, _ := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash",
    genai.Text("What is the average size of a swallow?"),
    config,
  )

  fmt.Println(result.Text())
```

--------------------------------

### Define and Call Function Tool with Gemini API

Source: https://ai.google.dev/gemini-api/docs/function-calling_example=meeting&hl=hi

Demonstrates creating a function tool declaration and sending an initial prompt to trigger the function call. The function retrieves image references for ordered items. This example shows the first turn of the multimodal workflow where the model identifies which function to call based on user input.

```python
import google.genai.types as types

# Define the function tool
getImageDeclaration = {
  'name': 'get_image',
  'description': 'Retrieves the image file reference for a specific order item.',
  'parameters': {
    'type': types.Type.OBJECT,
    'properties': {
      'item_name': {
        'type': types.Type.STRING,
        'description': "The name or description of the item ordered (e.g., 'green shirt')."
      }
    },
    'required': ['item_name']
  }
}

toolConfig = {
  'functionDeclarations': [getImageDeclaration]
}

# Send a message that triggers the tool
prompt = 'Show me the green shirt I ordered last month.'
response_1 = client.models.generate_content(
  model='gemini-3-flash-preview',
  contents=prompt,
  config=types.GenerateContentConfig(
    tools=[toolConfig]
  )
)
```

```javascript
import { GoogleGenAI, Type } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the function tool
const getImageDeclaration = {
  name: 'get_image',
  description: 'Retrieves the image file reference for a specific order item.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_name: {
        type: Type.STRING,
        description: "The name or description of the item ordered (e.g., 'green shirt')."
      }
    },
    required: ['item_name']
  }
};

const toolConfig = {
  functionDeclarations: [getImageDeclaration]
};

// Send a message that triggers the tool
const prompt = 'Show me the green shirt I ordered last month.';
const response1 = await client.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: prompt,
  config: {
    tools: [toolConfig]
  }
});
```

--------------------------------

### Define Environment Variables for PDF URLs and Prompt (Shell)

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=ko

This snippet provides example shell environment variable definitions for the URLs of the two PDF documents, display names, and the prompt text used for comparison with the Gemini API. These variables can be easily set in a shell script or terminal for reuse in various programming language examples.

```shell
DOC_URL_1="https://arxiv.org/pdf/2312.11805"
DOC_URL_2="https://arxiv.org/pdf/2403.05530"
DISPLAY_NAME_1="Gemini_paper"
DISPLAY_NAME_2="Gemini_1.5_paper"
PROMPT="What is the difference between each of the main benchmarks between these two papers? Output these in a table."
```

--------------------------------

### Initialize Gemini Client and Generate Content with Code Execution

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=sq

Creates a Gemini API client with authentication and enables code execution tool for dynamic code generation. Processes multi-modal content (images and text) and returns structured responses including generated code and execution results.

```python
client = genai.Client(api_key="GEMINI_API_KEY")

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents=[image, "Zoom into the expression pedals and tell me how many pedals are there?"],
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)
```

--------------------------------

### Prompt Iteration - Book Categorization Example

Source: https://ai.google.dev/gemini-api/docs/prompting-intro

Shows a classification prompt that initially receives a verbose response, then demonstrates rephrasing it as a multiple choice question to constrain the model's output to a single category option. This illustrates the analogous task technique.

```text
Original Prompt:
Which category does The Odyssey belong to:
thriller
sci-fi
mythology
biography

Improved Prompt (Multiple Choice):
Multiple choice problem: Which of the following options describes the book The Odyssey?
Options:
* thriller
* sci-fi
* mythology
* biography
```

--------------------------------

### Video Generation Workflow - Go

Source: https://ai.google.dev/gemini-api/docs/video_hl=de

Complete Go implementation for generating videos with the Gemini API. Demonstrates context usage, long-running operations, polling with time intervals, and file writing.

```APIDOC
## Video Generation Workflow - Go

### Description
Complete Go workflow for video generation using the Google Gemini API client library.

### Code
```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready
    for !operation.Done {
        log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```
```

--------------------------------

### GET /v1beta/files/{name}

Source: https://ai.google.dev/gemini-api/docs/prompting_with_media

Retrieves metadata for a specific uploaded file. This allows you to verify successful storage and get details like its name, type, and URI.

```APIDOC
## GET /v1beta/files/{name}

### Description
Retrieves metadata for a specific uploaded file. This allows you to verify successful storage and get details like its name, type, and URI.

### Method
GET

### Endpoint
/v1beta/files/{name}

### Parameters
#### Path Parameters
- **name** (string) - Required - The resource name of the file to retrieve (e.g., `files/file-12345`).

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **name** (string) - The resource name of the file.
- **displayName** (string) - The user-provided display name for the file.
- **mimeType** (string) - The MIME type of the file.
- **sizeBytes** (string) - The size of the file in bytes.
- **createTime** (string) - The timestamp when the file was created.
- **updateTime** (string) - The timestamp when the file was last updated.
- **state** (string) - The current state of the file.

#### Response Example
```json
{
  "name": "files/a1b2c3d4e5f6g7h8i9j0",
  "displayName": "sample.mp3",
  "mimeType": "audio/mpeg",
  "sizeBytes": "12345",
  "createTime": "2023-10-27T10:00:00Z",
  "updateTime": "2023-10-27T10:00:00Z",
  "state": "ACTIVE"
}
```
```

--------------------------------

### Send Initial Request with Gemini API Tools

Source: https://ai.google.dev/gemini-api/docs/interactions_hl=ru

This code demonstrates sending the initial prompt to the Gemini API, alongside a list of available tools. The model uses this information to decide if a tool call is required to fulfill the user's query. For cURL, this includes the full JSON payload defining the tool.

```python
interaction = client.interactions.create(
    model="gemini-3-flash-preview",
    input="What is the weather in Paris?",
    tools=[weather_tool]
)
```

```javascript
// 2. Send the request with tools
let interaction = await client.interactions.create({
    model: 'gemini-3-flash-preview',
    input: 'What is the weather in Paris?',
    tools: [weatherTool]
});
```

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
-H "Content-Type: application/json" \
-H "x-goog-api-key: $GEMINI_API_KEY" \
-d '{ \
    "model": "gemini-3-flash-preview", \
    "input": "What is the weather in Paris?", \
    "tools": [{ \
        "type": "function", \
        "name": "get_weather", \
        "description": "Gets the weather for a given location.", \
        "parameters": { \
            "type": "object", \
            "properties": { \
                "location": {"type": "string", "description": "The city and state, e.g. San Francisco, CA"} \
            }, \
            "required": ["location"] \
        } \
    }] \
}'
```

--------------------------------

### Make Gemini API generateContent request with cURL

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=vi

This cURL command illustrates how to make a direct HTTP POST request to the Gemini API's `generateContent` endpoint. It targets the `gemini-2.5-flash-image` model, includes authentication via the `GEMINI_API_KEY` environment variable, and sends a JSON payload with a detailed text prompt for image generation. This is a command-line utility example for API interaction.

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [
        {"text": "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image."}
      ]
    }]
  }'
```

--------------------------------

### Generate Image with Specific Text using Gemini API

Source: https://ai.google.dev/gemini-api/docs/image-generation

These code examples demonstrate how to programmatically generate an image using the Gemini API's `gemini-3-pro-image-preview` model. They show how to construct a detailed text prompt, configure image parameters like aspect ratio, send the request, and handle the multimodal response to save the generated image to a file. Dependencies include the official Gemini API client libraries for each language.

```Python
from google import genai
from google.genai import types    

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents="Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.",
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="1:1",
        )
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("logo_example.jpg")
```

```Java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.genai.types.ImageConfig;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class AccurateTextInImages {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .imageConfig(ImageConfig.builder()
              .aspectRatio("1:1")
              .build())
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-3-pro-image-preview",
          """
          Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.
          """,
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("logo_example.jpg"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```JavaScript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const prompt =
    "Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.";

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("logo_example.jpg", buffer);
      console.log("Image saved as logo_example.jpg");
    }
  }
}

main();
```

```Go
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-3-pro-image-preview",
        genai.Text("Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way."),
        &genai.GenerateContentConfig{
            ImageConfig: &genai.ImageConfig{
              AspectRatio: "1:1",
            },
        },
    )

    for _, part := range result.Candidates[0].Content.Parts {
        if part.Text != "" {
            fmt.Println(part.Text)
        } else if part.InlineData != nil {
            imageBytes := part.InlineData.Data
            outputFilename := "logo_example.jpg"
            _ = os.WriteFile(outputFilename, imageBytes, 0644)
        }
    }
}
```

--------------------------------

### Text Releveling User Prompt Example - 4th Grade

Source: https://ai.google.dev/gemini-api/docs/learnlm

An example user prompt demonstrating text releveling for 4th grade students. It provides a historical text about New York City that needs to be simplified while preserving key information and structure for younger learners.

```text
Rewrite the following text so that it would be easier to read for a student in
4th grade.

New York, often called New York City or NYC, is the most populous city in the
United States, located at the southern tip of New York State on one of the
world's largest natural harbors. The city comprises five boroughs, each
coextensive with a respective county.
```

--------------------------------

### Generate Multi-Speaker TTS Audio and Save as WAV (Python, Node.js, cURL)

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=id

These code examples demonstrate how to use the Gemini API's text-to-speech capabilities to generate audio for a multi-speaker conversation. Each speaker is assigned a specific pre-built voice, and the resulting audio data is saved into a WAV file. The Python and Node.js examples use client libraries, while the cURL example directly interacts with the API endpoint, decoding the base64 audio and converting it using ffmpeg.

```python
def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)

client = genai.Client()

prompt = """TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?"""

response = client.models.generate_content(
   model="gemini-2.5-flash-preview-tts",
   contents=prompt,
   config=types.GenerateContentConfig(
      response_modalities=["AUDIO"],
      speech_config=types.SpeechConfig(
         multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=[
               types.SpeakerVoiceConfig(
                  speaker='Joe',
                  voice_config=types.VoiceConfig(
                     prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Kore',
                     )
                  )
               ),
               types.SpeakerVoiceConfig(
                  speaker='Jane',
                  voice_config=types.VoiceConfig(
                     prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name='Puck',
                     )
                  )
               ),
            ]
         )
      )
   )
)

data = response.candidates[0].content.parts[0].inline_data.data

file_name='out.wav'
wave_file(file_name, data) # Saves the file to current directory
```

```javascript
import {GoogleGenAI} from '@google/genai';
import wav from 'wav';

async function saveWaveFile(
   filename,
   pcmData,
   channels = 1,
   rate = 24000,
   sampleWidth = 2,
) {
   return new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmData);
      writer.end();
   });
}

async function main() {
   const ai = new GoogleGenAI({});

   const prompt = `TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?`;

   const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
               multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                        {
                           speaker: 'Joe',
                           voiceConfig: {
                              prebuiltVoiceConfig: { voiceName: 'Kore' }
                           }
                        },
                        {
                           speaker: 'Jane',
                           voiceConfig: {
                              prebuiltVoiceConfig: { voiceName: 'Puck' }
                           }
                        }
                  ]
               }
            }
      }
   });

   const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   const audioBuffer = Buffer.from(data, 'base64');

   const fileName = 'out.wav';
   await saveWaveFile(fileName, audioBuffer);
}

await main();
```

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
  "contents": [{
    "parts":[{
      "text": "TTS the following conversation between Joe and Jane:
                Joe: Hows it going today Jane?
                Jane: Not too bad, how about you?"
    }]
  }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "multiSpeakerVoiceConfig": {
        "speakerVoiceConfigs": [{
            "speaker": "Joe",
            "voiceConfig": {
              "prebuiltVoiceConfig": {
                "voiceName": "Kore"
              }
            }
          }, {
            "speaker": "Jane",
            "voiceConfig": {
              "prebuiltVoiceConfig": {
                "voiceName": "Puck"
              }
            }
          }]
      }
    }
  },
  "model": "gemini-2.5-flash-preview-tts"
}' | jq -r '.candidates[0].content.parts[0].inlineData.data' | \
    base64 --decode > out.pcm
# You may need to install ffmpeg.
ffmpeg -f s16le -ar 24000 -ac 1 -i out.pcm out.wav
```

--------------------------------

### Text-to-Speech with Python Client

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=ru

Example implementation using the Google GenAI Python client library to generate audio from text and save it as a WAV file with specified audio parameters.

```APIDOC
## Python Client Implementation

### Description
Demonstrates how to use the Google GenAI Python client to generate text-to-speech audio and save the output as a WAV file.

### Prerequisites
- google-genai library installed
- wave module (standard library)
- GEMINI_API_KEY environment variable set

### Usage Example

```python
import wave
from google import genai
from google.genai import types

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
    """Save PCM data to a WAV file."""
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)

# Initialize client
client = genai.Client()

# Generate speech
response = client.models.generate_content(
    model="gemini-2.5-flash-preview-tts",
    contents="Say cheerfully: Have a wonderful day!",
    config=types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name='Kore'
                )
            )
        )
    )
)

# Extract audio data
data = response.candidates[0].content.parts[0].inline_data.data

# Save to file
file_name = 'out.wav'
wave_file(file_name, data)
```

### Parameters
- **model** - Model identifier (required)
- **contents** - Text to convert to speech (required)
- **response_modalities** - Set to ["AUDIO"] for audio output (required)
- **voice_name** - Prebuilt voice name (e.g., "Kore")

### Output
Saves audio file to specified filename in current directory
```

--------------------------------

### GET /caches.get - Get Cache Metadata

Source: https://ai.google.dev/gemini-api/docs/caching

Retrieves metadata for a specific cached content object by its name. Returns cache details including model, creation time, and expiration time.

```APIDOC
## GET /caches.get

### Description
Retrieves metadata for a specific cached content object using its name. Returns cache configuration details, timestamps, and usage information without exposing the cached content itself.

### Method
GET

### Endpoint
/caches.get

### Parameters
#### Query Parameters
- **name** (string) - Required - The unique identifier of the cache (e.g., "cachedContents/xyz123")

### Request Example
```python
from google import genai

client = genai.Client()

cache = client.caches.get(name="cachedContents/xyz123")
print(cache)
```

### Response
#### Success Response (200)
- **name** (string) - Unique cache identifier
- **model** (string) - Model associated with cache
- **display_name** (string) - Display name
- **usage_metadata** (object) - Token usage information
- **create_time** (string) - ISO-formatted creation timestamp
- **update_time** (string) - ISO-formatted last update timestamp
- **expire_time** (string) - ISO-formatted expiration timestamp

#### Response Example
```json
{
  "name": "cachedContents/xyz123",
  "model": "gemini-2.0-flash-001",
  "display_name": "cached_content_1",
  "usage_metadata": {
    "cached_content_token_count": 696190
  },
  "create_time": "2025-01-27T16:02:36.473528+00:00",
  "update_time": "2025-01-27T16:02:36.473528+00:00",
  "expire_time": "2025-01-28T16:02:36.473528+00:00"
}
```
```

--------------------------------

### Generate and Download Video (Multi-language)

Source: https://ai.google.dev/gemini-api/docs/video_hl=sq

These examples illustrate the complete workflow for generating a video using a text prompt with the Google Veo API. They demonstrate how to initiate video generation, poll the operation's status until completion, and finally download the generated video to a specified local path.

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const prompt = `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`;

let operation = await ai.models.generateVideos({
    model: "veo-3.1-generate-preview",
    prompt: prompt
});

// Poll the operation status until the video is ready.
while (!operation.done) {
    console.log("Waiting for video generation to complete...")
    await new Promise((resolve) => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({
        operation: operation
    });
}

// Download the generated video.
ai.files.download({
    file: operation.response.generatedVideos[0].video,
    downloadPath: "dialogue_example.mp4"
});
console.log(`Generated video saved to dialogue_example.mp4`);
```

```go
package main

import (
    "context"
    "log"
    "os"
    "time"

    "google.golang.org/genai"
)

func main() {
    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    prompt := `A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
    A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'`

    operation, _ := client.Models.GenerateVideos(
        ctx,
        "veo-3.1-generate-preview",
        prompt,
        nil,
        nil,
    )

    // Poll the operation status until the video is ready.
    for !operation.Done {
    log.Println("Waiting for video generation to complete...")
        time.Sleep(10 * time.Second)
        operation, _ = client.Operations.GetVideosOperation(ctx, operation, nil)
    }

    // Download the generated video.
    video := operation.Response.GeneratedVideos[0]
    client.Files.Download(ctx, video.Video, nil)
    fname := "dialogue_example.mp4"
    _ = os.WriteFile(fname, video.Video.VideoBytes, 0644)
    log.Printf("Generated video saved to %s\n", fname)
}
```

```bash
# Note: This script uses jq to parse the JSON response.
# GEMINI API Base URL
BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# Send request to generate video and capture the operation name into a variable.
operation_name=$(curl -s "${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -X "POST" \
  -d '{
    "instances": [{
        "prompt": "A close up of two people staring at a cryptic drawing on a wall, torchlight flickering. A man murmurs, \"This must be it. That\'\''s the secret code.\" The woman looks at him and whispering excitedly, \"What did you find?\""
      }
    ]
  }' | jq -r .name)

# Poll the operation status until the video is ready
while true; do
  # Get the full JSON status and store it in a variable.
  status_response=$(curl -s -H "x-goog-api-key: $GEMINI_API_KEY" "${BASE_URL}/${operation_name}")

  # Check the "done" field from the JSON stored in the variable.
  is_done=$(echo "${status_response}" | jq .done)

  if [ "${is_done}" = "true" ]; then
    # Extract the download URI from the final response.
    video_uri=$(echo "${status_response}" | jq -r '.response.generateVideoResponse.generatedSamples[0].video.uri')
    echo "Downloading video from: ${video_uri}"

    # Download the video using the URI and API key and follow redirects.
    curl -L -o dialogue_example.mp4 -H "x-goog-api-key: $GEMINI_API_KEY" "${video_uri}"
    break
  fi
  # Wait for 5 seconds before checking again.
  sleep 10
done
```

--------------------------------

### Configure and Use Dynamic Google Search Retrieval with Gemini API

Source: https://ai.google.dev/gemini-api/docs/grounding_hl=he

These examples demonstrate how to integrate the `google_search_retrieval` tool with the Gemini API, enabling dynamic grounding of model responses using search results. The configuration includes setting a `dynamic_threshold` to control when search is triggered based on confidence. Examples are provided in Python, JavaScript, and cURL, showcasing how to prepare the tool configuration and pass it during content generation.

```python
import os
from google import genai
from google.genai import types

client = genai.Client()

retrieval_tool = types.Tool(
    google_search_retrieval=types.GoogleSearchRetrieval(
        dynamic_retrieval_config=types.DynamicRetrievalConfig(
            mode=types.DynamicRetrievalConfigMode.MODE_DYNAMIC,
            dynamic_threshold=0.7 # Only search if confidence > 70%
        )
    )
)

config = types.GenerateContentConfig(
    tools=[retrieval_tool]
)

response = client.models.generate_content(
    model='gemini-1.5-flash',
    contents="Who won the euro 2024?",
    config=config,
)
print(response.text)
if not response.candidates[0].grounding_metadata:
  print("\nModel answered from its own knowledge.")
```

```javascript
import { GoogleGenAI, DynamicRetrievalConfigMode } from "@google/genai";

const ai = new GoogleGenAI({});

const retrievalTool = {
  googleSearchRetrieval: {
    dynamicRetrievalConfig: {
      mode: DynamicRetrievalConfigMode.MODE_DYNAMIC,
      dynamicThreshold: 0.7, // Only search if confidence > 70%
    },
  },
};

const config = {
  tools: [retrievalTool],
};

const response = await ai.models.generateContent({
  model: "gemini-1.5-flash",
  contents: "Who won the euro 2024?",
  config,
});

console.log(response.text);
if (!response.candidates?.[0]?.groundingMetadata) {
  console.log("\nModel answered from its own knowledge.");
}
```

```curl
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \

  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "contents": [
      {"parts": [{"text": "Who won the euro 2024?"}]}
    ],
    "tools": [{
      "google_search_retrieval": {
        "dynamic_retrieval_config": {
          "mode": "MODE_DYNAMIC",
          "dynamic_threshold": 0.7
        }
      }
    }]
  }'
```

--------------------------------

### Generate Content with Google Maps Grounding - Python

Source: https://ai.google.dev/gemini-api/docs/maps-grounding

This Python example demonstrates how to use the Gemini API with Google Maps grounding to generate location-aware responses. It initializes a Gemini client, sends a prompt about local restaurants with coordinates for Los Angeles, and processes the grounding metadata to extract and display source citations from Google Maps.

```python
from google import genai
from google.genai import types

client = genai.Client()

prompt = "What are the best Italian restaurants within a 15-minute walk from here?"

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config=types.GenerateContentConfig(
        # Turn on grounding with Google Maps
        tools=[types.Tool(google_maps=types.GoogleMaps())],
        # Optionally provide the relevant location context (this is in Los Angeles)
        tool_config=types.ToolConfig(retrieval_config=types.RetrievalConfig(
            lat_lng=types.LatLng(
                latitude=34.050481, longitude=-118.248526))),
    ),
)

print("Generated Response:")
print(response.text)

if grounding := response.candidates[0].grounding_metadata:
  if grounding.grounding_chunks:
    print('-' * 40)
    print("Sources:")
    for chunk in grounding.grounding_chunks:
      print(f'- [{chunk.maps.title}]({chunk.maps.uri})')
```

--------------------------------

### Detailed Prompt Example for Generating a Photorealistic Ceramicist Image

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=bn

A concrete prompt example illustrating how to describe a photorealistic scene. It details an elderly Japanese ceramicist, his workshop, specific lighting, camera lens (85mm), and desired mood, providing a rich context for image generation.

```text
A photorealistic close-up portrait of an elderly Japanese ceramicist with
deep, sun-etched wrinkles and a warm, knowing smile. He is carefully
inspecting a freshly glazed tea bowl. The setting is his rustic,
sun-drenched workshop. The scene is illuminated by soft, golden hour light
streaming through a window, highlighting the fine texture of the clay.
Captured with an 85mm portrait lens, resulting in a soft, blurred background
(bokeh). The overall mood is serene and masterful. Vertical portrait
orientation.


```

--------------------------------

### Implement Multi-Turn Conversational Streaming with Gemini API

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=fr

These code examples demonstrate how to create and manage multi-turn conversations with the Gemini API, utilizing streaming for real-time responses. They cover initializing chat sessions, sending messages, and processing streamed output across Python, JavaScript, Go, Java, REST (cURL), and Google Apps Script, including history management.

```Python
from google import genai

client = genai.Client()
chat = client.chats.create(model="gemini-2.5-flash")

response = chat.send_message_stream("I have 2 dogs in my house.")
for chunk in response:
    print(chunk.text, end="")

response = chat.send_message_stream("How many paws are in my house?")
for chunk in response:
    print(chunk.text, end="")

for message in chat.get_history():
    print(f'role - {message.role}', end=": ")
    print(message.parts[0].text)
```

```JavaScript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  const stream1 = await chat.sendMessageStream({
    message: "I have 2 dogs in my house.",
  });
  for await (const chunk of stream1) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }

  const stream2 = await chat.sendMessageStream({
    message: "How many paws are in my house?",
  });
  for await (const chunk of stream2) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }
}

await main();
```

```Go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  history := []*genai.Content{
      genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
      genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
  }

  chat, _ := client.Chats.Create(ctx, "gemini-2.5-flash", nil, history)
  stream := chat.SendMessageStream(ctx, genai.Part{Text: "How many paws are in my house?"})

  for chunk, _ := range stream {
      part := chunk.Candidates[0].Content.Parts[0]
      fmt.Print(part.Text)
  }
}
```

```Java
import com.google.genai.Chat;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;

public class MultiTurnConversationWithStreaming {
  public static void main(String[] args) {

    Client client = new Client();
    Chat chatSession = client.chats.create("gemini-2.5-flash");

    ResponseStream<GenerateContentResponse> responseStream =
        chatSession.sendMessageStream("I have 2 dogs in my house.", null);

    for (GenerateContentResponse response : responseStream) {
      System.out.print(response.text());
    }

    responseStream = chatSession.sendMessageStream("How many paws are in my house?", null);

    for (GenerateContentResponse response : responseStream) {
      System.out.print(response.text());
    }

    // Get the history of the chat session. History is added after the stream
    // is consumed and includes the aggregated response from the stream.
    System.out.println("History: " + chatSession.getHistory(false));
  }
}
```

```cURL
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Hello"
          }
        ]
      },
      {
        "role": "model",
        "parts": [
          {
            "text": "Great to meet you. What would you like to know?"
          }
        ]
      },
      {
        "role": "user",
        "parts": [
          {
            "text": "I have two dogs in my house. How many paws are in my house?"
          }
        ]
      }
    ]
  }'
```

```Apps Script
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Hello' },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: 'Great to meet you. What would you like to know?' },
        ],
      },
      {
        role: 'user',
        parts: [
          { text: 'I have two dogs in my house. How many paws are in my house?' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'x-goog-api-key': apiKey,
    },
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  // Process the streaming response, e.g., by joining text from chunks
  let fullText = '';
  if (data && data.candidates && data.candidates.length > 0) {
    data.candidates[0].content.parts.forEach(part => {
      if (part.text) {
        fullText += part.text;
      }
    });
  }
  console.log(fullText);
}
```

--------------------------------

### GET /v1beta/files/{name} - Get File Status

Source: https://ai.google.dev/gemini-api/docs/document-processing

Retrieves the status and metadata for a specific uploaded file. This endpoint is used to poll and determine when a file has finished processing and is ready for use.

```APIDOC
## GET /v1beta/files/{name}

### Description
Retrieves the status and metadata for a specific uploaded file identified by its resource name. This is crucial for monitoring the file processing state (e.g., `PROCESSING` to `ACTIVE`).

### Method
GET

### Endpoint
`/v1beta/files/{name}`

### Parameters
#### Path Parameters
- **name** (string) - Required - The resource name of the file, obtained from the upload response (e.g., `files/12345`).

### Request Example
_N/A for GET request, parameters are in the URL._

### Response
#### Success Response (200)
A `File` object containing the current details of the specified file.
- **name** (string) - Resource name of the file.
- **displayName** (string) - The display name of the file.
- **mimeType** (string) - The MIME type of the file.
- **sizeBytes** (string) - Size of the file in bytes.
- **state** (string) - Current processing state (`PROCESSING`, `ACTIVE`, `FAILED`).
- **createTime** (string) - Timestamp when the file was created.
- **updateTime** (string) - Timestamp when the file was last updated.
- **uri** (string) - URI to access the file content.

#### Response Example
```json
{
  "name": "files/a1b2c3d4e5f6g7h8",
  "displayName": "A17_FlightPlan.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": "123456",
  "state": "ACTIVE",
  "createTime": "2023-10-27T10:00:00Z",
  "updateTime": "2023-10-27T10:05:00Z",
  "uri": "https://generativelanguage.googleapis.com/v1beta/files/a1b2c3d4e5f6g7h8"
}
```
```

--------------------------------

### Configure Gemini Client with Tools in Python

Source: https://ai.google.dev/gemini-api/docs/function-calling_example=meeting&hl=fr

Initializes the Gemini API client and configures it with a GenerateContentConfig that includes the weather forecast and thermostat tool functions. This setup enables the model to call these tools during content generation.

```python
client = genai.Client()
config = types.GenerateContentConfig(
    tools=[get_weather_forecast, set_thermostat_temperature]
)
```

--------------------------------

### Image Generation - Go Example

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=fa

Go implementation using the Google Generative AI client library for generating images with Gemini models.

```APIDOC
## Image Generation with Go SDK

### Description
Example code demonstrating image generation using the Go Google Generative AI client library.

### Go - gemini-2.5-flash-image
```go
result, _ := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash-image",
    genai.Text("Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
        },
    }
  )
```

### Go - gemini-3-pro-image-preview
```go
result_gemini3, _ := client.Models.GenerateContent(
    ctx,
    "gemini-3-pro-image-preview",
    genai.Text("Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"),
    &genai.GenerateContentConfig{
        ImageConfig: &genai.ImageConfig{
          AspectRatio: "16:9",
          ImageSize: "2K",
        },
    }
  )
```
```

--------------------------------

### Install LlamaIndex Dependencies for Gemini Integration

Source: https://ai.google.dev/gemini-api/docs/llama-index

Install required LlamaIndex packages for Gemini API integration, including workflow utilities, Google GenAI LLM support, and Google tools. These packages enable building multi-agent systems with LlamaIndex and Gemini 2.5 Pro.

```bash
pip install llama-index llama-index-utils-workflow llama-index-llms-google-genai llama-index-tools-google
```

--------------------------------

### Python: Generate Grounded Images with Google Search

Source: https://ai.google.dev/gemini-api/docs/image-generation

Python implementation using the Google GenAI SDK to generate images with Google Search grounding. Demonstrates how to configure the client, set generation parameters, and process the response to extract text and image data.

```APIDOC
## Python Implementation

### Description
Use the Google GenAI Python client library to generate images grounded with Google Search results.

### Code Example
```python
from google import genai

prompt = "Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day"
aspect_ratio = "16:9"  # Options: "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=['Text', 'Image'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
        ),
        tools=[{"google_search": {}}]
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("weather.png")
```

### Key Parameters
- **model**: Use "gemini-3-pro-image-preview" for image generation
- **response_modalities**: Set to ['Text', 'Image'] to receive both types
- **aspect_ratio**: Choose from available ratios (e.g., "16:9")
- **tools**: Include {"google_search": {}} to enable grounding

### Response Processing
- Iterate through response.parts to access generated content
- Check part.text for text responses
- Use part.as_image() to extract and save images
```

--------------------------------

### Text-to-Speech with JavaScript Client

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=ru

Example implementation using the Google GenAI JavaScript client library to generate audio from text and save it as a WAV file.

```APIDOC
## JavaScript Client Implementation

### Description
Demonstrates how to use the Google GenAI JavaScript client to generate text-to-speech audio and save the output as a WAV file.

### Prerequisites
- @google/genai library installed
- wav library installed
- Node.js environment

### Usage Example

```javascript
import {GoogleGenAI} from '@google/genai';
import wav from 'wav';

async function saveWaveFile(
    filename,
    pcmData,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
) {
    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

async function main() {
    const ai = new GoogleGenAI({});

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{
            parts: [{
                text: 'Say cheerfully: Have a wonderful day!'
            }]
        }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: 'Kore'
                    }
                }
            }
        }
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const audioBuffer = Buffer.from(data, 'base64');

    const fileName = 'out.wav';
    await saveWaveFile(fileName, audioBuffer);
}

await main();
```

### Parameters
- **model** - Model identifier (required)
- **contents** - Array of content objects with text (required)
- **responseModalities** - Set to ['AUDIO'] for audio output (required)
- **voiceName** - Prebuilt voice name (e.g., 'Kore')

### Output
Saves audio file to specified filename
```

--------------------------------

### Generate Image from Multiple Image Inputs and Text Prompt using Gemini API

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ko

These code examples demonstrate how to utilize the Gemini 2.5 Flash Image model to combine multiple input images (e.g., a woman's photo and a logo) with a text-based instruction to generate a new image or modify an existing one. The snippets cover preparing image data, formulating a detailed text prompt, sending the request to the Gemini API, and processing the multimodal response to extract text or save the resulting image.

```Python
response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[woman_image, logo_image, text_input],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("woman_with_logo.png")
```

```Java
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class HighFidelity {
  public static void main(String[] args) throws IOException {

    try (Client client = new Client()) {
      GenerateContentConfig config = GenerateContentConfig.builder()
          .responseModalities("TEXT", "IMAGE")
          .build();

      GenerateContentResponse response = client.models.generateContent(
          "gemini-2.5-flash-image",
          Content.fromParts(
              Part.fromBytes(
                  Files.readAllBytes(
                      Path.of("/path/to/your/woman.png")),
                  "image/png"),
              Part.fromBytes(
                  Files.readAllBytes(
                      Path.of("/path/to/your/logo.png")),
                  "image/png"),
              Part.fromText("""
                  Take the first image of the woman with brown hair,
                  blue eyes, and a neutral expression. Add the logo
                  from the second image onto her black t-shirt.
                  Ensure the woman's face and features remain
                  completely unchanged. The logo should look like
                  it's naturally printed on the fabric, following
                  the folds of the shirt.
                  """)),
          config);

      for (Part part : response.parts()) {
        if (part.text().isPresent()) {
          System.out.println(part.text().get());
        } else if (part.inlineData().isPresent()) {
          var blob = part.inlineData().get();
          if (blob.data().isPresent()) {
            Files.write(Paths.get("woman_with_logo.png"), blob.data().get());
          }
        }
      }
    }
  }
}
```

```JavaScript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

async function main() {

  const ai = new GoogleGenAI({});

  const imagePath1 = "/path/to/your/woman.png";
  const imageData1 = fs.readFileSync(imagePath1);
  const base64Image1 = imageData1.toString("base64");
  const imagePath2 = "/path/to/your/logo.png";
  const imageData2 = fs.readFileSync(imagePath2);
  const base64Image2 = imageData2.toString("base64");

  const prompt = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image1,
      },
    },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image2,
      },
    },
    { text: "Take the first image of the woman with brown hair, blue eyes, and a neutral expression. Add the logo from the second image onto her black t-shirt. Ensure the woman's face and features remain completely unchanged. The logo should look like it's naturally printed on the fabric, following the folds of the shirt." },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("woman_with_logo.png", buffer);
      console.log("Image saved as woman_with_logo.png");
    }
  }
}

main();
```

```Go
package main

import (
  "context"
  "fmt"
  "log"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  imgData1, _ := os.ReadFile("/path/to/your/woman.png")
  imgData2, _ := os.ReadFile("/path/to/your/logo.png")

  parts := []*genai.Part{
    &genai.Part{
      InlineData: &genai.Blob{
        MIMEType: "image/png",
        Data:     imgData1,
      },
    },
    &genai.Part{
      InlineData: &genai.Blob{
        MIMEType: "image/png",
        Data:     imgData2,
      },
    },
    genai.NewPartFromText("Take the first image of the woman with brown hair, blue eyes, and a neutral expression. Add the logo from the second image onto her black t-shirt. Ensure the woman's face and features remain completely unchanged. The logo should look like it's naturally printed on the fabric, following the folds of the shirt."),
  }

  contents := []*genai.Content{
    genai.NewContentFromParts(parts, genai.RoleUser),
  }

  result, _ := client.Models.GenerateContent(
      ctx,
      "gemini-2.5-flash-image",
      contents,
  )

```

--------------------------------

### Imagen Model - Go Client

Source: https://ai.google.dev/gemini-api/docs/imagen

Generate images using the Imagen model with the Go Google GenAI client library. This example demonstrates image generation and file output in Go.

```APIDOC
## Go: Generate Images with Imagen

### Description
Use the Google GenAI Go client to generate images and write them to files.

### Installation
```bash
go get google.golang.org/genai
```

### Code Example
```go
package main

import (
  "context"
  "fmt"
  "os"
  "google.golang.org/genai"
)

func main() {
  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
    log.Fatal(err)
  }

  config := &genai.GenerateImagesConfig{
    NumberOfImages: 4,
  }

  response, _ := client.Models.GenerateImages(
    ctx,
    "imagen-4.0-generate-001",
    "Robot holding a red skateboard",
    config,
  )

  for n, image := range response.GeneratedImages {
    fname := fmt.Sprintf("imagen-%d.png", n)
    _ = os.WriteFile(fname, image.Image.ImageBytes, 0644)
  }
}
```

### Parameters
- **model** (string) - Required - Model ID: "imagen-4.0-generate-001"
- **prompt** (string) - Required - English text description of the image
- **config** (*GenerateImagesConfig) - Optional - Configuration pointer
  - **NumberOfImages** (int) - Number of images to generate (1-4)
  - **ImageSize** (string) - Image size: "1K" or "2K"
  - **AspectRatio** (string) - Aspect ratio: "1:1", "3:4", "4:3", "9:16", "16:9"
  - **PersonGeneration** (string) - Person policy: "dont_allow", "allow_adult", "allow_all"

### Returns
- **response.GeneratedImages** - Slice of generated image objects
  - **image.Image.ImageBytes** - Raw image byte data
```

--------------------------------

### Generate Content with Advanced Configuration across Languages

Source: https://ai.google.dev/gemini-api/docs/system-instructions_hl=de

These examples illustrate how to call the Gemini API's `generateContent` endpoint while specifying advanced generation configuration parameters. They cover options such as `temperature` (randomness), `topP` (nucleus sampling), `topK` (token selection), `responseMIMEType` (output format), and `stopSequences` (tokens to halt generation), influencing the creativity, diversity, and structure of the model's output across different programming languages and client libraries.

```Go
  topK := float32(20.0)

  config := &genai.GenerateContentConfig{
    Temperature:       &temp,
    TopP:              &topP,
    TopK:              &topK,
    ResponseMIMEType:  "application/json",
  }

  result, _ := client.Models.GenerateContent(
    ctx,
    "gemini-2.5-flash",
    genai.Text("What is the average size of a swallow?"),
    config,
  )

  fmt.Println(result.Text())
}
```

```Java
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;

public class GenerateContentWithConfig {
  public static void main(String[] args) {

    Client client = new Client();

    GenerateContentConfig config = GenerateContentConfig.builder().temperature(0.1f).build();

    GenerateContentResponse response =
        client.models.generateContent("gemini-2.5-flash", "Explain how AI works", config);

    System.out.println(response.text());
  }
}
```

```bash
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works"
          }
        ]
      }
    ],
    "generationConfig": {
      "stopSequences": [
        "Title"
      ],
      "temperature": 1.0,
      "topP": 0.8,
      "topK": 10
    }
  }'
```

```JavaScript
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    responseMimeType: 'text/plain',
  };

  const payload = {
    generationConfig,
    contents: [
      {
        parts: [
          { text: 'Explain how AI works in a few words' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  const content = data['candidates'][0]['content']['parts'][0]['text'];
  console.log(content);
}
```

--------------------------------

### JavaScript Client Example - Multi-Speaker TTS

Source: https://ai.google.dev/gemini-api/docs/speech-generation_hl=sq

JavaScript/Node.js implementation demonstrating how to use the Google AI JavaScript SDK to generate multi-speaker audio content and save it as a WAV file.

```APIDOC
## JavaScript Client Implementation

### Description
Implements Text-to-Speech functionality using the Google AI JavaScript SDK with multi-speaker voice configuration and WAV file output.

### Code Example
```javascript
import { GoogleGenAI } from '@google/genai';
import wav from 'wav';

async function saveWaveFile(
    filename,
    pcmData,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filename, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(pcmData);
        writer.end();
    });
}

async function main() {
    const ai = new GoogleGenAI({});

    const prompt = `TTS the following conversation between Joe and Jane:
         Joe: How's it going today Jane?
         Jane: Not too bad, how about you?`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: 'Joe',
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Kore' }
                            }
                        },
                        {
                            speaker: 'Jane',
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Puck' }
                            }
                        }
                    ]
                }
            }
        }
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const audioBuffer = Buffer.from(data, 'base64');

    const fileName = 'out.wav';
    await saveWaveFile(fileName, audioBuffer);
}

await main();
```

### Key Components
- **saveWaveFile()** - Helper function to write PCM audio data to WAV format
- **GoogleGenAI** - Initialize the Google AI client
- **generateContent()** - Call the TTS model with configuration
- **response.candidates[0].content.parts[0].inlineData.data** - Extract base64-encoded audio data
- **Buffer.from()** - Convert base64 data to buffer
```

--------------------------------

### Initialize Gemini Agent Conversation with Screenshot

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=pl

Sets up the initial state for the Gemini agent loop. It navigates to a starting URL, takes a screenshot of the initial page, defines a user's goal, and constructs the initial conversation `contents` by combining the user prompt with the screenshot.

```python
try:
    # Go to initial page
    page.goto("https://ai.google.dev/gemini-api/docs")

    # Initialize history
    initial_screenshot = page.screenshot(type="png")
    USER_PROMPT = "Go to ai.google.dev/gemini-api/docs and search for pricing."
    print(f"Goal: {USER_PROMPT}")

    contents = [
        Content(role="user", parts=[
            Part(text=USER_PROMPT),
            Part.from_bytes(data=initial_screenshot, mime_type='image/png')
        ])
    ]
```

--------------------------------

### Download, Upload, Cache, and Generate Content (Python - Original SDK)

Source: https://ai.google.dev/gemini-api/docs/migrate_hl=zh-tw

This Python example demonstrates a full workflow: downloading a text file, uploading it to the Gemini API, creating a CachedContent object with a system instruction, and finally generating a response using a model initialized with the cached content.

```python
response = requests.get(
    'https://storage.googleapis.com/generativeai-downloads/data/a11.txt')
pathlib.Path('a11.txt').write_text(response.text)

document = genai.upload_file(path="a11.txt")

apollo_cache = caching.CachedContent.create(
    model="gemini-2.0-flash-001",
    system_instruction="You are an expert at analyzing transcripts.",
    contents=[document],
)

apollo_model = genai.GenerativeModel.from_cached_content(
    cached_content=apollo_cache
)
response = apollo_model.generate_content("Find a lighthearted moment from this transcript")
```

--------------------------------

### Use code execution in chat (Python)

Source: https://ai.google.dev/gemini-api/docs/code-execution

Example code using the Python SDK to utilize the code execution feature of Gemini 2.5 Flash for chat interactions.

```APIDOC
## Use code execution in chat (Python)

### Description
This Python code demonstrates how to set up a chat using the Gemini 2.5 Flash model and trigger code execution, specifically asking the model to calculate the sum of the first 50 prime numbers.

### Method
N/A (SDK Usage)

### Endpoint
N/A (SDK Usage)

### Parameters
N/A (SDK Usage)

### Request Example
```python
from google import genai
from google.genai import types

client = genai.Client()

chat = client.chats.create(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution)]
    ),
)

response = chat.send_message("I have a math question for you.")
print(response.text)

response = chat.send_message(
    "What is the sum of the first 50 prime numbers? "
    "Generate and run code for the calculation, and make sure you get all 50."
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    if part.executable_code is not None:
        print(part.executable_code.code)
    if part.code_execution_result is not None:
        print(part.code_execution_result.output)
```

### Response
#### Success Response (200)
- **text** (string) - The response text from the model.
- **executable_code.code** (string) -  The generated code to be executed.
- **code_execution_result.output** (string) - The output from the code execution.

#### Response Example
```
# (Example Output from Python Code)
I have a math question for you.
The sum of the first 50 prime numbers is:

def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = []
num = 2
while len(primes) < 50:
    if is_prime(num):
        primes.append(num)
    num += 1

print(sum(primes))
9557
```
```

--------------------------------

### Implement Multi-Turn Chat with Streaming Responses

Source: https://ai.google.dev/gemini-api/docs/text-generation_hl=he&lang=python

This collection of examples illustrates how to conduct multi-turn conversations with streaming responses using the Google Gemini API across different platforms. Each example initializes a chat session, sends sequential messages, processes streamed content chunks, and demonstrates how to retrieve the full chat history where applicable.

```python
from google import genai

client = genai.Client()
chat = client.chats.create(model="gemini-2.5-flash")

response = chat.send_message_stream("I have 2 dogs in my house.")
for chunk in response:
    print(chunk.text, end="")

response = chat.send_message_stream("How many paws are in my house?")
for chunk in response:
    print(chunk.text, end="")

for message in chat.get_history():
    print(f'role - {message.role}', end=": ")
    print(message.parts[0].text)
```

```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  const stream1 = await chat.sendMessageStream({
    message: "I have 2 dogs in my house.",
  });
  for await (const chunk of stream1) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }

  const stream2 = await chat.sendMessageStream({
    message: "How many paws are in my house?",
  });
  for await (const chunk of stream2) {
    console.log(chunk.text);
    console.log("_".repeat(80));
  }
}

await main();
```

```go
package main

import (
  "context"
  "fmt"
  "log"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, err := genai.NewClient(ctx, nil)
  if err != nil {
      log.Fatal(err)
  }

  history := []*genai.Content{
      genai.NewContentFromText("Hi nice to meet you! I have 2 dogs in my house.", genai.RoleUser),
      genai.NewContentFromText("Great to meet you. What would you like to know?", genai.RoleModel),
  }

  chat, _ := client.Chats.Create(ctx, "gemini-2.5-flash", nil, history)
  stream := chat.SendMessageStream(ctx, genai.Part{Text: "How many paws are in my house?"})

  for chunk, _ := range stream {
      part := chunk.Candidates[0].Content.Parts[0]
      fmt.Print(part.Text)
  }
}
```

```java
import com.google.genai.Chat;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;

public class MultiTurnConversationWithStreaming {
  public static void main(String[] args) {

    Client client = new Client();
    Chat chatSession = client.chats.create("gemini-2.5-flash");

    ResponseStream<GenerateContentResponse> responseStream =
        chatSession.sendMessageStream("I have 2 dogs in my house.", null);

    for (GenerateContentResponse response : responseStream) {
      System.out.print(response.text());
    }

    responseStream = chatSession.sendMessageStream("How many paws are in my house?", null);

    for (GenerateContentResponse response : responseStream) {
      System.out.print(response.text());
    }

    // Get the history of the chat session. History is added after the stream
    // is consumed and includes the aggregated response from the stream.
    System.out.println("History: " + chatSession.getHistory(false));
  }
}
```

```curl
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Hello"
          }
        ]
      },
      {
        "role": "model",
        "parts": [
          {
            "text": "Great to meet you. What would you like to know?"
          }
        ]
      },
      {
        "role": "user",
        "parts": [
          {
            "text": "I have two dogs in my house. How many paws are in my house?"
          }
        ]
      }
    ]
  }'
```

```apps-script
// See https://developers.google.com/apps-script/guides/properties
// for instructions on how to set the API key.
const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function main() {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Hello' },
        ],
      },
      {
        role: 'model',
        parts: [
          { text: 'Great to meet you. What would you like to know?' },
        ],
      },
      {
        role: 'user',
        parts: [
          { text: 'I have two dogs in my house. How many paws are in my house?' },
        ],
      },
    ],
  };

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  const options = {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey,
    },
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
}
```

--------------------------------

### Use code execution in chat (JavaScript)

Source: https://ai.google.dev/gemini-api/docs/code-execution

Example code showcasing how to use the JavaScript SDK to leverage the code execution feature of Gemini 2.5 Flash for chat-based interactions.

```APIDOC
## Use code execution in chat (JavaScript)

### Description
This JavaScript code provides an example using the GoogleGenAI library to interact with the Gemini 2.5 Flash model and make use of code execution capabilities for a math problem.

### Method
N/A (SDK Usage)

### Endpoint
N/A (SDK Usage)

### Parameters
N/A (SDK Usage)

### Request Example
```javascript
import {GoogleGenAI} from "@google/genai";

const ai = new GoogleGenAI({});

const chat = ai.chats.create({
  model: "gemini-2.5-flash",
  history: [
    {
      role: "user",
      parts: [{ text: "I have a math question for you:" }],
    },
    {
      role: "model",
      parts: [{ text: "Great! I'm ready for your math question. Please ask away." }],
    },
  ],
  config: {
    tools: [{codeExecution:{}}],
  }
});

const response = await chat.sendMessage({
  message: "What is the sum of the first 50 prime numbers? " +
            "Generate and run code for the calculation, and make sure you get all 50."
});
console.log("Chat response:", response.text);
```

### Response
#### Success Response (200)
- **text** (string) - The response text from the model.
- **executable_code.code** (string) -  The generated code to be executed.
- **code_execution_result.output** (string) - The output from the code execution.

#### Response Example
```
# (Example of Javascript output)
Chat response: The sum of the first 50 prime numbers is:

def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = []
num = 2
while len(primes) < 50:
    if is_prime(num):
        primes.append(num)
    num += 1

print(sum(primes))
9557
```
```

--------------------------------

### Example Gemini Model Output for Robot API Sequence (JSON)

Source: https://ai.google.dev/gemini-api/docs/robotics-overview

This example shows a potential output from the generative model. It includes the model's detailed reasoning for performing a pick-and-place operation, outlining the steps for interacting with the blue block and orange bowl. Following the reasoning, a JSON array represents the planned sequence of robot API calls, where each object specifies a `"function"` name and its `"args"`. This demonstrates how the model translates its strategic thinking into executable robot commands. Note that the provided JSON array is truncated.

```json
[
  {
    "function": "move",
    "args": [
      163,
      427,
      true
    ]
  },
  {
    "function": "setGripperState",
    "args": [
      true
    ]
  },
  {
    "function": "move",
    "args": [
      163,
      427,
      false
    ]
  },
  {
    "function": "setGripperState",
    "args": [
      false
    ]
  },
  {
    "function": "move",
    "args": [
      163,
      427,
      true
    ]
  },
  {
    "function": "move",
    "args": [
      -247,
      90,
      true
    ]
  },
  {
    "function": "move",
    "args": [
      -247,
      90,
      false
    ]
  },
  {
    "function": "setGripperState",
    "args": [
      true
    ]
  }
]
```

--------------------------------

### Gemini API Prompts for High-Fidelity Detail Preservation

Source: https://ai.google.dev/gemini-api/docs/image-generation_hl=ar

These examples illustrate how to construct prompts for the Gemini API to ensure high-fidelity detail preservation during image manipulation. The first shows a generic template, and the second provides a specific Python implementation that loads images and defines a detailed prompt to add a logo while maintaining original features.

```text
Using the provided images, place [element from image 2] onto [element from
image 1]. Ensure that the features of [element from image 1] remain
completely unchanged. The added element should [description of how the
element should integrate].
```

```python
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

# Base image prompts:
# 1. Woman: "A professional headshot of a woman with brown hair and blue eyes, wearing a plain black t-shirt, against a neutral studio background."
# 2. Logo: "A simple, modern logo with the letters 'G' and 'A' in a white circle."
woman_image = Image.open('/path/to/your/woman.png')
logo_image = Image.open('/path/to/your/logo.png')
text_input = """Take the first image of the woman with brown hair, blue eyes, and a neutral
expression. Add the logo from the second image onto her black t-shirt.
Ensure the woman's face and features remain completely unchanged. The logo
should look like it's naturally printed on the fabric, following the folds
of the shirt."""
```

--------------------------------

### Enable Code Execution with Gemini API - Go

Source: https://ai.google.dev/gemini-api/docs/code-execution_hl=de

Create a Gemini API client in Go with code execution tool configured. This example sends a request to generate and execute code for calculating the sum of the first 50 prime numbers, then retrieves and displays the text, executable code, and execution results.

```go
package main

import (
    "context"
    "fmt"
    "os"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, err := genai.NewClient(ctx, nil)
    if err != nil {
        log.Fatal(err)
    }

    config := &genai.GenerateContentConfig{
        Tools: []*genai.Tool{
            {CodeExecution: &genai.ToolCodeExecution{}},
        },
    }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        genai.Text("What is the sum of the first 50 prime numbers? " +
                  "Generate and run code for the calculation, and make sure you get all 50."),
        config,
    )

    fmt.Println(result.Text())
    fmt.Println(result.ExecutableCode())
    fmt.Println(result.CodeExecutionResult())
}
```

--------------------------------

### Compare Multiple PDFs using Gemini File API Across Languages

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=sq

These examples demonstrate how to download or access two PDF files, upload them to the Gemini File API, and then create a multi-modal prompt to ask a Gemini model (e.g., `gemini-2.5-flash`) to compare information between them. This is shown for Python, JavaScript, and Go, illustrating common patterns for interacting with the Gemini File API and content generation.

```python
# Retrieve and upload both PDFs using the File API
doc_data_1 = io.BytesIO(httpx.get(doc_url_1).content)
doc_data_2 = io.BytesIO(httpx.get(doc_url_2).content)

sample_pdf_1 = client.files.upload(
  file=doc_data_1,
  config=dict(mime_type='application/pdf')
)
sample_pdf_2 = client.files.upload(
  file=doc_data_2,
  config=dict(mime_type='application/pdf')
)

prompt = "What is the difference between each of the main benchmarks between these two papers? Output these in a table."

response = client.models.generate_content(
  model="gemini-2.5-flash",
  contents=[sample_pdf_1, sample_pdf_2, prompt])
print(response.text)
```

```javascript
import { createPartFromUri, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "GEMINI_API_KEY" });

async function uploadRemotePDF(url, displayName) {
    const pdfBuffer = await fetch(url)
        .then((response) => response.arrayBuffer());

    const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    const file = await ai.files.upload({
        file: fileBlob,
        config: {
            displayName: displayName,
        },
    });

    // Wait for the file to be processed.
    let getFile = await ai.files.get({ name: file.name });
    while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: file.name });
        console.log(`current file status: ${getFile.state}`);
        console.log('File is still processing, retrying in 5 seconds');

        await new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });
    }
    if (file.state === 'FAILED') {
        throw new Error('File processing failed.');
    }

    return file;
}

async function main() {
    const content = [
        'What is the difference between each of the main benchmarks between these two papers? Output these in a table.',
    ];

    let file1 = await uploadRemotePDF("https://arxiv.org/pdf/2312.11805", "PDF 1")
    if (file1.uri && file1.mimeType) {
        const fileContent = createPartFromUri(file1.uri, file1.mimeType);
        content.push(fileContent);
    }
    let file2 = await uploadRemotePDF("https://arxiv.org/pdf/2403.05530", "PDF 2")
    if (file2.uri && file2.mimeType) {
        const fileContent = createPartFromUri(file2.uri, file1.mimeType);
        content.push(fileContent);
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
    });

    console.log(response.text);
}

main();
```

```go
package main

import (
    "context"
    "fmt"
    "io"
    "net/http"
    "os"
    "google.golang.org/genai"
)

func main() {

    ctx := context.Background()
    client, _ := genai.NewClient(ctx, &genai.ClientConfig{
        APIKey:  os.Getenv("GEMINI_API_KEY"),
        Backend: genai.BackendGeminiAPI,
    })

    docUrl1 := "https://arxiv.org/pdf/2312.11805"
    docUrl2 := "https://arxiv.org/pdf/2403.05530"
    localPath1 := "doc1_downloaded.pdf"
    localPath2 := "doc2_downloaded.pdf"

    respHttp1, _ := http.Get(docUrl1)
    defer respHttp1.Body.Close()

    outFile1, _ := os.Create(localPath1)
    _, _ = io.Copy(outFile1, respHttp1.Body)
    outFile1.Close()

    respHttp2, _ := http.Get(docUrl2)
    defer respHttp2.Body.Close()

    outFile2, _ := os.Create(localPath2)
    _, _ = io.Copy(outFile2, respHttp2.Body)
    outFile2.Close()

    uploadConfig1 := &genai.UploadFileConfig{MIMEType: "application/pdf"}
    uploadedFile1, _ := client.Files.UploadFromPath(ctx, localPath1, uploadConfig1)

    uploadConfig2 := &genai.UploadFileConfig{MIMEType: "application/pdf"}
    uploadedFile2, _ := client.Files.UploadFromPath(ctx, localPath2, uploadConfig2)

    promptParts := []*genai.Part{
        genai.NewPartFromURI(uploadedFile1.URI, uploadedFile1.MIMEType),
        genai.NewPartFromURI(uploadedFile2.URI, uploadedFile2.MIMEType),
        genai.NewPartFromText("What is the difference between each of the " +
                              "main benchmarks between these two papers? " +
                              "Output these in a table."),
    }
    contents := []*genai.Content{
        genai.NewContentFromParts(promptParts, genai.RoleUser),
    }

    modelName := "gemini-2.5-flash"
    result, _ := client.Models.GenerateContent(
        ctx,
        modelName,
        contents,
        nil,
    )

    fmt.Println(result.Text())
}
```

--------------------------------

### Upload and Summarize PDF using Go Gemini API

Source: https://ai.google.dev/gemini-api/docs/document-processing_hl=ja

This Go example illustrates how to download a PDF, save it locally, and then upload it to the Gemini File API using the official Go client library. It constructs a prompt with the uploaded file's URI and requests a summary from the Gemini model.

```go
package main

import (
  "context"
  "fmt"
  "io"
  "net/http"
  "os"
  "google.golang.org/genai"
)

func main() {

  ctx := context.Background()
  client, _ := genai.NewClient(ctx, &genai.ClientConfig{
    APIKey:  os.Getenv("GEMINI_API_KEY"),
    Backend: genai.BackendGeminiAPI,
  })

  pdfURL := "https://www.nasa.gov/wp-content/uploads/static/history/alsj/a17/A17_FlightPlan.pdf"
  localPdfPath := "A17_FlightPlan_downloaded.pdf"

  respHttp, _ := http.Get(pdfURL)
  defer respHttp.Body.Close()

  outFile, _ := os.Create(localPdfPath)
  defer outFile.Close()

  _, _ = io.Copy(outFile, respHttp.Body)

  uploadConfig := &genai.UploadFileConfig{MIMEType: "application/pdf"}
  uploadedFile, _ := client.Files.UploadFromPath(ctx, localPdfPath, uploadConfig)

  promptParts := []*genai.Part{
    genai.NewPartFromURI(uploadedFile.URI, uploadedFile.MIMEType),
    genai.NewPartFromText("Summarize this document"),
  }
  contents := []*genai.Content{
    genai.NewContentFromParts(promptParts, genai.RoleUser),
  }

    result, _ := client.Models.GenerateContent(
        ctx,
        "gemini-2.5-flash",
        contents,
        nil,
    )

  fmt.Println(result.Text())
}
```

--------------------------------

### Create and access Google GenAI client object (New SDK)

Source: https://ai.google.dev/gemini-api/docs/migrate

Demonstrates how to instantiate the `genai.Client` object in the new Google GenAI SDK and access various API services like `models`, `chats`, `files`, and `tunings` through this client. This is the new recommended approach for interacting with the Gemini API.

```python
client = genai.Client()

# Access API methods through services on the client object
response = client.models.generate_content(...)
chat = client.chats.create(...)
my_file = client.files.upload(...)
tuning_job = client.tunings.tune(...)
```

```javascript
import { GoogleGenAI } from "@google/genai";

// Create a single client object
const ai = new GoogleGenAI({apiKey: "GEMINI_API_KEY"});

// Access API methods through services on the client object
const response = await ai.models.generateContent(...);
const chat = ai.chats.create(...);
const uploadedFile = await ai.files.upload(...);
const cache = await ai.caches.create(...);
```

```go
import "google.golang.org/genai"

// Create a single client object
client, err := genai.NewClient(ctx, nil)

// Access API methods through services on the client object
result, err := client.Models.GenerateContent(...)
chat, err := client.Chats.Create(...)
uploadedFile, err := client.Files.Upload(...)
tuningJob, err := client.Tunings.Tune(...)
```

--------------------------------

### Update Infographic Language with Gemini API (Python, JavaScript, Go, Java)

Source: https://ai.google.dev/gemini-api/docs/image-generation

These code examples demonstrate how to update the language of an existing infographic using the Gemini API SDKs. Each example sends a message to change the infographic's text to Spanish while preserving other image elements. It also configures image output settings like aspect ratio and resolution, and then saves the updated image from the API response.

```python
message = "Update this infographic to be in Spanish. Do not change any other elements of the image."
aspect_ratio = "16:9" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "2K" # "1K", "2K", "4K"

response = chat.send_message(message,
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
        ),
    ))

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("photosynthesis_spanish.png")
```

```javascript
const message = 'Update this infographic to be in Spanish. Do not change any other elements of the image.';
const aspectRatio = '16:9';
const resolution = '2K';

let response = await chat.sendMessage({
  message,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: aspectRatio,
      imageSize: resolution,
    },
    tools: [{googleSearch: {}}],
  },
});

for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("photosynthesis2.png", buffer);
      console.log("Image saved as photosynthesis2.png");
    }
}
```

```go
message = "Update this infographic to be in Spanish. Do not change any other elements of the image."
aspect_ratio = "16:9" // "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "2K"     // "1K", "2K", "4K"

model.GenerationConfig.ImageConfig = &pb.ImageConfig{
    AspectRatio: aspect_ratio,
    ImageSize:   resolution,
}

resp, err = chat.SendMessage(ctx, genai.Text(message))
if err != nil {
    log.Fatal(err)
}

for _, part := range resp.Candidates[0].Content.Parts {
    if txt, ok := part.(genai.Text); ok {
        fmt.Printf("%s", string(txt))
    } else if img, ok := part.(genai.ImageData); ok {
        err := os.WriteFile("photosynthesis_spanish.png", img.Data, 0644)
        if err != nil {
            log.Fatal(err)
        }
    }
}
```

```java
String aspectRatio = "16:9"; // "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
String resolution = "2K"; // "1K", "2K", "4K"

config = GenerateContentConfig.builder()
    .responseModalities("TEXT", "IMAGE")
    .imageConfig(ImageConfig.builder()
        .aspectRatio(aspectRatio)
        .imageSize(resolution)
        .build())
    .build();

response = chat.sendMessage(
    "Update this infographic to be in Spanish. " +
    "Do not change any other elements of the image.",
    config);

for (Part part : response.parts()) {
  if (part.text().isPresent()) {
    System.out.println(part.text().get());
  } else if (part.inlineData().isPresent()) {
    var blob = part.inlineData().get();
    if (blob.data().isPresent()) {
      Files.write(Paths.get("photosynthesis_spanish.png"), blob.data().get());
    }
  }
}
```

--------------------------------

### Navigate to Initial Web Page in Python

Source: https://ai.google.dev/gemini-api/docs/computer-use_hl=pt-br

This line directs the newly created Playwright page to a specified initial URL. This serves as the starting point for the agent's interaction, setting the stage for the subsequent steps defined by the user prompt.

```python
page.goto("https://ai.google.dev/gemini-api/docs")
```