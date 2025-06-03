from flask import Flask, render_template, request, jsonify
import numpy as np
import cv2
import base64
import os
from tensorflow.keras.models import load_model

app = Flask(__name__)
model = load_model('model.h5')

emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None, None

    (x, y, w, h) = faces[0]
    roi = gray[y:y+h, x:x+w]
    roi = cv2.resize(roi, (48, 48))
    roi = roi.astype('float32') / 255.0
    roi = np.expand_dims(roi, axis=0)
    roi = np.expand_dims(roi, axis=-1)
    return roi, {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json['image']
    img_data = base64.b64decode(data.split(',')[1])
    nparr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    roi, face_coords = preprocess_frame(frame)
    if roi is None:
        return jsonify({'emotion': 'No face detected', 'face': None})

    preds = model.predict(roi)
    emotion = emotion_labels[np.argmax(preds)]
    return jsonify({'emotion': emotion, 'face': face_coords})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)