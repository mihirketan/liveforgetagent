# LiveForget Agent

A privacy-first text chat UI. Reset phrases are detected in the browser before the
message is added to conversation context or sent to the configured LLM proxy.

## Privacy behavior

- “Forget everything I said,” “forget everything,” “forget that,” and “start over”
  clear the in-memory conversation. The entire message containing a reset phrase
  is discarded and is not sent.
- Clearing the conversation aborts an in-flight request and prevents its late
  response from being added to the new conversation.
- Ordinary messages are sent only when `VITE_PROXY_URL` is configured. The
  browser keeps conversation state in memory; it does not persist a transcript.
- Resetting client context cannot delete messages already received or logged by
  an LLM proxy or provider. Review their retention policies before sending
  sensitive information.

Reset matching is case-insensitive and ignores punctuation between words. Voice
input and speech-to-text are not implemented.

## Run

```sh
npm ci
npm run dev
npm run test
npm run build
```

To connect a proxy, copy `.env.example` to `.env.local` and set
`VITE_PROXY_URL` to its HTTPS endpoint. The app sends a JSON `POST` with
`{ "provider": "anthropic", "messages": [...] }` and expects a JSON response
containing a string `text` or `content` field. The proxy must allow requests
from the app's origin and keep provider API keys server-side. No proxy
implementation is included in this repository.

For GitHub Pages deployment, enable GitHub Actions as the Pages source and set
the Vite `base` in `vite.config.ts` if the site is hosted below the domain root.
