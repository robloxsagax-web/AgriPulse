# Gdzie to wyrzucić? 🗑️ [ENG: Where to throw it?]

**A Polish recycling assistant powered by Gemma 4**

Take a photo of any item — even contaminated or unusual ones — and find out which bin it belongs in. Built for the [`dev.to` Gemma 4 Challenge](https://dev.to/challenges/google-gemma-2026-05-06), May 2026.

🔗 **Live demo:** [gdzie-wyrzucic.vercel.app](https://gdzie-wyrzucic.vercel.app/)

📝 **Write-up:** [`dev.to` article](TODO)

---

## The problem

Recycling rules in Poland confuse even people who care. The hard cases aren't "plastic bottle" or "newspaper" — they're:

- An empty hair dye bottle stained with dried dye
- A pizza box with grease on the bottom
- A pet food can with dried residue
- Old electronics: where exactly do they go?
- The new deposit system (kaucja, since October 2025) — which bottles qualify?
- The new purple textile bins (mandatory since January 2025)

Existing apps in Poland are searchable databases — they require users to know what an item is called in Polish, and they often miss edge cases. This app uses Gemma 4's vision capabilities to **look at the item and reason about it**, including its condition.

## How it works

1. User takes a photo of an item with their phone camera
2. The app sends the photo to Gemma 4 (E4B variant) along with a detailed system prompt encoding Polish recycling rules
3. Gemma returns structured JSON: bin category, preparation steps, explanation, edge-case notes
4. The app displays the result with the corresponding bin color

## Categories supported

The app classifies items into eleven disposal categories matching Poland's current waste system:

| Category | Bin color | Examples |
|---|---|---|
| `plastik_metal` | 🟡 Yellow | Plastic bottles, cans, Tetra Pak |
| `papier` | 🔵 Blue | Paper, cardboard |
| `szklo` | 🟢 Green | Glass jars, bottles |
| `bio` | 🟤 Brown | Food scraps, garden waste |
| `zmieszane` | ⚫ Grey | Mixed waste — contaminated or composite items |
| `tekstylia` | 🟣 Purple | Clothes, shoes (separate collection mandatory since Jan 2025) |
| `elektroodpady` | 🔴 Red | Small electronics, batteries |
| `pszok` | — | Large/hazardous items (municipal drop-off) |
| `kaucja` | — | Deposit-return bottles & cans (launched Oct 2025) |
| `niewyrazne` | — | Photo too unclear to classify — prompts user to retake |
| `niewaste` | — | Photo doesn't show a waste item |

## Why Gemma 4 E4B

Gemma 4 comes in four variants. I chose **E4B** for these reasons:

- **It's designed for edge deployment.** A recycling app gets used at the kitchen counter or trash room, sometimes with poor connectivity. E4B is optimized for mobile, edge, and browser environments — exactly the deployment context this app targets.
- **Visual reasoning quality is sufficient for the task.** Identifying packaging types and assessing contamination doesn't require frontier-scale reasoning. E4B handles it well when paired with a detailed domain-specific system prompt.
- **It demonstrates intentional model selection.** Anyone can wire up a 31B model via API. Choosing the variant Google designed for this exact use case is a deliberate match between problem and tool.
- **Privacy story.** Recycling decisions involve photos of your home and trash. A model that *can* run on-device (E4B) is a better long-term fit than a model that must run on a server (31B Dense / 26B MoE).

In this implementation, Gemma 4 E4B runs locally via Ollama, called from the Next.js API route through a configurable `OLLAMA_URL` (tunnelled via ngrok for the Vercel deployment). The same model could run fully on-device via MediaPipe in a future iteration — preserving the privacy story end to end.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** for styling
- **Gemma 4 E4B** via Ollama
- **ngrok** to expose local Ollama to Vercel's serverless functions
- **Sharp** for server-side image resizing before inference
- **Vercel** for deployment

## Running locally

You need [Ollama](https://ollama.com) installed and the Gemma 4 E4B model pulled.

```bash
# Pull the model (one-time, ~3 GB)
ollama pull gemma4:e4b

# Clone the repo
git clone https://github.com/YOUR-USERNAME/recycling-app.git
cd recycling-app

# Install dependencies
npm install

# Point the app at your local Ollama instance
echo "OLLAMA_URL=http://localhost:11434" > .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Deploying to Vercel?** Ollama can't run on Vercel's serverless infrastructure. Expose your local Ollama via [ngrok](https://ngrok.com) (`ngrok http 11434`) and set `OLLAMA_URL` to the ngrok HTTPS URL in your Vercel environment variables.

## Project status

This is a hackathon submission built solo in ~10 days. It's a working demo, not production software. Known limitations:

- Recycling rules vary by *gmina* (Polish municipality); the app uses general national guidelines
- Not all bin types (especially purple textile bins) are available in every neighborhood yet
- The kaucja symbol recognition depends on photo quality
- Confidence calibration is rough — Gemma may be confidently wrong on unusual items

Future ideas: location-aware gmina-specific rules, integration with PSZOK location databases, on-device deployment via MediaPipe, multi-language support.

## About

Built by Klaudia Grzondziel for the [`dev.to` Gemma 4 Challenge](https://dev.to/challenges/google-gemma-2026-05-06).

I'm a technical writer, not a developer — this is my first web app. AI coding assistance via [Claude Code](https://www.anthropic.com/claude-code) helped me bridge the gap from idea to working code. The product design, system prompt engineering, and Polish recycling knowledge are mine; the boilerplate code is mostly AI-assisted.

## License

MIT — see [LICENSE](./LICENSE).
