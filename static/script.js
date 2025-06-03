const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const emotionText = document.getElementById('emotion');

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(err => {
    console.error("Error accessing webcam: ", err);
});

// Send frame to backend every 500ms
setInterval(() => {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/jpeg');

    fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
    })
    .then(res => res.json())
    .then(data => {
        emotionText.textContent = data.emotion;

        // Clear previous drawings
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        // Draw the green border around video (already done in CSS)

        if (data.face) {
            // Make square bigger by padding
            const padding = 20;

            // Scale coordinates from video to canvas overlay
            let scaleX = overlay.width / video.videoWidth;
            let scaleY = overlay.height / video.videoHeight;

            let x = (data.face.x - padding) * scaleX;
            let y = (data.face.y - padding) * scaleY;
            let w = (data.face.w + padding * 2) * scaleX;
            let h = (data.face.h + padding * 2) * scaleY;

            // Keep coordinates positive (optional)
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
        console.error("Prediction error: ", err);
        emotionText.textContent = 'Error';
    });
}, 500);
