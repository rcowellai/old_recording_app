# Love Retold: Recording Integration - Complete Implementation Guide

## Table of Contents
1. [Product Requirements Document (PRD)](#product-requirements-document-prd)
2. [Technical Architecture](#technical-architecture)
3. [Firebase Setup Guide](#firebase-setup-guide)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Development Tasks](#development-tasks)
6. [Testing Strategy](#testing-strategy)
7. [Launch Checklist](#launch-checklist)

---

## Product Requirements Document (PRD)

### Executive Summary
Transform Love Retold from a prompt management system into a complete memory recording platform by integrating with a dedicated recording web app and cloud backend infrastructure.

### Product Vision
Enable users to seamlessly record voice and video responses to memory prompts, automatically transcribe them, and organize them in a personal story library.

### User Stories

#### Primary User Flow
1. **As a user**, I want to click "Record Now" on a prompt and be taken to a recording interface
2. **As a user**, I want to record audio or video responses using my device's native capabilities
3. **As a user**, I want my recordings automatically transcribed and saved to my account
4. **As a user**, I want completed recordings to appear in a "My Stories" section
5. **As a user**, I want prompts to be automatically removed once recorded

#### Email Integration Flow
1. **As a user**, I want to receive email notifications with recording links when prompts are scheduled
2. **As a user**, I want to click email links and record directly without logging in
3. **As a user**, I want the system to prevent duplicate recordings from the same prompt

#### Security & Access Control
1. **As a user**, I want my recordings to be private and secure
2. **As a user**, I want expired or completed recording links to show appropriate messages
3. **As a user**, I want deleted prompts to show "removed by account owner" messages

### Success Metrics
- Recording completion rate: >70%
- Email click-through rate: >40% 
- User retention after first recording: >60%
- Recording-to-story conversion rate: 100%

---

## Technical Architecture

### System Overview

```
[Love Retold App] ←→ [Firebase Backend] ←→ [Recording App]
                           ↓
                    [External Services]
                    - OpenAI Whisper
                    - Email Service
                    - File Storage
```

### Component Architecture

#### 1. Love Retold (Frontend Updates)
- **Technology**: Existing React/Vue framework
- **New Features**:
  - "Record Now" button integration
  - "My Stories" page
  - Prompt status management
  - Firebase SDK integration

#### 2. Recording App (New Frontend)
- **Technology**: React + Firebase SDK
- **Purpose**: Lightweight recording interface
- **Core Features**:
  - URL-based session validation
  - Device media access (audio/video)
  - File upload to Firebase Storage
  - Recording status feedback

#### 3. Firebase Backend (New Infrastructure)
- **Services Used**:
  - Firestore (database)
  - Cloud Functions (serverless backend)
  - Cloud Storage (file storage)
  - Authentication (user management)
  - Cloud Scheduler (email automation)

#### 4. External Integrations
- **OpenAI Whisper API**: Speech-to-text transcription
- **SendGrid/EmailJS**: Email delivery service
- **Firebase Hosting**: Recording app deployment

---

## Firebase Setup Guide

### Prerequisites
- Google account
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 16+ installed

### Step 1: Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: "love-retold-backend"
4. Enable Google Analytics (recommended)
5. Select your Google Analytics account

### Step 2: Enable Required Services

#### Firestore Database
1. Navigate to "Firestore Database"
2. Click "Create database"
3. Start in "test mode" (we'll secure later)
4. Choose location closest to your users

#### Cloud Storage
1. Navigate to "Storage"
2. Click "Get started"
3. Start in "test mode"
4. Use default bucket location

#### Authentication
1. Navigate to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Enable "Anonymous" provider (for email-link access)

#### Cloud Functions
1. Enable "Cloud Functions API" in Google Cloud Console
2. Upgrade to "Blaze" plan (pay-as-you-go, required for external API calls)

### Step 3: Configure Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prompts are user-specific
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Stories are user-specific
    match /stories/{storyId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Recording sessions need special handling for anonymous access
    match /recordingSessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /recordings/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 4: Environment Configuration

Create `.env` files for both applications:

#### Love Retold `.env`
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=love-retold-backend.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=love-retold-backend
VITE_FIREBASE_STORAGE_BUCKET=love-retold-backend.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RECORDING_APP_URL=https://record-love-retold.web.app
```

#### Recording App `.env`
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=love-retold-backend.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=love-retold-backend
REACT_APP_FIREBASE_STORAGE_BUCKET=love-retold-backend.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_OPENAI_API_KEY=your_openai_key
```

---

## Implementation Roadmap

### Phase 1: Backend Infrastructure (Week 1-2) - **FIREBASE ONLY**
All work in this phase happens in the Firebase Console and Cloud Functions development environment.

#### Database Schema Implementation - **FIREBASE FIRESTORE**
Create these collections and documents directly in Firebase Firestore:
```javascript
// Firestore Collections Structure

// Collection: users
{
  userId: "auto-generated-id",
  email: "user@example.com",
  preferences: {
    emailNotifications: true,
    timezone: "America/New_York"
  },
  createdAt: "2024-01-01T00:00:00Z"
}

// Collection: prompts
{
  promptId: "auto-generated-id", 
  userId: "user-id-reference",
  question: "Tell me about your childhood home",
  uniqueUrl: "https://record-app.com/record/abc123",
  sessionId: "abc123",
  status: "waiting" | "sent" | "completed",
  scheduledDate: "2024-01-15T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  sentAt: null,
  completedAt: null
}

// Collection: recordingSessions  
{
  sessionId: "abc123",
  promptId: "prompt-id-reference",
  userId: "user-id-reference", 
  status: "active" | "completed" | "expired",
  createdAt: "2024-01-01T00:00:00Z",
  expiresAt: "2024-01-08T00:00:00Z" // 7 days from creation
}

// Collection: stories
{
  storyId: "auto-generated-id",
  userId: "user-id-reference",
  originalPromptId: "prompt-id-reference", 
  question: "Tell me about your childhood home",
  audioUrl: "gs://bucket/recordings/userId/audio.wav",
  videoUrl: "gs://bucket/recordings/userId/video.mp4", // optional
  transcript: "When I was young, our house...",
  duration: 120, // seconds
  recordedAt: "2024-01-15T12:30:00Z",
  createdAt: "2024-01-15T12:35:00Z" // when processing completed
}
```

#### Cloud Functions Implementation - **FIREBASE CLOUD FUNCTIONS**
Develop and deploy these serverless functions in Firebase:

**Function 1: Create Prompt** - **FIREBASE CLOUD FUNCTION**
Develop in `/functions` folder of Firebase project:
```javascript
// functions/src/createPrompt.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

exports.createPrompt = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { question, scheduledDate } = data;
  const userId = context.auth.uid;
  const sessionId = uuidv4();
  
  // Create prompt document
  const promptRef = admin.firestore().collection('prompts').doc();
  const recordingSessionRef = admin.firestore().collection('recordingSessions').doc(sessionId);
  
  const uniqueUrl = `${process.env.RECORDING_APP_URL}/record/${sessionId}`;
  
  const batch = admin.firestore().batch();
  
  batch.set(promptRef, {
    userId,
    question,
    uniqueUrl,
    sessionId,
    status: 'waiting',
    scheduledDate: new Date(scheduledDate),
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  batch.set(recordingSessionRef, {
    promptId: promptRef.id,
    userId,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  await batch.commit();
  
  return { promptId: promptRef.id, uniqueUrl };
});
```

**Function 2: Get Recording Session** - **FIREBASE CLOUD FUNCTION**
Develop in `/functions` folder of Firebase project:
```javascript
// functions/src/getRecordingSession.js
exports.getRecordingSession = functions.https.onCall(async (data, context) => {
  const { sessionId } = data;
  
  const sessionDoc = await admin.firestore()
    .collection('recordingSessions')
    .doc(sessionId)
    .get();
    
  if (!sessionDoc.exists) {
    return { status: 'removed', message: 'This question has been removed by the account owner' };
  }
  
  const session = sessionDoc.data();
  
  // Check if expired
  if (new Date() > session.expiresAt.toDate()) {
    return { status: 'expired', message: 'This recording link has expired' };
  }
  
  // Check if already completed
  if (session.status === 'completed') {
    return { status: 'completed', message: 'This memory has been recorded' };
  }
  
  // Get the prompt details
  const promptDoc = await admin.firestore()
    .collection('prompts')
    .doc(session.promptId)
    .get();
    
  if (!promptDoc.exists) {
    return { status: 'removed', message: 'This question has been removed by the account owner' };
  }
  
  const prompt = promptDoc.data();
  
  return {
    status: 'active',
    question: prompt.question,
    sessionId: sessionId,
    promptId: session.promptId
  };
});
```

**Function 3: Process Recording Upload** - **FIREBASE CLOUD FUNCTION**
Develop in `/functions` folder of Firebase project:
```javascript
// functions/src/processRecording.js
const { Storage } = require('@google-cloud/storage');
const OpenAI = require('openai');

exports.processRecording = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  
  // Only process files in recordings folder
  if (!filePath.startsWith('recordings/')) return;
  
  const pathParts = filePath.split('/');
  const userId = pathParts[1];
  const sessionId = pathParts[2].split('_')[0]; // Extract session ID from filename
  
  try {
    // Get session details
    const sessionDoc = await admin.firestore()
      .collection('recordingSessions')
      .doc(sessionId)
      .get();
      
    if (!sessionDoc.exists) return;
    
    const session = sessionDoc.data();
    
    // Get prompt details
    const promptDoc = await admin.firestore()
      .collection('prompts')
      .doc(session.promptId)
      .get();
      
    const prompt = promptDoc.data();
    
    // Download file for transcription
    const storage = new Storage();
    const bucket = storage.bucket(object.bucket);
    const file = bucket.file(filePath);
    
    // Generate transcript using OpenAI Whisper
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const transcription = await openai.audio.transcriptions.create({
      file: await file.download(),
      model: 'whisper-1'
    });
    
    // Create story document
    const storyRef = admin.firestore().collection('stories').doc();
    await storyRef.set({
      userId,
      originalPromptId: session.promptId,
      question: prompt.question,
      audioUrl: `gs://${object.bucket}/${filePath}`,
      videoUrl: null, // Will be updated if video exists
      transcript: transcription.text,
      duration: object.metadata?.duration || 0,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update prompt status to completed
    await admin.firestore().collection('prompts').doc(session.promptId).update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update session status
    await admin.firestore().collection('recordingSessions').doc(sessionId).update({
      status: 'completed'
    });
    
  } catch (error) {
    console.error('Error processing recording:', error);
    throw error;
  }
});
```

**Function 4: Send Scheduled Emails** - **FIREBASE CLOUD FUNCTION**
Develop in `/functions` folder of Firebase project:
```javascript
// functions/src/sendScheduledEmails.js
const sgMail = require('@sendgrid/mail');

exports.sendScheduledEmails = functions.pubsub.schedule('0 9 * * *') // Daily at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find prompts scheduled for today
    const promptsSnapshot = await admin.firestore()
      .collection('prompts')
      .where('scheduledDate', '>=', today)
      .where('scheduledDate', '<', tomorrow)
      .where('status', '==', 'waiting')
      .get();
    
    const emailPromises = [];
    
    for (const doc of promptsSnapshot.docs) {
      const prompt = doc.data();
      
      // Get user details
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(prompt.userId)
        .get();
        
      const user = userDoc.data();
      
      if (user.preferences?.emailNotifications) {
        const msg = {
          to: user.email,
          from: 'memories@loveretold.com',
          subject: 'Time to record a new memory',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>It's time to record a new memory!</h2>
              <p>Today's prompt:</p>
              <blockquote style="font-style: italic; border-left: 3px solid #ccc; padding-left: 20px;">
                "${prompt.question}"
              </blockquote>
              <a href="${prompt.uniqueUrl}" 
                 style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
                Record Your Memory
              </a>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                This link will be active for 7 days. Your recording will be private and secure.
              </p>
            </div>
          `
        };
        
        emailPromises.push(sgMail.send(msg));
      }
      
      // Update prompt status to sent
      await doc.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await Promise.all(emailPromises);
    console.log(`Sent ${emailPromises.length} scheduled emails`);
});
```

### Phase 2: Recording App Development (Week 2-3) - **NEW REACT APP**
Build a completely new React application separate from Love Retold.

## Recording App UX Flow & Data Requirements

### **How Information RECEIVES (Input)**
1. **URL Parameters**: `https://record-app.com/record/{sessionId}`
   - Extracts `sessionId` from URL path
   - No authentication required (anonymous access via unique URL)

2. **Firebase Cloud Function Call**: `getRecordingSession(sessionId)`
   - **Receives**: Session validation data
   - **Expected Response**:
     ```json
     {
       "status": "active" | "completed" | "expired" | "removed",
       "question": "Tell me about your childhood home",
       "sessionId": "abc123",
       "promptId": "prompt-id-reference",
       "message": "Error message if status not active"
     }
     ```

3. **Browser Media APIs**: `navigator.mediaDevices.getUserMedia()`
   - **Receives**: User permission for camera/microphone access
   - **Captures**: Raw audio/video stream from device

### **How Information TRANSMITS (Output)**
1. **File Upload to Firebase Storage**: `recordings/{sessionId}/{filename}`
   - **Transmits**: Binary blob (audio/video file)
   - **File Structure**:
     ```
     recordings/
     └── {sessionId}/
         ├── {sessionId}_{timestamp}.webm (video)
         └── {sessionId}_{timestamp}.wav (audio)
     ```

2. **Automatic Cloud Function Trigger**: File upload triggers `processRecording`
   - **Transmits**: File metadata and triggers backend processing
   - **Results in**: Story creation, prompt completion, transcript generation

### **Core Elements Required for Functionality**

#### **1. Session Management System**
```javascript
// Core functionality: Validate and manage recording sessions
const SessionManager = {
  validateSession: async (sessionId) => {
    // Call Firebase Function to check session status
    // Handle: active, completed, expired, removed states
  },
  
  getPromptData: async (sessionId) => {
    // Retrieve question text and session details
    // Return formatted data for UI display
  }
}
```

#### **2. Media Recording Engine**
```javascript
// Core functionality: Handle device media recording
const MediaRecorder = {
  requestPermissions: async (type) => {
    // Request camera/mic permissions
    // Handle permission denials gracefully
  },
  
  startRecording: (constraints) => {
    // Start media capture with specified constraints
    // Support both audio-only and video+audio
  },
  
  processRecordingData: (chunks) => {
    // Convert recorded chunks to blob
    // Handle different media formats (webm, etc.)
  }
}
```

#### **3. File Upload System**
```javascript
// Core functionality: Upload recordings to Firebase
const UploadManager = {
  uploadToFirebase: async (sessionId, blob, type) => {
    // Upload file to Firebase Storage
    // Include metadata (session, type, timestamp)
    // Handle upload progress and errors
  },
  
  generateFileName: (sessionId, type) => {
    // Create unique filename: {sessionId}_{timestamp}.{ext}
    // Prevent filename conflicts
  }
}
```

#### **4. State Management & UI Controller**
```javascript
// Core functionality: Manage app state and user interface
const AppController = {
  states: ['loading', 'ready', 'recording', 'preview', 'uploading', 'completed', 'error'],
  
  manageRecordingFlow: () => {
    // Control state transitions
    // Handle user interactions (start, stop, retry, upload)
    // Display appropriate UI for each state
  },
  
  handleErrors: (error) => {
    // Graceful error handling and user feedback
    // Retry mechanisms for failed operations
  }
}
```

### **Essential UX Components**

#### **1. Session Validation Screen**
- **Purpose**: Validate URL and display appropriate message
- **States**: Loading, Active Session, Expired, Completed, Removed
- **Data Requirements**: Session status, error messages

#### **2. Recording Interface**
- **Purpose**: Capture audio/video from user device
- **Elements**: 
  - Question display (large, readable)
  - Media type selector (audio/video toggle)
  - Recording controls (start/stop buttons)
  - Recording indicator (visual feedback)
  - Timer display (optional)

#### **3. Preview & Confirmation**
- **Purpose**: Let user review recording before submission
- **Elements**:
  - Playback controls (audio/video player)
  - Re-record option
  - Upload/save button
  - Duration display

#### **4. Upload Progress**
- **Purpose**: Show upload status and prevent page abandonment
- **Elements**:
  - Progress bar
  - Upload status text
  - Cancel option (if needed)

#### **5. Completion Confirmation**
- **Purpose**: Confirm successful recording and processing
- **Elements**:
  - Success message
  - Next steps (optional)
  - Link back to Love Retold (optional)

### **Critical Technical Requirements**

#### **1. Firebase Integration**
```javascript
// Required Firebase services and configuration
const firebaseConfig = {
  // Storage: For file uploads
  // Functions: For session validation and processing
  // Anonymous Auth: For secure file uploads
}
```

#### **2. Browser Compatibility**
- **MediaRecorder API**: Core recording functionality
- **getUserMedia**: Device access
- **File API**: Blob handling
- **Fetch API**: Firebase communication
- **ES6+ Support**: Modern JavaScript features

#### **3. Mobile Optimization**
- **Responsive Design**: Works on all device sizes
- **Touch Interactions**: Mobile-friendly controls
- **Camera Selection**: Front/back camera choice (video)
- **Orientation Handling**: Portrait/landscape support

#### **4. Error Recovery**
- **Network Failures**: Retry upload mechanisms
- **Permission Denials**: Clear instructions for user
- **Session Expiry**: Appropriate error messages
- **File Size Limits**: Validation and compression

#### Project Structure - **NEW RECORDING APP**
Create a new React project with this structure:
```
recording-app/
├── src/
│   ├── components/
│   │   ├── RecordingInterface.jsx
│   │   ├── UploadProgress.jsx
│   │   └── StatusMessages.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   └── recording.js
│   ├── hooks/
│   │   └── useRecording.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
└── vite.config.js
```

#### Core Components - **RECORDING APP COMPONENTS**
Develop these React components in the new Recording App:

**Recording Interface Component** - **RECORDING APP COMPONENT**
Create in the Recording App project:
```jsx
// src/components/RecordingInterface.jsx
import React, { useState, useRef } from 'react';
import { uploadRecording } from '../services/recording';

const RecordingInterface = ({ question, sessionId, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingType, setRecordingType] = useState('audio');
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const constraints = recordingType === 'video' 
        ? { video: true, audio: true }
        : { audio: true };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { 
          type: recordingType === 'video' ? 'video/webm' : 'audio/webm'
        });
        setRecordedBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAndComplete = async () => {
    if (!recordedBlob) return;
    
    setIsUploading(true);
    try {
      await uploadRecording(sessionId, recordedBlob, recordingType);
      onComplete();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="recording-interface">
      <div className="question-display">
        <h2>{question}</h2>
      </div>
      
      <div className="recording-type-selector">
        <label>
          <input
            type="radio"
            value="audio"
            checked={recordingType === 'audio'}
            onChange={(e) => setRecordingType(e.target.value)}
            disabled={isRecording || recordedBlob}
          />
          Audio Only
        </label>
        <label>
          <input
            type="radio"
            value="video"
            checked={recordingType === 'video'}
            onChange={(e) => setRecordingType(e.target.value)}
            disabled={isRecording || recordedBlob}
          />
          Video + Audio
        </label>
      </div>

      <div className="recording-controls">
        {!recordedBlob && (
          <>
            {!isRecording ? (
              <button onClick={startRecording} className="start-button">
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="stop-button">
                Stop Recording
              </button>
            )}
          </>
        )}
        
        {recordedBlob && (
          <div className="recording-preview">
            <h3>Recording Complete!</h3>
            {recordingType === 'video' ? (
              <video 
                controls 
                src={URL.createObjectURL(recordedBlob)}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            ) : (
              <audio 
                controls 
                src={URL.createObjectURL(recordedBlob)}
              />
            )}
            
            <div className="preview-actions">
              <button onClick={resetRecording} disabled={isUploading}>
                Record Again
              </button>
              <button 
                onClick={uploadAndComplete} 
                disabled={isUploading}
                className="upload-button"
              >
                {isUploading ? 'Uploading...' : 'Save Memory'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse"></div>
          Recording in progress...
        </div>
      )}
    </div>
  );
};

export default RecordingInterface;
```

**Recording Service** - **RECORDING APP SERVICE**
Create in the Recording App project:
```javascript
// src/services/recording.js
import { storage, functions } from './firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';

const getRecordingSession = httpsCallable(functions, 'getRecordingSession');

export const fetchRecordingSession = async (sessionId) => {
  try {
    const result = await getRecordingSession({ sessionId });
    return result.data;
  } catch (error) {
    console.error('Error fetching recording session:', error);
    throw error;
  }
};

export const uploadRecording = async (sessionId, blob, type) => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const extension = type === 'video' ? 'webm' : 'wav';
    const filename = `${sessionId}_${timestamp}.${extension}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `recordings/${sessionId}/${filename}`);
    
    const metadata = {
      contentType: blob.type,
      customMetadata: {
        sessionId: sessionId,
        recordingType: type,
        duration: '0' // Will be calculated server-side
      }
    };
    
    await uploadBytes(storageRef, blob, metadata);
    
    // The Cloud Function will automatically process this upload
    return { success: true, filename };
  } catch (error) {
    console.error('Error uploading recording:', error);
    throw error;
  }
};
```

**Main App Component** - **RECORDING APP MAIN**
Create in the Recording App project:
```jsx
// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import RecordingInterface from './components/RecordingInterface';
import StatusMessages from './components/StatusMessages';
import { fetchRecordingSession } from './services/recording';
import './App.css';

function App() {
  const { sessionId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await fetchRecordingSession(sessionId);
        setSessionData(data);
      } catch (error) {
        console.error('Error loading session:', error);
        setSessionData({ status: 'error', message: 'Failed to load recording session' });
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleRecordingComplete = () => {
    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="app-container">
        <StatusMessages 
          status="completed" 
          message="Your memory has been successfully recorded and saved!" 
        />
      </div>
    );
  }

  if (!sessionData || sessionData.status !== 'active') {
    return (
      <div className="app-container">
        <StatusMessages 
          status={sessionData?.status || 'error'} 
          message={sessionData?.message || 'Unknown error occurred'} 
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Love Retold</h1>
        <p>Record Your Memory</p>
      </header>
      
      <main className="app-main">
        <RecordingInterface 
          question={sessionData.question}
          sessionId={sessionId}
          onComplete={handleRecordingComplete}
        />
      </main>
    </div>
  );
}

export default App;
```

### Phase 3: Love Retold Integration (Week 3-4) - **LOVE RETOLD APP UPDATES**
Modify the existing Love Retold application to integrate with Firebase backend.

#### Firebase Integration Service - **LOVE RETOLD UPDATE**
Add this new service file to the existing Love Retold app:
```javascript
// src/services/firebase.js (Love Retold)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
```

#### Prompts Service Update - **LOVE RETOLD UPDATE**
Modify existing prompts service in Love Retold app:
```javascript
// src/services/prompts.js (Love Retold)
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from './firebase';

const createPromptFunction = httpsCallable(functions, 'createPrompt');

export const createPrompt = async (promptData) => {
  try {
    const result = await createPromptFunction(promptData);
    return result.data;
  } catch (error) {
    console.error('Error creating prompt:', error);
    throw error;
  }
};

export const subscribeToUserPrompts = (userId, callback) => {
  const q = query(
    collection(db, 'prompts'),
    where('userId', '==', userId),
    where('status', 'in', ['waiting', 'sent'])
  );
  
  return onSnapshot(q, (snapshot) => {
    const prompts = [];
    snapshot.forEach((doc) => {
      prompts.push({ id: doc.id, ...doc.data() });
    });
    callback(prompts);
  });
};

export const subscribeToUserStories = (userId, callback) => {
  const q = query(
    collection(db, 'stories'),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const stories = [];
    snapshot.forEach((doc) => {
      stories.push({ id: doc.id, ...doc.data() });
    });
    callback(stories);
  });
};

export const openRecordingInterface = (uniqueUrl) => {
  window.open(uniqueUrl, '_blank', 'noopener,noreferrer');
};
```

#### Updated Prompts Component - **LOVE RETOLD UPDATE**
Modify existing Prompts component in Love Retold app:
```jsx
// src/components/Prompts.jsx (Love Retold)
import React, { useState, useEffect } from 'react';
import { subscribeToUserPrompts, openRecordingInterface } from '../services/prompts';
import { useAuth } from '../contexts/AuthContext';

const Prompts = () => {
  const [prompts, setPrompts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserPrompts(user.uid, (updatedPrompts) => {
      setPrompts(updatedPrompts);
    });

    return unsubscribe;
  }, [user]);

  const handleRecordNow = (prompt) => {
    openRecordingInterface(prompt.uniqueUrl);
  };

  return (
    <div className="prompts-container">
      <h2>Your Prompts</h2>
      
      {prompts.length === 0 ? (
        <p>No prompts available. Create your first prompt!</p>
      ) : (
        <div className="prompts-list">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="prompt-card">
              <div className="prompt-content">
                <h3>{prompt.question}</h3>
                <p className="prompt-status">
                  Status: {prompt.status}
                  {prompt.scheduledDate && (
                    <span className="scheduled-date">
                      • Scheduled: {new Date(prompt.scheduledDate.toDate()).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="prompt-actions">
                <button 
                  onClick={() => handleRecordNow(prompt)}
                  className="record-now-btn"
                >
                  Record Now
                </button>
                
                <div className="dropdown-menu">
                  <button className="dropdown-trigger">⋮</button>
                  <div className="dropdown-content">
                    <button onClick={() => handleRecordNow(prompt)}>
                      Record Now
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(prompt.uniqueUrl)}>
                      Copy Link
                    </button>
                    <button onClick={() => shareViaEmail(prompt.uniqueUrl)}>
                      Share via Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const shareViaEmail = (url) => {
  const subject = 'Record your memory - Love Retold';
  const body = `Please record your memory using this link: ${url}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(emailUrl);
};

export default Prompts;
```

#### New Stories Component - **LOVE RETOLD NEW COMPONENT**
Create this new component in Love Retold app:
```jsx
// src/components/Stories.jsx (Love Retold)
import React, { useState, useEffect } from 'react';
import { subscribeToUserStories } from '../services/prompts';
import { useAuth } from '../contexts/AuthContext';

const Stories = () => {
  const [stories, setStories] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserStories(user.uid, (updatedStories) => {
      // Sort by most recent first
      const sorted = updatedStories.sort((a, b) => 
        new Date(b.recordedAt?.toDate()) - new Date(a.recordedAt?.toDate())
      );
      setStories(sorted);
    });

    return unsubscribe;
  }, [user]);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="stories-container">
      <h2>My Stories</h2>
      
      {stories.length === 0 ? (
        <div className="empty-state">
          <p>No stories recorded yet.</p>
          <p>Go to "Your Prompts" and click "Record Now" to create your first story!</p>
        </div>
      ) : (
        <div className="stories-list">
          {stories.map((story) => (
            <div key={story.id} className="story-card">
              <div className="story-header">
                <h3>{story.question}</h3>
                <span className="story-date">
                  {new Date(story.recordedAt?.toDate()).toLocaleDateString()}
                </span>
              </div>
              
              <div className="story-media">
                {story.videoUrl ? (
                  <video 
                    controls 
                    preload="metadata"
                    className="story-video"
                  >
                    <source src={story.videoUrl} type="video/webm" />
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <audio 
                    controls 
                    preload="metadata"
                    className="story-audio"
                  >
                    <source src={story.audioUrl} type="audio/webm" />
                    Your browser does not support audio playback.
                  </audio>
                )}
                
                <div className="media-info">
                  <span className="duration">
                    Duration: {formatDuration(story.duration || 0)}
                  </span>
                  <span className="type">
                    {story.videoUrl ? 'Video' : 'Audio'}
                  </span>
                </div>
              </div>
              
              <div className="story-transcript">
                <h4>Transcript</h4>
                <p>{story.transcript}</p>
              </div>
              
              <div className="story-actions">
                <button onClick={() => downloadStory(story)}>
                  Download
                </button>
                <button onClick={() => shareStory(story)}>
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const downloadStory = async (story) => {
  try {
    const response = await fetch(story.audioUrl || story.videoUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.question.substring(0, 30)}.${story.videoUrl ? 'webm' : 'wav'}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download failed:', error);
    alert('Download failed. Please try again.');
  }
};

const shareStory = (story) => {
  if (navigator.share) {
    navigator.share({
      title: 'My Memory',
      text: `"${story.question}" - ${story.transcript.substring(0, 100)}...`,
      url: story.audioUrl || story.videoUrl
    });
  } else {
    navigator.clipboard.writeText(story.audioUrl || story.videoUrl);
    alert('Story link copied to clipboard!');
  }
};

export default Stories;
```

---

## Development Tasks

### Sprint 1: Backend Foundation (5 days) - **ALL FIREBASE WORK**
1. **Day 1**: Firebase project setup and configuration - **FIREBASE CONSOLE**
2. **Day 2**: Implement Firestore schema and security rules - **FIREBASE CONSOLE**
3. **Day 3**: Develop createPrompt and getRecordingSession functions - **FIREBASE FUNCTIONS**
4. **Day 4**: Implement processRecording function with OpenAI integration - **FIREBASE FUNCTIONS**
5. **Day 5**: Create sendScheduledEmails function and test email delivery - **FIREBASE FUNCTIONS + EMAIL SERVICE**

### Sprint 2: Recording App (5 days) - **NEW REACT APP**
1. **Day 1**: Set up React project and Firebase SDK integration - **NEW RECORDING APP**
2. **Day 2**: Develop RecordingInterface component with media recording - **RECORDING APP COMPONENT**
3. **Day 3**: Implement file upload functionality and progress tracking - **RECORDING APP SERVICES**
4. **Day 4**: Create status message components and error handling - **RECORDING APP COMPONENTS**
5. **Day 5**: Style the app and test across different devices/browsers - **RECORDING APP CSS + TESTING**

### Sprint 3: Love Retold Integration (5 days) - **LOVE RETOLD UPDATES**
1. **Day 1**: Integrate Firebase SDK into existing Love Retold app - **LOVE RETOLD SERVICES**
2. **Day 2**: Update Prompts component with "Record Now" functionality - **LOVE RETOLD COMPONENT UPDATE**
3. **Day 3**: Create new Stories component for displaying recorded memories - **LOVE RETOLD NEW COMPONENT**
4. **Day 4**: Implement real-time updates and state management - **LOVE RETOLD STATE MANAGEMENT**
5. **Day 5**: Add sharing and download functionality - **LOVE RETOLD FEATURES**

### Sprint 4: Testing & Polish (5 days) - **ALL APPLICATIONS**
1. **Day 1**: End-to-end testing of complete user flow - **LOVE RETOLD + RECORDING APP + FIREBASE**
2. **Day 2**: Mobile responsiveness and cross-browser compatibility - **BOTH APPS**
3. **Day 3**: Performance optimization and error handling - **FIREBASE FUNCTIONS + BOTH APPS**
4. **Day 4**: Security testing and penetration testing - **FIREBASE SECURITY + BOTH APPS**
5. **Day 5**: User acceptance testing and bug fixes - **ALL SYSTEMS**

---

## Testing Strategy

### Unit Testing
```javascript
// Example test for createPrompt function
const { createPrompt } = require('../functions/src/createPrompt');
const admin = require('firebase-admin-testing');

describe('createPrompt', () => {
  test('should create prompt with unique URL', async () => {
    const mockContext = {
      auth: { uid: 'test-user-id' }
    };
    
    const mockData = {
      question: 'Test question?',
      scheduledDate: '2024-01-15T00:00:00Z'
    };
    
    const result = await createPrompt(mockData, mockContext);
    
    expect(result.promptId).toBeDefined();
    expect(result.uniqueUrl).toContain('/record/');
  });
});
```

### Integration Testing Checklist
- [ ] Prompt creation flow
- [ ] Email notification delivery
- [ ] Recording session validation
- [ ] File upload and processing
- [ ] Transcript generation
- [ ] Story creation and display
- [ ] Real-time updates
- [ ] Authentication and authorization
- [ ] Mobile device compatibility
- [ ] Error handling and recovery

### End-to-End Testing Scenarios
1. **Happy Path**: User creates prompt → receives email → records memory → views in stories
2. **Direct Access**: User clicks "Record Now" → records immediately → story appears
3. **Expired Link**: User accesses old URL → sees appropriate message
4. **Deleted Prompt**: User accesses URL for deleted prompt → sees removal message
5. **Mobile Recording**: User records on mobile device → upload succeeds → transcript accurate

---

## Launch Checklist

### Pre-Launch Requirements
- [ ] Firebase project configured with proper security rules
- [ ] Cloud Functions deployed and tested
- [ ] Recording App deployed to Firebase Hosting
- [ ] Love Retold updated with Firebase integration
- [ ] Email templates designed and tested
- [ ] OpenAI API integration working
- [ ] SSL certificates installed
- [ ] Domain names configured
- [ ] CDN setup for media files
- [ ] Database backup strategy implemented

### Security Checklist
- [ ] Firestore security rules tested
- [ ] Storage security rules tested
- [ ] Authentication working correctly
- [ ] API keys properly secured
- [ ] CORS policies configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] XSS protection implemented
- [ ] HTTPS enforced everywhere

### Performance Checklist
- [ ] Media files compressed appropriately
- [ ] CDN configured for global delivery
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] Lazy loading for large story lists
- [ ] Progressive web app features
- [ ] Offline capability for recording
- [ ] Auto-retry for failed uploads

### Monitoring & Analytics
- [ ] Firebase Analytics configured
- [ ] Error tracking (Sentry) setup
- [ ] Performance monitoring enabled
- [ ] User behavior tracking
- [ ] Cost monitoring alerts
- [ ] Uptime monitoring
- [ ] Security monitoring
- [ ] Usage analytics dashboard

### Documentation
- [ ] User onboarding guide
- [ ] Technical documentation
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] FAQ section created

---

## AI Development Prompts

To help with AI-assisted development, use these specific prompts:

### For Backend Development
```
"Implement a Firebase Cloud Function that [specific functionality] with proper error handling, authentication checks, and logging. Include input validation and return appropriate HTTP status codes."
```

### For Frontend Components
```
"Create a React component for [functionality] that uses Firebase hooks, includes loading states, error handling, and is mobile-responsive. Follow accessibility best practices."
```

### For Database Operations
```
"Write Firestore queries and security rules for [specific use case] that ensure data privacy, prevent unauthorized access, and optimize for read/write performance."
```

### For Testing
```
"Generate comprehensive tests for [component/function] including unit tests, integration tests, and edge case scenarios. Use Jest and Firebase testing utilities."
```

This document provides a complete roadmap for implementing the Love Retold recording integration. Each section is detailed enough for an AI assistant to help implement while being comprehensive enough for a non-technical user to understand the scope and requirements.