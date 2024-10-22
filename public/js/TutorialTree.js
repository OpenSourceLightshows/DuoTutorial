export default class TutorialTree {
  constructor(vortexLib) {
    this.vortexLib = vortexLib;
    this.currentState = 'state-off'; // Initial state when Duo is off
    this.isTreeVisible = true; // Tree is visible by default on larger screens

    // Initialize the tree view
    this.initTree();

    // Add hamburger button toggle for mobile view
    this.initHamburgerToggle();
    
    // Event listeners for tree navigation
    document.querySelectorAll('.tree-node').forEach(node => {
      node.addEventListener('click', (event) => {
        const selectedState = event.target.id;
        this.navigateToState(selectedState);
      });
    });
    
    // Set the initial "Off" state as active
    this.updateActiveState('state-off');
  }

  // Initialize the tree structure in the DOM
  initTree() {
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tutorialTree';
    treeContainer.innerHTML = `
      <div id="treeContainer" class="tree-container">
        <ul class="nav-tree">
          <li id="state-off" class="tree-node">Off</li>
          <li id="state-main-modes-list" class="tree-node">Main Modes List</li>
          <ul class="sub-tree">
            <li id="state-menus-list" class="tree-node">Menus List</li>
            <ul class="sub-tree">
              <li id="state-randomizer-menu" class="tree-node">Randomizer Menu</li>
              <li id="state-mode-sharing-menu" class="tree-node">Mode Sharing Menu</li>
              <li id="state-color-select-menu" class="tree-node">Color Select Menu</li>
              <li id="state-pattern-select-menu" class="tree-node">Pattern Select Menu</li>
              <li id="state-global-brightness-menu" class="tree-node">Global Brightness Menu</li>
              <li id="state-factory-reset-menu" class="tree-node">Factory Reset Menu</li>
            </ul>
          </ul>
        </ul>
      </div>
    `;

    document.body.appendChild(treeContainer);

    // Add pull tab to toggle the tree visibility
    const pullTab = document.createElement('div');
    pullTab.id = 'pullTab';
    pullTab.innerHTML = '&#9776;'; // Hamburger icon or tab icon
    document.body.appendChild(pullTab);
  }

  // Initialize the hamburger button for mobile users
  initHamburgerToggle() {
    const treeContainer = document.getElementById('treeContainer');

    document.getElementById('pullTab').addEventListener('click', function() {
      const tree = document.getElementById('tutorialTree');
      tree.classList.toggle('open');
    });

  }

  // Handle navigation to different states based on the tree
  navigateToState(stateId) {
    this.updateActiveState(stateId);

    switch (stateId) {
      case 'state-off':
        this.vortexLib.Vortex.turnOff();
        break;
      case 'state-main-modes-list':
        this.vortexLib.Vortex.goToModesList();
        break;
      case 'state-menus-list':
        this.vortexLib.Vortex.enterMenuClick();
        this.showSubTree('state-menus-list');
        break;
      case 'state-randomizer-menu':
        this.vortexLib.Vortex.enterRandomizerMenu();
        break;
      case 'state-mode-sharing-menu':
        this.vortexLib.Vortex.enterModeSharingMenu();
        break;
      case 'state-color-select-menu':
        this.vortexLib.Vortex.enterColorSelectMenu();
        break;
      case 'state-pattern-select-menu':
        this.vortexLib.Vortex.enterPatternSelectMenu();
        break;
      case 'state-global-brightness-menu':
        this.vortexLib.Vortex.enterBrightnessMenu();
        break;
      case 'state-factory-reset-menu':
        this.vortexLib.Vortex.enterFactoryResetMenu();
        break;
      default:
        break;
    }
  }

  // Update the visual representation of the active state
  updateActiveState(stateId) {
    // Remove 'active' class from the previous state
    document.getElementById(this.currentState)?.classList.remove('active');
    
    // Add 'active' class to the new state
    document.getElementById(stateId).classList.add('active');
    
    // Update the current state
    this.currentState = stateId;
  }

  // Show sub-menus when entering a menu
  showSubTree(parentId) {
    // Expand the submenu
    const subTree = document.querySelector(`#${parentId} + .sub-tree`);
    if (subTree) {
      subTree.style.display = 'block';
    }
  }
}

