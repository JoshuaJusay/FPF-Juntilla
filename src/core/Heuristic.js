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
  manhattan: function(dx, dy) {
      return dx + dy;
  },

  /**
  * Safest-route heuristic.
  * @param {number} WL - Water level at node n.
  * @param {number} T - Time at node n.
  * @return {number} Math.abs(WL * T)
  */
  safestroute: function(WL, T) {
      return Math.abs(WL * T);
  },

  /**
   * Combined weighted Manhattan and safest-route heuristic.
   * @param {number} dx - Difference in x.
   * @param {number} dy - Difference in y.
   * @param {number} WL - Water level at node n.
   * @param {number} T - Time at node n.
   * @param {number} manhattanWeight - Weight for the Manhattan distance heuristic.
   * @param {number} safestRouteWeight - Weight for the safest-route heuristic.
   * @return {number} Weighted combination of Manhattan distance and safest-route heuristic.
   */
  enhancedheuristic: function(dx, dy, WL, T, manhattanWeight, safestRouteWeight) {
      // Calculate Manhattan distance
      const manhattanDistance = dx + dy;
      
      // Calculate safest-route value
      const safestRouteValue = Math.abs(WL * T);
      
      // Combine the two heuristics using the provided weights
      return (manhattanWeight * manhattanDistance) + (safestRouteWeight * safestRouteValue);
  }

};

//Added Safest-route Heuristic - subject to changes/temporary (19/8)
//Removed unnecessary Heuristics (20/8)
//Added formula for the fused heuristics each with corresponding weights (given weight is tentative might change based on the test and experiments to be conducted)(21/8)
