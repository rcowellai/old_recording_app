# Love Retold - Story Recording Web App

A React-based web application for recording personal stories with video and audio capabilities, built for Firebase hosting.

## 🚀 Features

- **Dual Recording Modes**: Audio-only or video recording (720p quality)
- **Session-Based Access**: URL-based recording sessions without user accounts
- **Real-time Analytics**: Comprehensive user journey and performance tracking
- **Responsive Design**: Mobile-first design that works across all devices
- **Firebase Integration**: Secure cloud storage and real-time database
- **Progress Tracking**: Visual upload progress with error handling
- **Browser Compatibility**: Works on Chrome, Firefox, Safari, and Edge

## 🛠️ Tech Stack

- **Frontend**: React 18.2, React Router v6
- **Backend**: Firebase (Firestore, Storage, Cloud Functions, Hosting)
- **Recording**: MediaRecorder API, WebRTC
- **Styling**: Custom CSS with responsive design
- **Analytics**: Firebase Analytics with custom event tracking
- **Testing**: Jest, React Testing Library

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with enabled services:
  - Authentication (Anonymous)
  - Firestore Database
  - Cloud Storage
  - Cloud Functions
  - Hosting

## 🔧 Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd "Story Recording Web App/view"

# Install dependencies
npm install

# Install Firebase Functions dependencies
cd ../functions
npm install
cd ../view
```

### 2. Environment Configuration

Create environment files with your Firebase configuration:

**`.env.development`**
```bash
REACT_APP_FIREBASE_API_KEY=your-dev-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-dev-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
REACT_APP_FIREBASE_APP_ID=your-dev-app-id
```

### 3. Firebase Setup

```bash
# Login to Firebase
firebase login

# Deploy Firebase rules and functions
firebase deploy --only firestore,storage,functions
```

## 🏃‍♂️ Development

```bash
# Start development server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Run linting
npm run lint
```

**Coverage Targets**: 70% for branches, functions, lines, and statements

## 🚀 Deployment

### Quick Deployment

```bash
# Deploy everything (tests + build + deploy)
npm run deploy:full

# Deploy only hosting
npm run deploy:hosting
```

### Manual Deployment Scripts

**Linux/macOS:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows:**
```cmd
scripts\deploy.bat
```

## 📱 Usage

### Recording Flow

1. **Access**: User opens `/record/{sessionId}` URL
2. **Validation**: App validates session and displays question
3. **Mode Selection**: User chooses audio or video recording
4. **Recording**: App handles permissions and records content
5. **Review**: User can play back and confirm recording
6. **Upload**: Secure upload to Firebase Storage
7. **Success**: Confirmation screen with confetti animation

## 🔧 Configuration

### Recording Settings

- **Max Duration**: 15 minutes (900 seconds)
- **Video Quality**: 720p (1280x720)
- **Audio Quality**: 44.1kHz with noise suppression
- **File Size Limit**: 50MB

### Browser Support

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 14+
- **Edge**: 80+

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm start` | Development server |
| `npm test` | Interactive test runner |
| `npm run test:coverage` | Tests with coverage |
| `npm run build` | Production build |
| `npm run deploy:full` | Test, build, and deploy |
| `npm run lint` | Run ESLint |

## 🏗️ Architecture

```
src/
├── components/          # React components
├── services/           # Business logic
├── utils/              # Utilities
└── styles/            # CSS styles
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is proprietary software for Love Retold.
