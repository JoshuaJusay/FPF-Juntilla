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
    /**
     * The x coordinate of the node on the grid.
     * @type {number}
     */
    this.x = x;

    /**
     * The y coordinate of the node on the grid.
     * @type {number}
     */
    this.y = y;

    /**
     * Whether this node can be walked through.
     * @type {boolean}
     */
    this.walkable = walkable;

    /**
     * Water level at this node.
     * @type {number}
     */
    this.WL = WL;

    /**
     * Time at this node.
     * @type {number}
     */
    this.T = T;
}

module.exports = Node;


//Added Water level (WL) and Time (T) to accomodate the SafestRoute Heuristics
//Should also add arguments to line 29-41 whether it is walkable or not based on water levels and time

