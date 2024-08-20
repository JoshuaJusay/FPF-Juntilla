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
  safestRoute: function(WL, T) {
      return Math.abs(WL * T);
  }

};
//Added Safest-route Heuristic - subject to changes/temporary (19/8)
//Removed unnecessary Heuristics (20/8)