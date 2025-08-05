# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
npm start      # Runs the app in development mode on http://localhost:3000
npm run build  # Creates production build in /build directory
npm test       # Runs tests in interactive watch mode
```

### Firebase Deployment
```bash
firebase deploy          # Deploy all services (hosting, firestore, storage)
firebase deploy --only hosting  # Deploy only the web app
firebase deploy --only firestore:rules  # Deploy only Firestore rules
firebase deploy --only storage:rules    # Deploy only Storage rules
```

## Architecture Overview

This is a React-based web application for story recording, built with Create React App and integrated with Firebase services.

### Key Technologies
- **React 18.2** - UI framework
- **Firebase** - Backend services (Firestore, Storage, Hosting)
- **React Router v6** - Client-side routing
- **Wavesurfer.js** - Audio waveform visualization
- **React Audio Player Component** - Audio playback functionality

### Firebase Configuration
- **Project ID**: loveretoldpoc
- **Services Used**:
  - Firestore: Document database for storing story metadata
  - Storage: File storage for audio recordings
  - Hosting: Web app deployment (serves from /build directory)

### Build Output
The application builds to the `/build` directory with:
- Static assets optimized for production
- Single-page app with HTML5 routing (all routes serve index.html)
- Minified JavaScript and CSS with source maps

### Security Considerations
- Firestore rules currently allow read/write access until Feb 21, 2025
- Storage rules currently allow unrestricted read/write access
- Environment variables are stored in `.env.local` (not tracked in git)

### Development Workflow
1. Source code should be placed in a `src/` directory (currently missing)
2. Public assets should be placed in a `public/` directory (currently missing)
3. The app uses standard Create React App structure and conventions