import Notification from './Notification.js';

export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.isActionCompleted = false; // Track if action is completed for each step
    this.pressStartTime = null; // Track press start time
    this.holdTimeouts = []; // To store timeouts for clearing on early release

    // Step-specific data (e.g., a counter for step 1)
    this.stepData = {
      clickCounter: 0,
      curMenu: 'Randomizer',
    };

    this.steps = [
      {
        title: "Short Clicks",
        content: "First is basic input, perform a <b>Short Click</b> by pressing the button for less than 0.25 seconds",
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("That was a long click, don't hold the button for too long");
            return;
          }
          Notification.success("Good, a short click is for cycling through options");
          this.nextStep();
        }
      },
      {
        title: "Long Clicks",
        content: "Next, try a <b>Long Click</b> by pressing the button for at least 0.25 seconds",
        buttonTime: 0.25,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            Notification.failure("That was a short click, make sure to hold button for 0.25 seconds");
            return;
          }
          Notification.success("Good! That was a long click");
          this.buttonTime = 1.5;
          this.nextStep();
        }
      },
      {
        title: "Holds",
        content: "The last way to press the button is by <b>holding</b> for an extended duration. " +
                 "Try <b>holding</b> the button for 1.25 seconds",
        buttonTime: 1.25,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 1250) {
            Notification.failure("That was too quick, make sure to hold the button for 1.25 seconds");
            return;
          }
          Notification.success("Great! That was a 'hold', these are not common");
          this.nextStep();
        }
      },
      {
        title: "Turning On",
        content: () => `Start by <b>short clicking</b> the button to turn on the Duo`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("That's a long click, that turns on the Duo and toggles Conjure Mode");
            return;
          }

          Notification.success(`Great! The Duo is now running it's first mode`);
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      {
        title: "Turning Off",
        content: () => `You can turn the Duo <b>off</b> by holding for at least half a second up to 1.25 seconds`,
        buttonTime: 0.5,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 500) {
            Notification.failure("That's a short click, you must hold the button longer");
            return;
          }
          if (dur >= 1250) {
            Notification.failure("That's too long, this would open the menus. Try again");
            return;
          }
          Notification.success(`Fantastic! Holding the button for this short duration turns off the Duo`);
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      {
        title: "Cycling Modes",
        content: () => `Turn the Duo back on and <b>short click</b> to cycle through the available modes. ${(this.stepData.clickCounter > 0) ? `Current Mode: ${this.stepData.clickCounter} / 5` : ``}`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur > 250) {
            Notification.failure("You are holding the button for too long, use fast clicks to cycle");
            return;
          }
          if (!this.stepData.clickCounter) {
            this.lightshow.toggleEnabled();
          } else {
            this.vortexLib.Vortex.shortClick(0);
          }
          this.stepData.clickCounter++;
          if (this.vortexLib.Vortex.curModeIndex() < 4) {
            Notification.message(`Cycled to mode ${(this.stepData.clickCounter) % 6}`);
          } else {
            this.nextStep();
            Notification.success(`You successfully cycled all the modes, you're back at the first mode`);
          }
        }
      },
      {
        title: "Enter Menus",
        content: "To enter the Menus <b>hold</b> the button, past the <b>off</b> option, till the LED flashes white (1.25 seconds)",
        buttonTime: 1.25,
        action: (type, dur) => {
          if (type === 'down') {
            // Call an action at 500ms
            const hold500ms = setTimeout(() => {
              this.lightshow.setEnabled(false);
            }, 500);

            // Call another action at 1250ms
            const hold1250ms = setTimeout(() => {
              this.lightshow.setEnabled(true);
              this.vortexLib.Vortex.menuEnterClick(0);
            }, 1250);

            // Store timeouts to clear them on early release
            this.holdTimeouts.push(hold500ms, hold1250ms);
          } else if (type === 'up') {
            if (dur < 1250) {
              // Clear any remaining timeouts
              this.holdTimeouts.forEach(timeout => clearTimeout(timeout));
              this.holdTimeouts = []; // Reset the timeouts

              if (dur < 500) {
                Notification.failure("You released the button much too soon");
              } else if (dur >= 500) {
                Notification.failure("You need to hold the button for longer");
              }

              this.lightshow.setEnabled(true);
            } else {
              Notification.success("Success, you entered the menus.");
              this.nextStep(); // Move to the next step if held correctly
            }
          }
        }
      },
      {
        title: "The Menus",
        content: () => `Click to cycle through the menus.<br>Current Menu: ${this.stepData.curMenu}`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          this.vortexLib.Vortex.shortClick(0);
          this.stepData.clickCounter++;
          this.stepData.curMenu = (() => {
            switch (this.stepData.clickCounter % 6) {
              case 0: return 'Randomizer';
              case 1: return 'Mode Sharing';
              case 2: return 'Color Select';
              case 3: return 'Pattern Select';
              case 4: return 'Global Brightness';
              case 5: return 'Factory Reset';
              default: return 'Unknown';
            }
          })();
          if (this.vortexLib.Menus.curMenuID().value === 5 && this.stepData.clickCounter >= 4) {
            Notification.success("Great! You cycled all 6 menus back to the Randomizer");
            this.nextStep();
          } else {
            Notification.message(`Iterated to the ${this.stepData.curMenu} menu`);
          }
        }
      },
      {
        title: "Enter the Randomizer",
        content: "Next, <b>Long click</b> to enter the Randomizer Menu",
        buttonTime: 0.25,
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

    // Handle mousedown and touchstart for the device button (pressing the button)
    const deviceButton = document.getElementById('deviceButton');
    if ('ontouchstart' in window) {
      // Mobile device: use touchstart/touchend
      deviceButton.addEventListener('touchstart', (event) => this.handlePressStart(event));
      deviceButton.addEventListener('touchend', (event) => this.handlePressEnd(event));
    } else {
      // Desktop: use mousedown/mouseup
      deviceButton.addEventListener('mousedown', (event) => this.handlePressStart(event));
      deviceButton.addEventListener('mouseup', (event) => this.handlePressEnd(event));
    }
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
          <div id="deviceButton" class="device-button">
            <!-- SVG Circular Progress Bar -->
            <svg class="progress-ring" width="80" height="80">
              <circle class="progress-ring__circle" stroke="#0080ff" stroke-width="6" fill="transparent" r="38" cx="40" cy="40"/>
            </svg>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);
    // Initialize progress ring to be empty (full stroke-dashoffset)
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    // Initially set it to full circumference (empty)
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
  }

  handlePressStart(event) {
    this.pressStartTime = new Date().getTime();
    this.steps[this.currentStep].action('down');

    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    // Set strokeDasharray and start with the circle fully empty
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`; // Set it to full circumference (empty)

    // Animate the stroke fill if buttonTime is defined
    if (this.steps[this.currentStep].buttonTime) {
      // Reapply the transition to animate the fill
      circle.style.transition = `stroke-dashoffset ${this.steps[this.currentStep].buttonTime}s linear`;
      circle.style.strokeDashoffset = '0'; // Progress starts to fill
    }

    document.querySelector('.device-button').classList.add('device-button-pressed');
  }

  handlePressEnd(event) {
    const pressDuration = new Date().getTime() - this.pressStartTime;
    this.steps[this.currentStep].action('up', pressDuration);
    this.updateTutorialStep(this.currentStep);

    // Reset the progress bar
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    // Instantly reset the stroke-dashoffset without any transition
    circle.style.transition = 'none'; // Remove transition for an instant reset
    circle.style.strokeDashoffset = `${circumference}`; // Reset to full circumference (empty)

    document.querySelector('.device-button').classList.remove('device-button-pressed');
  }

  // Update the current step and disable the Next button until action is completed
  updateTutorialStep(stepIndex) {
    const step = this.steps[stepIndex];
    document.querySelector('.tutorial-step-title').textContent = `${step.title}`;
    let content = (typeof step.content === 'function') ? step.content() : step.content;
    document.querySelector('.tutorial-step-content').innerHTML = content; 
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
      // reset this
      this.stepData.clickCounter = 0;
    }
  }
}

