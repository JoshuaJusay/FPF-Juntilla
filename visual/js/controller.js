/**
 * The visualization controller works as a state machine.
 * See files under the `doc` folder for transition descriptions.
 * See https://github.com/jakesgordon/javascript-state-machine
 * for the document of the StateMachine module.
 */
var Controller = StateMachine.create({
    initial: 'none',
    events: [
        { name: 'init', from: 'none', to: 'ready' },
        { name: 'search', from: 'starting', to: 'searching' },
        { name: 'pause', from: 'searching', to: 'paused' },
        { name: 'finish', from: 'searching', to: 'finished' },
        { name: 'resume', from: 'paused', to: 'searching' },
        { name: 'cancel', from: 'paused', to: 'ready' },
        { name: 'modify', from: 'finished', to: 'modified' },
        { name: 'reset', from: '*', to: 'ready' },
        { name: 'clear', from: ['finished', 'modified'], to: 'ready' },
        { name: 'start', from: ['ready', 'modified', 'restarting'], to: 'starting' },
        { name: 'restart', from: ['searching', 'finished'], to: 'restarting' },
        { name: 'dragStart', from: ['ready', 'finished'], to: 'draggingStart' },
        { name: 'dragEnd', from: ['ready', 'finished'], to: 'draggingEnd' },
        { name: 'drawWall', from: ['ready', 'finished'], to: 'drawingWall' },
        { name: 'eraseWall', from: ['ready', 'finished'], to: 'erasingWall' },
        { name: 'drawWater', from: ['ready', 'finished'], to: 'drawingWater' },
        { name: 'rest', from: ['draggingStart', 'draggingEnd', 'drawingWall', 'erasingWall', 'drawingWater'], to: 'ready' }
    ]
});

