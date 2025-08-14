// ----------------------------------------------------------
// AdminPage.jsx
// ----------------------------------------------------------
/**
 * AdminPage.jsx
 * -------------
 * Allows an admin user to filter and view recordings
 * by date and media type. Fetches metadata from Firestore
 * via the firebaseRecordingService. Displays a QR code to 
 * open each recording. Now sorts the filtered results in
 * descending time order so the newest recording is on top.
 */

import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { COLORS, LAYOUT } from '../constants/recording';

// Import local storage service layer
import { fetchAllRecordings } from '../services/localRecordingService';

function AdminPage() {
  const [selectedDate, setSelectedDate] = useState('');
  const [mediaType, setMediaType] = useState('audio');
  const [allRecordings, setAllRecordings] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  // On mount, fetch all docs from "recordings"
  useEffect(() => {
    async function loadRecordings() {
      try {
        const results = await fetchAllRecordings();
        setAllRecordings(results);
      } catch (err) {
        console.error('Error fetching recordings:', err);
      }
    }
    loadRecordings();
  }, []);

  // Helper to get a numeric timestamp from either createdAt or fileName
  function getTimestamp(rec) {
    if (rec.createdAt?.toDate) {
      // Firestore's createdAt
      return rec.createdAt.toDate().getTime(); 
    } else if (rec.fileName) {
      // Parse from fileName, e.g. "2025-01-26_145210_audio.webm"
      // We'll convert "2025-01-26_145210" into a Date if possible.
      const [datePart, timePart] = rec.fileName.split('_'); 
      // datePart => "2025-01-26"
      // timePart => "145210"
      const [yr, mo, dy] = datePart.split('-');
      const year = parseInt(yr, 10);
      const month = parseInt(mo, 10) - 1; // zero-based
      const day = parseInt(dy, 10);

      if (timePart?.length >= 6) {
        const hh = parseInt(timePart.slice(0, 2), 10);
        const mm = parseInt(timePart.slice(2, 4), 10);
        const ss = parseInt(timePart.slice(4, 6), 10);
        const maybeDate = new Date(year, month, day, hh, mm, ss);
        return maybeDate.getTime();
      } else {
        // If we can't parse properly, default to 0
        return 0;
      }
    }
    // If neither field is available, default to 0
    return 0;
  }

  // Handle user clicking Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedDate) {
      alert('Please select a date.');
      return;
    }

    // e.g. "2025-01-26"
    const [, monthStr, dayStr] = selectedDate.split('-');
    const dayNum = parseInt(dayStr, 10);
    const monthNum = parseInt(monthStr, 10);

    // Filter local array
    const results = allRecordings.filter((rec) => {
      // Check media type
      if (rec.fileType !== mediaType) return false;

      // Extract dd/mm from createdAt or fileName
      let d, m;
      if (rec.createdAt?.toDate) {
        const dt = rec.createdAt.toDate();
        d = dt.getDate();      // 1..31
        m = dt.getMonth() + 1; // 1..12
      } else if (rec.fileName) {
        // e.g. "2025-01-26_145210_audio.webm"
        const fileParts = rec.fileName.split('_');
        const datePart = fileParts[0].split('-'); 
        // datePart => ["2025","01","26"]
        d = parseInt(datePart[2], 10);
        m = parseInt(datePart[1], 10);
      } else {
        return false;
      }

      return (d === dayNum && m === monthNum);
    });

    // NEW: Sort results in descending order by time
    results.sort((a, b) => {
      const aTime = getTimestamp(a);
      const bTime = getTimestamp(b);
      // "bTime - aTime" => newest first
      return bTime - aTime;
    });

    setFilteredResults(results);
  };

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <div
        className="main-layout-container"
        style={{
          backgroundColor: COLORS.PRIMARY_LIGHT,
          maxWidth: LAYOUT.MAX_WIDTH,
          margin: '0 auto',
          padding: '20px'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Admin - Filter Recordings
        </h2>

        {/* Filter Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: LAYOUT.MARGIN_TOP_SMALL }}>
          <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '6px' }}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                fontSize: '1rem',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '20px' }}>Media Type:</label>
            <label style={{ marginRight: '16px' }}>
              <input
                type="radio"
                name="mediaType"
                value="audio"
                checked={mediaType === 'audio'}
                onChange={() => setMediaType('audio')}
              />
              Audio
            </label>
            <label>
              <input
                type="radio"
                name="mediaType"
                value="video"
                checked={mediaType === 'video'}
                onChange={() => setMediaType('video')}
              />
              Video
            </label>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: COLORS.PRIMARY_DARK,
              color: COLORS.PRIMARY_LIGHT,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              padding: '8px 14px',
              cursor: 'pointer'
            }}
          >
            Submit
          </button>
        </form>

        {/* Results */}
        <div style={{ marginTop: LAYOUT.MARGIN_TOP_MEDIUM }}>
          {filteredResults.map((rec) => {
            // Extract dd/mm, hh:mm for display
            let dd = '--', mm = '--';
            let HH = '--', Min = '--';

            if (rec.createdAt?.toDate) {
              const dt = rec.createdAt.toDate();
              dd = String(dt.getDate()).padStart(2, '0');
              mm = String(dt.getMonth() + 1).padStart(2, '0');
              HH = String(dt.getHours()).padStart(2, '0');
              Min = String(dt.getMinutes()).padStart(2, '0');
            } else if (rec.fileName) {
              const [datePart, timePart] = rec.fileName.split('_');
              const [, mo, dy] = datePart.split('-');
              dd = dy;
              mm = mo;
              if (timePart?.length >= 6) {
                HH = timePart.slice(0, 2);
                Min = timePart.slice(2, 4);
              }
            }

            const docUrl = `${window.location.origin}/view/${rec.id}`;

            return (
              <div
                key={rec.id}
                style={{
                  border: '1px solid #ccc',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>Date:</strong> {dd}/{mm}
                  <span style={{ marginLeft: '12px' }}>
                    <strong>Time:</strong> {HH}:{Min}
                  </span>
                </div>

                {/* QR code => link to /view/:docId */}
                <div style={{ marginBottom: '8px' }}>
                  <QRCodeCanvas value={docUrl} size={LAYOUT.QR_CODE_SIZE} includeMargin />
                </div>

                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline', color: '#333' }}
                >
                  Open Recording
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
