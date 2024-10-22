/* Tutorial.js */
export default class Tutorial {
  constructor(vortexLib, lightshow) {
    this.vortexLib = vortexLib;
    this.lightshow = lightshow;
    this.currentStep = 0;
    this.steps = [
      {
        title: "Step 1: Getting Started",
        content: "Let's start by pressing the 'Next' button to interact with the Duo lightshow!"
      },
      {
        title: "Step 2: Change Light Pattern",
        content: "Press '1', '2', '3', or '4' to change the lightshow pattern on your Duo."
      },
      // Additional steps can be added here...
    ];

    this.init();
  }

  init() {
    this.createTutorialOverlay();
    this.updateTutorialStep(this.currentStep);
      this.vortexLib.Vortex.setTickrate(1000);

    //document.getElementById('nextStep').addEventListener('mousedown', () => {
    //  this.vortexLib.Vortex.pressButton(0);
    //});

    //document.getElementById('nextStep').addEventListener('mouseup', () => {
    //  this.vortexLib.Vortex.releaseButton(0);
    //});

    document.getElementById('nextStep').addEventListener('click', () => {
    //  this.nextStep();
      this.vortexLib.Vortex.menuEnterClick(0);
    });

    document.getElementById('prevStep').addEventListener('click', () => {
      this.prevStep();
    });

    document.getElementById('skipTutorial').addEventListener('click', () => {
      this.skipTutorial();
    });
  }

  createTutorialOverlay() {
    const tutorialOverlay = document.createElement('div');
    tutorialOverlay.classList.add('tutorial-overlay');
    tutorialOverlay.innerHTML = `
      <div class="tutorial-content">
        <h2 class="tutorial-step-title"></h2>
        <p class="tutorial-step-content"></p>
        <div class="tutorial-actions">
          <button class="btn-prev" id="prevStep">Back</button>
          <button class="btn-next" id="nextStep">Next</button>
          <button class="btn-skip" id="skipTutorial">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(tutorialOverlay);
  }

  updateTutorialStep(stepIndex) {
    const step = this.steps[stepIndex];
    document.querySelector('.tutorial-step-title').textContent = step.title;
    document.querySelector('.tutorial-step-content').textContent = step.content;
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateTutorialStep(this.currentStep);
    }
    // Optionally: Add step-specific logic, like interacting with the lightshow
    //
    this.vortexLib.Modes.nextMode();
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateTutorialStep(this.currentStep);
    }
  }

  skipTutorial() {
    document.querySelector('.tutorial-overlay').style.display = 'none';
    // Optionally: Cleanup or finalize tutorial
  }
}

