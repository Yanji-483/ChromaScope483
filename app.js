const imageInput = document.getElementById('image-upload');
const canvas = document.getElementById('canvas');
const colorDisplay = document.getElementById('colour-display');
const colourPreview = document.getElementById('colour-preview');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// Camera Elements
const video = document.getElementById('camera-feed');
const camBtn = document.getElementById('toggleCamera');
const liveDisplay = document.getElementById('live-colour-display');
const camCanvas = document.getElementById('camera-canvas');
const camCtx = camCanvas.getContext('2d');

let stream = null;

// --- IMAGE UPLOAD LOGIC ---
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.style.display = 'block';
            colorDisplay.innerText = "Click the image to identify its colors";
        };
        img.src = event.target.result;
    };
    if (file) reader.readAsDataURL(file);
});

// Accurate Color Picking for Uploaded Image
canvas.addEventListener('click', async (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(r, g, b);
    const name = await getColorName(hex);

    colorDisplay.innerText = `RGB: (${r}, ${g}, ${b}) | HEX: ${hex} | Name: ${name}`;
    colourPreview.style.backgroundColor = hex;
});

// --- LIVE CAMERA LOGIC ---
camBtn.addEventListener('click', async () => {
    if (stream) {
        stopCamera();
    } else {
        try {
            // Requests camera access
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "environment" } 
            });
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
                processCameraFrame();
            };
        } catch (err) {
            alert("Camera access denied. Check your browser permissions!");
        }
    }
});

function processCameraFrame() {
    if (!stream) return;

    // Use the hidden canvas to process video frames
    camCanvas.width = video.videoWidth;
    camCanvas.height = video.videoHeight;
    camCtx.drawImage(video, 0, 0, camCanvas.width, camCanvas.height);
    
    // Pick the color from the center of the screen
    const centerX = camCanvas.width / 2;
    const centerY = camCanvas.height / 2;
    const [r, g, b] = camCtx.getImageData(centerX, centerY, 1, 1).data;
    
    const hex = rgbToHex(r, g, b);
    liveDisplay.innerText = `Center Color: ${hex}`;
    colourPreview.style.backgroundColor = hex;

    requestAnimationFrame(processCameraFrame);
}

function stopCamera() {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    liveDisplay.innerText = "Point center of the cursor to detect its colour";
}

// --- HELPERS ---
function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function getColorName(hex) {
    try {
        const res = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace('#','')}`);
        const data = await res.json();
        return data.name.value;
    } catch { return "Unknown"; }
}