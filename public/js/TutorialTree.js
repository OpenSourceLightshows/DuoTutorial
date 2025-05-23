export default class TutorialTree {
  constructor(vortexLib) {
    this.vortexLib = vortexLib;
    this.currentState = 'state-off'; // Initial state when Duo is off

    // Define the initial map structure with children
    this.map = {
      'state-all': { label: 'Duo Navigation', children: ['state-off', 'state-on'], isExpanded: true},

      // main
      'state-off': { label: 'Off', children: [] },
      'state-on': { label: 'On', children: ['state-mode-0', 'state-mode-1', 'state-mode-2', 'state-mode-3', 'state-mode-4', 'state-mode-5', 'state-mode-6', 'state-mode-7', 'state-mode-8'] },

      // modes
      'state-mode-0': { label: 'Mode 1', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-1': { label: 'Mode 2', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-2': { label: 'Mode 3', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-3': { label: 'Mode 4', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-4': { label: 'Mode 5', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-5': { label: 'Mode 6', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-6': { label: 'Mode 7', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-7': { label: 'Mode 8', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-8': { label: 'Mode 9', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },

      // menus
      'state-menu-0': { label: 'Randomizer', children: ['state-led-select', 'state-randomizing'] },
      'state-menu-1': { label: 'Mode Sharing', children:
        [
          'state-mode-sharing-send-receive',
          'state-mode-sharing-send-receive-legacy',
          'state-mode-sharing-exit'
        ]
      },
      'state-menu-2': { label: 'Color Select', children: ['state-led-select', 'state-color-select', 'state-color-select-quad', 'state-color-select-hue', 'state-color-select-sat', 'state-color-select-val'] },
      'state-menu-3': { label: 'Pattern select', children: ['state-led-select', 'state-pattern-select'] },
      'state-menu-4': { label: 'Global Brightness', children: ['state-global-brightness'] },
      'state-menu-5': { label: 'Factory Reset', children: ['state-factory-reset', 'state-factory-reset-confirm'] },

      // most menus have led select
      'state-led-select': { label: 'Led Selection' },

      // randomizer
      'state-randomizing': { label: 'Randomizing' },

      // mode sharing
      'state-mode-sharing-send-receive': { label: 'Send / Receive Modes' },
      'state-mode-sharing-send-receive-legacy': { label: 'Send / Receive Modes (Legacy)' },
      'state-mode-sharing-exit': { label: 'Exit Mode Sharing' },

      // color select
      'state-color-select': { label: 'Pick Color Slot' },
      'state-color-select-quad': { label: 'Pick Hue Quadrant' },
      'state-color-select-hue': { label: 'Pick Hue' },
      'state-color-select-sat': { label: 'Pick Saturation' },
      'state-color-select-val': { label: 'Pick Brightness' },

      // pattern select
      'state-pattern-select': { label: 'Pattern Select' },

      // global brightness
      'state-global-brightness': { label: 'Select Brightness' },

      // factory reset
      'state-factory-reset': { label: 'Cancel and Exit' },
      'state-factory-reset-confirm': { label: 'Perform Reset' },
    };

    this.initMap();
  }

  // Initialize the tree structure in the DOM
  initMap() {
    const treeContainer = document.createElement('div');
    treeContainer.id = 'tutorialTree';
    document.body.appendChild(treeContainer);

    const tutorialTitleDiv = document.createElement('div');
    tutorialTitleDiv.id = 'tutorialTitleContainer';
    const tutorialTitle = document.createElement('label');
    tutorialTitle.id = 'tutorialTitle';
    const startNode = this.map['state-off'];
    tutorialTitle.innerHTML = ('title' in startNode) ? startNode.title : '';
    tutorialTitleDiv.appendChild(tutorialTitle);
    document.body.appendChild(tutorialTitleDiv);

    // Create the tree structure
    this.updateActiveState(treeContainer, 'state-off');
  }

  renderMap(container) {
    // render the map
    this.renderMapInner(container, 'state-all', 0);
    // Add 'active' class to the new state
    document.getElementById(this.currentState)?.classList.add('active');
  }

  // Recursive function to render the map
  renderMapInner(container, stateId, depth) {
    const node = this.map[stateId];
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('tree-node');
    nodeElement.id = stateId;
    if ('ontouchstart' in window) {
      // mobile? I think?
      nodeElement.style.marginLeft = `${depth * 6}px`; // Indent based on depth level
    } else {
      nodeElement.style.marginLeft = `${depth * 10}px`; // Indent based on depth level
    }

    // Toggle arrow symbol (collapsed/expanded)
    const toggleIcon = ((this.currentState === stateId) ? '▣' : '▢');
    const toggleArrow = (node.isExpanded ? '▼' : toggleIcon);

    const selectIcon = ((node.children && node.children.length > 0) ? toggleArrow : toggleIcon);
    nodeElement.innerHTML = `${selectIcon} ${node.label}`;

    container.appendChild(nodeElement);

    // Render child nodes if expanded
    if (node.children && node.isExpanded) {
      node.children.forEach((childId) => {
        this.renderMapInner(container, childId, depth + 1);  // Increase depth when rendering children
      });
    }

    // TODO: handle clicks?
    //nodeElement.addEventListener('click', () => {
    //  this.toggleBranch(stateId); // Allow expansion/collapse on click
    //});
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

    // Update the active state after re-rendering
    this.updateActiveState(treeContainer, this.currentState);
  }

  // Handle navigation to different states based on the tree
  navigateToState(...stateIds) {
    const previousState = this.currentState; // Track the previous state
    // Multi-state navigation
    const path = this.findStatePathByFullPath(stateIds);
    if (path) {
      this.expandAndActivate(path, this.findStatePath(previousState));
    } else {
      console.warn(`Path ${stateIds.join(' -> ')} not found in the tree.`);
    }
  }

  // Recursive function to find the state path for a single node by its key
  findStatePath(targetStateId, currentStateId = 'state-all', path = []) {
    const node = this.map[currentStateId];
    if (!node) {
      console.log("Error: missing node: " + currentStateId);
      return null;
    }
    path.push(currentStateId);

    // If we have reached the target, return the full path including the target node
    if (currentStateId === targetStateId) {
      return path;
    }

    // Recurse into children if they exist
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
    path.push(currentStateId);  // Add the current state to the path
    let currentNode = this.map[currentStateId];

    // If we've reached the end of stateIds, return the path
    if (stateIds.length === 0) {
      return path;
    }

    const nextStateId = stateIds[0]; // Get the next state in the list

    // Recursively search this node's children to find the next state
    const result = this.recursiveSearchForPath(nextStateId, currentNode, [...path]);

    if (result) {
      // If we found the next state, continue searching the rest of the stateIds
      return this.findStatePathByFullPath(stateIds.slice(1), result[result.length - 1], result);
    } else {
      console.warn(`State ${nextStateId} not found in the tree.`);
      return null;  // Return null if not found
    }
  }

  recursiveSearchForPath(targetId, currentNode, path) {
    if (!currentNode.children) {
      return null;  // No children, return null
    }

    // Iterate through each child to search for the targetId
    for (const childId of currentNode.children) {
      const childNode = this.map[childId];

      // If the target is found, return the path including the target
      if (childId === targetId) {
        path.push(childId);
        return path;
      }

      // Recursively search this child's children
      const result = this.recursiveSearchForPath(targetId, childNode, [...path, childId]);
      if (result) {
        return result;  // If found, return the path
      }
    }

    return null;  // If the target is not found in any child, return null
  }

  // Expand and activate the node and its parent path
  expandAndActivate(statePath, previousPath = null) {
    // Collapse unrelated parents if we have a previous path
    this.collapseAll();

    // The final target node we're navigating to
    const targetNodeId = statePath[statePath.length - 1];
    const curNode = this.map[targetNodeId];

    // Expand all parent nodes, but not the target node itself
    const parents = this.findParents(statePath);
    parents.forEach((parentId) => {
      this.map[parentId].isExpanded = true; // Expand parents
    });

    // Ensure the target node is not expanded but is selected (active)
    curNode.isExpanded = false;

    // Re-render the tree after adjusting the parent expansions
    const treeContainer = document.getElementById('tutorialTree');
    treeContainer.innerHTML = ''; // Clear the existing tree

    const tutorialTitle = document.getElementById('tutorialTitle');
    tutorialTitle.innerHTML = ('title' in curNode) ? curNode.title : '';

    // Set the current state and mark it as active (select the target node)
    this.updateActiveState(treeContainer, targetNodeId);
  }

  collapseAll() {
    for (const key in this.map) {
      if (this.map[key].children) {
        this.map[key].isExpanded = false;
      }
    }
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
  updateActiveState(treeContainer, stateId) {
    // Update the current state
    this.currentState = stateId;
    // re-render
    this.renderMap(treeContainer);
  }
}

