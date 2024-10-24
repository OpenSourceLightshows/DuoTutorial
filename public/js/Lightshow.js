/* Lightshow.js */
export default class Lightshow {
  static instanceCount = 0;

  // constructor for draw6
  constructor(vortexLib, canvas, modeData = null, configurableSectionCount = 100) {
    this.id = Lightshow.instanceCount++;
    this.canvas = canvas;
    if (!this.canvas) {
      throw new Error(`Canvas with ID ${canvasId} not found`);
    }
    this.ctx = this.canvas.getContext('2d');
    this.dotSize = 15;
    this.blurFac = 3;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;  // Set the canvas internal width to match the displayed size
    this.canvas.height = rect.height;  // Set the canvas internal height to match the displayed size
    this.radius = ((this.canvas.width > this.canvas.height) ? this.canvas.height : this.canvas.width) / 3;
    this.tickRate = 1;
    this.trailSize = 150;
    this.spread = 25;
    this.angle = 0;
    this.currentShape = 'circle'; // Default shape
    this.direction = 1;
    this.vortexLib = vortexLib;
    this.vortexLib.Vortex.init();
    this.vortexLib.Vortex.setLedCount(1);
    this.vortexLib.Tick();
    this.animationFrameId = null;
    this.configurableSectionCount = configurableSectionCount;
    this.sectionWidth = this.canvas.width / this.configurableSectionCount;
    this.boundDraw = this.draw.bind(this);
    this.ctx.fillStyle = 'rgba(0, 0, 0)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.modeData = modeData;
    this.applyModeData();
    this.targetLeds = [0];
    this.enabled = false;

    // Initialize histories for each LED
    this.updateHistories();
  }

  setFlashCanvas(canvas) {
    this.flashCanvas = canvas;
    this.flashCtx = this.flashCanvas.getContext('2d');
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
  }

  setEnabled(enable) {
    this.enabled = enable;
  }

  setLedCount(count) {
    this.vortexLib.Vortex.setLedCount(count);
    this.updateHistories();
  }

