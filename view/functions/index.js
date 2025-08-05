/**
 * Love Retold Recording App - Cloud Functions
 * Handles session validation, file processing, and analytics
 */

const {onRequest} = require("firebase-functions/v2/https");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

/**
 * Get Recording Session - Validates session and returns question data
 * Called by recording app to validate URL and get session details
 */
exports.getRecordingSession = onRequest({
  cors: true,
  region: "us-central1",
}, async (request, response) => {
  try {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      response.set("Access-Control-Allow-Origin", "*");
      response.set("Access-Control-Allow-Methods", "GET, POST");
      response.set("Access-Control-Allow-Headers", "Content-Type");
      response.status(204).send("");
      return;
    }

    response.set("Access-Control-Allow-Origin", "*");

    const {sessionId} = request.body.data || request.query;

    if (!sessionId) {
      response.status(400).json({
        error: "Session ID is required",
      });
      return;
    }

    logger.info("Getting recording session", {sessionId});

    // Get session document
    const sessionDoc = await db.collection("recordingSessions").doc(sessionId).get();

    if (!sessionDoc.exists) {
      response.json({
        data: {
          status: "removed",
          message: "This question has been removed by the account owner",
        },
      });
      return;
    }

    const session = sessionDoc.data();

    // Check if expired
    const now = new Date();
    const expiresAt = session.expiresAt?.toDate();
    if (expiresAt && now > expiresAt) {
      response.json({
        data: {
          status: "expired",
          message: "This recording link has expired",
        },
      });
      return;
    }

    // Check if already completed
    if (session.status === "completed") {
      response.json({
        data: {
          status: "completed",
          message: "This memory has been recorded",
        },
      });
      return;
    }

    // Return active session data
    response.json({
      data: {
        status: "active",
        question: session.question,
        sessionId: sessionId,
        promptId: session.promptId,
        asker: session.asker || "Someone",
      },
    });
  } catch (error) {
    logger.error("Error getting recording session", error);
    response.status(500).json({
      error: "Failed to get recording session",
    });
  }
});

/**
 * Process Recording Upload - Triggered when file is uploaded to Storage
 * Handles file processing and session completion
 */
exports.processRecordingUpload = onObjectFinalized({
  region: "us-central1",
}, async (event) => {
  try {
    const filePath = event.data.name;
    const bucket = event.data.bucket;

    // Only process files in recordings folder
    if (!filePath.startsWith("recordings/")) {
      logger.info("Ignoring non-recording file", {filePath});
      return;
    }

    logger.info("Processing recording upload", {filePath, bucket});

    // Extract session ID from file path: recordings/{sessionId}/{filename}
    const pathParts = filePath.split("/");
    if (pathParts.length < 3) {
      logger.error("Invalid file path structure", {filePath});
      return;
    }

    const sessionId = pathParts[1];
    const filename = pathParts[2];

    // Get session document
    const sessionDoc = await db.collection("recordingSessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      logger.error("Session not found", {sessionId});
      return;
    }

    const session = sessionDoc.data();

    // Extract recording type from filename
    const recordingType = filename.includes(".webm") ?
      (filename.includes("video") ? "video" : "audio") :
      "audio";

    // Get file metadata
    const file = storage.bucket(bucket).file(filePath);
    const [metadata] = await file.getMetadata();
    const fileSize = parseInt(metadata.size) || 0;

    // Update session with completion data
    await db.collection("recordingSessions").doc(sessionId).update({
      status: "completed",
      recordingUrl: `gs://${bucket}/${filePath}`,
      recordingType: recordingType,
      completedAt: new Date(),
      fileSize: fileSize,
      duration: 0, // Could be extracted from file metadata if needed
    });

    // Record analytics
    await db.collection("analytics").add({
      sessionId: sessionId,
      eventType: "upload_completed",
      timestamp: new Date(),
      fileSize: fileSize,
      recordingType: recordingType,
      processingDuration: 0,
    });

    logger.info("Recording processing completed", {
      sessionId,
      recordingType,
      fileSize,
    });

    // TODO: Future integration point - notify main Love Retold app
    // This is where we would trigger integration with the main platform
    // For now, we just log the completion

  } catch (error) {
    logger.error("Error processing recording upload", error);
    // Don't throw - we don't want to retry file processing on error
  }
});

/**
 * Cleanup Expired Sessions - Scheduled function to clean up old sessions
 * Runs daily at 2 AM to mark expired sessions and clean up orphaned files
 */
