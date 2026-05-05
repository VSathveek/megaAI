# Mega AI Frontend

React-based frontend for real-time face detection streaming.

## Features

- Real-time video stream with WebSocket connection
- Live face detection with bounding box visualization
- Detection history with ROI coordinates and timestamps
- Responsive design with modern UI
- Status indicators and statistics

## Installation

```bash
cd frontend
npm install
```

## Running

```bash
npm start
```

The app will open at http://localhost:3000

## Usage

1. Click "Start Stream" to begin video capture
2. Grant camera permissions when prompted
3. The app connects to the backend WebSocket at ws://localhost:8000/ws/stream
4. Detected faces appear with bounding boxes in real-time
5. Detection history is displayed on the right side
6. Click "Stop Stream" to end the session
