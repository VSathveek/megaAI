import React from "react";

function VideoStream({ videoRef, isConnected }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isConnected ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {!isConnected && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#000",
            color: "#777",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #222",
              borderTop: "3px solid #666",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />

          <p
            style={{
              marginTop: "18px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Click Start Monitoring to begin
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoStream;