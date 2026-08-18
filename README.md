# ReSort ♻️

**Snap a photo. Find the right bin. Recycle correctly.**

**An AI-powered recycling assistant for Poland's waste sorting system, powered by Gemma 4**

Take a photo of any item — even contaminated or unusual ones — and ReSort tells you which bin it belongs in.

---

## The problem

Recycling rules in Poland confuse even people who care. The hard cases aren't "plastic bottle" or "newspaper" — they're:

- An empty hair dye bottle stained with dried dye
- A pizza box with grease on the bottom
- A pet food can with dried residue
- Old electronics: where exactly do they go?
- The new deposit system (kaucja, launching January 2026) — which bottles qualify?
- The new purple textile bins (mandatory since January 2025)

Existing apps in Poland are searchable databases — they require users to know what an item is called in Polish, and they often miss edge cases. This app uses Gemma 4's vision capabilities to **look at the item and reason about it**, including its condition.

## How it works

1. User takes a photo of an item with their phone camera
2. The app sends the photo to Gemma 4 26B Mixture-of-Experts via Google AI Studio API, along with a detailed system prompt encoding Polish recycling rules
3. Gemma returns structured JSON: bin category, preparation steps, explanation, edge-case notes
4. The app displays the result with the corresponding bin color

## Categories supported

The app classifies items into twelve disposal categories matching Poland's current waste system:

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
| `kaucja` | — | Deposit-return bottles & cans (launching January 2026) |
| `niewyrazne` | — | Photo too unclear to classify — prompts user to retake |
| `niewaste` | — | Photo doesn't show a waste item |
| `apteka` | — | Expired or unused medications — pharmacy drop-off |

## Why Gemma 4 26B MoE

Gemma 4 comes in four variants. I chose **26B MoE** (`gemma-4-26b-a4b-it`) for these reasons:

- **Production-quality reasoning at edge-class compute.** The 26B MoE architecture activates only ~4B parameters per token, so it reasons at 26B-class quality while running at roughly E4B cost. Hard recycling edge cases — composite packaging, contaminated containers, blister packs photographed from the foil side — benefit from the larger knowledge base.
- **Better accuracy on ambiguous items.** Classifying items correctly matters more than classification speed here. The 26B MoE handles material composition, contamination tradeoffs, and subtle visual cues more reliably than smaller variants.
- **Free hosting via Google AI Studio enables 24/7 availability.** No local infrastructure, no tunnel, no cold-start latency — the demo runs as a standard Vercel serverless function calling a managed API.
- **The on-device story still holds.** During development I tested E4B locally via Ollama to validate that the smaller variant can handle the task on-device. The deployment choice (cloud-hosted 26B) is separate from the capability story: E4B works on-device too, making a future MediaPipe or local-Ollama deployment viable without rewriting the system prompt.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** for styling
- **Gemma 4 26B MoE** (`gemma-4-26b-a4b-it`) via Google AI Studio API
- **Sharp** for server-side image resizing before inference
- **Vercel** for deployment

## Running locally

You need a [Google AI Studio](https://aistudio.google.com) API key (free tier available).

```bash
# Clone the repo
git clone https://github.com/robloxsagax-web/ReSort.git
cd ReSort

# Install dependencies
npm install

# Set your Google AI Studio credentials
echo "GOOGLE_API_KEY=your_key_here" >> .env.local
echo "GOOGLE_MODEL=gemma-4-26b-a4b-it" >> .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Deploying to Vercel?** Add `GOOGLE_API_KEY` and `GOOGLE_MODEL` as environment variables in your Vercel project settings.

## Project status

This is a hackathon submission built solo in ~10 days. It's a working demo, not production software. Known limitations:

- Recycling rules vary by *gmina* (Polish municipality); the app uses general national guidelines
- Not all bin types (especially purple textile bins) are available in every neighborhood yet
- The kaucja symbol recognition depends on photo quality
- Confidence calibration is rough — Gemma may be confidently wrong on unusual items

Future ideas: location-aware gmina-specific rules, integration with PSZOK location databases, on-device deployment via MediaPipe, multi-language support.

## About

ReSort is based on [`recycling-app`](https://github.com/klaudiagrz/recycling-app), originally built by Klaudia Grzondziel for the [`dev.to` Gemma 4 Challenge](https://dev.to/challenges/google-gemma-2026-05-06) ([write-up](https://dev.to/klaudiagrz/recycling-made-easy-a-polish-recycling-assistant-powered-by-gemma-4-j0a) · [original live demo](https://gdzie-wyrzucic.vercel.app/)).

The product design, system prompt engineering, and Polish recycling knowledge are hers; the boilerplate code was mostly AI-assisted via [Claude Code](https://www.anthropic.com/claude-code). ReSort rebrands and continues the project under the MIT license.

## License

MIT — see [LICENSE](./LICENSE).
