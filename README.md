# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/95dd71d7-6290-4c71-9b99-8407f3963fa5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/95dd71d7-6290-4c71-9b99-8407f3963fa5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Create your environment file from the example.
cp .env.example .env

# Step 4: Fill in your Supabase values in .env.

# Step 5: Install dependencies.
npm i

# Step 6: Start the development server.
npm run dev
```

## Environment variables (required)

This project requires the following Vite environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use `.env.example` as the source of truth for variable names and expected format.

### Local setup

1. Copy `.env.example` to `.env`.
2. Populate values from your Supabase project settings.
3. Never commit `.env` or any real credential-like value to git.

### Secret/public key policy

- `VITE_SUPABASE_PUBLISHABLE_KEY` is a **public/anon key** intended for client use, but it must still be managed with operational hygiene.
- Never expose `service_role` keys in frontend code or Vite variables.
- Rotate the publishable key if it is ever committed, shared in logs, or included in screenshots.
- After rotation, update all environments (local/dev/staging/prod) before redeploying.

## Supabase key rotation runbook

1. In Supabase dashboard, rotate/regenerate the anon/publishable key for the project.
2. Update `VITE_SUPABASE_PUBLISHABLE_KEY` and confirm `VITE_SUPABASE_URL` in each environment.
3. Redeploy each environment.
4. Validate login/session flows in each deployed environment.

## Deploy/pipeline environment injection checklist

No CI/CD pipeline files were found in this repository at the moment, so environment injection is expected to be configured in the hosting platform (for example, Lovable deploy settings).

For each environment (dev/staging/prod), ensure:

- `VITE_SUPABASE_URL` is set with the correct project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` is set with the active publishable key.
- Variables are configured as build-time environment variables.
- After any key rotation, a new deploy is triggered for every environment.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/95dd71d7-6290-4c71-9b99-8407f3963fa5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
