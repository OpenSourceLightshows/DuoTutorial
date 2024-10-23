/* Main.js for Duo Tutorial */
import VortexLib from './VortexLib.js';
import Lightshow from './Lightshow.js';
import Tutorial from './Tutorial.js';
import TutorialTree from './TutorialTree.js';

// Welcome message for the tutorial
const welcomeTitle = "<h2>Welcome to the Interactive Duo Tutorial!</h2>";
const welcomeBlurb = `
  This is a guide designed to introduce the Duo and Vortex Engine, it features a virtual Duo that can be controlled by clicking a button.<br><br>
  The goal is to demonstrate how to use the Duo and navigate it's menus. Follow along with your own Duo and learn how to make the most of it</p>
`;

// Initialize the VortexLib WebAssembly module
VortexLib().then(vortexLib => {
  // Initialize the Vortex engine (since it's static in the WASM version)
  vortexLib.Init();

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

  // Initialize the tutorial and pass vortexLib and lightshow instances
  const tutorial = new Tutorial(vortexLib, lightshow);
  //const tutorialTree = new TutorialTree(vortexLib);

  // Check if the welcome modal should be shown
  const showWelcome = localStorage.getItem('showWelcome') !== 'false';

  if (showWelcome) {
    // Assuming you have a `welcomeModal` container for your modal
    const welcomeModal = document.createElement('div');
    welcomeModal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal">
        <div class="modal-content">
          ${welcomeTitle}
          ${welcomeBlurb}
          <div class="modal-checkbox-container"><label><input type="checkbox" id="doNotShowAgain"> Do not show this again</label></div>
          <button id="closeModal">Begin</button>
        </div>
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

