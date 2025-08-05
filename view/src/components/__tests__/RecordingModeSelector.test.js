import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecordingModeSelector from '../RecordingModeSelector';

describe('RecordingModeSelector', () => {
  const defaultProps = {
    question: 'What is your favorite memory?',
    asker: 'John Doe',
    onModeSelected: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders question and asker correctly', () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    expect(screen.getByText('John Doe asked')).toBeInTheDocument();
    expect(screen.getByText('What is your favorite memory?')).toBeInTheDocument();
  });

  test('renders recording mode options', () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Choose your recording mode')).toBeInTheDocument();
  });

  test('video mode is selected by default', () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    const videoButton = screen.getByRole('button', { name: /video/i });
    expect(videoButton).toHaveClass('selected');
  });

  test('calls onModeSelected when audio mode is clicked', async () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    const audioButton = screen.getByRole('button', { name: /audio/i });
    fireEvent.click(audioButton);
    
    await waitFor(() => {
      expect(defaultProps.onModeSelected).toHaveBeenCalledWith('audio');
    });
  });

  test('calls onModeSelected when video mode is clicked', async () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    const videoButton = screen.getByRole('button', { name: /video/i });
    fireEvent.click(videoButton);
    
    await waitFor(() => {
      expect(defaultProps.onModeSelected).toHaveBeenCalledWith('video');
    });
  });

  test('shows loading state after mode selection', async () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    const audioButton = screen.getByRole('button', { name: /audio/i });
    fireEvent.click(audioButton);
    
    expect(screen.getByText('Initializing audio recording...')).toBeInTheDocument();
  });

  test('displays mode information text', () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    expect(screen.getByText(/Audio.*Voice recording with real-time visualization/)).toBeInTheDocument();
    expect(screen.getByText(/Video.*Camera and microphone recording \(720p\)/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum recording time: 15 minutes/)).toBeInTheDocument();
  });

  test('buttons are disabled during loading', async () => {
    render(<RecordingModeSelector {...defaultProps} />);
    
    const audioButton = screen.getByRole('button', { name: /audio/i });
    const videoButton = screen.getByRole('button', { name: /video/i });
    
    fireEvent.click(audioButton);
    
    expect(audioButton).toBeDisabled();
    expect(videoButton).toBeDisabled();
  });
});