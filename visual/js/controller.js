/**
 * The visualization controller works as a state machine.
 * See files under the `doc` folder for transition descriptions.
 * See https://github.com/jakesgordon/javascript-state-machine
 * for the document of the StateMachine module.
 */
var Controller = StateMachine.create({
    initial: 'none',
    events: [
        {
            name: 'init',
            from: 'none',
            to: 'ready'
        },
        {
            name: 'search',
            from: 'starting',
            to: 'searching'
        },
        {
            name: 'pause',
            from: 'searching',
            to: 'paused'
        },
        {
            name: 'finish',
            from: 'searching',
            to: 'finished'
        },
        {
            name: 'resume',
            from: 'paused',
            to: 'searching'
        },
        {
            name: 'cancel',
            from: 'paused',
            to: 'ready'
        },
        {
            name: 'modify',
            from: 'finished',
            to: 'modified'
        },
        {
            name: 'reset',
            from: '*',
            to: 'ready'
        },
        {
            name: 'clear',
            from: ['finished', 'modified'],
            to: 'ready'
        },
        {
            name: 'start',
            from: ['ready', 'modified', 'restarting'],
            to: 'starting'
        },
        {
            name: 'restart',
            from: ['searching', 'finished'],
            to: 'restarting'
        },
        {
            name: 'dragStart',
            from: ['ready', 'finished'],
            to: 'draggingStart'
        },
        {
            name: 'dragEnd',
            from: ['ready', 'finished'],
            to: 'draggingEnd'
        },
        {
            name: 'drawWall',
            from: ['ready', 'finished'],
            to: 'drawingWall'
        },
        {
            name: 'eraseWall',
            from: ['ready', 'finished'],
            to: 'erasingWall'
        },
        {
            name: 'drawWater',
            from: ['ready', 'finished'],
            to: 'drawingWater'
        },
        {
            name: 'rest',
            from: ['draggingStart', 'draggingEnd', 'drawingWall', 'erasingWall', 'drawingWater'],
            to: 'ready'
        },
    ],
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

    setWaterAt: function (gridX, gridY, color) {
        const node = this.grid.getNodeAt(gridX, gridY);



        View.setAttributeAt(gridX, gridY, 'water', color);
    },


    // ------------------ PRESETS ------------------------------------------------ //

    mapPreset1: function () {
        var numCols = this.gridSize[0],
            numRows = this.gridSize[1],
            gridData = [];

        // Collect grid data (walkability, WL, T for each node)
        for (var x = 0; x < numCols; x++) {
            gridData[x] = [];
            for (var y = 0; y < numRows; y++) {
                var node = this.grid.getNodeAt(x, y);
                gridData[x][y] = {
                    walkable: node.walkable,
                    WL: node.WL,
                    T: node.T
                };
            }
        }

        // Save preset including grid data and start/end positions
        var preset1 = {
            gridSize: this.gridSize,
            gridData: gridData,
            startPos: { x: this.startX, y: this.startY }, // Save start position
            endPos: { x: this.endX, y: this.endY }         // Save end position
        };

        // Save preset to localStorage
        localStorage.setItem('myGridPreset', JSON.stringify(preset1));
        alert('Preset saved successfully!');
    },

    // Load Preset
    loadPreset: function () {
        // Clear existing grid
        if (this.grid) {
            this.grid = null;
            $('#gridContainer').empty();
        }

        // Retrieve preset from localStorage
        var preset = JSON.parse(localStorage.getItem('myGridPreset'));

        if (!preset) {
            alert('No preset found');
            return;
        }

        // Reinitialize grid with loaded data
        this.gridSize = preset.gridSize;
        this.grid = new PF.Grid(this.gridSize[0], this.gridSize[1]);

        // Apply grid data
        var gridData = preset.gridData;
        for (var x = 0; x < this.gridSize[0]; x++) {
            for (var y = 0; y < this.gridSize[1]; y++) {
                var nodeData = gridData[x][y];
                var node = this.grid.getNodeAt(x, y);
                node.walkable = nodeData.walkable;
                node.WL = nodeData.WL;
                node.T = nodeData.T;

                // Update visual representation of nodes (walls, water levels)
                if (!node.walkable) {
                    View.setWaterAt(x, y, 'black'); // Wall
                } else if (node.WL === 1) {
                    View.setWaterAt(x, y, 'green'); // Low water
                } else if (node.WL === 2) {
                    View.setWaterAt(x, y, 'orange'); // Moderate water
                } else if (node.WL === 3) {
                    View.setWaterAt(x, y, 'red'); // High water
                } else {
                    View.setWaterAt(x, y, 'white'); // Walkable area
                }
            }
        }

        // Restore start and end positions
        this.setStartPos(preset.startPos.x, preset.startPos.y);
        this.setEndPos(preset.endPos.x, preset.endPos.y);

        // Reinitialize the view
        View.init({
            numCols: this.gridSize[0],
            numRows: this.gridSize[1]
        });
        View.generateGrid(function () {
            Controller.bindEvents();
            Controller.transition(); // Transition to 'ready' state
        });

        alert('Preset loaded successfully!');
    },



    // ------------------ PRESETS ------------------------------------------------ //

    clearAll: function () {
        this.clearFootprints();
        View.clearBlockedNodes();

        var numRows = this.gridSize[1];
        var numCols = this.gridSize[0];

        for (var y = 0; y < numRows; y++) {
            for (var x = 0; x < numCols; x++) {
                // Skip resetting the start and end nodes
                if (this.isStartOrEndPos(x, y)) continue;

                // Reset only the colored nodes (red, orange, green) back to white
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
        this.setWalkableAt(gridX, gridY, false);
    },

    oneraseWall: function (event, from, to, gridX, gridY) {
        this.setWalkableAt(gridX, gridY, true);
    },

    ondrawWater: function (event, from, to, gridX, gridY) {
        const node = this.grid.getNodeAt(gridX, gridY);
        const { WL, T } = Panel.getCurrentWaterLevelAndTime();
        node.setWaterLevelAndTime(WL, T); // Update node's water level and time
        View.setWaterAt(gridX, gridY, Panel.selectedColor);
    },

    onsearch: function (event, from, to) {
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
        this.clearAll(); // Ensure this is called
    },

    onmodify: function (event, from, to) {
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
            callback: $.proxy(this.reset, this), // Bind reset logic to the Clear Walls button
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
                // Skip resetting the start and end nodes
                if (this.isStartOrEndPos(x, y)) continue;

                // Reset only the colored nodes (red, orange, green) back to white
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

        switch (Panel.selectedColor) {
            case 'black':
                if (this.can('drawWall') && grid.isWalkableAt(gridX, gridY)) {
                    this.drawWall(gridX, gridY);
                }
                break;
            case 'green':
            case 'orange':
            case 'red':
                if (this.can('drawWater') && grid.isWalkableAt(gridX, gridY)) {
                    this.drawWater(gridX, gridY);
                }
                break;
            case 'white':
                if (this.can('eraseWall') && !grid.isWalkableAt(gridX, gridY)) {
                    this.eraseWall(gridX, gridY);
                }
                break;
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
                this.setWalkableAt(gridX, gridY, false);
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
        this.setStartPos(2, 48);
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

    setWalkableAt: function (gridX, gridY, walkable) {
        const node = this.grid.getNodeAt(gridX, gridY);
        node.walkable = walkable;
        View.setAttributeAt(gridX, gridY, 'walkable', walkable);
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
    },
});

$(document).ready(function () {
    // Save preset 1
    $('#save_preset1').on('click', function () {
        Controller.mapPreset1();  // Correctly call the mapPreset1 function
    });

    // Load preset 1
    $('#load_preset1').on('click', function () {
        Controller.loadPreset();  // Correctly call the loadPreset function
    });
});
