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
    this.trackRecursion = opt.trackRecursion || false;
    this.timeLimit = opt.timeLimit || Infinity; // Default: no time limit.
    this.heuristic = opt.heuristic || function(dx, dy,) { 
        return dx + dy; // Default to Manhattan distance
    };
}


/**
 * Find and return the path. When an empty array is returned, either
 * no path is possible, or the maximum execution time is reached.
 *
 * @return {Array.<[number, number]>} The path, including both start and end positions.
 */
IDAStarFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
    var nodesVisited = 0;
    var startTime = new Date().getTime();
    var maxDepth = 1000; // Prevents too deep recursion

    var start = grid.getNodeAt(startX, startY);
    var end = grid.getNodeAt(endX, endY);

    console.log("Starting search from: ", start);
    console.log("Goal node: ", end);

    // Handle dynamic heuristic
    var h = function(a, b) {
        return this.heuristic(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    }.bind(this);

    var search = function(node, g, cutoff, route, depth) {
        nodesVisited++;
        
        console.log("Visiting node: ", node, " with f-score: ", g + h(node, end) * this.weight);

        if (depth > maxDepth) {
            console.error("Recursion depth exceeded");
            return Infinity;
        }

        if (this.timeLimit > 0 && new Date().getTime() - startTime > this.timeLimit * 1000) {
            return Infinity;
        }

        var f = g + h(node, end) * this.weight;

        if (f > cutoff) {
            return f;
        }

        if (node === end) {
            route[depth] = [node.x, node.y];
            return node;
        }

        var min = Infinity;
        var neighbours = grid.getNeighbors(node, false); // No diagonal movement

        for (var k = 0; k < neighbours.length; ++k) {
            var neighbour = neighbours[k];

            if (neighbour.tested) continue;

            if (this.trackRecursion) {
                neighbour.retainCount = neighbour.retainCount + 1 || 1;
                if (neighbour.tested !== true) {
                    neighbour.tested = true;
                }
            }

            var t = search(neighbour, g + cost(node, neighbour), cutoff, route, depth + 1);

            if (t instanceof Node) {
                route[depth] = [node.x, node.y];
                return t;
            }

            if (this.trackRecursion && (--neighbour.retainCount) === 0) {
                neighbour.tested = false;
            }

            if (t < min) {
                min = t;
            }
        }

        return min;
    }.bind(this);

    var cutOff = h(start, end);

    for (var j = 0; true; ++j) {
        var route = [];
        var t = search(start, 0, cutOff, route, 0);

        if (t === Infinity) {
            return [];
        }

        if (t instanceof Node) {
            return route;
        }

        cutOff = t;
    }
};


module.exports = IDAStarFinder;
