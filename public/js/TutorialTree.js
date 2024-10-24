export default class TutorialTree {
  constructor(vortexLib) {
    this.vortexLib = vortexLib;
    this.currentState = 'state-off'; // Initial state when Duo is off

    // Define the initial map structure with children
    this.map = {
      'state-all': { label: 'Duo Navigation', children: ['state-off', 'state-on'], isExpanded: true},
      'state-off': { label: 'Off', children: [] },
      'state-on': { label: 'On', children: ['state-mode-0', 'state-mode-1', 'state-mode-2', 'state-mode-3', 'state-mode-4'] },
      'state-mode-0': { label: 'Mode 1', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-1': { label: 'Mode 2', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-2': { label: 'Mode 3', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-3': { label: 'Mode 4', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
      'state-mode-4': { label: 'Mode 5', children: ['state-menu-0', 'state-menu-1', 'state-menu-2', 'state-menu-3', 'state-menu-4', 'state-menu-5' ] },
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
    if ('ontouchstart' in window) {
      // mobile? I think?
      nodeElement.style.marginLeft = `${depth * 6}px`; // Indent based on depth level
    } else {
      nodeElement.style.marginLeft = `${depth * 15}px`; // Indent based on depth level
    }

    // Toggle arrow symbol (collapsed/expanded)
    const toggleArrow = (node.isExpanded ? '▼' : '▶');
    nodeElement.innerHTML = `${toggleArrow} ${node.label}`;

    container.appendChild(nodeElement);

    // Render child nodes if expanded
    if (node.children && node.isExpanded) {
      node.children.forEach((childId) => {
        this.renderMap(container, childId, depth + 1);  // Increase depth when rendering children
      });
    }

    // Event listener to toggle branch expansion on click
    nodeElement.addEventListener('click', () => {
      this.toggleBranch(stateId); // Allow expansion/collapse on click
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
    const previousState = this.currentState; // Track the previous state

    if (stateIds.length === 1) {
      // Single state navigation
      const singleState = stateIds[0];
      const path = this.findStatePath(singleState);
      if (path) {
        this.expandAndActivate(path, this.findStatePath(previousState));
      } else {
        console.warn(`State ${singleState} not found in the tree.`);
      }
    } else if (stateIds.length > 1) {
      // Multi-state navigation
      const path = this.findStatePathByFullPath(stateIds);
      if (path) {
        this.expandAndActivate(path, this.findStatePath(previousState));
      } else {
        console.warn(`Path ${stateIds.join(' -> ')} not found in the tree.`);
      }
    } else {
      console.warn('Invalid state IDs provided.');
    }
  }

  // Recursive function to find the state path for a single node by its key
  findStatePath(targetStateId, currentStateId = 'state-all', path = []) {
    const node = this.map[currentStateId];
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
    const targetNodeId = statePath[statePath.length - 1]; // The final target node we're navigating to

    // Collapse unrelated parents if we have a previous path
    if (previousPath) {
      this.collapseUnrelatedParents(statePath, previousPath);
    }

    // Expand all parent nodes, but not the target node itself
    const parents = this.findParents(statePath);
    parents.forEach((parentId) => {
      this.map[parentId].isExpanded = true; // Expand parents
    });

    // Ensure the target node is not expanded but is selected (active)
    this.map[targetNodeId].isExpanded = false; // Don't expand the target node unless explicitly navigated inside

    // Re-render the tree after adjusting the parent expansions
    const treeContainer = document.getElementById('tutorialTree');
    treeContainer.innerHTML = ''; // Clear the existing tree
    this.renderMap(treeContainer, 'state-all', 0);

    // Set the current state and mark it as active (select the target node)
    this.updateActiveState(targetNodeId);
  }

  collapseUnrelatedParents(newStatePath, previousStatePath) {
    // Find the common parent between the two paths
    const minLength = Math.min(newStatePath.length, previousStatePath.length);
    let divergingIndex = 0;

    for (let i = 0; i < minLength; i++) {
      if (newStatePath[i] !== previousStatePath[i]) {
        divergingIndex = i;
        break;
      }
    }

    // Collapse any nodes that are no longer part of the new path
    for (let i = divergingIndex; i < previousStatePath.length; i++) {
      const parentId = previousStatePath[i];
      if (this.map[parentId]) {
        this.map[parentId].isExpanded = false;
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
  updateActiveState(stateId) {
    // Remove 'active' class from the previous state
    document.getElementById(this.currentState)?.classList.remove('active');

    // Update the current state
    this.currentState = stateId;

    // Add 'active' class to the new state
    document.getElementById(this.currentState)?.classList.add('active');
  }

}

