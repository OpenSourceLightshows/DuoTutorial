/* Main.js for Duo Tutorial */
import VortexLib from './VortexLib.js';
import Lightshow from './Lightshow.js';
import Tutorial from './Tutorial.js';

// Welcome message for the tutorial
const welcomeTitle = "<h2>Welcome to the Interactive Duo Tutorial!</h2>";
const welcomeBlurb = `
  This is a guide designed to introduce the Duo and Vortex Engine, it features a virtual Duo that can be controlled by clicking the button or pressing spacebar.<br><br>
  The goal is to demonstrate how to use the Duo and navigate it's menus. Follow along with your own Duo and learn how to make the most of it!</p>
`;

// Initialize the VortexLib WebAssembly module
VortexLib().then(vortexLib => {
  // Initialize the Vortex engine (since it's static in the WASM version)
  vortexLib.Init();

  const mainCanvas = document.getElementById('mainLightshowCanvas');
  const tutorial = new Tutorial(vortexLib);

  // okay this is kinda dumb first init the lightshow with the main canvas
  const lightshow = new Lightshow(vortexLib, mainCanvas);
  // then init the tutorial with reference to the lightshow so it can control it
  tutorial.init(lightshow);
  // but then pass an element created by the tutorial back to the lightshow so it
  // can render to it (the second canvas under the leds)
  lightshow.setFlashCanvas(tutorial.ledCanvas);

  // Start the lightshow
  lightshow.start();

  // Example way to jump to a step for debugging:
  //
  // navigateToState is navigating a tree where each argument is a node of the
  // tree found in TutorialTree.js
  //tutorial.tutorialTree.navigateToState('state-mode-0', 'state-menu-1', 'state-mode-sharing-send-receive');
  // and gotoStep is just jumping to a linear tutorial step as from Tutorial.js
  //tutorial.gotoStep('Mode Sharing Menu');
  // turn on the lightshow so it renders
  //lightshow.toggleEnabled();
  // perform some click or operations to enter a menu in the engine
  //vortexLib.Vortex.longClick(0);

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

