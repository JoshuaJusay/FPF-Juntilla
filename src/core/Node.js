/**
 * A node in the grid.
 * This class holds some basic information about a node and custom 
 * attributes may be added, depending on the algorithms' needs.
 * @constructor
 * @param {number} x - The x coordinate of the node on the grid.
 * @param {number} y - The y coordinate of the node on the grid.
 * @param {boolean} [walkable=true] - Whether this node is walkable. Defaults to true.
 * @param {number} [WL=0] - Water level at this node. Defaults to 0.
 * @param {number} [T=0] - Time at this node. Defaults to 0.
 */
function Node(x, y, walkable = true, WL = 0, T = 0) {
    this.x = x;
    this.y = y;
    this.walkable = walkable;
    this.WL = WL;
    this.T = T;

    // Automatically determine if the node is walkable based on WL and T
    this.updateWalkability();
}

/**
 * Method to update the WL and T of a node and recheck walkability.
 * @param {number} newWL - New water level at the node.
 * @param {number} newT - New time at the node.
 */
Node.prototype.setWaterLevelAndTime = function (newWL, newT) {
    this.WL = newWL;
    this.T = newT;
    this.updateWalkability(); // Recalculate walkability after updating WL and T
};

module.exports = Node;


