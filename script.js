/**
 * This file creates the JS Canvas Copter game
 *
 * Based on the original flash copter game:
 * http://www.seethru.co.uk/zine/south_coast/helicopter_game.htm
 *
 * @author petegoodman.com
 */

var jsCopter = {

    // object : default options, can be overwritten by init call
    options : {
        canvas : {
            width : 500,
            height : 300,
            refreshRate : 20
        },
        copter : {
            width : 30,
            height : 15,
            topSpeed : 5,                   // max speed
            acceleration : 0.15,            // how much to increase the speed by each time the game refreshes and the button is held down
            img : null                      // optional copter image path, relative to the html page
        },
        physics : {
            terminalVelocity : 4,           // max speed
            gravity : 0.5,
            friction : 0.8
        },
        walls : {
            separation : 19,                //fudge
            width : 20,
            step : 5,                       // potential height difference for each new wall
            startHeight : 60,
            maxHeight : 120,
            heightIncreaseInterval : 5,     // how often to increase the height of each wall (from start to max)
            heightIncreaseStep : 10         // how much to increase the height of each wall by
        },
        obstacles : {
            separation : 250,               // frequency of obstacles
            width : 20,
            height : 50
        },
        colours : {
            bg : "#000000",
            fill : "#ff9900",
            light : "#ffffff"
        }
    },

    // object : the game elements
    gameData : {
        copter : {
            x : 20,
            y : 0,
            speed : 0,
            rotation : 0
        },
        walls : {
            counter : 0,
            currentHeight : 0,
            currentStep : 0,
            heightIncreaseInterval : 0,    // fudge
            current : []
        },
        obstacles : {
            counter : 0,
            current : []
        }
    },

    // object : scores - ints and html objects
    scores : {
        current : 0,
        top : 0,
        elements : {
            current : null,
            top : null
        },
        halfStep : 0    // fudge
    },

    // object: the html canvas area
    canvas : null,

    // object : the html parent element containing the canvas
    container : null,

    // object : the interval between pie fills
    canvasInterval : null,

    // object : the canvas draw context
    drawContext : null,

    // bool : is the mouse button currently being held down?
    mouseDown : false,

    // bool : is the game currently running?
    gameRunning : false,

    // object : to contain the death text. when you die.
    deathText : null,


    /**
     * start the JS Copter process
     *
     * @param canvasId string the id of the canvas element that will be created
      * @param parentId string the id of the html element to attach the canvas to
     * @param options object a set of optional options, to set defaults
     *
     * @return void
     */
    init: function(canvasId, parentId, options){

        // search for parent element - if not found, stop now
        this.container = document.getElementById(parentId);
        if (!this.container) return false;

        // set the options
        for (var optionType in options) {
            for (var subOption in options[optionType]) {
                this.options[optionType][subOption] = options[optionType][subOption];
            }
        };

        // Create a canvas element
        this.canvas = this.createCanvas(canvasId);

        // Set up the scoring
        this.initScoring();

        // create draw context
        this.drawContext = this.canvas.getContext("2d");

        // Create initial BG content for the canvas
        this.createBG();

        // set the intial copter game data
        this.resetGameData();

        // create copter element
        this.createCopter();

        // create initial floor & ceiling
        this.createInitialWalls();

        // set a mouse listener to start the game
        this.initMouseListener();
    },


    /*
     * create a canvas element of specific size
     *
     * @param id string the id of the canvas element that will be created
     *
     * @return canvas object the created canvas
      */
    createCanvas: function(canvasId) {

        // create the canvas
        var canvas = document.createElement("canvas");
        canvas.id = canvasId;
        canvas.width = this.options.canvas.width;
        canvas.height = this.options.canvas.height;

        // add the canvas into the page
        this.container.appendChild(canvas);

        return canvas;
    },


    /*
     * create initial border and fill of canvas element
     *
     */
    createBG: function() {

        // get the global draw context
        var draw = this.drawContext;

        // draw the outer rounded rectangle
        draw.clearRect(0,0,this.options.canvas.width, this.options.canvas.height);
        draw.beginPath();
        this.roundedRect(draw, 0, 0, this.options.canvas.width, this.options.canvas.height, 10);
        draw.fillStyle = this.options.colours.bg;
        draw.fill();
    },


    /*
     * Reset game data
     */
    resetGameData: function() {

        // reset current score
        this.scores.current = this.scores.elements.current.innerHTML = 0;

        // reset 'y' position of copter
        this.gameData.copter.y = Math.round(this.options.canvas.height/2);

        // reset the starting height of the walls
        this.gameData.walls.currentHeight = this.options.walls.startHeight;

        // reset the steps between wall heights
        this.gameData.walls.currentStep = this.options.walls.step;

        // set first obstacle to start straight away
        this.gameData.obstacles.counter = this.options.obstacles.separation - this.options.obstacles.width;

        // remove all obstacles
        this.gameData.obstacles.current.length = 0;

        // remove all walls
        this.gameData.walls.current.length = 0;

        // reset death text
        if (!!this.deathText) {
            this.deathText.style.display = "none";
        }

        // create initial floor and ceiling
        this.createInitialWalls();
    },


    /*
     * create initial copter element
     * @param draw object the canvas draw context
     */
    createCopter: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : calculate copter position based on whether the mouse is currently held down
        if(this.mouseDown === true) {
            this.gameData.copter.speed -= this.options.copter.acceleration;
            if (this.gameData.copter.speed < -this.options.copter.topSpeed) this.gameData.copter.speed = -this.options.copter.topSpeed;
            this.gameData.copter.rotation = this.gameData.copter.rotation - 0.01;
            if (this.gameData.copter.rotation < -0.25) this.gameData.copter.rotation = -0.25;

        // mouse button not held down
        } else {
            this.gameData.copter.speed = (this.gameData.copter.speed + this.options.physics.gravity) * this.options.physics.friction;
            if(this.gameData.copter.speed > this.options.physics.terminalVelocity) this.gameData.copter.speed = this.options.physics.terminalVelocity;
            this.gameData.copter.rotation = this.gameData.copter.rotation + 0.02;
            if (this.gameData.copter.rotation > 0) this.gameData.copter.rotation = 0;
        }

        // set new Y position
        this.gameData.copter.y = this.gameData.copter.y + this.gameData.copter.speed;

        // create and position copter element
        draw.save();
        draw.translate(this.gameData.copter.x, this.gameData.copter.y);
        draw.rotate(this.gameData.copter.rotation);

        // condition : if an image is specified, use it
        if (this.options.copter.img) {

            // save 'this' context
            var that = this;

            // create copter element
            var copter = new Image();
            copter.src = that.options.copter.img;

            // when image has loaded
            copter.onload = function() {
                draw.drawImage(copter, that.gameData.copter.x, that.gameData.copter.y, copter.width, copter.height);
                that.options.copter.width = copter.width;
                that.options.copter.height = copter.height;
            }

        // no image set, use a block
        } else {
            draw.beginPath();
            this.roundedRect(draw, 0, 0, this.options.copter.width, this.options.copter.height, 10);
            draw.fillStyle = this.options.colours.light;
            draw.fill();
        }

        draw.restore();
    },


    /*
     * Create a rounded rectangle
     * From: https://developer.mozilla.org/samples/canvas-tutorial/2_7_canvas_combined.html
     *
     */
    roundedRect: function(draw, x, y, width, height, radius) {
        draw.beginPath();
        draw.moveTo(x,y+radius);
        draw.lineTo(x,y+height-radius);
        draw.quadraticCurveTo(x,y+height,x+radius,y+height);
        draw.lineTo(x+width-radius,y+height);
        draw.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
        draw.lineTo(x+width,y+radius);
        draw.quadraticCurveTo(x+width,y,x+width-radius,y);
        draw.lineTo(x+radius,y);
        draw.quadraticCurveTo(x,y,x,y+radius);
        //draw.stroke();
    },


    /**
     * Initialise the scoring
     *
     */
    initScoring: function() {

        // create score html elements and add them to the page
        this.scores.elements.current = this.createScore('current');
        this.scores.elements.top = this.createScore('top');

        // retrieve the current top score from cookie, if cookie script is present
        if (!!cookie && !!cookie.get) {
            var topScore = cookie.get('topScore');
        }

        // condition : if a current top score exists, set it
        if (topScore) {
            this.scores.top = this.scores.elements.top.innerHTML = topScore;
        }
    },


    /**
     * create score html elements
     *
     */
    createScore: function(scoreType) {

        // create score element
        var scoreContainer = document.createElement("p");
        scoreContainer.id = scoreType+"scorecontainer";
        var scoreContainerText = document.createTextNode(this.ucFirst(scoreType) + " score: ");
        scoreContainer.appendChild(scoreContainerText);

        // create score container, ready to return
        var score = document.createElement("strong");
        score.id = scoreType+"score";

        // set the current score to 0
        var scoreText = document.createTextNode("0");
        score.appendChild(scoreText);
        scoreContainer.appendChild(score);

        // add the scores to the page
        this.container.appendChild(scoreContainer);

        return score;
    },


    /**
     * Initialise the mouse listener, to detect when the mouse button is being pressed
     */
    initMouseListener: function(){

        // save 'this' state
        var that = this;

        // detect mouse press
        document.onmousedown = function(event) {

            // condition : if mouse press is over the canvas element
            if (event.target.id == that.canvas.id) {

                // tells the game
                that.mouseDown = true;

                // condition : if the game is not currently running, start it
                if (that.gameRunning === false) {
                    that.startGame();
                }
            }
        }

        // detect mouse release
        document.onmouseup = function(event) {
            that.mouseDown = false;
        }
    },



    /*
     * Start the game
     */
    startGame: function() {

        // reset game data
        this.resetGameData();

        // set running variable
        this.gameRunning = true;

        // set interval to start the game
        this.canvasInterval = setInterval('jsCopter.draw()', this.options.canvas.refreshRate);
    },


    /*
     * Draw the canvas element; function called repeatedly by interval
     *
     */
    draw: function() {

        // check for impact
        var impact = this.checkForImpact();

        // condition : check for an impact
        if (impact === false) {

            // update graphics
            this.createBG();
            this.createCopter();
            this.createWalls();
            this.createObstacles();

            // update score
            this.updateScore();

        // condition : an impact has occurred, end the game
        } else {
            this.endGame();
        }
    },


    /*
     * Check the current position of the copter, to see if it has hit something
     */
    checkForImpact: function() {

        // condition : OBSTACLES - only want to check for impacts on the latest, if it's in range
        if (this.gameData.obstacles.current.length >=1) {

            // loop through the obstacles
            for (var x = this.gameData.obstacles.current.length-1; x >= 0; x--){

                // only check the current obstacle if it overlaps horizontally with the copter
                if(
                    this.gameData.obstacles.current[x].x >=this.gameData.copter.x &&
                    this.gameData.obstacles.current[x].x <= (this.gameData.copter.x+this.options.obstacles.width)
                ) {
                    // condition : check for impacts on obstacles in range
                    if (
                        this.gameData.copter.y >= this.gameData.obstacles.current[x].y &&
                        this.gameData.copter.y <= (this.gameData.obstacles.current[x].y + this.options.obstacles.height)
                    ) {
                        return true;
                    }
                }
            }
        }


        // loop through walls that we need to do detection
        for (var i = 0; i < this.gameData.walls.current.length; i++){

            if (this.gameData.walls.current[i].x < this.options.walls.width + this.options.copter.width) {

                // condition : check for impacts on the walls that are in range
                if (
                    (
                        this.gameData.walls.current[0].width == (this.options.canvas.width + this.options.walls.width) || // first wall
                        this.gameData.walls.current[i].x >=0 // all other walls
                    ) && (
                        this.gameData.copter.y < this.gameData.walls.current[i].height || //top
                        this.gameData.copter.y > (this.options.canvas.height - this.options.copter.height - (this.gameData.walls.current[i].y-this.gameData.walls.current[i].height)) // bottom
                    )
                ) {
                    return true;
                }
            }
        }

        // condition : final impact check - if somehow the copter has gone off screen, above or below
        if (this.gameData.copter.y < 0 || this.gameData.copter.y > (this.options.canvas.height - this.options.copter.height)) {
            return true;
        }

        // no impact detected
        return false;
    },


    /*
     * create the initial floor and ceiling
     */
    createInitialWalls: function() {

        // get the global draw context
        var draw = this.drawContext;

        // generate values for the new wall
        var newwall = {
            x: 0,
            y: this.gameData.walls.currentHeight,
            width : this.options.canvas.width + this.options.walls.width,
            height : (this.gameData.walls.currentHeight/2)
        }

        // add wall to the array
        this.gameData.walls.current.push(newwall);

        // draw ceiling
        draw.save();
        draw.beginPath();
        draw.fillStyle = this.options.colours.fill;
        draw.fillRect(newwall.x, 0, newwall.width, newwall.height);
        draw.fill();
        draw.restore();

        // draw floor
        draw.beginPath();
        draw.fillStyle = this.options.colours.fill;
        draw.fillRect(newwall.x, this.options.canvas.height-newwall.height, newwall.width, newwall.height);
        draw.fill();
    },


    /*
     * create the floor and ceiling
     */
    createWalls: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : if the separation (between walls) has been reached, create a new wall
        if (this.gameData.walls.counter++ >= Math.floor(this.options.walls.separation/this.options.copter.topSpeed)) {

            // get previous wall height
            var previousHeight = this.gameData.walls.current[this.gameData.walls.current.length-1].height;

            // random decision, whether to increase or decrease the height (either 0 or 1)
            var plusMinus = Math.round(Math.random());

            // throw in the occasional bigger jump in wall positioning...
            var bigOne = Math.round(Math.random()*10);

            // set variable that will contain new height
            var newHeight;

            // condition : calculate the new height
            if (bigOne == 10) {
                newHeight = this.gameData.walls.currentHeight/2;
            } else if (plusMinus == 1) {
                newHeight = previousHeight + Math.floor(Math.random()*this.gameData.walls.currentStep);
            } else {
                newHeight = previousHeight - Math.floor(Math.random()*this.gameData.walls.currentStep);
            }

            // condition : stop the height going too...high
            if (newHeight > this.gameData.walls.currentHeight) {
                newHeight = this.gameData.walls.currentHeight - this.gameData.walls.currentStep;
            }

            // condition : stop the height going too...low
            if (newHeight < 0) {
                newHeight = this.gameData.walls.currentStep;
            }

            // generate values for the new wall
            var newwall = {
                x: this.options.canvas.width,
                y: this.gameData.walls.currentHeight,
                width: this.options.walls.width,
                height: newHeight
            }

            // add wall to the array
            this.gameData.walls.current.push(newwall);

            // reset wall separation counter
            this.gameData.walls.counter = 0;
        }

        // draw every wall in the array
        for (var i=0; i < this.gameData.walls.current.length; i++) {

            // draw ceiling
            draw.save();
            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            draw.fillRect(this.gameData.walls.current[i].x-=this.options.copter.topSpeed, 0, this.gameData.walls.current[i].width, this.gameData.walls.current[i].height);
            draw.fill();
            draw.restore();

            // draw floor
            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            draw.fillRect(this.gameData.walls.current[i].x, this.options.canvas.height-(this.gameData.walls.current[i].y-this.gameData.walls.current[i].height), this.gameData.walls.current[i].width, this.gameData.walls.current[i].y-this.gameData.walls.current[i].height);
            draw.fill();

            // condition : if the last wall in the array has disappeared off screen, remove it
            if (this.gameData.walls.current[i].x <= - (2*this.gameData.walls.current[i].width)) {
                this.gameData.walls.current.splice(i, 1);
            }
        }
    },



    /*
     * Update the obstacles
     */
    createObstacles: function() {

        // get the global draw context
        var draw = this.drawContext;

        // condition : if the separation (between obstacles) has been reached, create a new obstacle
        if (this.gameData.obstacles.counter++ >= Math.floor(this.options.obstacles.separation/this.options.copter.topSpeed)) {

            // condition : increase the current height of the walls every x number of times
            if (
                    this.gameData.walls.currentHeight <= this.options.walls.maxHeight &&
                    this.options.walls.heightIncreaseInterval > 0 &&
                    (this.gameData.walls.heightIncreaseInterval++ == this.options.walls.heightIncreaseInterval)
            ) {

                // increase the potential height of each wall
                this.gameData.walls.currentHeight += this.options.walls.heightIncreaseStep;

                // increase slightly the potential height difference between each wall
                this.gameData.walls.currentStep++;

                // reset counter
                this.gameData.walls.heightIncreaseInterval = 0;
            }

            // generate values for the new obstacle
            var newObstacle = {
                x: this.options.canvas.width,
                y: Math.floor((Math.random() * (this.options.canvas.height - (2*this.gameData.walls.currentHeight))) + (this.gameData.walls.currentHeight/2))
            }

            // add obstacle to the array
            this.gameData.obstacles.current.push(newObstacle);

            // reset obstacle separation counter
            this.gameData.obstacles.counter = 0;
        }

        // draw every obstacle in the array
        for (var i=0; i < this.gameData.obstacles.current.length; i++) {

            draw.beginPath();
            draw.fillStyle = this.options.colours.fill;
            this.roundedRect(draw, this.gameData.obstacles.current[i].x-=this.options.copter.topSpeed, this.gameData.obstacles.current[i].y, this.options.obstacles.width, this.options.obstacles.height, 10);
            draw.fill();

            // condition : if the last obstacle in the array has disappeared off screen, remove it
            if (this.gameData.obstacles.current[i].x <= - (this.options.canvas.width)) {
                this.gameData.obstacles.current.splice(i, 1);
            }
        }
    },


    /*
     * Update the score - every second time, to stop it increasing so quickly
     */
    updateScore: function() {
        this.scores.halfStep = (this.scores.halfStep == 0) ? 1 : 0;
        if (this.scores.halfStep == 1) {
            this.scores.current++;
            this.scores.elements.current.innerHTML = this.scores.current;
        }
    },


    /*
     * Function to call when the game has come to an end
     */
    endGame: function() {

        // condition : if the current score is higher than the top score, set it
        if (this.scores.current > this.scores.top) {

            // set the top score
            this.scores.elements.top.innerHTML = this.scores.current;

            // set cookie containing the top score
            if (cookie && cookie.set) {
                cookie.set('topScore', this.scores.current, 1000, '/');
            }
        }

        // condition : create death text ?
        if (!this.deathText) {
            this.deathText = document.createElement("p");
            this.deathText.id = "deathtext";
            var deathTextText = document.createTextNode("CRASH!");
            this.deathText.appendChild(deathTextText);
            this.container.appendChild(this.deathText);
        } else {
            this.deathText.style.display = "block";
        }

        // stop the interval
        clearInterval(this.canvasInterval);

        // set running variable
        this.gameRunning = false;
    },


    /**
     * function to Capitalise the First text Character of A string
     * @param {string} title the url of the new link
     * @returns {string} the new Text String
     */
    ucFirst: function(textString) {
        //return textString.substr(0,1).toUpperCase() + textString.substr(1,textString.length);
        return textString;
    }
}