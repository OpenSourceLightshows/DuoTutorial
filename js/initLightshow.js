// Initialize the Duo UI and connect to the VortexLib WASM engine
let wasmInstance;

function initWasm() {
  const wasmUrl = 'wasm/VortexLib.wasm';
  fetch(wasmUrl).then(response =>
    response.arrayBuffer()
  ).then(bytes =>
    WebAssembly.instantiate(bytes)
  ).then(results => {
    wasmInstance = results.instance;
    console.log('WASM loaded');
    setupDuoLightshow();
  });
}

function setupDuoLightshow() {
  const canvas = document.getElementById('duo-canvas');
  const ctx = canvas.getContext('2d');

  // Example: Set up rendering logic for the duo (adapt to your actual design)
  canvas.width = 600;
  canvas.height = 400;

  // Use the WASM Vortex engine to start the lightshow
  wasmInstance.exports.startLightshow();
}

function startLightshow() {
  wasmInstance.exports.startLightshow();
}

function stopLightshow() {
  wasmInstance.exports.stopLightshow();
}

window.onload = initWasm;

