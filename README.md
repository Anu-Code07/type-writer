# Type Writer

A premium, local-first typewriter journaling app for MacBook browsers.

## Features

- Desktop-first mechanical typewriter writing surface
- Opening journal/book animation
- Custom rendered paper, text, cursor, platen, and carriage
- Optional Web Audio API typing, bell, backspace, and carriage-return sounds
- Local document management with IndexedDB persistence
- Debounced autosave
- TXT and Markdown export
- Focus mode with `Cmd + Enter`
- Supabase Auth with email/password and magic link options
- Supabase document/book sync for signed-in users
- Offline support after the first load via a service worker

## Shortcuts

- `Cmd + N` - New document
- `Cmd + S` - Save locally
- `Cmd + Shift + S` - Export Markdown
- `Cmd + Enter` - Toggle focus mode
- `Escape` - Exit focus mode / close panels
- `Cmd + Z` - Undo
- `Cmd + Shift + Z` - Redo

## Development

```bash
npm install
npm run dev
```

## Supabase Auth

Create `.env.local` from `.env.example` and provide:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

The app uses email/password sign-in, sign-up with a display name, and magic links. Google/OAuth login is not enabled.

To enable cloud saving, run `supabase/schema.sql` in your Supabase SQL editor. The app remains local-first with IndexedDB, then syncs documents/books to Supabase for signed-in users.