$.extend(Controller, {
    gridSize: [50, 50], // number of nodes horizontally and vertically
    operationsPerSecond: 300,

    onleavenone: function () {
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1];

        this.grid = new PF.Grid(numCols, numRows);

        View.init({
            numCols: numCols,
            numRows: numRows
        });
        View.generateGrid(function () {
            Controller.setDefaultStartEndPos();
            Controller.bindEvents();
            Controller.transition(); // transit to the next state (ready)
        });

        this.$buttons = $('.control_button');
        this.hookPathFinding();

        return StateMachine.ASYNC;
    },

    setWaterAt: function (event, from, to, gridX, gridY, color) {
        var node = this.grid.getNodeAt(gridX, gridY);

        if (color == 'green') {
            node.setWaterLevelAndTime(2, 3);
            node.walkable = true;
        } else if (color == 'orange') {
            node.setWaterLevelAndTime(3, 3);
            node.walkable = true;
        } else if (color == 'red') {
            node.setWaterLevelAndTime(4, 4);
            node.walkable = true;
        } else {
            node.walkable = false;
            node.setWaterLevelAndTime(0, 0);
        }

        View.setAttributeAt(gridX, gridY, 'water', color);
    },

    setWalkableByWL: function (Level) {
        var numCols = this.gridSize[0];
        var numRows = this.gridSize[1];

        // Iterate through every node in the grid
        for (var x = 0; x < numCols; x++) {
            for (var y = 0; y < numRows; y++) {
                var node = this.grid.getNodeAt(x, y);


                if (node.WL >= Level || node.WL == 0) {
                    node.walkable = false;

                } else {
                    node.walkable = true;

                }
            }
        }
    },

    // ------------------ PRESETS ------------------------------------------------ //

    mapPreset1: function () {
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1],
            gridData = [];

        for (var x = 0; x < numCols; x++) {
            gridData[x] = [];
            for (var y = 0; y < numRows; y++) {
                var node = this.grid.getNodeAt(x, y);
                var rectColor = View.rects[y][x].attr("fill");

                gridData[x][y] = {
                    walkable: node.walkable,
                    WL: node.WL,
                    T: node.T,
                    color: rectColor
                };
            }
        }

        var preset1 = {
            gridSize: this.gridSize,
            gridData: gridData,
            startPos: { x: this.startX, y: this.startY },
            endPos: { x: this.endX, y: this.endY }
        };

        console.log("Saving grid preset:", preset1);

        var presetName = 'myGridPreset';
        localStorage.setItem(presetName, JSON.stringify(preset1));

        var jsonData = JSON.stringify(preset1, null, 4);
        var blob = new Blob([jsonData], { type: 'application/json' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'gridPreset.json';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    loadPreset: function () {
        var self = this;

        if (self.grid) {
            self.grid = null;
            $('#draw_area').empty();
        }

        var preset = JSON.parse(localStorage.getItem('myGridPreset'));

        if (!preset) {
            console.log('No preset found');
            return;
        }

        console.log("Loaded grid preset:", preset);

        self.gridSize = preset.gridSize;
        self.grid = new PF.Grid(self.gridSize[0], self.gridSize[1]);

        View.init({
            numCols: self.gridSize[0],
            numRows: self.gridSize[1]
        });

        View.generateGrid(function () {
            var gridData = preset.gridData;

            for (var x = 0; x < self.gridSize[0]; x++) {
                for (var y = 0; y < self.gridSize[1]; y++) {
                    var nodeData = gridData[x][y];
                    var node = self.grid.getNodeAt(x, y);

                    node.walkable = nodeData.walkable;
                    node.WL = nodeData.WL;
                    node.T = nodeData.T;

                    if (!node.walkable) {
                        View.setAttributeAt(x, y, 'black', false);
                    } else if (node.WL === 2) {
                        View.setWaterAt(x, y, 'green');
                    } else if (node.WL === 3) {
                        View.setWaterAt(x, y, 'orange');
                    } else if (node.WL === 4) {
                        View.setWaterAt(x, y, 'red');
                    } else {
                        View.setAttributeAt(x, y, 'white', true);
                    }
                }
            }

            self.setStartPos(preset.startPos.x, preset.startPos.y);
            self.setEndPos(preset.endPos.x, preset.endPos.y);
        });

        console.log('Preset loaded successfully and grid redrawn');
    },

    savePreset: function (presetName) {
        var presetList = JSON.parse(localStorage.getItem('presetList')) || [];

        if (!presetList.includes(presetName)) {
            presetList.push(presetName);
            localStorage.setItem('presetList', JSON.stringify(presetList));
        }

        var numCols = this.gridSize[0],
            numRows = this.gridSize[1],
            gridData = [];

        for (var x = 0; x < numCols; x++) {
            gridData[x] = [];
            for (var y = 0; y < numRows; y++) {
                var node = this.grid.getNodeAt(x, y);
                var rectColor = View.rects[y][x].attr("fill");

                gridData[x][y] = {
                    walkable: node.walkable,
                    WL: node.WL,
                    T: node.T,
                    color: rectColor
                };
            }
        }

        var preset = {
            gridSize: this.gridSize,
            gridData: gridData,
            startPos: { x: this.startX, y: this.startY },
            endPos: { x: this.endX, y: this.endY }
        };

        localStorage.setItem(presetName, JSON.stringify(preset));
        alert('Preset saved as ' + presetName);
    },

    listPresets: function () {
        var presetList = JSON.parse(localStorage.getItem('presetList')) || [];
        var presetContainer = $('#preset_list');
        presetContainer.empty();  // Clear the list container before adding new entries

        if (presetList.length === 0) {
            presetContainer.append('<p>No presets saved yet.</p>');
        } else {
            presetList.forEach(function (presetName) {
                var presetItem = $('<div>').addClass('preset-item');

                // Create a button to load the preset
                var loadButton = $('<button>')
                    .text('Load ' + presetName)
                    .addClass('preset_button')
                    .click(function () {
                        Controller.loadPresetByName(presetName);  // Load the preset when clicked
                    });

                // Create a delete button to delete the preset
                var deleteButton = $('<button>')
                    .text('Delete')
                    .addClass('delete_button')
                    .click(function () {
                        Controller.deletePreset(presetName, presetItem);  // Delete the preset when clicked
                        setTimeout(function () {
                            location.reload(); // This will refresh the page after the specified delay
                        }, 1000); // 3000 milliseconds = 3 seconds delay
                    });

                // Append both load and delete buttons to the container
                presetItem.append(loadButton).append(deleteButton);
                presetContainer.append(presetItem);
            });
        }
    },


    deletePreset: function (presetName, presetItem) {
        // Confirm the deletion
        if (!confirm('Are you sure you want to delete the preset "' + presetName + '"?')) {
            return; // If the user cancels the deletion, stop here
        }

        // Remove the preset from localStorage
        localStorage.removeItem(presetName);

        // Update the preset list in localStorage
        var presetList = JSON.parse(localStorage.getItem('presetList')) || [];
        var updatedPresetList = presetList.filter(function (name) {
            return name !== presetName; // Keep all other preset names
        });

        // Save the updated preset list back to localStorage
        localStorage.setItem('presetList', JSON.stringify(updatedPresetList));

        // Remove the preset button from the UI
        presetItem.remove();

        alert('Preset "' + presetName + '" deleted successfully.');
    },


    loadPresetByName: function (presetName) {
        var self = this;

        // Clear the existing grid and ensure there are no visual remains
        if (self.grid) {
            self.grid = null;
            $('#draw_area').empty();
        }

        // Retrieve the preset from localStorage
        var preset = JSON.parse(localStorage.getItem(presetName));

        if (!preset) {
            console.log('No preset found with name:', presetName);
            return;
        }

        console.log("Loaded grid preset:", preset);

        // Reinitialize the grid with loaded data
        self.gridSize = preset.gridSize;
        self.grid = new PF.Grid(self.gridSize[0], self.gridSize[1]);

        // Reinitialize the view (grid rendering)
        View.init({
            numCols: self.gridSize[0],
            numRows: self.gridSize[1]
        });

        // Regenerate the grid visually
        View.generateGrid(function () {
            var gridData = preset.gridData;

            for (var x = 0; x < self.gridSize[0]; x++) {
                for (var y = 0; y < self.gridSize[1]; y++) {
                    var nodeData = gridData[x][y];
                    var node = self.grid.getNodeAt(x, y);

                    node.walkable = nodeData.walkable;
                    node.WL = nodeData.WL;
                    node.T = nodeData.T;

                    // Update the visual representation of the node
                    if (!node.walkable) {
                        View.setAttributeAt(x, y, 'black', false);
                    } else if (node.WL === 1) {
                        View.setWaterAt(x, y, 'green');
                    } else if (node.WL === 2) {
                        View.setWaterAt(x, y, 'orange');
                    } else if (node.WL === 3) {
                        View.setWaterAt(x, y, 'red');
                    } else {
                        View.setAttributeAt(x, y, 'white', true);
                    }
                }
            }

            // Set start and end nodes with specific colors
            View.setStart(self.startX, self.startY, 'green'); // Green for start
            View.setEnd(self.endX, self.endY, 'red');         // Red for end

            // Immediately bring the start and end nodes to the front
            if (View.startNode) {
                View.startNode.toFront(); // Bring start node to the front
            }
            if (View.endNode) {
                View.endNode.toFront();   // Bring end node to the front
            }
        });

    },


    clearAll: function () {
        this.clearFootprints();
        View.clearBlockedNodes();

        var numRows = this.gridSize[1];
        var numCols = this.gridSize[0];

        for (var y = 0; y < numRows; y++) {
            for (var x = 0; x < numCols; x++) {
                if (this.isStartOrEndPos(x, y)) continue;

                var currentFill = View.rects[y][x].attr("fill");
                if (currentFill === View.nodeStyle.waterHigh.fill ||
                    currentFill === View.nodeStyle.waterModerate.fill ||
                    currentFill === View.nodeStyle.waterLow.fill) {
                    View.setAttributeAt(x, y, 'walkable', true);
                    View.colorizeNode(View.rects[y][x], View.nodeStyle.normal.fill);
                }
            }
        }
    },

    ondrawWall: function (event, from, to, gridX, gridY) {
        const selectedColor = document.querySelector('input[name="cell_option"]:checked').value;

        switch (selectedColor) {
            case 'black':
                this.setWalkableAt(gridX, gridY, false, 0, 0, "black");
                break;
            case 'green':
                this.setWalkableAt(gridX, gridY, true, 2, 3, "green");
                break;
            case 'orange':
                this.setWalkableAt(gridX, gridY, true, 3, 4, "orange");
                break;
            case 'red':
                this.setWalkableAt(gridX, gridY, true, 4, 5, "red");
                break;
        }
    },

    oneraseWall: function (event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, true);
    },

    ondrawWater: function (event, from, to, gridX, gridY) {
        const node = this.grid.getNodeAt(gridX, gridY);
        const { WL, T } = Panel.getCurrentWaterLevelAndTime();
        node.setWaterLevelAndTime(WL, T);
        View.setWaterAt(gridX, gridY, Panel.selectedColor);
    },

    onsearch: function (event, from, to) {

        // Check if Water_Option and ida_heuristic are correctly selected
        const selected = document.querySelector('input[name="Water_Option"]:checked');
        const selected2 = document.querySelector('input[name="ida_heuristic"]:checked');

        // Debugging logs to ensure elements are found
        console.log("Selected Water Option: ", selected ? selected.value : "Not Found");
        console.log("Selected Heuristic Option: ", selected2 ? selected2.value : "Not Found");

        // Proceed only if both are found
        if (selected && selected2) {
            if (selected2.value == "enhancedheuristic") {
                // Log and set walkability based on the selected water option
                console.log("Using Enhanced Heuristic with Water Option: ", selected.value);
                this.setWalkableByWL(selected.value);
            } else {
                // Log and set a default walkability value if not using enhanced heuristic
                console.log("Using Default Heuristic");
                this.setWalkableByWL(5);
            }
        } else {
            console.error("Could not find the selected heuristic or water option");
        }

        var grid,
            timeStart, timeEnd,
            finder = Panel.getFinder();

        timeStart = window.performance ? performance.now() : Date.now();
        grid = this.grid.clone();
        this.path = finder.findPath(
            this.startX, this.startY, this.endX, this.endY, grid
        );
        this.operationCount = this.operations.length;
        timeEnd = window.performance ? performance.now() : Date.now();
        this.timeSpent = (timeEnd - timeStart).toFixed(4);

        this.loop();
    },

    onrestart: function () {
        setTimeout(function () {
            Controller.clearOperations();
            Controller.clearFootprints();
            Controller.start();
        }, View.nodeColorizeEffect.duration * 1.2);
    },

    onpause: function (event, from, to) {
        // Pausing the search
    },

    onresume: function (event, from, to) {
        this.loop();
    },

    oncancel: function (event, from, to) {
        this.clearOperations();
        this.clearFootprints();
    },

    onfinish: function (event, from, to) {
        View.showStats({
            pathLength: PF.Util.pathLength(this.path),
            timeSpent: this.timeSpent,
            operationCount: this.operationCount,
        });
        View.drawPath(this.path);
    },

    onclear: function (event, from, to) {
        this.clearOperations();
        this.clearFootprints();
        this.clearAll();
    },

    onmodified: function (event, from, to) {
        // Modify event handler
    },

    onreset: function (event, from, to) {
        setTimeout(function () {
            Controller.clearOperations();
            Controller.clearAll();
            Controller.buildNewGrid();
        }, View.nodeColorizeEffect.duration * 1.2);
    },

    onready: function () {
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: false,
        }, {
            id: 3,
            text: 'Clear Walls',
            enabled: true,
            callback: $.proxy(this.reset, this),
        });
    },

    onstarting: function (event, from, to) {
        this.clearFootprints();
        this.setButtonStates({
            id: 2,
            enabled: true,
        });
        this.search();
    },

    onsearching: function () {
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Pause Search',
            enabled: true,
            callback: $.proxy(this.pause, this),
        });
    },

    onpaused: function () {
        this.setButtonStates({
            id: 1,
            text: 'Resume Search',
            enabled: true,
            callback: $.proxy(this.resume, this),
        }, {
            id: 2,
            text: 'Cancel Search',
            enabled: true,
            callback: $.proxy(this.cancel, this),
        });
    },

    onfinished: function () {
        this.setButtonStates({
            id: 1,
            text: 'Restart Search',
            enabled: true,
            callback: $.proxy(this.restart, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        });
    },

    onmodified: function () {
        this.setButtonStates({
            id: 1,
            text: 'Start Search',
            enabled: true,
            callback: $.proxy(this.start, this),
        }, {
            id: 2,
            text: 'Clear Path',
            enabled: true,
            callback: $.proxy(this.clear, this),
        });
    },

    hookPathFinding: function () {
        PF.Node.prototype = {
            get opened() {
                return this._opened;
            },
            set opened(v) {
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'opened',
                    value: v
                });
            },
            get closed() {
                return this._closed;
            },
            set closed(v) {
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'closed',
                    value: v
                });
            },
            get tested() {
                return this._tested;
            },
            set tested(v) {
                Controller.operations.push({
                    x: this.x,
                    y: this.y,
                    attr: 'tested',
                    value: v
                });
            },
        };

        this.operations = [];
    },

    bindEvents: function () {
        $('#draw_area').mousedown($.proxy(this.mousedown, this));
        $(window)
            .mousemove($.proxy(this.mousemove, this))
            .mouseup($.proxy(this.mouseup, this));

    },

    loop: function () {
        var interval = 1000 / this.operationsPerSecond;
        (function loop() {
            if (!Controller.is('searching')) {
                return;
            }
            Controller.step();
            setTimeout(loop, interval);
        })();
    },

    step: function () {
        var operations = this.operations,
            op, isSupported;

        do {
            if (!operations.length) {
                this.finish();
                return;
            }
            op = operations.shift();
            isSupported = View.supportedOperations.indexOf(op.attr) !== -1;
        } while (!isSupported);

        View.setAttributeAt(op.x, op.y, op.attr, op.value);
    },

    clearOperations: function () {
        this.operations = [];
    },

    clearFootprints: function () {
        View.clearFootprints();
        View.clearPath();
    },

    clearAll: function () {
        this.clearFootprints();
        View.clearBlockedNodes();

        var numRows = this.gridSize[1];
        var numCols = this.gridSize[0];

        for (var y = 0; y < numRows; y++) {
            for (var x = 0; x < numCols; x++) {
                if (this.isStartOrEndPos(x, y)) continue;

                var currentFill = View.rects[y][x].attr("fill");
                if (currentFill === View.nodeStyle.waterHigh.fill ||
                    currentFill === View.nodeStyle.waterModerate.fill ||
                    currentFill === View.nodeStyle.waterLow.fill) {
                    View.setAttributeAt(x, y, 'walkable', true);
                    View.colorizeNode(View.rects[y][x], View.nodeStyle.normal.fill);
                }
            }
        }
    },

    buildNewGrid: function () {
        this.grid = new PF.Grid(this.gridSize[0], this.gridSize[1]);
    },

    mousedown: function (event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1],
            grid = this.grid;

        if (this.isStartOrEndPos(gridX, gridY)) {
            return;
        }
        if (this.can('dragStart') && this.isStartPos(gridX, gridY)) {
            this.dragStart();
            return;
        }
        if (this.can('dragEnd') && this.isEndPos(gridX, gridY)) {
            this.dragEnd();
            return;
        }
        if (this.can('drawWall') && grid.isWalkableAt(gridX, gridY)) {
            this.drawWall(gridX, gridY);
            return;
        }
        if (this.can('eraseWall') && !grid.isWalkableAt(gridX, gridY)) {
            this.eraseWall(gridX, gridY);
        }
    },

    mousemove: function (event) {
        var coord = View.toGridCoordinate(event.pageX, event.pageY),
            gridX = coord[0],
            gridY = coord[1],
            grid = this.grid;

        if (this.isStartOrEndPos(gridX, gridY)) {
            return;
        }

        switch (this.current) {
            case 'draggingStart':
                if (grid.isWalkableAt(gridX, gridY)) {
                    this.setStartPos(gridX, gridY);
                }
                break;
            case 'draggingEnd':
                if (grid.isWalkableAt(gridX, gridY)) {
                    this.setEndPos(gridX, gridY);
                }
                break;
            case 'drawingWall':
                const selectedColor = document.querySelector('input[name="cell_option"]:checked').value;

                switch (selectedColor) {
                    case 'black':
                        this.setWalkableAt(gridX, gridY, false, 0, 0, "black");
                        break;
                    case 'white':
                        this.setWalkableAt(gridX, gridY, true, 1, 1, "white");
                        break;
                    case 'green':
                        this.setWalkableAt(gridX, gridY, true, 2, 3, "green");
                        break;
                    case 'orange':
                        this.setWalkableAt(gridX, gridY, true, 3, 4, "orange");
                        break;
                    case 'red':
                        this.setWalkableAt(gridX, gridY, true, 4, 5, "red");
                        break;
                }

                break;
            case 'erasingWall':
                this.setWalkableAt(gridX, gridY, true);
                break;
            case 'drawingWater':
                this.setWaterAt(gridX, gridY, Panel.selectedColor);
                break;
        }
    },

    mouseup: function (event) {
        if (Controller.can('rest')) {
            Controller.rest();
        }
    },

    setButtonStates: function () {
        $.each(arguments, function (i, opt) {
            var $button = Controller.$buttons.eq(opt.id - 1);
            if (opt.text) {
                $button.text(opt.text);
            }
            if (opt.callback) {
                $button
                    .unbind('click')
                    .click(opt.callback);
            }
            if (opt.enabled === undefined) {
                return;
            } else if (opt.enabled) {
                $button.removeAttr('disabled');
            } else {
                $button.attr({ disabled: 'disabled' });
            }
        });
    },

    setDefaultStartEndPos: function () {
        this.setStartPos(2, 47);
        this.setEndPos(48, 2);
    },

    setStartPos: function (gridX, gridY) {
        this.startX = gridX;
        this.startY = gridY;
        View.setStartPos(gridX, gridY);
    },

    setEndPos: function (gridX, gridY) {
        this.endX = gridX;
        this.endY = gridY;
        View.setEndPos(gridX, gridY);
    },

    setWalkableAt: function (gridX, gridY, walkable, WL, T, color) {
        const node = this.grid.getNodeAt(gridX, gridY);
        node.walkable = walkable;
        node.WL = WL;
        node.T = T;
        View.setAttributeAt(gridX, gridY, color, walkable);
    },

    setWaterAt: function (gridX, gridY, color) {
        const node = this.grid.getNodeAt(gridX, gridY);
        node.walkable = false;
        View.setAttributeAt(gridX, gridY, 'water', color);
    },

    isStartPos: function (gridX, gridY) {
        return gridX === this.startX && gridY === this.startY;
    },

    isEndPos: function (gridX, gridY) {
        return gridX === this.endX && gridY === this.endY;
    },

    isStartOrEndPos: function (gridX, gridY) {
        return this.isStartPos(gridX, gridY) || this.isEndPos(gridX, gridY);
    }






});

$(document).ready(function () {
    $('#save_preset1').on('click', function () {
        var presetName = prompt("Enter a name for the preset:");
        if (presetName) {
            Controller.savePreset(presetName);
            setTimeout(function () {
                location.reload(); // This will refresh the page after the specified delay
            }, 1000); // 3000 milliseconds = 3 seconds delay
        }
    });

    $('#list_presets').on('click', function () {
        Controller.listPresets();
    });
});
