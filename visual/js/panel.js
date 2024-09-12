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
        document.getElementById('ida_heuristic').addEventListener('change', function(event) {
            if (event.target.name === 'ida_heuristic') {
                console.log("Selected heuristic:", event.target.value);
        
                // Recreate the finder based on the selected heuristic
                if (event.target.value === 'manhattan') {
                    Panel.finder = new PF.IDAStarFinder({
                        heuristic: PF.Heuristic.manhattan,
                        timeLimit: -1 // Example time limit, adjust if needed
                    });
                    console.log("Manhattan heuristic is now set.");
                } else if (event.target.value === 'enhanced') {
                    Panel.finder = new PF.IDAStarFinder({
                        heuristic: PF.Heuristic.enhancedheuristic,
                        timeLimit: -1 // Example time limit, adjust if needed
                    });
                    console.log("Enhanced heuristic is now set.");
                } else {
                    console.log("No valid heuristic selected.");
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

            case 'ida_header':
                trackRecursion = typeof $('#ida_section ' +
                    '.track_recursion:checked').val() !== 'undefined';

                heuristic = $('input[name=ida_heuristic]:checked').val();

                timeLimit = parseInt($('#ida_section input[name=time_limit]').val());

                // Any non-negative integer, indicates "forever".
                timeLimit = (timeLimit <= 0 || isNaN(timeLimit)) ? -1 : timeLimit;

                finder = new PF.IDAStarFinder({
                    timeLimit: timeLimit,
                    trackRecursion: trackRecursion,
                    heuristic: PF.Heuristic[heuristic] || PF.Heuristic.manhattan,
                });

                break;
        }

        return finder;
    }
};
