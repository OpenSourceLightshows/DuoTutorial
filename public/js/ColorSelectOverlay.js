export default class ColorSelectOverlay {
  constructor() {
    this.colorset = [];
    this.selectedIndex = 0; // Track selected color slot
    this.selectedName = 'Color Slot 1'; // Track selected color slot
    this.deleteMode = false; // Track if delete mode is active
    this.activeDropdown = null; // Track the active dropdown
  }

  initialize(initialColors = []) {
    this.colorset = initialColors.slice(0, 8); // Max of 8 colors

    // Create overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'color-select-overlay'; // Use ID for fixed positioning
    this.overlayElement.classList.add('color-select-overlay');

    // Append overlay container to the document
    document.body.appendChild(this.overlayElement);

    this.renderSlots();
  }

  renderSlots() {
    // Clear existing slots
    this.overlayElement.innerHTML = '';

    // Create slots for each color
    this.colorset.forEach((color, index) => {
      const slot = document.createElement('div');
      slot.classList.add('slot', 'color-slot');
      slot.style.backgroundColor = color;
      slot.style.color = color;
      slot.dataset.index = index;

      // Apply selected class if applicable
      if (index === this.selectedIndex) {
        slot.classList.add('slot-selected');
      }

      // Event listeners for color editing and deletion
      slot.addEventListener('mousedown', () => this.startHold(index));
      slot.addEventListener('mouseup', () => this.handleTap(index));
      slot.addEventListener('mouseleave', () => this.cancelHold());

      this.overlayElement.appendChild(slot);
    });

    // Add slot for new color if under 8 slots
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

    // Fill remaining empty slots to always have 8
    for (let i = this.colorset.length + 1; i < 8; i++) {
      const emptySlot = document.createElement('div');
      emptySlot.classList.add('slot', 'empty');
      this.overlayElement.appendChild(emptySlot);
    }

    // finally the exit slot
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
      this.colorset.push('#000000'); // Default color for new slots
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
    }, 500); // Hold for 500ms to enter delete mode
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
      this.colorset.splice(index, 1); // Delete color
      this.renderSlots();
      this.deleteMode = false;
    }
  }

  startFlashingRed(index) {
    const slot = this.overlayElement.querySelector(`.slot[data-index="${index}"]`);
    slot.classList.add('flashing-red');
  }

  stopFlashingRed() {
    const slots = this.overlayElement.querySelectorAll('.slot');
    slots.forEach(slot => slot.classList.remove('flashing-red'));
    this.deleteMode = false;
  }
}

