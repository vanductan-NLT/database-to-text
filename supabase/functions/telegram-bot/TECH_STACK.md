# Telegram Database Q&A Agent - Tech Stack

## Runtime & Language
- **Deno** 1.x (via Supabase Edge Functions)
- **TypeScript** 5.x (strict mode)

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.x | Database client |
| `@google/generative-ai` | ^0.21.0 | Gemini 2.5 Flash |

## APIs

| Service | Endpoint | Auth |
|---------|----------|------|
| **Telegram Bot API** | `https://api.telegram.org/bot<TOKEN>/` | Bot Token |
| **Gemini API** | `https://generativelanguage.googleapis.com/` | API Key |
| **Supabase** | Project URL | Service Role Key |

## Environment Variables

```bash
TELEGRAM_BOT_TOKEN=     # From @BotFather
GEMINI_API_KEY=         # From Google AI Studio
SUPABASE_URL=           # Project URL
SUPABASE_SERVICE_ROLE_KEY=  # Service role key (not anon!)
```

## Architecture Layers

```
Domain → Application → Infrastructure
   ↑          ↑              ↑
 Entities   Use Cases    Adapters
 Interfaces DTOs         Repositories
```
