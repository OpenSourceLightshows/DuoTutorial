import Notification from './Notification.js';
import TutorialTree from './TutorialTree.js';

export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.isActionCompleted = false; // Track if action is completed for each step
    this.pressStartTime = null; // Track press start time
    this.holdTimeouts = []; // To store timeouts for clearing on early release
    this.tutorialTree = new TutorialTree(this.vortexLib);
    this.buttonDown = false;

    // Step-specific data (e.g., a counter for step 1)
    this.stepData = {
      clickCounter: 0,
      curMenu: 'Randomizer',
    };

    this.steps = [
      //// ================================================================================
      //{
      //  title: "Short Clicks",
      //  content: "Let's start with basic input. A <b>Short Click</b> is simply a normal click. Perform a <b>Short Click</b> on the button below",
      //  prepare: () => {
      //    // run stuff to prepare the step if necessary
      //  },
      //  action: (type, dur) => {
      //    if (type != 'up') {
      //      return;
      //    }
      //    if (dur >= 250) {
      //      Notification.failure("That was a long click, don't hold the button for too long (250 milliseconds)");
      //      return;
      //    }
      //    Notification.success("Good, a short click is for cycling through options");
      //    this.nextStep();
      //  }
      //},
      //// ================================================================================
      //{
      //  title: "Long Clicks",
      //  content: "Now, try a <b>Long Click</b> by holding the button for about 1 second",
      //  buttonTime: 0.25,
      //  action: (type, dur) => {
      //    if (type != 'up') {
      //      return;
      //    }
      //    if (dur < 250) {
      //      Notification.failure("That was a short click, make sure to hold button for 0.25 seconds");
      //      return;
      //    }
      //    Notification.success("Good! That was a long click");
      //    this.buttonTime = 1.5;
      //    this.nextStep();
      //  }
      //},
      //// ================================================================================
      //{
      //  title: "Holds",
      //  content: "The last way to press the button is by <b>holding</b> for an extended duration. " +
      //           "Try <b>holding</b> the button for 1.25 seconds",
      //  buttonTime: 1.25,
      //  action: (type, dur) => {
      //    if (type != 'up') {
      //      return;
      //    }
      //    if (dur < 1250) {
      //      Notification.failure("That was too quick, make sure to hold the button for 1.25 seconds");
      //      return;
      //    }
      //    Notification.success("Great! That was a 'hold', these are not common");
      //    this.nextStep();
      //  }
      //},
      // ================================================================================
      {
        title: "Turning On",
        content: () => `Turn on the Duo with a <b>short click</b>.`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("That's a long click, that toggles Conjure Mode");
            return;
          }
          Notification.success(`Great! The Duo is now playing the first mode`);
          this.tutorialTree.navigateToState('state-mode-0');
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      // ================================================================================
      {
        title: "Turning Off",
        content: () => `Hold for half a second and release when the led is off to <b>turn the Duo off</b>`,
        buttonTime: 0.5,
        action: (type, dur) => {
          if (type === 'down') {
            // Call an action at 500ms
            const hold500ms = setTimeout(() => {
              this.lightshow.setEnabled(false);
            }, 500);

            // Call another action at 1250ms
            const hold1250ms = setTimeout(() => {
              this.lightshow.setEnabled(true);
            }, 1250);

            // Store timeouts to clear them on early release
            this.holdTimeouts.push(hold500ms, hold1250ms);
          } else if (type === 'up') {
            if (dur < 1250) {
              // Clear any remaining timeouts
              this.holdTimeouts.forEach(timeout => clearTimeout(timeout));
              this.holdTimeouts = []; // Reset the timeouts

              if (dur < 500) {
                Notification.failure("You released the button too soon");
              } else if (dur >= 1250) {
                Notification.failure("You need to hold the button for longer");
              } else {
                Notification.success(`Fantastic! Holding the button for this short duration turns off the Duo`);
                this.tutorialTree.navigateToState('state-off');
                this.nextStep();
              }
            }
          }
        }
      },
      // ================================================================================
      {
        title: "Turn back On",
        content: () => `Turn the Duo back on with a <b>short click</b> to continue.`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("That was a long click, use a short click");
            return;
          }
          Notification.success(`Good, the Duo is turned back on`);
          this.tutorialTree.navigateToState('state-mode-0');
          this.lightshow.toggleEnabled();
          this.nextStep();
        }
      },
      // ================================================================================
      {
        title: "Cycling Modes",
        content: () => `<b>Short click</b> to cycle through the available modes.<br>${(this.stepData.clickCounter > 0) ? `Current Mode: ${this.stepData.clickCounter + 1} / 5` : ``}`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("You held the button for too long, use a short click");
            return;
          }
          this.vortexLib.Vortex.shortClick(0);
          this.stepData.clickCounter++;
          this.tutorialTree.navigateToState('state-mode-' + (this.stepData.clickCounter % 5));
          if (this.vortexLib.Vortex.curModeIndex() < 4) {
            Notification.message(`Cycled to mode ${(this.stepData.clickCounter + 1) % 6}`);
          } else {
            Notification.success(`You've successfully cycled through all the modes and returned to the first mode.`);
            this.tutorialTree.navigateToState('state-mode-0');
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Opening Menus",
        content: "Pick a mode then <b>hold past off</b> till the <b>LEDs flash white</b>. The menus will only affect that specific mode",
        buttonTime: 1.25,
        prepare: () => {
          this.lightshow.setEnabled(true);
        },
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

              if (dur < 250) {
                Notification.message("You can open the menus from any mode");
                this.vortexLib.Vortex.shortClick(0);
                this.tutorialTree.navigateToState('state-mode-' + (++this.stepData.clickCounter % 5));
              } else if (dur < 500) {
                Notification.failure("You released the button much too soon");
              } else if (dur >= 500) {
                Notification.failure("You need to hold the button for longer");
              }

              // re-enable it because they might have turned it off, don't open the menus for them either
              this.lightshow.setEnabled(true);
            } else {
              this.tutorialTree.navigateToState('state-mode-' + (this.stepData.clickCounter % 5), 'state-menu-0');
              Notification.success("Success, you entered the menus");
              this.nextStep(); // Move to the next step if held correctly
            }
          }
        }
      },
      // ================================================================================
      {
        title: "The Menus",
        content: () => `Click to cycle through the menus.<br>Current Menu: ${this.stepData.curMenu}`,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("That was a long click, use a short click to cycle menus");
            return;
          }
          this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                            'state-menu-' + (++this.stepData.clickCounter % 6));
          this.vortexLib.Vortex.shortClick(0);
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
            Notification.message(`The ${this.stepData.curMenu} Menu`);
          }
        }
      },
      // ================================================================================
      {
        title: "Enter the Randomizer",
        content: "Next, <b>Long click</b> to enter the Randomizer Menu",
        buttonTime: 0.25,
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            Notification.failure("That was a short click. Use a long click to enter a menu");
            return;
          }
          Notification.success("You opened the mode randomizer");
          this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                            'state-menu-0',
                                            'state-led-select');
          this.vortexLib.Vortex.longClick(0);
          this.nextStep();
        }
      },
      // ================================================================================
      {
        title: "Select Leds",
        content: "<b>Short click</b> to pick which leds will be targeted, <b>long click</b> to select those leds",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          const options = [
            'Both Leds',
            'Tip Led',
            'Top Led'
          ];
          if (dur < 250) {
            Notification.message("Selected " + options[++this.stepData.clickCounter % 3]);
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                              'state-menu-0',
                                              'state-randomizing');
            this.vortexLib.Vortex.longClick(0);
            Notification.success("Good, you picked the leds to be targeted by the menu");
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Randomize a New Mode",
        content: "<b>Short click</b> unlimited times to roll new random patterns and colorsets on the chosen leds. <b>Long click</b> to save the selected mode and exit",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            Notification.message("Randomized a new mode");
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.vortexLib.Vortex.longClick(0);
            Notification.success("Well done, you successfully randomized a mode");
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Understand Where You Are",
        content: "After editing a mode, the changes are saved, and the menu is closed. <b>Short click</b> to see that you're back on the main modes list",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            this.stepData.clickCounter++;
            this.vortexLib.Vortex.shortClick(0);
            if (this.stepData.clickCounter > 3) {
              Notification.success(``);
            } else {
              Notification.message(`Cycled to mode ${(this.stepData.clickCounter) % 6}`);
            }
          } else {
            this.vortexLib.Vortex.longClick(0);
            Notification.success("Good, you picked the leds to be targeted by the menu");
            this.nextStep();
          }
          if (this.vortexLib.Vortex.curModeIndex() < 4) {
          } else {
            this.nextStep();
            Notification.success(`You successfully cycled all the modes, you're back at the first mode`);
          }
        }
      },
    ];
  }

  init(lightshow) {
    this.lightshow = lightshow;
    this.createTutorialOverlay();
    // run init
    if (typeof this.steps[this.currentStep].prepare === 'function') {
      this.steps[this.currentStep].prepare();
    }
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
    // Add event listeners for spacebar press and release
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        this.handlePressStart(event);
        event.preventDefault(); // Prevent default spacebar behavior (scrolling down the page)
      }
    });
    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
        this.handlePressEnd(event);
        event.preventDefault(); // Prevent default spacebar behavior
      }
    });
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
          <img src="images/duo-tutorial-leds.png" alt="Duo Logo" class="duo-image">
          <div id="deviceButton" class="device-button">
            <!-- SVG Circular Progress Bar -->
            <a class=device-button-text>Press</a>
            <svg class="progress-ring" width="64" height="64">
              <circle class="progress-ring__circle" stroke="#0080ff" stroke-width="6" fill="transparent" r="28" cx="32" cy="32"/>
            </svg>
          </div>
          <p class="tutorial-step-number">1</p>
        </div>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);

    // Get the duo-image element to match the size
    const deviceButton = tutorialOverlay.querySelector('.device-button');

    // Create the canvas element dynamically
    this.ledCanvas = document.createElement('canvas');
    this.ledCanvas.id = 'ledLightshowCanvas';
    deviceButton.insertAdjacentElement('afterend', this.ledCanvas);

    // Initialize progress ring to be empty (full stroke-dashoffset)
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    // Initially set it to full circumference (empty)
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
  }

  handlePressStart(event) {
    if (this.buttonDown) {
      return;
    }

    this.buttonDown = true;

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
    if (!this.buttonDown) {
      return;
    }

    this.buttonDown = false;

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
    document.querySelector('.tutorial-step-number').textContent = `${stepIndex + 1}`;
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
      // only prepare first one?
      //if (typeof this.steps[this.currentStep].prepare === 'function') {
      //  this.steps[this.currentStep].prepare();
      //}
      // update the tutorial step
      this.updateTutorialStep(this.currentStep);
      // reset this
      this.stepData.clickCounter = 0;
    }
  }
}

