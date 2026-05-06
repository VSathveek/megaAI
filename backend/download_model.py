import urllib.request

MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'
MODEL_FILE = 'face_landmarker.task'

if __name__ == '__main__':
    print(f'Downloading Mediapipe model from {MODEL_URL}')
    try:
        urllib.request.urlretrieve(MODEL_URL, MODEL_FILE)
        print(f'Model saved to {MODEL_FILE}')
    except Exception as exc:
        print('Failed to download model:', exc)
        print('If this fails, verify your network and the URL.')
