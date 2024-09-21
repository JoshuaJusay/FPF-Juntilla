const Node = require('./Node');


console.log('Checkpoint 1: Starting execution');
console.log('Node class being used:', Node);

function Grid(width, height, matrix) {
    console.log('Grid constructor called');
    this.width = width;
    this.height = height;
    this.nodes = this._buildNodes(width, height, matrix);
    console.log('Grid initialized:', this);
}

Grid.prototype._buildNodes = function (width, height, matrix) {
    console.log('Checkpoint 2: _buildNodes function is called');
    let i, j,
        nodes = new Array(height);

    for (i = 0; i < height; ++i) {
        nodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            console.log('Using Node class:', Node);  // Ensure correct Node class
            nodes[i][j] = new Node(j, i, matrix && !!matrix[i][j]);
            console.log('New Node:', nodes[i][j]);  // Confirm each node creation
        }
    }

    console.log('Checkpoint 3: Node creation loop finished');
    return nodes;
};

console.log('New Node created in Grid:', new Node(0, 0));  // Test Node instantiation

/**
 * Get the node at the given coordinates.
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
 * @return {Node} The node at (x, y)
 */
Grid.prototype.getNodeAt = function (x, y) {
    return this.nodes[y][x];
};

/**
 * Determine whether the node at the given position is walkable.
 * (Also returns false if the position is outside the grid.)
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @return {boolean} - The walkability of the node.
 */
Grid.prototype.isWalkableAt = function(x, y) {
    return this.isInside(x, y) && this.nodes[y][x].walkable;
};

/**
 * Determine whether the position is inside the grid.
 * XXX: grid.isInside(x, y) is weird to read.
 * It should be (x, y) is inside grid, but I failed to find a better
 * name for this method.
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
Grid.prototype.isInside = function(x, y) {
    return (x >= 0 && x < this.width) && (y >= 0 && y < this.height);
};

/**
 * Set whether the node on the given position is walkable.
 * NOTE: throws exception if the coordinate is not inside the grid.
 * @param {number} x - The x coordinate of the node.
 * @param {number} y - The y coordinate of the node.
 * @param {boolean} walkable - Whether the position is walkable.
 */
Grid.prototype.setWalkableAt = function(x, y, walkable) {
    this.nodes[y][x].walkable = walkable;
};

/**
 * Get the neighbors of the given node.
 *
 *     offsets      diagonalOffsets:
 *  +---+---+---+    +---+---+---+
 *  |   | 0 |   |    | 0 |   | 1 |
 *  +---+---+---+    +---+---+---+
 *  | 3 |   | 1 |    |   |   |   |
 *  +---+---+---+    +---+---+---+
 *  |   | 2 |   |    | 3 |   | 2 |
 *  +---+---+---+    +---+---+---+
 *
 *  When allowDiagonal is true, if offsets[i] is valid, then
 *  diagonalOffsets[i] and
 *  diagonalOffsets[(i + 1) % 4] is valid.
 * @param {Node} node
 * @param {DiagonalMovement} diagonalMovement
 */
Grid.prototype.getNeighbors = function(node) {
    var x = node.x,
        y = node.y,
        neighbors = [],
        nodes = this.nodes;

    // ↑
    if (this.isWalkableAt(x, y - 1)) {
        neighbors.push(nodes[y - 1][x]);
    }
    // →
    if (this.isWalkableAt(x + 1, y)) {
        neighbors.push(nodes[y][x + 1]);
    }
    // ↓
    if (this.isWalkableAt(x, y + 1)) {
        neighbors.push(nodes[y + 1][x]);
    }
    // ←
    if (this.isWalkableAt(x - 1, y)) {
        neighbors.push(nodes[y][x - 1]);
    }

    return neighbors;
};

/**
 * Get a clone of this grid.
 * @return {Grid} Cloned grid.
 */
Grid.prototype.clone = function() {
    var i, j,

        width = this.width,
        height = this.height,
        thisNodes = this.nodes,

        newGrid = new Grid(width, height),
        newNodes = new Array(height),
        row;

    for (i = 0; i < height; ++i) {
        newNodes[i] = new Array(width);
        for (j = 0; j < width; ++j) {
            newNodes[i][j] = new Node(j, i, thisNodes[i][j].walkable);
        }
    }

    newGrid.nodes = newNodes;

    return newGrid;
};
module.exports = Grid;

