import Notification from './Notification.js';
import TutorialTree from './TutorialTree.js';
import ColorSelectOverlay from './ColorSelectOverlay.js';

export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.isActionCompleted = false; // Track if action is completed for each step
    this.pressStartTime = null; // Track press start time
    this.holdTimeouts = []; // To store timeouts for clearing on early release
    this.tutorialTree = new TutorialTree(this.vortexLib);
    this.colorSelectOverlay = new ColorSelectOverlay();
    this.buttonDown = false;

    // Step-specific data (e.g., a counter for step 1)
    this.stepData = {
      clickCounter: 0,
      curMenu: 'Randomizer',
      targetLed: 'Both Leds',
      colSlot: 0,
    };

    this.steps = [
      //// ================================================================================
      //{
      //  title: "Short Clicks",
      //  content: "Let's start with basic input. A Short Click is simply a normal click. Perform a Short Click on the button below",
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
      //  content: "Now, try a Long Click by holding the button for about 1 second",
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
      //  content: "The last way to press the button is by holding for an extended duration. " +
      //           "Try holding the button for 1.25 seconds",
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
        content: () => `Turn on the Duo with a short click.`,
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
        content: () => `Hold for half a second and release when the led is off to turn the Duo off`,
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
        content: () => `Turn the Duo back on with a short click to continue.`,
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
        content: () => `Short click to cycle through the available modes.<br>${(this.stepData.clickCounter > 0) ? `Current Mode: ${this.stepData.clickCounter + 1} / 5` : ``}`,
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
          this.tutorialTree.navigateToState('state-mode-' + (this.vortexLib.Vortex.curModeIndex() + 1) % 5);
          if (this.vortexLib.Vortex.curModeIndex() < 4) {
            Notification.message(`Cycled to mode ${(this.stepData.clickCounter + 1) % 6}`);
          } else {
            Notification.success(`You've successfully cycled through all the modes and returned to the first mode.`);
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Opening Menus",
        content: "Pick a mode then hold past off till the LEDs flash white. The menus will only affect that specific mode",
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
                this.tutorialTree.navigateToState('state-mode-' + (this.vortexLib.Vortex.curModeIndex() + 1) % 5);
              } else if (dur < 500) {
                Notification.failure("You released the button much too soon");
              } else if (dur >= 500) {
                Notification.failure("You need to hold the button for longer");
              }

              // re-enable it because they might have turned it off, don't open the menus for them either
              this.lightshow.setEnabled(true);
            } else {
              this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(), 'state-menu-0');
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
        content: "Next, Long click to enter the Randomizer Menu",
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
      //  Randomizer Menu
      // ================================================================================
      {
        title: "Randomizer Menu",
        content: () => `First, short click to pick which leds will be targeted, then long click to choose those leds<br>Targeting: ${this.stepData.targetLed}`,
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
          // target is current click count option
          this.stepData.targetLed = options[this.stepData.clickCounter % 3];
          if (dur < 250) {
            // unless they click the re-assign target
            this.stepData.targetLed = options[++this.stepData.clickCounter % 3];
            Notification.message("Selected " + this.stepData.targetLed);
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
        content: "Short click unlimited times to roll new random patterns and colorsets on the chosen leds. Long click to save the selected mode and exit",
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
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex());
            this.vortexLib.Vortex.longClick(0);
            Notification.success("Well done, you successfully randomized a mode");
            this.nextStep();
          }
        }
      },

      // ================================================================================
      //  Begin Main Loop
      // ================================================================================
      {
        title: "Understand Where You Are",
        content: "After editing a mode, the changes are saved, and the menu is closed. Short click to see that you're back on the main modes list",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur >= 250) {
            Notification.failure("Short click to see where you are");
            return;
          }
          this.stepData.clickCounter++;
          this.vortexLib.Vortex.shortClick(0);
          const modeIdx = (this.vortexLib.Vortex.curModeIndex() + 1) % 5;
          this.tutorialTree.navigateToState('state-mode-' + modeIdx);
          if (this.stepData.clickCounter > 0) {
            Notification.success("Notice you're back at the main modes");
            this.nextStep();
          } else {
            Notification.message(`Cycled to mode ${modeIdx + 1}`);
          }
        }
      },
      // ================================================================================
      {
        title: "Enter Any Menu",
        content: "Pick a mode and enter menus",
        buttonTime: 1.25,
        prepare: () => {
          this.lightshow.toggleEnabled();
          this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex());
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
                this.tutorialTree.navigateToState('state-mode-' + (this.vortexLib.Vortex.curModeIndex() + 1) % 5);
              } else if (dur < 500) {
                Notification.failure("You released the button much too soon");
              } else if (dur >= 500) {
                Notification.failure("You need to hold the button for longer");
              }

              // re-enable it because they might have turned it off, don't open the menus for them either
              this.lightshow.setEnabled(true);
            } else {
              this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                                'state-menu-0');
              Notification.success("Success, you entered the menus");
              this.nextStep(); // Move to the next step if held correctly
            }
          }
        }
      },

      // ================================================================================
      {
        title: "Pick a Menu",
        content: () => `Pick a menu to learn about, this is the ${this.stepData.curMenu} menu`,
        buttonTime: 0.25,
        prepare: () => {
          this.lightshow.setEnabled(true);
        },
        action: (type, dur) => {
          if (type !== 'up') {
            return;
          }
          if (dur < 250) {
            Notification.message("You can open the menus from any mode");
            this.vortexLib.Vortex.shortClick(0);
            const curMenuID = (this.vortexLib.Menus.curMenuID().value + 1) % 6;
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-' + curMenuID);
            this.stepData.curMenu = (() => {
              switch (curMenuID) {
                case 0: return 'Randomizer';
                case 1: return 'Mode Sharing';
                case 2: return 'Color Select';
                case 3: return 'Pattern Select';
                case 4: return 'Global Brightness';
                case 5: return 'Factory Reset';
                default: return 'Unknown';
              }
            })();
          } else {
            const curMenuID = this.vortexLib.Menus.curMenuID().value;
            Notification.success(`Success, you entered the ${this.stepData.curMenu} menu`);
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-' + curMenuID);
            this.vortexLib.Vortex.longClick(0);
            this.gotoStep(`${this.stepData.curMenu} Menu`);
          }
        }
      },

      // ================================================================================
      //  Mode Sharing Menu
      // ================================================================================
      {
        title: "Mode Sharing Menu",
        content: () => `The Mode Sharing menu facilitates sending or receiving modes to/from another Duo, the Duo is in receiver mode, short click to send the current mode and long click to leave the menu`,
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            Notification.message("Sending the mode...");
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                              'state-menu-1',
                                              'state-mode-sharing-send');
            const hold500ms = setTimeout(() => {
              Notification.message("Done Sending");
              this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
                                                'state-menu-1',
                                                'state-mode-sharing-receive');
            }, 2000);
            this.vortexLib.Vortex.shortClick(0);
          } else {
            Notification.success("Leaving the menu");
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex());
            this.vortexLib.Vortex.longClick(0);
            this.gotoStep('Understand Where You Are');
          }
        }
      },

      // ================================================================================
      //  Color Select Menu
      // ================================================================================
      {
        title: "Color Select Menu",
        content: () => `First, short click to pick which leds will be targeted, then long click to choose those leds<br>Targeting: ${this.stepData.targetLed}`,
        buttonTime: 0.25,
        prepare: () => {
          this.vortexLib.Vortex.shortClick(0);
          this.vortexLib.Vortex.shortClick(0);
          this.vortexLib.Vortex.menuEnterClick(0);
          this.vortexLib.Vortex.shortClick(0);
          this.vortexLib.Vortex.shortClick(0);
          this.vortexLib.Vortex.longClick(0);
          this.lightshow.toggleEnabled();
          this.tutorialTree.navigateToState('state-mode-2', 'state-menu-2', 'state-led-select');
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
          // target is current click count option
          this.stepData.targetLed = options[this.stepData.clickCounter % 3];
          if (dur < 250) {
            // unless they click the re-assign target
            this.stepData.targetLed = options[++this.stepData.clickCounter % 3];
            Notification.message("Selected " + this.stepData.targetLed);
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select');
            this.vortexLib.Vortex.longClick(0);
            Notification.success("Good, you picked the leds to be targeted by the menu");
            this.nextStep();
            const led = (this.stepData.targetLed === 'Top Led') ? this.vortexLib.LedPos.LED_1 : this.vortexLib.LedPos.LED_0;
            var set = new this.vortexLib.Colorset();
            this.vortexLib.Vortex.getColorset(led, set);
            let setArr = [];
            for (let i = 0; i < set.numColors(); ++i) {
              const color = set.get(i);
              const hexColor = `#${((1 << 24) + (color.red << 16) + (color.green << 8) + color.blue).toString(16).slice(1).toUpperCase()}`;
              setArr.push(hexColor);
            }
            this.colorSelectOverlay.initialize(setArr);
          }
        }
      },
      // ================================================================================
      {
        title: "Pick a Color Slot",
        content: "Short click to cycle through the colors of this mode, long click one to edit the color, or the gray blink to add new",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            // add 1 for readability
            this.vortexLib.Vortex.shortClick(0);
            this.colorSelectOverlay.iterateSelecton();
            Notification.message(this.colorSelectOverlay.selectedName);
            return;
          }
          if (this.colorSelectOverlay.selectionType() == 2) {
            Notification.failure("That is exit, try to add or edit a color");
            return;
          }
          Notification.success(this.colorSelectOverlay.selectedName);
          this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
            'state-menu-2', 'state-color-select-quad');
          this.vortexLib.Vortex.longClick(0);
          this.nextStep();
        }
      },
      // ================================================================================
      {
        title: "Pick a Hue Quadrant",
        content: "Short click to cycle through the four quadrants, long click to pick one",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select-hue');
            this.vortexLib.Vortex.longClick(0);
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Pick a Hue",
        content: "Short click to cycle through the four quadrants, long click to pick one",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select-sat');
            this.vortexLib.Vortex.longClick(0);
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Pick a Saturation",
        content: "Short click to cycle through the four quadrants, long click to pick one",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select-val');
            this.vortexLib.Vortex.longClick(0);
            this.nextStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Pick a Value",
        content: "Short click to cycle through the four quadrants, long click to pick one",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select');
            this.vortexLib.Vortex.longClick(0);
            this.gotoStep();
          }
        }
      },
      // ================================================================================
      {
        title: "Pick a Color Slot or Exit",
        content: "Great you changed a color, either add/edit another color or exit",
        buttonTime: 0.25,
        prepare: () => {
        },
        action: (type, dur) => {
          if (type != 'up') {
            return;
          }
          if (dur < 250) {
            // add 1 for readability
            this.vortexLib.Vortex.shortClick(0);
            this.colorSelectOverlay.iterateSelecton();
            Notification.message(this.colorSelectOverlay.selectedName);
            return;
          }
          if (this.colorSelectOverlay.selectionType() == 2) {
            Notification.failure("That is exit, try to add or edit a color");
            return;
          }
          Notification.success(this.colorSelectOverlay.selectedName);
          this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
            'state-menu-2', 'state-color-select-quad');
          this.vortexLib.Vortex.longClick(0);
          this.nextStep();

          if (dur < 250) {
            this.vortexLib.Vortex.shortClick(0);
          } else {
            this.tutorialTree.navigateToState('state-mode-' + this.vortexLib.Vortex.curModeIndex(),
              'state-menu-2', 'state-color-select');
            this.vortexLib.Vortex.longClick(0);
            this.gotoStep();
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

    // skip to a step
    //this.gotoStep('Color Select Menu', true);
    //this.gotoStep('Pick a Color Slot', true);

    // disable duoImage context menu
    const duoImage  = document.querySelector('.duo-image');
    duoImage.addEventListener("contextmenu",function(e){ e.preventDefault(); return false; });

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
      deviceButton.addEventListener('mouseleave', (event) => this.handlePressEnd(event));
    }
    // Add event listeners for spacebar press and release
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        this.handlePressStart(event);
        // Trigger haptic feedback (vibration) on button press
        if (navigator.vibrate) {
          navigator.vibrate(50); // Vibrate for 50 milliseconds
        }
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
          <div class="image-container">
            <canvas id="ledLightshowCanvas"></canvas>
            <img src="images/duo-tutorial-leds.png" alt="Duo Logo" class="duo-image">
            <div id="deviceButton" class="device-button">
              <!-- SVG Circular Progress Bar -->
              <a class=device-button-text>Press</a>
              <svg class="progress-ring" viewBox="0 0 64 64" width="64" height="64">
                <circle class="progress-ring__circle" stroke="#0080ff" stroke-width="6" fill="transparent" r="28" cx="32" cy="32"/>
              </svg>
            </div>
          </div>
        </div>
        <p class="tutorial-step-number">1</p>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);

    // need to assign this member
    this.ledCanvas = document.getElementById('ledLightshowCanvas');

    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;

    // Update the offset to animate
    function setProgress(percent) {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

  }

  // Adjust the handlePressStart method to ensure correct press start handling
  handlePressStart(event) {
    if (this.buttonDown) {
      return; // Prevent multiple press starts if already pressed
    }

    this.buttonDown = true; // Mark the button as being pressed
    this.pressStartTime = new Date().getTime(); // Store the press start time

    // Trigger the 'down' action for the current step
    this.steps[this.currentStep].action('down');

    // Update the progress ring for long press visualization
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`; // Start with the circle empty

    // Animate the stroke fill for buttonTime if defined
    if (this.steps[this.currentStep].buttonTime) {
      circle.style.transition = `stroke-dashoffset ${this.steps[this.currentStep].buttonTime}s linear`;
      circle.style.strokeDashoffset = '0'; // Start the progress bar fill
    }

    // Add visual indication of button press
    document.querySelector('.device-button').classList.add('device-button-pressed');
  }

  // Adjust the handlePressEnd method to ensure correct press release handling
  handlePressEnd(event) {
    if (!this.buttonDown) {
      return; // Prevent handling press end if button wasn't pressed
    }

    this.buttonDown = false; // Mark the button as released

    // Calculate the duration of the button press
    const pressDuration = new Date().getTime() - this.pressStartTime;

    // Trigger the 'up' action with the press duration
    this.steps[this.currentStep].action('up', pressDuration);

    // Reset the progress ring to its initial state
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.transition = 'none'; // Instantly reset the progress bar
    circle.style.strokeDashoffset = `${circumference}`; // Set back to full circumference (empty)

    // Remove the visual indication of button press
    document.querySelector('.device-button').classList.remove('device-button-pressed');

    // Update the tutorial step based on the action performed
    this.updateTutorialStep(this.currentStep);
  }

  adjustFontSizeToFit(element) {
    const initialFontSize = 20; // Starting font size in pixels
    let fontSize = initialFontSize;
    element.style.fontSize = `${fontSize}px`;

    // Loop until the text fits or reaches the minimum font size
    while (element.scrollHeight > element.clientHeight && fontSize > 10) { // 10px as a minimum font size
      fontSize -= 1;
      element.style.fontSize = `${fontSize}px`;
    }
  }

  updateTutorialStep(stepIndex) {
    const step = this.steps[stepIndex];
    const contentEl = document.querySelector('.tutorial-step-content');
    contentEl.style.fontSize = '20px'; // Reset font size to starting point

    // Set content text
    let content = (typeof step.content === 'function') ? step.content() : step.content;
    contentEl.innerHTML = content;

    // Adjust font size if the content overflows
    this.adjustFontSizeToFit(contentEl);

    // Update other elements as usual
    document.querySelector('.tutorial-step-title').textContent = `${step.title}`;
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

  gotoStep(stepTitle, prepare = false) {
    const stepIndex = this.steps.findIndex(step => step.title === stepTitle);
    if (stepIndex !== -1) {
      this.currentStep = stepIndex;
      this.updateTutorialStep(stepIndex);
      if (prepare) {
        this.steps[stepIndex].prepare();
      }
      this.stepData.clickCounter = 0; // Reset click counter for the new step
    } else {
      console.error(`Step with title "${stepTitle}" not found.`);
    }
  }
}

