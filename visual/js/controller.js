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

async function savePresetToFile(presetName, presetData) {
    try {
        const options = {
            types: [
                {
                    description: 'JSON Files',
                    accept: {
                        'application/json': ['.json'],
                    },
                },
            ],
        };
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: `${presetName}.json`,
            ...options,
        });

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(presetData, null, 2));
        await writable.close();

        alert('Preset saved successfully!');
    } catch (error) {
        console.error('Error saving preset:', error);
        alert('Failed to save preset');
    }
}


// Attach the event listener to the file input
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loadPresetFile').addEventListener('change', loadPresetFromFile);
});

$(document).ready(function () {
    // When the load button is clicked, trigger the file input
    $('#load_preset').on('click', function () {
        $('#loadPresetFile').click();
    });

    // Handle the selected file for loading a preset
    $('#loadPresetFile').on('change', loadPresetFromFile);
});

// Function to handle the loading of a preset file (as defined previously)
async function loadPresetFromFile(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected');
        return;
    }

    try {
        const fileContent = await file.text();
        const preset = JSON.parse(fileContent);

        // Call loadPresetData directly to load the preset
        Controller.loadPresetData(preset);

    } catch (error) {
        console.error('Error loading preset:', error);
        alert('Failed to load preset');
    }
}




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


    savePreset: function (presetName) {
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1],
            gridData = [];
    
        for (var x = 0; x < numCols; x++) {
            gridData[x] = [];
            for (var y = 0; y < numRows; y++) {
                var node = this.grid.getNodeAt(x, y);
                gridData[x][y] = {
                    walkable: node.walkable,
                    WL: node.WL,
                    T: node.T,
                };
            }
        }
    
        var preset = {
            gridSize: this.gridSize,
            gridData: gridData,
            startPos: { x: this.startX, y: this.startY },
            endPos: { x: this.endX, y: this.endY }
        };
    
        // Use the File System Access API to save the preset to a file
        savePresetToFile(presetName, preset);
    },
    

    loadPresetData: function (preset) {
        var self = this;

        if (!preset) {
            console.error('Invalid preset data');
            return;
        }
    
        // Clear existing grid if it exists
        if (self.grid) {
            self.grid = null;
            $('#draw_area').empty();
        }
    
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
    
            View.setStart(self.startX, self.startY); 
            View.setEnd(self.endX, self.endY);         
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
        this.setEndPos(47, 2);
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
    $(document).ready(function () {
        $('#save_preset1').on('click', function () {
            var presetName = prompt("Enter a name for the preset:");
            if (presetName) {
                Controller.savePreset(presetName);
            }
        });
    });
    

    $('#list_presets').on('click', function () {
        Controller.listPresets();
    });
});
