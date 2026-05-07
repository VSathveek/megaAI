import React from "react";

function ROIHistory({ roiData }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCoordinate = (value) => {
    return Math.round(value);
  };

  return (
    <div>
      {roiData && roiData.length > 0 ? (
        roiData.map((roi, index) => (
          <div
            key={roi.id}
            style={{
              padding: "18px",
              borderBottom: "1px solid #1f1f1f",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "14px",
                color: "#ffffff",
              }}
            >
              Detection #{roiData.length - index}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "13px",
                color: "#a1a1a1",
              }}
            >
              <div>
                X-Min: {formatCoordinate(roi.x_min)}
              </div>

              <div>
                Y-Min: {formatCoordinate(roi.y_min)}
              </div>

              <div>
                X-Max: {formatCoordinate(roi.x_max)}
              </div>

              <div>
                Y-Max: {formatCoordinate(roi.y_max)}
              </div>
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "12px",
                color: "#666",
              }}
            >
              {formatTimestamp(roi.timestamp)}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            height: "240px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "#666",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontWeight: "600",
            }}
          >
            No detections yet
          </p>

          <p
            style={{
              marginTop: "10px",
              fontSize: "13px",
            }}
          >
            Start monitoring to begin detection
          </p>
        </div>
      )}
    </div>
  );
}

export default ROIHistory;