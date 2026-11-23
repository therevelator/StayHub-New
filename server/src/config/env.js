import dotenv from 'dotenv';

// Load local environment files once, before anything reads process.env.
// `.env.local` is git-ignored and wins over `.env`: keep secrets (API keys)
// there, since `.env` is committed to the repository.
dotenv.config({ path: ['.env.local', '.env'] });
