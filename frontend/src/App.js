import React, { useState, useEffect, useRef } from "react";
import VideoStream from "./components/VideoStream";
import ROIHistory from "./components/ROIHistory";

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [roiData, setRoiData] = useState([]);
  const [processedFrame, setProcessedFrame] = useState(null);
  const [uptime, setUptime] = useState(0);

  const websocketRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const uptimeIntervalRef = useRef(null);

  useEffect(() => {
    if (isConnected) {
      uptimeIntervalRef.current = setInterval(() => {
        setUptime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(uptimeIntervalRef.current);
      setUptime(0);
    }

    return () => clearInterval(uptimeIntervalRef.current);
  }, [isConnected]);

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch("http://localhost:8000/data/roi");

      if (response.ok) {
        const data = await response.json();

        setRoiData(data.data || []);
        setDetectionCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching ROI data:", error);
    }
  };

  const connectWebSocket = () => {
    return new Promise((resolve) => {
      const ws = new WebSocket("ws://localhost:8000/ws/stream");

      ws.onopen = () => {
        setIsConnected(true);
        fetchHistoricalData();
        resolve(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.frame) {
            setProcessedFrame(message.frame);
          }

          if (message.roi) {
            fetchHistoricalData();
          }
        } catch (e) {
          console.error("WebSocket Parse Error:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      websocketRef.current = ws;
    });
  };

  const captureFrames = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    captureIntervalRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return;

            const reader = new FileReader();

            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              websocketRef.current.send(base64);
            };

            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.6
        );
      }
    }, 100);
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;

      await connectWebSocket();

      captureFrames();
    } catch (err) {
      alert("Camera access denied or backend offline.");
      console.error(err);
    }
  };

  const stopStream = () => {
    clearInterval(captureIntervalRef.current);

    streamRef.current?.getTracks().forEach((track) => track.stop());

    websocketRef.current?.close();

    setIsConnected(false);
    setProcessedFrame(null);
  };

  const formatUptime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div style={styles.app}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.logo}>
            MEGA <span style={styles.logoAccent}>AI</span>
          </h1>

          <p style={styles.subtitle}>
            Real-Time Vision Intelligence Platform
          </p>
        </div>

        <div style={styles.statusCard(isConnected)}>
          <div style={styles.statusDot(isConnected)} />

          {isConnected ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={styles.dashboardGrid}>
        {/* LEFT SECTION */}
        <div style={styles.leftPanel}>
          {/* VIDEO CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Live Analysis</h2>

                <p style={styles.cardSubtitle}>
                  Real-time face detection stream
                </p>
              </div>

              {!isConnected ? (
                <button
                  style={styles.startButton}
                  onClick={startStream}
                >
                  Start Monitoring
                </button>
              ) : (
                <button
                  style={styles.stopButton}
                  onClick={stopStream}
                >
                  Stop Stream
                </button>
              )}
            </div>

            {/* VIDEO CONTAINER */}
            <div style={styles.videoWrapper}>
              <VideoStream
                videoRef={videoRef}
                isConnected={isConnected}
                videoStyle={styles.videoLayer}
              />

              {processedFrame && (
                <img
                  src={`data:image/jpeg;base64,${processedFrame}`}
                  alt="Processed Frame"
                  style={styles.overlay}
                />
              )}

              {!isConnected && (
                <div style={styles.videoOverlay}>
                  <div style={styles.overlayText}>
                    Waiting for stream initialization...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* METRICS */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Detections</div>

              <div style={styles.metricValue}>
                {detectionCount}
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>FPS</div>

              <div style={styles.metricValue}>
                {isConnected ? "12" : "0"}
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Uptime</div>

              <div style={styles.metricValue}>
                {formatUptime(uptime)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Detection Logs</h2>

              <p style={styles.cardSubtitle}>
                Historical ROI records
              </p>
            </div>
          </div>

          <div style={styles.historyContainer}>
            <ROIHistory roiData={roiData} />
          </div>
        </div>
      </div>

      {/* HIDDEN CANVAS */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ display: "none" }}
      />
    </div>
  );
};

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#ffffff",
    padding: "28px",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    paddingBottom: "18px",
    borderBottom: "1px solid #1f1f1f",
  },

  logo: {
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    margin: 0,
    color: "#ffffff",
  },

  logoAccent: {
    color: "#d1d5db",
  },

  subtitle: {
    marginTop: "6px",
    color: "#8a8a8a",
    fontSize: "14px",
    fontWeight: "400",
  },

  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1.7fr 1fr",
    gap: "24px",
  },

  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

 card: {
  background: "#111111",
  border: "1px solid #1f1f1f",
  borderRadius: "16px",
  padding: "20px",
  overflow: "hidden",
},

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "#ffffff",
  },

  cardSubtitle: {
    marginTop: "4px",
    color: "#7a7a7a",
    fontSize: "13px",
  },

  videoWrapper: {
  position: "relative",
  width: "100%",
  height: "540px",
  minHeight: "540px",
  maxHeight: "540px",
  overflow: "hidden",
  background: "#000",
  borderRadius: "14px",
  border: "1px solid #1f1f1f",
  flexShrink: 0,
},

  videoLayer: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
  },

  videoOverlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000000",
  },

  overlayText: {
    color: "#6b7280",
    fontSize: "15px",
    fontWeight: "500",
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },

  metricCard: {
    background: "#111111",
    border: "1px solid #1f1f1f",
    borderRadius: "14px",
    padding: "18px",
  },

  metricLabel: {
    fontSize: "13px",
    color: "#7a7a7a",
    marginBottom: "10px",
    fontWeight: "500",
  },

  metricValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#ffffff",
  },

  startButton: {
    background: "#ffffff",
    color: "#000000",
    border: "none",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },

  stopButton: {
    background: "#171717",
    color: "#ffffff",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "12px 18px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },

  statusCard: (connected) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "#111111",
    border: "1px solid #1f1f1f",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "600",
  }),

  statusDot: (connected) => ({
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: connected ? "#ffffff" : "#5a5a5a",
  }),

  historyContainer: {
    maxHeight: "700px",
    overflowY: "auto",
    paddingRight: "4px",
  },
};

export default App;