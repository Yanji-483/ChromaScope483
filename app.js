const imageInput = document.getElementById('image-upload');
const canvas = document.getElementById('canvas');
const colorDisplay = document.getElementById('colour-display'); // Corrected ID to match HTML
const colourPreview = document.getElementById('colour-preview'); // Corrected ID to match HTML

const ctx = canvas.getContext('2d'); //used for image processing

// Handle image upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            canvas.style.display = 'block'; // Show the canvas once the image is drawn
            colorDisplay.innerText = "Click the image to identify its colors"; // Reset instruction
            colourPreview.style.backgroundColor = '#fff'; // Reset preview
        };
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});

// Function to fetch accurate color names
async function getColorNameFromAPI(hex) {
    try {
        const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex.replace("#", "")}`); // Corrected template literal
        const data = await response.json();
        return data.name.value || "Unknown";
    } catch (error) {
        console.error("Error fetching color name:", error);
        return "Unknown";
    }
}

// Handle color detection on canvas click
canvas.addEventListener('click', async function (event) { // Changed listener to canvas
    const rect = canvas.getBoundingClientRect(); // Get the bounding rectangle of the canvas
    const x = event.clientX - rect.left; // Calculate x relative to the canvas
    const y = event.clientY - rect.top;  // Calculate y relative to the canvas

    // Make sure there is pixel data before color detection
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    if (!pixel || pixel.length === 0) {
        console.error("No pixel data found. Make sure the image is drawn on the canvas.");
        return;
    }

    const [r, g, b] = pixel;

    const hex = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16)
        .padStart(2, '0')}`.toUpperCase();

    const colorName = await getColorNameFromAPI(hex);

    colorDisplay.innerText = `RGB: (${r}, ${g}, ${b}) | HEX: ${hex} | Name: ${colorName}`; // Added color name
    colorDisplay.style.color = hex;

    // Preview box
    colourPreview.style.backgroundColor = hex; // Corrected ID
});

const video = document.getElementById('camera-feed');
const cameraCanvas = document.getElementById('camera-canvas');//Hidden camvas for processing
const livecolorDisplay = document.getElementById('live-colour-display');
const toggleButton = document.getElementById('toggleCamera');
const cameraCtx = cameraCanvas.getContext("2d"); //used for camera processing

let currentStream;//Default rear camera
let useBackCamera = true;
function startCamera(){
    const constraints = {video: {facingMode: useBackCamera ? "environment" : "user"}};

    //Access camera
navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());}

            currentStream = stream;
            video.srcObject = stream;
            video.onloadedmetadata = () => {video.play();
}
    })
    .catch(error => console.error("camera access error:", error));
}

//Toggle between front and rear cameras when button is clicked
toggleButton.addEventListener("click", () => {
    useBackCamera = !useBackCamera;
    startCamera();
});


//Draw frame and continuosly color at the center of the screen
video.addEventListener('play', detectColorFromCamera);

    function detectColorFromCamera() {
         if (video.readyState >= 2) {

             cameraCanvas.width = video.videoWidth;
             cameraCanvas.height = video.videoHeight;
    cameraCtx.drawImage(video, 0, 0, cameraCanvas.width, cameraCanvas.height);

    //Middle pixel of the screen that is cursor aligned
    const centerX = Math.floor(cameraCanvas.width / 2);
    const centerY = Math.floor(cameraCanvas.height / 2);
    const pixel = cameraCtx.getImageData(centerX, centerY, 1, 1).data;

    const [r, g, b] = pixel;
    const hex = `#${r.toString(16)
        .padStart(2, '0')}${g.toString(16)
        .padStart(2, '0')}${b.toString(16)
        .padStart(2, '0')}`.toUpperCase();

livecolorDisplay.innerText = `Live RGB: (${r}, ${g}, ${b}) | HEX: ${hex}`;
livecolorDisplay.style.color = hex;

requestAnimationFrame(detectColorFromCamera); //continuosly update detection
}
video.addEventListener("loadeddata", () => {
});
detectColorFromCamera();
};
startCamera(); //Start camera feed

// Handle color detection on video click
video.addEventListener('click', async function (event) {
    const rect = video.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Draw current frame to hidden canvas
    cameraCanvas.width = video.videoWidth;
    cameraCanvas.height = video.videoHeight;
    cameraCtx.drawImage(video, 0, 0, cameraCanvas.width, cameraCanvas.height);

    // Scale click coordinates to video resolution
    const scaleX = video.videoWidth / rect.width;
    const scaleY = video.videoHeight / rect.height;
    const pixelX = Math.floor(x * scaleX);
    const pixelY = Math.floor(y * scaleY);

    const pixel = cameraCtx.getImageData(pixelX, pixelY, 1, 1).data;
    const [r, g, b] = pixel;

    const hex = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();

    const colorName = await getColorNameFromAPI(hex);

    livecolorDisplay.innerText = `Clicked RGB: (${r}, ${g}, ${b}) | HEX: ${hex} | Name: ${colorName}`;
    livecolorDisplay.style.color = hex;

    // Update preview box
    colourPreview.style.backgroundColor = hex;
});