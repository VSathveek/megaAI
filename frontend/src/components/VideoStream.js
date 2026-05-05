import React from 'react';

function VideoStream({ videoRef, isConnected }) {
  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="video-frame"
        style={{ display: isConnected ? 'block' : 'none' }}
      />
      {!isConnected && (
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px', color: '#999' }}>
            Click "Start Stream" to begin
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoStream;