exports.cleanupExpiredSessions = onSchedule({
  schedule: "0 2 * * *", // Daily at 2 AM
  timeZone: "America/New_York",
  region: "us-central1",
}, async (event) => {
  try {
    logger.info("Starting cleanup of expired sessions");

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

    // Find expired sessions
    const expiredSessionsQuery = await db.collection("recordingSessions")
        .where("expiresAt", "<=", now)
        .where("status", "==", "active")
        .get();

    const batch = db.batch();
    let expiredCount = 0;

    expiredSessionsQuery.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        expiredAt: now,
      });
      expiredCount++;
    });

    // Find very old completed sessions to archive
    const oldCompletedQuery = await db.collection("recordingSessions")
        .where("completedAt", "<=", cutoffDate)
        .where("status", "==", "completed")
        .limit(100) // Process in batches
        .get();

    let archivedCount = 0;

    oldCompletedQuery.forEach((doc) => {
      batch.update(doc.ref, {
        status: "archived",
        archivedAt: now,
      });
      archivedCount++;
    });

    if (expiredCount > 0 || archivedCount > 0) {
      await batch.commit();
    }

    // Record cleanup analytics
    await db.collection("analytics").add({
      eventType: "cleanup_completed",
      timestamp: now,
      expiredSessions: expiredCount,
      archivedSessions: archivedCount,
    });

    logger.info("Cleanup completed", {
      expiredSessions: expiredCount,
      archivedSessions: archivedCount,
    });

  } catch (error) {
    logger.error("Error during cleanup", error);
  }
});

/**
 * Create Recording Session - For future integration with main Love Retold app
 * This function will be called by the main app to create new recording sessions
 */
exports.createRecordingSession = onRequest({
  cors: true,
  region: "us-central1",
}, async (request, response) => {
  try {
    response.set("Access-Control-Allow-Origin", "*");

    // TODO: Add authentication check here when integrating with main app
    
    const {question, userId, asker, promptId} = request.body.data || request.body;

    if (!question || !userId) {
      response.status(400).json({
        error: "Question and user ID are required",
      });
      return;
    }

    // Generate unique session ID
    const sessionId = db.collection("recordingSessions").doc().id;

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session document
    const sessionData = {
      sessionId: sessionId,
      promptId: promptId || null,
      userId: userId,
      question: question,
      asker: asker || "Someone",
      status: "active",
      createdAt: new Date(),
      expiresAt: expiresAt,
      recordingUrl: null,
      recordingType: null,
      completedAt: null,
    };

    await db.collection("recordingSessions").doc(sessionId).set(sessionData);

    // Generate the recording URL
    const recordingUrl = `${request.get("origin") || "https://loveretoldpoc.web.app"}/record/${sessionId}`;

    logger.info("Recording session created", {sessionId, userId});

    response.json({
      data: {
        sessionId: sessionId,
        recordingUrl: recordingUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error("Error creating recording session", error);
    response.status(500).json({
      error: "Failed to create recording session",
    });
  }
});

/**
 * Get Analytics Data - Simple analytics endpoint for monitoring
 * Returns basic usage statistics
 */
exports.getAnalytics = onRequest({
  cors: true,
  region: "us-central1",
}, async (request, response) => {
  try {
    response.set("Access-Control-Allow-Origin", "*");

    // TODO: Add admin authentication here

    const {startDate, endDate} = request.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const end = endDate ? new Date(endDate) : new Date();

    // Get analytics data
    const analyticsQuery = await db.collection("analytics")
        .where("timestamp", ">=", start)
        .where("timestamp", "<=", end)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();

    const events = [];
    const eventCounts = {};

    analyticsQuery.forEach((doc) => {
      const data = doc.data();
      events.push(data);
      eventCounts[data.eventType] = (eventCounts[data.eventType] || 0) + 1;
    });

    // Get session statistics
    const sessionsQuery = await db.collection("recordingSessions")
        .where("createdAt", ">=", start)
        .where("createdAt", "<=", end)
        .get();

    const sessionStats = {
      total: 0,
      active: 0,
      completed: 0,
      expired: 0,
    };

    sessionsQuery.forEach((doc) => {
      const data = doc.data();
      sessionStats.total++;
      sessionStats[data.status] = (sessionStats[data.status] || 0) + 1;
    });

    response.json({
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        sessions: sessionStats,
        events: eventCounts,
        totalEvents: events.length,
      },
    });

  } catch (error) {
    logger.error("Error getting analytics", error);
    response.status(500).json({
      error: "Failed to get analytics data",
    });
  }
});