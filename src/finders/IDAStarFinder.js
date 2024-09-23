var Util = require('../core/Util');
var Heuristic = require('../core/Heuristic');
var Node = require('../core/Node');

/**
 * Iterative Deeping A Star (IDA*) path-finder.
 *
 * @constructor
 * @param {object} opt
 * @param {function} opt.heuristic Heuristic function to estimate the distance (defaults to manhattan).
 * @param {integer} opt.weight Weight to apply to the heuristic to allow for suboptimal paths, in order to speed up the search.
 * @param {object} opt.trackRecursion Whether to track recursion for statistical purposes.
 * @param {object} opt.timeLimit Maximum execution time. Use <= 0 for infinite.
 */
function IDAStarFinder(opt) {
    opt = opt || {};
    this.weight = opt.weight || 1;
    this.trackRecursion = opt.trackRecursion || true;
    this.timeLimit = opt.timeLimit || 10; // Default: no time limit.

    // Choose heuristic based on the user's choice or default to 'manhattan'
    if (opt.heuristic == 'enhancedheuristics') {
        this.heuristic = Heuristic.enhancedheuristic;
    } else {
        this.heuristic = Heuristic.manhattan;  // Default heuristic
    }
}

/**
 * Find and return the path. When an empty array is returned, either
 * no path is possible, or the maximum execution time is reached.
 *
 * @return {Array.<[number, number]>} The path, including both start and end positions.
 */
IDAStarFinder.prototype.findPath = function (startX, startY, endX, endY, grid) {
    // Used for statistics:
    var nodesVisited = 0;

    // Execution time limitation:
    var startTime = new Date().getTime();

    // Heuristic helper:
    var h = function (a, b) {
        var dx = Math.abs(b.x - a.x);
        var dy = Math.abs(b.y - a.y);
        var WL = a.WL;
        var T = a.T;
        return this.heuristic(dx, dy, WL, T);
    }.bind(this);

    // Step cost from a to b:
    var cost = function (a, b) {
        var WL = b.WL;
        var T = b.T;
        return ((a.x === b.x || a.y === b.y) ? 1 : Math.SQRT2) * WL + T;

    };

    var search = function (node, g, cutoff, route, depth) {
        nodesVisited++;

        // Enforce timelimit:
        if (this.timeLimit > 0 &&
            new Date().getTime() - startTime > this.timeLimit * 1000) {
            // Enforced as "path-not-found".
            return Infinity;
        }

        var f = g + h(node, end) * this.weight;

        // We've searched too deep for this iteration.
        if (f > cutoff) {
            return f;
        }

        if (node == end) {
            route[depth] = [node.x, node.y];
            return node;
        }

        var min, t, k, neighbour;
        var neighbours = grid.getNeighbors(node, this.diagonalMovement);

        for (k = 0, min = Infinity; neighbour = neighbours[k]; ++k) {
            t = search(neighbour, g + cost(node, neighbour), cutoff, route, depth + 1);

            if (t instanceof Node) {
                route[depth] = [node.x, node.y];
                return t;
            }

            if (t < min) {
                min = t;
            }
        }

        return min;

    }.bind(this);

    // Node instance lookups:
    var start = grid.getNodeAt(startX, startY);
    var end = grid.getNodeAt(endX, endY);

    // Initial search depth
    var cutOff = h(start, end);

    var j, route, t;

    for (j = 0; true; ++j) {
        route = [];

        // Search till cut-off depth:
        t = search(start, 0, cutOff, route, 0);

        // Route not possible, or not found in time limit.
        if (t === Infinity) {
            return [];
        }

        // If t is a node, it's also the end node. Route is now populated with a valid path to the end node.
        if (t instanceof Node) {
            return route;
        }

        // Try again, this time with a deeper cut-off. The t score is the closest we got to the end node.
        cutOff = t;
    }

    return [];
};

module.exports = IDAStarFinder;