  resetToCenter() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.sectionWidth = this.canvas.width / this.configurableSectionCount;
    this.ctx.fillStyle = 'rgba(0, 0, 0)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.histories = this.histories.map(() => []);
  }

  // Method to update histories based on the LED count
  updateHistories() {
    const ledCount = this.ledCount();
    this.histories = [];
    for (let i = 0; i < ledCount; i++) {
      this.histories.push([]);
    }
  }

  applyModeData() {
    if (!this.modeData) {
      return;
    }
    var set = new this.vortexLib.Colorset();
    this.modeData.colorset.forEach(hexCode => {
      const normalizedHex = hexCode.replace('0x', '#');
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
      if (result) {
        set.addColor(new this.vortexLib.RGBColor(
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ));
      }
    });
    // grab the 'preview' mode for the current mode (randomizer)
    let demoMode = this.vortexLib.Modes.curMode();
    if (!demoMode) {
      return;
    }
    // set the colorset of the demo mode
    demoMode.setColorset(set, this.ledCount());
    // set the pattern of the demo mode to the selected dropdown pattern on all LED positions
    // with null args and null colorset (so they are defaulted and won't change)
    let patID = this.vortexLib.intToPatternID(this.modeData.pattern_id);
    demoMode.setPattern(patID, this.ledCount(), null, null);
    let args = new this.vortexLib.PatternArgs();
    for (let i = 0; i < this.modeData.args.length; ++i) {
      args.addArgs(this.modeData.args[i]);
    }
    this.vortexLib.Vortex.setPatternArgs(this.ledCount(), args, false);
    // re-initialize the demo mode so it takes the new args into consideration
    demoMode.init();
  }

  set tickRate(value) {
    const intValue = parseInt(value, 10);
    this._tickRate = intValue > 0 ? intValue : 1;
  }

  get tickRate() {
    return this._tickRate || 1;
  }

  set targetLeds(value) {
    this._targetLeds = value;
  }

  get targetLeds() {
    return this._targetLeds || [];
  }

  set trailSize(value) {
    const intValue = parseInt(value, 10);
    this.history = [];
    this._trailSize = intValue > 0 ? intValue : 1;
  }

  get trailSize() {
    return this._trailSize || 100;
  }

  ledCount() {
    return this.vortexLib.LedPos.LED_COUNT;
  }

  // function to set the shape
  setShape(shape) {
    // no change shape
    if (this.currentShape === shape) {
      this.direction *= -1;
    } else {
      this.currentShape = shape;
    }
  }

  draw() {
    if (this.enabled) {
      switch (this.currentShape) {
        case 'dot':
          this.feedDotPoints();
          break;
        case 'circle':
          this.feedCirclePoints();
          break;
        case 'figure8':
          this.feedFigure8Points();
          break;
        case 'heart':
          this.feedHeartPoints();
          break;
        case 'box':
          this.feedBoxPoints();
          break;
        default:
          console.warn('Unknown shape:', this.currentShape);
          return;
      }
    } else {
      this.histories = [];
    }

    this.drawHistories();
  }

  drawHistories() {
    this.ctx.fillStyle = `rgba(0, 0, 0, 1)`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.histories.forEach(history => {
      for (let index = history.length - 1; index >= 0; index--) {
        const point = history[index];
        if (!point.color.red && !point.color.green && !point.color.blue) {
          continue;
        }

        const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, this.dotSize);
        const innerAlpha = (1 - ((history.length - 1 - index) / history.length)).toFixed(2);
        const outerAlpha = this.blurFac !== 0 ? (innerAlpha / this.blurFac).toFixed(2) : innerAlpha;

        gradient.addColorStop(0, `rgba(${point.color.red}, ${point.color.green}, ${point.color.blue}, ${innerAlpha})`);
        gradient.addColorStop(0.8, `rgba(${point.color.red}, ${point.color.green}, ${point.color.blue}, ${outerAlpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, this.dotSize, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    });

    if (!this.histories.length) {
        this.flashCtx.fillStyle = `rgba(0, 0, 0, 1)`;
        this.flashCtx.fillRect(100, 0, 100, 85);
    }

    // Draw flash effect for both histories (first LED in each history)
    this.histories.forEach((history, historyIndex) => {
      if (!this.flashCtx) {
        return;
      }
      if (history.length > 0) {
        const point = history[history.length - 1];
        if (!point.color.red && !point.color.green && !point.color.blue) {
          this.flashCtx.fillStyle = `rgba(0, 0, 0, 0.5)`;
        } else {
          this.flashCtx.fillStyle = `rgba(${point.color.red}, ${point.color.green}, ${point.color.blue}, 1)`;
        }
        if (historyIndex == 0) {
          this.flashCtx.fillRect(100, 0, 100, 60);
        } else {
          this.flashCtx.fillRect(130, 55, 40, 25);
        }
      } else {
        this.flashCtx.fillStyle = `rgba(0, 0, 0, 1)`;
        this.flashCtx.fillRect(0, 0, 170, 170);
      }
    });

    // Ensure histories do not exceed the trail size
    this.histories.forEach(history => {
      while (history.length > this.trailSize) {
        history.shift();
      }
    });

    requestAnimationFrame(this.draw.bind(this));
  }

  drawFlashHistory(index, point) {
    const flashFadeFactor = 0.95; // Adjust fade-out speed for flash

  }

  flashDraw() {
    if (this._pause) return;

    const newColor = this.vortexLib.RunTick(this.vortex);
    if (newColor) {
    }

    this.animationFrameId = requestAnimationFrame(this.boundFlashDraw);
  }

  feedCirclePoints() {
    const centerX = (this.canvas.width / 2);
    const centerY = this.canvas.height / 2;

    // Set up variables to control flashing behavior
    const flashX = this.canvas.width * 0.1;  // Arbitrary location for flashing
    const flashY = this.canvas.height * 0.1; // Arbitrary location for flashing
    const flashInterval = 100;  // Controls how frequently the flash occurs
    let lastFlashTime = Date.now();  // To track flash timing

    for (let i = 0; i < this.tickRate; i++) {
      const leds = this.vortexLib.Tick();
      if (!leds) {
        continue;
      }

      // Ensure histories array has sub-arrays for each LED
      while (this.histories.length < leds.length) {
        this.histories.push([]);
      }

      this.angle += ((0.02) * this.direction);
      if (this.angle >= 2 * Math.PI) {
        this.angle = 0;
      }

      leds.forEach((col, index) => {
        let radius = this.radius + (index * this.spread);
        const x = centerX + radius * Math.cos(this.angle);
        const y = centerY + radius * Math.sin(this.angle);
        if (!col) {
          col = { red: 0, green: 0, blue: 0 };
        }
        this.histories[index].push({ x, y, color: col });
      });
    }
  }

  feedHeartPoints() {
    const centerX = (this.canvas.width / 2);
    const centerY = this.canvas.height / 2;
    const scale = (this.radius / 20) + 1;

    for (let i = 0; i < this.tickRate; i++) {
      const leds = this.vortexLib.Tick();
      if (!leds) {
        continue;
      }

      // Ensure histories array has sub-arrays for each LED
      while (this.histories.length < leds.length) {
        this.histories.push([]);
      }

      this.angle += (0.05 * this.direction); // Adjust this value to control the speed of the heart shape
      if (this.angle >= 2 * Math.PI) {
        this.angle = 0;
      }

      leds.forEach((col, index) => {
        const radiusScale = 1 + index * this.spread / 100; // Modify this line to use spread to adjust the scale
        const t = this.angle;
        const x = centerX + scale * radiusScale * 16 * Math.pow(Math.sin(t), 3);
        const y = centerY - scale * radiusScale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        if (!col) {
          col = { red: 0, green: 0, blue: 0 };
        }
        this.histories[index].push({ x, y, color: col });
      });
    }
  }

  feedBoxPoints() {
    const centerX = (this.canvas.width / 2);
    const centerY = (this.canvas.height / 2);
    const baseBoxSize = Math.min(centerX, centerY) - (500 - parseInt(this.radius));  // Start with a reasonable base size for visibility

    for (let i = 0; i < this.tickRate; i++) {
      const leds = this.vortexLib.Tick();
      if (!leds) {
        continue;
      }

      leds.forEach((col, index) => {
        const boxSize = baseBoxSize + index * this.spread;  // Actual size of the square for this LED
        const halfBoxSize = boxSize / 2;
        const fullPerimeter = 4 * boxSize;  // Total perimeter of the square

        this.angle += (this.direction * (0.01 / leds.length) * (360 / fullPerimeter));  // Increment angle proportionally to the perimeter
        if (this.angle >= 1) {  // Normalize the angle to prevent overflow
          this.angle = 0;
        } else if (this.angle < 0) {
          this.angle = 1;
        }

        const perimeterPosition = (this.angle * fullPerimeter) % fullPerimeter;  // Current position on the perimeter

        let x = centerX, y = centerY;
        if (perimeterPosition < boxSize) {
          x = centerX - halfBoxSize + perimeterPosition;
          y = centerY - halfBoxSize;
        } else if (perimeterPosition < 2 * boxSize) {
          x = centerX + halfBoxSize;
          y = centerY - halfBoxSize + (perimeterPosition - boxSize);
        } else if (perimeterPosition < 3 * boxSize) {
          x = centerX + halfBoxSize - (perimeterPosition - 2 * boxSize);
          y = centerY + halfBoxSize;
        } else {
          x = centerX - halfBoxSize;
          y = centerY + halfBoxSize - (perimeterPosition - 3 * boxSize);
        }

        if (!col) {
          col = { red: 0, green: 0, blue: 0 };
        }
        this.histories[index].push({ x, y, color: col });
      });
    }
  }

  feedFigure8Points() {
    const centerX = (this.canvas.width / 2);
    const centerY = this.canvas.height / 2;
    let baseRadius = Math.min(centerX, centerY) - (500 - parseInt(this.radius));

    for (let i = 0; i < this.tickRate; i++) {
      const leds = this.vortexLib.Tick();
      if (!leds) {
        continue;
      }

      // Ensure histories array has sub-arrays for each LED
      while (this.histories.length < leds.length) {
        this.histories.push([]);
      }

      this.angle += (0.02 * this.direction);
      if (this.angle >= 2 * Math.PI) {
        this.angle = 0;
      }

      leds.forEach((col, index) => {
        let radius = baseRadius + index * this.spread; // Adjust this value to control the distance between rings
        const x = centerX + (radius * Math.sin(this.angle)) / (1 + Math.cos(this.angle) * Math.cos(this.angle));
        const y = centerY + (radius * Math.sin(this.angle) * Math.cos(this.angle)) / (1 + Math.cos(this.angle) * Math.cos(this.angle));
        if (!col) {
          col = { red: 0, green: 0, blue: 0 };
        }
        this.histories[index].push({ x, y, color: col });
      });
    }
  }

  start() {
    this._pause = false;
    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(this.boundDraw);
    }
  }

  stop() {
    this._pause = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // get the pattern
  getPattern() {
    const demoMode = this.vortexLib.Vortex.Modes.curMode();
    return demoMode.getPattern(0);
  }

  // set the pattern
  setPattern(patternIDValue, targetLeds = this.targetLeds) {
    // the selected dropdown pattern
    const selectedPattern = this.vortexLib.PatternID.values[patternIDValue];
    // grab the 'preview' mode for the current mode (randomizer)
    let demoMode = this.vortexLib.Vortex.Modes.curMode();
    targetLeds.forEach(ledIndex => {
      // set the pattern of the demo mode to the selected dropdown pattern on all LED positions
      // with null args and null colorset (so they are defaulted and won't change)
      demoMode.setPattern(selectedPattern, ledIndex, null, null);
    });
    // re-initialize the demo mode so it takes the new args into consideration
    demoMode.init();
    // save
    this.vortexLib.Vortex.Modes.saveCurMode();
  }

  // get colorset
  getColorset(led = this.vortexLib.Vortex.Leds.LED_ANY) {
    const demoMode = this.vortexLib.Vortex.Modes.curMode();
    if (!demoMode) {
      return new this.vortexLib.Colorset();
    }
    return demoMode.getColorset(led);
  }

  // update colorset
  setColorset(colorset, targetLeds = this.targetLeds) {
    // grab the 'preview' mode for the current mode (randomizer)
    let demoMode = this.vortexLib.Vortex.Modes.curMode();
    if (!demoMode) {
      return;
    }
    // set the colorset of the demo mode
    targetLeds.forEach(ledIndex => {
      demoMode.setColorset(colorset, ledIndex);
    });
    // re-initialize the demo mode because num colors may have changed
    demoMode.init();
    // save
    //this.vortexLib.Vortex.Modes.saveCurMode();
  }

  // add a color to the colorset
  addColor(r, g, b, targetLeds = this.targetLeds) {
    // there's two ways we could do this, we could actually add a color to each
    // colorset regardless of whats there... or we could add a color to the displayed
    // colorset (first selected led) then set that colorset on the rest thereby overwriting
    // I think the more intuitive approach is the latter which overwrites
    let set = this.getColorset(targetLeds[0]);
    set.addColor(new this.vortexLib.RGBColor(r, g, b));
    targetLeds.forEach(ledIndex => {
      this.setColorset(set, [ledIndex]);
    });
  }

  // delete a color from the colorset
  delColor(index, targetLeds = this.targetLeds) {
    let set = this.getColorset(targetLeds[0]);
    if (set.numColors() <= 1) {
      return;
    }
    set.removeColor(index);
    targetLeds.forEach(ledIndex => {
      this.setColorset(set, [ledIndex]);
    });
  }

  // update a color in the colorset
  updateColor(index, r, g, b, targetLeds = this.targetLeds) {
    let set = this.getColorset(targetLeds[0]);
    set.set(index, new this.vortexLib.RGBColor(r, g, b));
    targetLeds.forEach(ledIndex => {
      this.setColorset(set, [ledIndex]);
    });
  }
}
