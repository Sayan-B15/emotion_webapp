const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const emotionText = document.getElementById('emotion');

let isProcessing = false; // prevent overlapping calls

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(err => {
    console.error("Error accessing webcam: ", err);
});

// Set canvas size same as video
video.addEventListener('loadedmetadata', () => {
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
});

// Send frame to backend every 500ms
setInterval(() => {
    if (isProcessing || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    isProcessing = true;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');

    emotionText.textContent = 'Detecting...'; // Optional UI feedback

    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
    })
    .then(res => res.json())
    .then(data => {
        isProcessing = false;
        emotionText.textContent = `Emotion: ${data.emotion}`;

        // Clear previous drawings
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (data.face) {
            const padding = 20;

            let scaleX = overlay.width / video.videoWidth;
            let scaleY = overlay.height / video.videoHeight;

            let x = (data.face.x - padding) * scaleX;
            let y = (data.face.y - padding) * scaleY;
            let w = (data.face.w + padding * 2) * scaleX;
            let h = (data.face.h + padding * 2) * scaleY;

            x = x < 0 ? 0 : x;
            y = y < 0 ? 0 : y;

            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'lime';
            ctx.rect(x, y, w, h);
            ctx.stroke();
        }
    })
    .catch(err => {
        isProcessing = false;
        console.error("Prediction error: ", err);
        emotionText.textContent = 'Error';
    });
}, 500);
