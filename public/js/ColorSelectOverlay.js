export default class ColorSelectOverlay {
  constructor() {
    this.colorset = [];
    this.selectedIndex = 0;
    this.selectedName = 'Color Slot 1';
    this.deleteMode = false;
    this.activeDropdown = null;
    this.selectedDropdownIndex = 0;
    this.hueQuad = -1;
    this.hueValue = -1;
    this.satValue = -1;
    this.startingLightness = 0;
  }

  initialize(initialColors = []) {
    this.colorset = initialColors.slice(0, 8);
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'color-select-overlay';
    this.overlayElement.classList.add('color-select-overlay');
    document.body.appendChild(this.overlayElement);
    this.renderSlots();
  }

  close() {
    // Remove the overlay element from the DOM if it exists
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }

    // Reset relevant state properties to their default values
    this.activeDropdown = null;
    this.selectedIndex = 0;
    this.selectedName = 'Color Slot 1';
    this.deleteMode = false;
    this.hueQuad = -1;
    this.hueValue = -1;
    this.satValue = -1;
    this.startingLightness = 0;
    this.selectedDropdownIndex = 0;
  }

  renderSlots() {
    this.overlayElement.innerHTML = '';
    this.colorset.forEach((color, index) => {
      const slot = document.createElement('div');
      slot.classList.add('slot', 'color-slot');
      slot.style.backgroundColor = color;
      slot.style.color = color;
      slot.dataset.index = index;
      if (index === this.selectedIndex) {
        slot.classList.add('slot-selected');
      }
      slot.addEventListener('mousedown', () => this.startHold(index));
      slot.addEventListener('mouseup', () => this.handleTap(index));
      slot.addEventListener('mouseleave', () => this.cancelHold());
      this.overlayElement.appendChild(slot);
    });
    if (this.colorset.length < 8) {
      const addSlot = document.createElement('div');
      addSlot.classList.add('slot', 'add-slot');
      addSlot.innerHTML = '<div class="slot-plus-icon">+</div>';
      if (this.colorset.length === this.selectedIndex) {
        addSlot.classList.add('slot-selected');
      }
      addSlot.addEventListener('click', () => this.addNewColor());
      this.overlayElement.appendChild(addSlot);
    }
    for (let i = this.colorset.length + 1; i < 8; i++) {
      const emptySlot = document.createElement('div');
      emptySlot.classList.add('slot', 'empty');
      this.overlayElement.appendChild(emptySlot);
    }
    const exitSlot = document.createElement('div');
    exitSlot.classList.add('slot', 'exit-slot');
    exitSlot.innerHTML = `<div class="slot-back-icon">←</div>`;
    if (8 === this.selectedIndex) {
      exitSlot.classList.add('slot-selected');
    }
    this.overlayElement.appendChild(exitSlot);
  }

  addNewColor() {
    if (this.colorset.length < 8) {
      this.colorset.push('#000000');
      this.renderSlots();
    }
  }

  selectionType() {
    if (this.selectedIndex === 8) {
      return 2;
    } else if (this.selectedIndex < 8 && this.selectedIndex === (this.colorset.length)) {
      return 1;
    }
    return 0;
  }

  iterateSelecton() {
    this.selectedIndex++;
    if (this.selectedIndex >= 9) {
      this.selectedIndex = 0;
    } else if (this.selectedIndex >= (this.colorset.length + 1)) {
      this.selectedIndex = 8;
    }
    if (this.selectedIndex === 8) {
      this.selectedName = 'Exit';
    } else if (this.selectedIndex < 8 && this.selectedIndex === (this.colorset.length)) {
      this.selectedName = 'Add Color #' + (this.selectedIndex + 1);
    } else {
      this.selectedName = 'Edit Color #' + (this.selectedIndex + 1);
    }
    this.renderSlots();
  }

  startHold(index) {
    this.holdTimer = setTimeout(() => {
      this.deleteMode = true;
      this.startFlashingRed(index);
    }, 500);
  }

  cancelHold() {
    clearTimeout(this.holdTimer);
    if (this.deleteMode) {
      this.stopFlashingRed();
    }
  }

  handleTap(index) {
    if (!this.deleteMode) {
      this.selectedIndex = index;
      this.renderSlots();
    } else {
      this.colorset.splice(index, 1);
      this.renderSlots();
      this.deleteMode = false;
    }
  }

  startFlashingRed() {
    const slot = this.overlayElement.querySelector('.slot-selected');
    if (slot) {
      slot.classList.add('flashing-red');
    }
  }

  stopFlashingRed() {
    const slots = this.overlayElement.querySelectorAll('.slot');
    slots.forEach(slot => slot.classList.remove('flashing-red'));
    this.deleteMode = false;
  }

  activateQuadrantSelection(backwards = false) {
    // reset these anytime visiting quadrant selection, backwards or not
    this.hueQuad = -1;
    this.hueValue = -1;
    this.satValue = -1;
    this.showHueQuadrantDropdown();
    this.selectedDropdownIndex = 0;
  }

  activateHueSelection(backwards = false) {
    if (!backwards) {
      this.hueQuad = this.selectedDropdownIndex;
    }
    this.showHueDropdown();
    this.selectedDropdownIndex = 0;
  }

  activateSaturationSelection(backwards = false) {
    if (!backwards) {
      this.hueValue = (this.hueQuad * 90) + this.selectedDropdownIndex * 22.5;
      console.log("Hue val: " + this.hueValue);
    }
    this.showSaturationDropdown();
    this.selectedDropdownIndex = 0;
  }

  activateBrightnessSelection() {
    this.satValue = (3 - this.selectedDropdownIndex) * 33;
    this.showBrightnessDropdown();
    this.selectedDropdownIndex = 0;
  }

  iterateDropdownSelection() {
    if (!this.activeDropdown) return;

    const optionsContainer = this.activeDropdown.querySelector('.dropdown-options-container');
    const options = Array.from(optionsContainer.querySelectorAll('.dropdown-option'));

    // Find the currently selected option
    const currentIndex = options.findIndex(option => option.classList.contains('dropdown-option-selected'));
    this.selectedDropdownIndex = currentIndex;

    if (this.selectedDropdownIndex !== -1) {
      // Remove selected class from current option
      options[this.selectedDropdownIndex].classList.remove('dropdown-option-selected');

      // Calculate the next index, wrapping around to the first option if at the end
      this.selectedDropdownIndex = (this.selectedDropdownIndex + 1) % options.length;

      // Add selected class to the new option
      options[this.selectedDropdownIndex].classList.add('dropdown-option-selected');
    }
  }

  showHueQuadrantDropdown() {
    this.closeDropdown();
    const hueQuadrants = [
      { value: 0, backgroundImage: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(70, 100%, 50%))' },
      { value: 90, backgroundImage: 'linear-gradient(to right, hsl(90, 100%, 50%), hsl(160, 100%, 50%))' },
      { value: 180, backgroundImage: 'linear-gradient(to right, hsl(180, 100%, 50%), hsl(250, 100%, 50%))' },
      { value: 270, backgroundImage: 'linear-gradient(to right, hsl(270, 100%, 50%), hsl(340, 100%, 50%))' }
    ];
    const hueQuadrantDropdown = this.createDropdown(hueQuadrants, 'Select Quadrant:');
    document.body.appendChild(hueQuadrantDropdown);
    this.positionDropdown(hueQuadrantDropdown);
    this.activeDropdown = hueQuadrantDropdown;
  }

  closeDropdown() {
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }
  }

  createDropdown(options, title) {
    // make the dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    // make the title of the dropdown
    const titleElement = document.createElement('div');
    titleElement.className = 'dropdown-title';
    titleElement.textContent = title;
    dropdown.appendChild(titleElement);

    // make the options of the dropdown
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'dropdown-options-container';

    // all of the 4 options
    options.forEach((option, index) => {
      const box = document.createElement('div');
      box.className = 'dropdown-option';
      if (index === 0) {
        box.className = 'dropdown-option dropdown-option-selected';
      }
      if (option.backgroundImage) {
        box.style.backgroundImage = option.backgroundImage;
      } else {
        box.style.backgroundColor = option.color;
      }
      optionsContainer.appendChild(box);
    });

    // add the exit option
    const exitBox = document.createElement('div');
    exitBox.className = 'dropdown-option dropdown-exit-option';
    exitBox.innerHTML = `<div class="dropdown-option-back-icon">↶</div>`;
    optionsContainer.appendChild(exitBox);

    // add the options to the dropdown
    dropdown.appendChild(optionsContainer);

    return dropdown;
  }

  positionDropdown(dropdown) {
    if (!dropdown) return;
    const rect = dropdown.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + window.scrollY + 10}px`;
    dropdown.style.right = '10px';
  }

  calculateLightnessForSaturation(saturation) {
    // If saturation is 0 (pure white), set base lightness to 100%
    return saturation === 0 ? 100 : 50 + (100 - saturation) / 2;
  }

  showHueDropdown() {
    this.closeDropdown();
    const hues = Array.from({ length: 4 }, (_, i) => {
      const hue = (this.hueQuad * 90) + i * 22.5;
      return { value: hue, color: `hsl(${hue}, 100%, 50%)` };
    });
    const hueDropdown = this.createDropdown(hues, 'Select Hue:');
    document.body.appendChild(hueDropdown);
    this.positionDropdown(hueDropdown);
    this.activeDropdown = hueDropdown;
  }

  showSaturationDropdown() {
    this.closeDropdown();
    const saturations = [
      { value: 100, color: `hsl(${this.hueValue}, 100%, 50%)` },
      { value: 66, color: `hsl(${this.hueValue}, 66%, 60%)` },
      { value: 33, color: `hsl(${this.hueValue}, 33%, 80%)` },
      { value: 0, color: `hsl(${this.hueValue}, 0%, 100%)` }
    ];
    const saturationDropdown = this.createDropdown(saturations, 'Select Saturation:');
    document.body.appendChild(saturationDropdown);
    this.positionDropdown(saturationDropdown);
    this.activeDropdown = saturationDropdown;
  }


  showBrightnessDropdown() {
    this.closeDropdown(); // Close any existing dropdown

    const sat = this.satValue;
    const hue = this.hueValue;

    // Set up the starting lightness based on chosen saturation level
    if (sat === 0) {
      this.startingLightness = 100; // White if saturation is zero
    } else if (sat === 100) {
      this.startingLightness = 50; // Full brightness for fully saturated color
    } else {
      this.startingLightness = 50 + (100 - sat) / 2; // Calculate midpoint lightness
    }

    // Define brightness options scaling down the lightness to black
    const brightnesses = [
      { value: this.startingLightness, color: `hsl(${hue}, ${sat}%, ${this.startingLightness}%)` }, // Start with the base color
      { value: this.startingLightness * 0.66, color: `hsl(${hue}, ${sat}%, ${this.startingLightness * 0.66}%)` }, // 66% brightness
      { value: this.startingLightness * 0.33, color: `hsl(${hue}, ${sat}%, ${this.startingLightness * 0.33}%)` }, // 33% brightness
      { value: 0, color: `hsl(${hue}, ${sat}%, 0%)` } // Black
    ];

    // Create and display the brightness dropdown
    const brightnessDropdown = this.createDropdown(brightnesses, 'Select Brightness:');
    document.body.appendChild(brightnessDropdown);
    this.positionDropdown(brightnessDropdown);
    this.activeDropdown = brightnessDropdown;
  }


  saveColor() {
    // Retrieve the exact color selected from the brightness dropdown based on selectedDropdownIndex
    const brightnessOptions = [
      `hsl(${this.hueValue}, ${this.satValue}%, ${this.startingLightness}%)`,       // Full brightness (selected index 0)
      `hsl(${this.hueValue}, ${this.satValue}%, ${this.startingLightness * 0.66}%)`, // Medium brightness
      `hsl(${this.hueValue}, ${this.satValue}%, ${this.startingLightness * 0.33}%)`, // Low brightness
      `hsl(${this.hueValue}, ${this.satValue}%, 0%)`                                 // Black
    ];

    // Use the color directly as it appears in the brightness dropdown
    const finalColor = brightnessOptions[this.selectedDropdownIndex];

    // Save the chosen color into the colorset at the current selectedIndex
    this.colorset[this.selectedIndex] = finalColor;

    // Re-render slots to display the updated color
    this.renderSlots();

    // Reset any state used for dropdown navigation
    this.selectedDropdownIndex = 0;
    this.hueValue = -1;
    this.satValue = -1;
  }

  deleteColor() {
    // Check if a valid index is selected
    if (this.selectedIndex < this.colorset.length) {
      // Remove the color at the current selectedIndex
      this.colorset.splice(this.selectedIndex, 1);

      // Re-render slots to reflect the updated colorset
      this.renderSlots();
    }
  }


}

