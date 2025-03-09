# Habit Tracker Application

A modern habit tracking application that helps users build and maintain consistent habits with visual feedback, streak tracking, and statistics.

## Features

- Create, track, and visualize habits by category
- Track habit completion with 0%, 50%, or 100% levels
- View streaks and completion statistics
- Calendar view to review past performance
- Mobile-responsive design

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: Express.js, TypeScript, In-memory storage (can be upgraded to PostgreSQL)
- **Build Tools**: Vite, ESBuild

## Deployment Guide

### Frontend Deployment (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Use the following build settings:
   - Build command: `cd client && npm run build`
   - Publish directory: `client/dist`
4. Set environment variables:
   - `NODE_ENV`: `production`

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Use the following settings:
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Set environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `CORS_ORIGIN`: Your Netlify app URL (e.g., `https://habit-tracker-app.netlify.app`)
   - `SESSION_SECRET`: Generate a random string

### Update Frontend Configuration

After deploying the backend, update the Netlify redirect rule in the `netlify.toml` file:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-render-app-url.onrender.com/api/:splat"
  status = 200
  force = true
```

Replace `your-render-app-url` with your actual Render app URL.

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at `http://localhost:5000`

## License

MIT