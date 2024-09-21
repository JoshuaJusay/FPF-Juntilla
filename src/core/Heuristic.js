/**
 * @namespace PF.Heuristic
 * @description A collection of heuristic functions.
 */
module.exports = {
    /**
     * Manhattan distance.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @return {number} dx + dy
     */
    manhattan: function (dx, dy) {
        return dx + dy;
    },
    
    /**
     * Combined weighted Manhattan and safest-route heuristic.
     * @param {number} dx - Difference in x.
     * @param {number} dy - Difference in y.
     * @param {number} WL - Water level at node n.
     * @param {number} T - Time at node n.
     * @param {number} w1 - Weight for the Manhattan distance heuristic (default 0.5).
     * @param {number} w2 - Weight for the safest-route heuristic (default 0.5).
     * @return {number} Weighted combination of Manhattan distance and safest-route heuristic.
     */
    enhancedheuristic: function(dx, dy, WL, T, w1 = 0.5, w2 = 0.5) {
        // Calculate Manhattan distance
        var manhattan = dx + dy;

        // Calculate safest-route value
        var safest = WL < 4 ? Math.abs(WL * T) : 0;  // Avoid Infinity, default to 0

        // Return weighted combination of Manhattan and safest-route heuristics
        return (manhattan * w1) + (safest * w2);
    }
};

//Added Safest-route Heuristic - subject to changes/temporary (19/8)
//Removed unnecessary Heuristics (20/8)
//Added formula for the fused heuristics each with corresponding weights (given weight is tentative might change based on the test and experiments to be conducted)(21/8)
