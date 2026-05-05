import React, { useState, useEffect, useRef } from 'react';
import VideoStream from './components/VideoStream';
import ROIHistory from './components/ROIHistory';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [roiData, setRoiData] = useState([]);
  const websocketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch historical ROI data
  const fetchHistoricalData = async () => {
    try {
      const response = await fetch('http://localhost:8000/data/roi');
      if (response.ok) {
        const data = await response.json();
        setRoiData(data.data);
        setDetectionCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching ROI data:', error);
    }
  };

  // Initialize WebSocket connection
  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws/stream');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      fetchHistoricalData();
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.frame) {
        // Update video frame
        if (videoRef.current) {
          videoRef.current.src = `data:image/jpeg;base64,${message.frame}`;
        }
        // Update detection count if ROI detected
        if (message.roi) {
          fetchHistoricalData();
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    websocketRef.current = ws;
  };

  // Start video stream
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Connect WebSocket
      connectWebSocket();

      // Start capturing frames
      captureFrames();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  // Capture frames from video and send to WebSocket
  const captureFrames = () => {
    if (!videoRef.current || !websocketRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const captureFrame = () => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            websocketRef.current.send(base64);
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.7);
      }

      if (isConnected || websocketRef.current?.readyState === WebSocket.OPEN) {
        setTimeout(captureFrame, 100); // 10 FPS
      }
    };

    captureFrame();
  };

  // Stop stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    setIsConnected(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container">
        <div className="header">
          <h1>🎥 Mega AI</h1>
          <p>Real-Time Face Detection System</p>
        </div>

        <div className="content">
          <div className="section">
            <h2 className="section-title">Live Stream</h2>
            <div className="status" style={{
              backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
              color: isConnected ? '#155724' : '#721c24'
            }}>
              Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            
            <div className="controls">
              <button
                className="btn-start"
                onClick={startStream}
                disabled={isConnected}
              >
                ▶ Start Stream
              </button>
              <button
                className="btn-stop"
                onClick={stopStream}
                disabled={!isConnected}
              >
                ⏹ Stop Stream
              </button>
            </div>

            <VideoStream videoRef={videoRef} isConnected={isConnected} />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{ display: 'none' }}
            />

            <div className="stats">
              <div className="stat-box">
                <div className="stat-value">{detectionCount}</div>
                <div className="stat-label">Total Detections</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{isConnected ? '10' : '0'}</div>
                <div className="stat-label">FPS</div>
              </div>
            </div>
          </div>

          <div className="section">
            <h2 className="section-title">Detection History</h2>
            <ROIHistory roiData={roiData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
