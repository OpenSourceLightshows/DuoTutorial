export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.isActionCompleted = false; // Track if action is completed for each step

    this.steps = [
      {
        title: "Step 1: Getting Started",
        content: "Start by turning on your Duo",
        action: (type, dur) => {
          if (type != 'click') {
            return;
          }
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      {
        title: "Step 2: Change Light Pattern",
        content: "Click to cycle through the 5 modes",
        action: (type, dur) => {
          if (type != 'click') {
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
        content: "Hold the button till the led flashes white",
        action: (type, dur) => {
          if (type === 'down') {
            console.log("Down");
          }
          if (type === 'up' && dur && dur > 500) {
            console.log("up");
            this.nextStep();
          }
        }
      }
      // Additional steps can be added here...
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
        <div class="tutorial-actions">
          <button class="btn-prev" id="prevStep">Back</button>
          <div id="deviceButton" class="device-button">Press</div> <!-- Changed to a div -->
          <button class="btn-skip" id="skipTutorial">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);
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

    if (pressDuration <= 150) { // Check if it qualifies as a click (150ms or more)
      this.steps[this.currentStep].action('click', pressDuration); // Perform the action for the current step
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

