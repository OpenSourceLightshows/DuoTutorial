/* Main.js for Duo Tutorial */
import VortexLib from './VortexLib.js';
import Lightshow from './Lightshow.js';

// Welcome message for the tutorial
const welcomeTitle = "<h1>Welcome to Duo Tutorial</h1>";
const welcomeBlurb = `
  <p>Welcome to the Duo Tutorial! Follow along to learn how to interact with the Vortex Engine and create mesmerizing lightshows.</p>
`;

// Initialize the VortexLib WebAssembly module
VortexLib().then(vortexLib => {
  const canvas = document.getElementById('lightshowCanvas');
  
  // Create a new instance of the Lightshow
  let lightshow = new Lightshow(vortexLib, canvas);

  // Start the lightshow
  lightshow.start();

  // Set up key events for shape changing
  window.addEventListener('keydown', (event) => {
    switch (event.key) {
      case '1':
        lightshow.setShape('circle');
        break;
      case '2':
        lightshow.setShape('figure8');
        break;
      case '3':
        lightshow.setShape('heart');
        break;
      case '4':
        lightshow.setShape('box');
        break;
      default:
        return;
    }
    lightshow.angle = 0; // Reset angle after changing shape
  });

  // Check if the welcome modal should be shown
  const showWelcome = localStorage.getItem('showWelcome') !== 'false';

  if (showWelcome) {
    const welcomeModal = document.createElement('div');
    welcomeModal.classList.add('modal');
    welcomeModal.innerHTML = `
      <div class="modal-content">
        ${welcomeTitle}
        ${welcomeBlurb}
        <label><input type="checkbox" id="doNotShowAgain"> Do not show this again</label>
        <button id="closeModal">Close</button>
      </div>
    `;

    document.body.appendChild(welcomeModal);

    document.getElementById('doNotShowAgain').addEventListener('change', (event) => {
      localStorage.setItem('showWelcome', !event.target.checked);
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      welcomeModal.style.display = 'none';
    });
  }
});

