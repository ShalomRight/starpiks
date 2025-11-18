
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import FrameSelection from './components/FrameSelection';
import CameraPage from './components/CameraPage';
import { type Frame } from './types';

export default function App() {
  const [page, setPage] = useState<'landing' | 'frames' | 'camera'>('landing');
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);

  const handleSelectFrame = (frame: Frame) => {
    setSelectedFrame(frame);
    setPage('camera');
  };

  return (
    <>
      {page === 'landing' && <LandingPage onStart={() => setPage('frames')} />}
      {page === 'frames' && (
        <FrameSelection 
          onSelectFrame={handleSelectFrame}
          onBack={() => setPage('landing')}
        />
      )}
      {page === 'camera' && selectedFrame && (
        <CameraPage
          selectedFrame={selectedFrame}
          onBack={() => setPage('frames')}
        />
      )}
    </>
  );
}
