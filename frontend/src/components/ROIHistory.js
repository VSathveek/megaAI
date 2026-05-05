import React from 'react';

function ROIHistory({ roiData }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatCoordinate = (value) => {
    return Math.round(value);
  };

  return (
    <div className="roi-list">
      {roiData && roiData.length > 0 ? (
        roiData.map((roi, index) => (
          <div key={roi.id} className="roi-item">
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              Detection #{roiData.length - index}
            </div>
            <div className="roi-coordinates">
              <div>X-Min: {formatCoordinate(roi.x_min)}</div>
              <div>Y-Min: {formatCoordinate(roi.y_min)}</div>
              <div>X-Max: {formatCoordinate(roi.x_max)}</div>
              <div>Y-Max: {formatCoordinate(roi.y_max)}</div>
            </div>
            <div className="roi-timestamp">
              {formatTimestamp(roi.timestamp)}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-list">
          <p>No face detections yet</p>
          <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
            Start the stream to begin detecting faces
          </p>
        </div>
      )}
    </div>
  );
}

export default ROIHistory;
