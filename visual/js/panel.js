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
                    console.log("Manhattan heuristic is now set.");
                } else if (event.target.value === 'enhancedheuristic') {
                    Panel.finder = new PF.IDAStarFinder({
                        heuristic: PF.Heuristic.enhancedheuristic,
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

   
    getFinder: function () {
        var finder, selected_header, heuristic, weight, trackRecursion, timeLimit;
    
        selected_header = $(
            '#algorithm_panel ' +
            '.ui-accordion-header[aria-selected=true]'
        ).attr('id');
    
        switch (selected_header) {
            case 'ida_header':
                trackRecursion = typeof $('#ida_section ' +
                    '.track_recursion:checked').val() !== 'undefined';
    
                heuristic = $('input[name=ida_heuristic]:checked').val(); // should return 
                // Add this log to verify the exact heuristic value selected from the UI
                console.log("Selected heuristic from UI:", heuristic);
    
                timeLimit = parseInt($('#ida_section input[name=time_limit]').val());
    
                // Any non-negative integer, indicates "forever".
                timeLimit = (timeLimit <= 0 || isNaN(timeLimit)) ? -1 : timeLimit;
    
                // Add extra debug log to check if the heuristic exists in PF.Heuristic
                if (PF.Heuristic[heuristic]) {
                    console.log("Heuristic found in PF.Heuristic:", heuristic);
                } else {
                    console.log("Heuristic not found, defaulting to manhattan.");
                }
    
                finder = new PF.IDAStarFinder({
                    timeLimit: timeLimit,
                    trackRecursion: trackRecursion,
                    heuristic: PF.Heuristic[heuristic] || PF.Heuristic.manhattan,  // Initially assign heuristic
                });
    
                // Explicitly set the heuristic again to ensure it's correct
                finder.heuristic = PF.Heuristic[heuristic] || PF.Heuristic.manhattan;
                console.log("Updated heuristic:", finder.heuristic.name);  // Verify it's set correctly
    
                break;
        }
    
        return finder;
    }
    
};
