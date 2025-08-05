import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecordingApp from '../RecordingApp';

// Mock Firebase services
jest.mock('../../services/firebase', () => ({
  getRecordingSession: jest.fn(),
  recordAnalyticsEvent: jest.fn()
}));

// Mock child components
jest.mock('../SessionValidator', () => {
  return function MockSessionValidator() {
    return <div data-testid="session-validator">Session Validator</div>;
  };
});

jest.mock('../RecordingModeSelector', () => {
  return function MockRecordingModeSelector() {
    return <div data-testid="mode-selector">Mode Selector</div>;
  };
});

jest.mock('../RecordingInterface', () => {
  return function MockRecordingInterface() {
    return <div data-testid="recording-interface">Recording Interface</div>;
  };
});

jest.mock('../ConfettiSuccess', () => {
  return function MockConfettiSuccess() {
    return <div data-testid="confetti-success">Success</div>;
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RecordingApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    renderWithRouter(<RecordingApp />);
    expect(screen.getByText('Loading your recording session...')).toBeInTheDocument();
  });

  test('shows session error for invalid session ID', async () => {
    const { getRecordingSession } = require('../../services/firebase');
    getRecordingSession.mockRejectedValue(new Error('Session not found'));

    renderWithRouter(<RecordingApp />);

    await waitFor(() => {
      expect(screen.getByTestId('session-validator')).toBeInTheDocument();
    });
  });

  test('shows mode selection for valid session', async () => {
    const { getRecordingSession } = require('../../services/firebase');
    getRecordingSession.mockResolvedValue({
      status: 'active',
      question: 'Test question',
      asker: 'Test asker'
    });

    renderWithRouter(<RecordingApp />);

    await waitFor(() => {
      expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    });
  });

  test('tracks analytics on session start', async () => {
    const { getRecordingSession, recordAnalyticsEvent } = require('../../services/firebase');
    getRecordingSession.mockResolvedValue({
      status: 'active',
      question: 'Test question',
      asker: 'Test asker'
    });

    renderWithRouter(<RecordingApp />);

    await waitFor(() => {
      expect(recordAnalyticsEvent).toHaveBeenCalledWith(
        undefined, // sessionId will be undefined in test
        'session_start',
        expect.objectContaining({
          url: expect.any(String),
          referrer: expect.any(String)
        })
      );
    });
  });
});