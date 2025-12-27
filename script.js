// Elements
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureText = document.getElementById("gesture");
const statusText = document.getElementById("status");
const languageSelect = document.getElementById("language");

canvasElement.width = 640;
canvasElement.height = 480;

// Speech
function speak(text) {
  const lang = languageSelect.value === "hi" ? "hi-IN" : "en-US";
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

// Gesture update
let lastGesture = "";

function updateGesture(textEN, textHI) {
  const text = languageSelect.value === "hi" ? textHI : textEN;
  gestureText.innerText = "Detected Sign: " + text;
  speak(text);
}

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// Camera
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();

// Results
hands.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, 640, 480);

  if (results.multiHandLandmarks.length > 0) {
    statusText.innerText = "Status: Hand Detected ✔";

    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: "#22c55e",
        lineWidth: 2
      });

      drawLandmarks(canvasCtx, landmarks, {
        color: "#00eaff",
        lineWidth: 2
      });

      detectSign(landmarks);
    }
  } else {
    statusText.innerText = "Status: No Hand ❌";
    gestureText.innerText = "Detected Sign: —";
    lastGesture = "";
  }
});

// Sign Language Logic
function detectSign(lm) {
  const thumb = lm[4];
  const index = lm[8];
  const middle = lm[12];
  const ring = lm[16];
  const pinky = lm[20];

  const indexBase = lm[5];
  const middleBase = lm[9];
  const ringBase = lm[13];
  const pinkyBase = lm[17];

  const indexUp = index.y < indexBase.y;
  const middleUp = middle.y < middleBase.y;
  const ringUp = ring.y < ringBase.y;
  const pinkyUp = pinky.y < pinkyBase.y;

  // HELLO (Open palm)
  if (indexUp && middleUp && ringUp && pinkyUp && lastGesture !== "HELLO") {
    updateGesture("Hello", "नमस्ते");
    lastGesture = "HELLO";
    return;
  }

  // YES (Thumbs up)
  if (thumb.x > lm[2].x && !indexUp && lastGesture !== "YES") {
    updateGesture("Yes", "हाँ");
    lastGesture = "YES";
    return;
  }

  // NO (Fist)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && lastGesture !== "NO") {
    updateGesture("No", "नहीं");
    lastGesture = "NO";
  }
}
