<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b30a9495-e3d8-46d5-bbe7-32dcc9b0fa36

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env` and set `NVIDIA_API_KEY` to your NVIDIA API key
3. Run the app:
   `npm run dev`

For Vercel, add `NVIDIA_API_KEY` in the project Environment Variables and redeploy. `.env` is intentionally ignored by git and is not uploaded to Vercel.
