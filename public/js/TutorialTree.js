export default class TutorialTree {
  constructor(vortexLib) {
    this.vortexLib = vortexLib;
    this.currentState = 'state-off'; // Initial state when Duo is off

    // Define the initial map structure with children
    this.map = {
      'state-all': { label: 'Nav', children: ['state-off', 'state-on'], isExpanded: true },
      'state-off': { label: 'Off', children: [], isExpanded: false },
      'state-on': { label: 'On', children: ['state-mode-0', 'state-mode-1', 'state-mode-2', 'state-mode-3', 'state-mode-4'], isExpanded: false },
      'state-mode-0': { label: 'Mode 1', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ], isExpanded: false },
      'state-mode-1': { label: 'Mode 2', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ], isExpanded: false },
      'state-mode-2': { label: 'Mode 3', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ], isExpanded: false },
      'state-mode-3': { label: 'Mode 4', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ], isExpanded: false },
      'state-mode-4': { label: 'Mode 5', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ], isExpanded: false },
      'state-menu-0': { label: 'Randomizer', children: ['state-led-select', 'state-randomizing'] },
      'state-menu-1': { label: 'Mode Sharing', children: ['state-led-select'] },
      'state-menu-2': { label: 'Color Select', children: ['state-led-select'] },
      'state-menu-3': { label: 'Pattern select', children: ['state-led-select'] },
      'state-menu-4': { label: 'Global Brightness', children: ['state-led-select'] },
      'state-menu-5': { label: 'Factory Reset', children: ['state-led-select'] },
      'state-led-select': { label: 'Led Selection' },
      'state-randomizing': { label: 'Randomizing' },
    };

    this.initMap();
    this.updateActiveState('state-off');
  }

  // Initialize the tree structure in the DOM
  initMap() {
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tutorialTree';
    document.body.appendChild(treeContainer);

    // Create the tree structure
    this.renderMap(treeContainer, 'state-all', 0);
  }

  // Recursive function to render the map
  renderMap(container, stateId, depth) {
    const node = this.map[stateId];
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('tree-node');
    nodeElement.id = stateId;
    nodeElement.style.marginLeft = `${depth * 5}px`; // Indent based on depth level

    // Toggle arrow symbol (collapsed/expanded)
    const toggleArrow = node.children && node.label ? (node.isExpanded ? '▼' : '▶') : '';
    nodeElement.innerHTML = `${toggleArrow} ${node.label}`;

    container.appendChild(nodeElement);

    // Render child nodes if expanded
    if (node.children && node.isExpanded) {
      node.children.forEach((childId) => {
        this.renderMap(container, childId, node.label ? depth + 1 : depth);
      });
    }

    nodeElement.addEventListener('click', () => {
      this.navigateToState(stateId);
    });
  }

  // Toggle expansion/collapse of a branch
  toggleBranch(stateId) {
    const node = this.map[stateId];

    // Toggle the expanded state of the node
    if (node.children) {
      node.isExpanded = !node.isExpanded;
    }

    // Re-render the tree to reflect changes
    const treeContainer = document.getElementById('tutorialTree');
    treeContainer.innerHTML = ''; // Clear the existing tree
    this.renderMap(treeContainer, 'state-all', 0);

    // Update the active state after re-rendering
    this.updateActiveState(this.currentState);
  }

  // Handle navigation to different states based on the tree
  navigateToState(...stateIds) {
    if (stateIds.length === 1) {
      const singleState = stateIds[0];
      // If only a single state ID is given, find the first match recursively by state key
      const path = this.findStatePath(singleState);
      if (path) {
        this.expandAndActivate(path);
      } else {
        console.warn(`State ${singleState} not found in the tree.`);
      }
    } else {
      // If a path of multiple states is provided, try to match the entire path using state keys
      const path = this.findStatePathByFullPath(stateIds);
      if (path) {
        this.expandAndActivate(path);
      } else {
        console.warn(`Path ${stateIds.join(' -> ')} not found in the tree.`);
      }
    }
  }

  // Recursive function to find the state path for a single node by its key
  findStatePath(targetStateId, currentStateId = 'state-all', path = []) {
    const node = this.map[currentStateId];
    path.push(currentStateId);

    if (currentStateId === targetStateId) {
      return path;
    }

    if (node.children) {
      for (const childId of node.children) {
        const result = this.findStatePath(targetStateId, childId, [...path]); // Recurse into children
        if (result) {
          return result;
        }
      }
    }

    return null; // Return null if the targetStateId is not found
  }

  // Find the full path for a set of key state IDs by matching the state keys
  findStatePathByFullPath(stateIds, currentStateId = 'state-all', path = []) {
    path.push(currentStateId);
    let currentNode = this.map[currentStateId];

    for (const targetId of stateIds) {
      if (currentNode.children) {
        const foundChild = currentNode.children.find((childId) => childId === targetId);
        if (foundChild) {
          currentNode = this.map[foundChild];
          path.push(foundChild);
        } else {
          // If we can't find the child directly, try to recursively find it
          const recursivePath = this.findStatePath(targetId, currentStateId, path);
          if (recursivePath) {
            return recursivePath;
          }
          return null; // If no matching child found, return null
        }
      } else {
        return null; // If no children, return null
      }
    }

    return path;
  }

  // Expand and activate the node and its parent path
  expandAndActivate(statePath) {
    const node = this.map[statePath[statePath.length - 1]];

    // Find parents and expand them
    const parents = this.findParents(statePath);
    parents.forEach((parentId) => {
      this.map[parentId].isExpanded = true;
    });

    // Re-render the tree after expanding nodes
    const treeContainer = document.getElementById('tutorialTree');
    treeContainer.innerHTML = ''; // Clear the existing tree
    this.renderMap(treeContainer, 'state-all', 0);

    // Set the current state and mark it active
    this.updateActiveState(statePath[statePath.length - 1]);
  }

  // Find all parent nodes of the current node
  findParents(statePath) {
    const parents = [];
    for (let i = 0; i < statePath.length - 1; i++) {
      parents.push(statePath[i]);
    }
    return parents;
  }

  // Update the visual representation of the active state
  updateActiveState(stateId) {
    // Remove 'active' class from the previous state
    document.getElementById(this.currentState)?.classList.remove('active');

    // Update the current state
    this.currentState = stateId;

    // Add 'active' class to the new state
    document.getElementById(this.currentState)?.classList.add('active');
  }
}

