import Notification from './Notification.js';

export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.isActionCompleted = false; // Track if action is completed for each step
    this.pressStartTime = null; // Track press start time
    this.holdTimeouts = []; // To store timeouts for clearing on early release
    this.errorMessage = ''; // Store error messages if needed

    this.steps = [
      {
        title: "Step 1: Getting Started",
        content: "Start by turning on your Duo",
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      {
        title: "Step 2: Cycling Modes",
        content: "Click to cycle through the 5 modes",
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          this.vortexLib.Vortex.shortClick(0);
          if (this.vortexLib.Vortex.curModeIndex() === 4) {
            this.nextStep();
          }
        }
      },
      {
        title: "Step 3: Enter Menus",
        content: "Hold till the LED flashes white (1250ms)",
        action: (type, dur) => {
          if (type === 'down') {
            this.startHoldAction();
          } else if (type === 'up') {
            this.endHoldAction(dur);
          }
        }
      },
      {
        title: "Step 4: The Menus",
        content: "Click to cycle through all the available menus",
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          this.vortexLib.Vortex.shortClick(0);
          console.log(this.vortexLib.Menus.curMenuID());
          if (this.vortexLib.Menus.curMenuID().value === 4) {
            this.nextStep();
          }
        }
      },
      {
        title: "Step 5: Enter the Randomizer",
        content: "Click to cycle through all the available menus",
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          this.vortexLib.Vortex.shortClick(0);
          if (this.vortexLib.Menus.curMenuID() === 5) {
            this.nextStep();
          }
        }
      }
    ];

    this.init();
  }

  init() {
    this.createTutorialOverlay();
    this.updateTutorialStep(this.currentStep);

    document.getElementById('prevStep').addEventListener('click', () => {
      this.prevStep();
    });

    document.getElementById('skipTutorial').addEventListener('click', () => {
      this.skipTutorial();
    });

    // Handle mousedown and touchstart for the device button (pressing the button)
    const deviceButton = document.getElementById('deviceButton');
    deviceButton.addEventListener('mousedown', (event) => this.handlePressStart(event));
    deviceButton.addEventListener('mouseup', (event) => this.handlePressEnd(event));

    // For mobile devices, handle touch events
    deviceButton.addEventListener('touchstart', (event) => this.handlePressStart(event));
    deviceButton.addEventListener('touchend', (event) => this.handlePressEnd(event));
  }

  // Create the overlay with the tutorial content and buttons
  createTutorialOverlay() {
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.classList.add('tutorial-overlay');
    tutorialOverlay.innerHTML = `
      <div class="tutorial-content">
        <h2 class="tutorial-step-title"></h2>
        <p class="tutorial-step-content"></p>
        <p class="tutorial-error-message" id="errorMessage" style="color:red; display:none;"></p>
        <div class="tutorial-actions">
          <button class="btn-prev" id="prevStep">Back</button>
          <div id="deviceButton" class="device-button">Press</div> <!-- Changed to a div -->
          <button class="btn-skip" id="skipTutorial">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);
  }

  // Show error message and revert to the current step
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block'; // Show the error message
  }

  // Handle press start (mousedown/touchstart)
  handlePressStart(event) {
    this.pressStartTime = new Date().getTime(); // Record the time when the press started
    this.steps[this.currentStep].action('down'); // Perform the action for the current step
    document.querySelector('.device-button').style = 'background-color:#1A682C;';
  }

  // Handle press end (mouseup/touchend)
  handlePressEnd(event) {
    const pressDuration = new Date().getTime() - this.pressStartTime; // Calculate how long the press lasted
    this.steps[this.currentStep].action('up', pressDuration); // Perform the action for the current step
    document.querySelector('.device-button').style = '';
  }

  // Timer-based actions when button is held down
  startHoldAction() {
    // Call an action at 500ms
    const hold500ms = setTimeout(() => {
      console.log("500ms reached: triggering VortexLib API.");
      this.lightshow.setEnabled(false);
    }, 500);

    // Call another action at 1250ms
    const hold1250ms = setTimeout(() => {
      console.log("1250ms reached: triggering VortexLib API.");
      this.lightshow.setEnabled(true);
      this.vortexLib.Vortex.menuEnterClick(0);
    }, 1250);

    // Store timeouts to clear them on early release
    this.holdTimeouts.push(hold500ms, hold1250ms);
  }

  // Handle the end of the hold and call the appropriate API
  endHoldAction(duration) {
    if (duration < 1250) {
      // Clear any remaining timeouts
      this.holdTimeouts.forEach(timeout => clearTimeout(timeout));
      this.holdTimeouts = []; // Reset the timeouts

      if (duration < 500) {
        console.log("Released too soon, under 500ms.");
        Notification.failure("You released the button too soon. Hold it longer next time.");
      } else if (duration >= 500) {
        console.log("Released between 500ms and 1250ms.");
        Notification.failure("You released the button before entering the menu. Try again.");
      }

      this.lightshow.setEnabled(true);
    } else {
      Notification.success("Success, you entered the menus.");
      this.nextStep(); // Move to the next step if held correctly
      // No need to do anything here, as the hold action at 1250ms already triggers the next step.
    }
  }

  // Update the current step and disable the Next button until action is completed
  updateTutorialStep(stepIndex) {
    const step = this.steps[stepIndex];
    document.querySelector('.tutorial-step-title').textContent = step.title;
    document.querySelector('.tutorial-step-content').textContent = step.content;
  }

  // Simulate the device click action for a step
  simulateDeviceClick() {
    this.isActionCompleted = true;
    this.vortexLib.Vortex.pressButton(0); // Simulate device button press
  }

  // Simulate pattern change action
  simulatePatternChange() {
    this.isActionCompleted = true;
    this.lightshow.changePattern(); // Example function to simulate a pattern change
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateTutorialStep(this.currentStep);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateTutorialStep(this.currentStep);
    }
  }

  skipTutorial() {
    document.querySelector('.tutorial-overlay').style.display = 'none';
  }
}

