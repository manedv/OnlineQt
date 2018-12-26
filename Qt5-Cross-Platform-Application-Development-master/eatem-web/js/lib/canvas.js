
// https://requirejs.org/docs/why.html#9
// https://stackoverflow.com/questions/4869530/requirejs-how-to-define-modules-that-contain-a-single-class

define(['../global'], function(global) {
    function Canvas(){
        this.directionLock = false;
        this.target = global.target;
        this.reenviar = true;
        this.socket = global.socket;
        this.directions = [];
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screenWidth;
        this.cv.height = global.screenHeight;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keypress', this.keyInput, false);
        this.cv.addEventListener('keyup', function(event) {
            self.reenviar = true;
            self.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown, false);
        this.cv.addEventListener('touchstart', this.touchInput, false);
        this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.parent = self;
        global.canvas = this;
    }

    // Function called when a key is pressed, will change direction if arrow key.
    Canvas.prototype.directionDown = function(event) {
        var key = event.which || event.keyCode;
        var self = this.parent; // have to do this so we are not using the cv object
        if (self.directional(key)) {
            self.directionLock = true;
            if (self.newDirection(key, self.directions, true)) {
                self.updateTarget(self.directions);
                self.socket.emit('0', self.target);
            }
        }
    }

    // Function called when a key is lifted, will change direction if arrow key.
    Canvas.prototype.directionUp = function(event) {
        var key = event.which || event.keyCode;
        if (this.directional(key)) { // this == the actual class
            if (this.newDirection(key, this.directions, false)) {
                this.updateTarget(this.directions);
                if (this.directions.length === 0) this.directionLock = false;
                this.socket.emit('0', this.target);
            }
        }
    }

    // Updates the direction array including information about the new direction.
    Canvas.prototype.newDirection = function(direction, list, isAddition) {
        var result = false;
        var found = false;
        for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] == direction) {
                found = true;
                if (!isAddition) {
                    result = true;
                    // Removes the direction.
                    list.splice(i, 1);
                }
                break;
            }
        }
        // Adds the direction.
        if (isAddition && found === false) {
            result = true;
            list.push(direction);
        }

        return result;
    }

    // Updates the target according to the directions in the directions array.
    Canvas.prototype.updateTarget = function(list) {
        this.target = { x : 0, y: 0 };
        var directionHorizontal = 0;
        var directionVertical = 0;
        for (var i = 0, len = list.length; i < len; i++) {
            if (directionHorizontal === 0) {
                if (list[i] == global.KEY_LEFT) directionHorizontal -= Number.MAX_VALUE;
                else if (list[i] == global.KEY_RIGHT) directionHorizontal += Number.MAX_VALUE;
            }
            if (directionVertical === 0) {
                if (list[i] == global.KEY_UP) directionVertical -= Number.MAX_VALUE;
                else if (list[i] == global.KEY_DOWN) directionVertical += Number.MAX_VALUE;
            }
        }
        this.target.x += directionHorizontal;
        this.target.y += directionVertical;
        global.target = this.target;
    }

    Canvas.prototype.directional = function(key) {
        return this.horizontal(key) || this.vertical(key);
    }

    Canvas.prototype.horizontal = function(key) {
        return key == global.KEY_LEFT || key == global.KEY_RIGHT;
    }

    Canvas.prototype.vertical = function(key) {
        return key == global.KEY_DOWN || key == global.KEY_UP;
    }

    // Register when the mouse goes off the canvas.
    Canvas.prototype.outOfBounds = function() {
        if (!global.continuity) {
            this.parent.target = { x : 0, y: 0 };
            global.target = this.parent.target;
        }
    }

    Canvas.prototype.gameInput = function(mouse) {
        if (!this.directionLock) {
            this.parent.target.x = mouse.clientX - this.width / 2;
            this.parent.target.y = mouse.clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    Canvas.prototype.touchInput = function(touch) {
        touch.preventDefault();
        touch.stopPropagation();
        if (!this.directionLock) {
            this.parent.target.x = touch.touches[0].clientX - this.width / 2;
            this.parent.target.y = touch.touches[0].clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    // Chat command callback functions.
    Canvas.prototype.keyInput = function(event) {
        var key = event.which || event.keyCode;
        if (key === global.KEY_FIREFOOD && this.parent.reenviar) {
            this.parent.socket.emit('1');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_SPLIT && this.parent.reenviar) {
            document.getElementById('split_cell').play();
            this.parent.socket.emit('2');
            this.parent.reenviar = false;
        }
    }

    return Canvas;
});
