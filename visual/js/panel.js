/**
 * The control panel.
 */
var Panel = {
    selectedColor: 'black',  // Default to 'Wall (Black)'
    currentWL: 0,  // Default water level
    currentT: 0,   // Default time

    init: function () {
        var $algo = $('#algorithm_panel');

        $('.panel').draggable();
        $('.accordion').accordion({
            collapsible: false,
        });
        $('.option_label').click(function () {
            $(this).prev().click();
        });
        $('#hide_instructions').click(function () {
            $('#instructions_panel').slideUp();
        });
        $('#play_panel').css({
            top: $algo.offset().top + $algo.outerHeight() + 20
        });
        $('#button2').attr('disabled', 'disabled');

        // Add event listener for cell color options
        $('input[name="cell_option"]').on('change', function () {
            Panel.selectedColor = $(this).val().toLowerCase();  // Ensure the value is lowercase

            // Update WL and T based on selected color
            switch (Panel.selectedColor) {
                case 'black':
                    Panel.currentWL = 0;
                    Panel.currentT = 0;
                    break;
                case 'green':
                    Panel.currentWL = 1;  // Low Water Level
                    Panel.currentT = Math.floor(Math.random() * 10) + 1;  // Randomize T from 1-10
                    break;
                case 'orange':
                    Panel.currentWL = 2;  // Moderate Water Level
                    Panel.currentT = Math.floor(Math.random() * 10) + 1;  // Randomize T from 1-10
                    break;
                case 'red':
                    Panel.currentWL = 3;  // High Water Level
                    Panel.currentT = Math.floor(Math.random() * 10) + 1;  // Randomize T from 1-10
                    break;
            }
        });
    },

    // Add a method to retrieve the current WL and T values
    getCurrentWaterLevelAndTime: function () {
        return {
            WL: this.currentWL,
            T: this.currentT
        };
    },

    /**
     * Get the user selected path-finder.
     * TODO: clean up this messy code.
     */
    getFinder: function () {
        var finder, selected_header, heuristic, allowDiagonal, biDirectional, dontCrossCorners, weight, trackRecursion, timeLimit;

        selected_header = $(
            '#algorithm_panel ' +
            '.ui-accordion-header[aria-selected=true]'
        ).attr('id');

        switch (selected_header) {

            case 'astar_header':
                allowDiagonal = typeof $('#astar_section ' +
                    '.allow_diagonal:checked').val() !== 'undefined';
                biDirectional = typeof $('#astar_section ' +
                    '.bi-directional:checked').val() !== 'undefined';
                dontCrossCorners = typeof $('#astar_section ' +
                    '.dont_cross_corners:checked').val() !== 'undefined';

                /* parseInt returns NaN (which is falsy) if the string can't be parsed */
                weight = parseInt($('#astar_section .spinner').val()) || 1;
                weight = weight >= 1 ? weight : 1; /* if negative or 0, use 1 */

                heuristic = $('input[name=astar_heuristic]:checked').val();
                if (biDirectional) {
                    finder = new PF.BiAStarFinder({
                        allowDiagonal: allowDiagonal,
                        dontCrossCorners: dontCrossCorners,
                        heuristic: PF.Heuristic[heuristic],
                        weight: weight
                    });
                } else {
                    finder = new PF.AStarFinder({
                        allowDiagonal: allowDiagonal,
                        dontCrossCorners: dontCrossCorners,
                        heuristic: PF.Heuristic[heuristic],
                        weight: weight
                    });
                }
                break;

            case 'ida_header':
                allowDiagonal = typeof $('#ida_section ' +
                    '.allow_diagonal:checked').val() !== 'undefined';
                dontCrossCorners = typeof $('#ida_section ' +
                    '.dont_cross_corners:checked').val() !== 'undefined';
                trackRecursion = typeof $('#ida_section ' +
                    '.track_recursion:checked').val() !== 'undefined';

                heuristic = $('input[name=jump_point_heuristic]:checked').val();

                weight = parseInt($('#ida_section input[name=astar_weight]').val()) || 1;
                weight = weight >= 1 ? weight : 1; /* if negative or 0, use 1 */

                timeLimit = parseInt($('#ida_section input[name=time_limit]').val());

                // Any non-negative integer, indicates "forever".
                timeLimit = (timeLimit <= 0 || isNaN(timeLimit)) ? -1 : timeLimit;

                finder = new PF.IDAStarFinder({
                    timeLimit: timeLimit,
                    trackRecursion: trackRecursion,
                    allowDiagonal: allowDiagonal,
                    dontCrossCorners: dontCrossCorners,
                    heuristic: PF.Heuristic[heuristic],
                    weight: weight
                });

                break;
        }

        return finder;
    }
};
