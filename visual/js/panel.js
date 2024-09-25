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

        // Add event listener for heuristic options
        document.getElementById('ida_heuristic').addEventListener('change', function (event) {
            if (event.target.name === 'ida_heuristic') {
                const finder = Panel.getFinder();  // Get the current IDAStarFinder instance
                if (!finder) {
                    console.error("Finder is not defined.");
                    return;
                }
                // Change the heuristic based on user selection
                if (event.target.value === 'manhattan') {
                    Panel.finder = new PF.IDAStarFinder({
                        heuristic: PF.Heuristic.manhattan,
                    });
                } else if (event.target.value === 'enhancedheuristic') {
                    Panel.finder = new PF.IDAStarFinder({
                    });
                }
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


    getFinder: function () {
        var finder, heuristic, allowDiagonal = false, dontCrossCorners = false, weight, trackRecursion = false, timeLimit;

        heuristic = $('input[name=ida_heuristics]:checked').val() || 'manhattan';

        weight = parseInt($('#ida_section input[name=astar_weight]').val()) || 3;
        weight = weight >= 1 ? weight : 1; /* if negative or 0, use 1 */

        timeLimit = 10;

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



        return finder;
    }


};
