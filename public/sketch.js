//check README.md for more information

/// <reference path="TSDef/p5.global-mode.d.ts" />

//create a socket connection
var socket;

//linear speed
var SPEED = 100;
//how long does it stay per character
var MESSAGE_TIME = 0.3;

//this object keeps track of all the current players, coordinates and color
var players;
//a reference to this particular player
var me;
var canvas;


//setup is called when all the assets have been loaded
function preload() {
}

function setup() {

    /*
    //This is to visualize framerate independent movements
    var fps = random(30, 60);
    frameRate(fps);
    console.log("Simulating a framerate of " + fps);
    */

    //create a canvas
    canvas = createCanvas(800, 600);
    //accept only the clicks on the canvas (not the ones on the UI)
    canvas.mouseReleased(canvasClicked);
    //by default the canvas is attached to the bottom, i want a 
    canvas.parent('canvas-container');


    //paint it white
    background(200, 255, 255);

    //initialize players as object
    players = {};

    //I create socket but I wait to assign all the functions before opening a connection
    socket = io({
        autoConnect: false
    });

    //if the client detects a server connection it may be because the server restarted 
    //in that case the clients reconnect automatically and are assigned new ids so I have to clear
    //the previous player list to avoid ghosts
    socket.on('connect', function () {
        players = {};
    });

    //when somebody joins the game create a new player
    socket.on('playerJoined',
        function (p) {
            console.log("new player connected " + p.id);
            players[p.id] = {
                color: p.color,
                x: p.x,
                y: p.y,
                destinationX: p.destinationX,
                destinationY: p.destinationY
            }

            //if it's me save a reference to myself and get my initial coordinates from the game state
            if (socket.id == p.id) {
                me = players[p.id];
                me.x = p.x;
                me.y = p.y;
                me.destinationX = p.destinationX;
                me.destinationY = p.destinationY;

            }
            else {
                //if I'm not the new player this forces a new update so the new player knows my position and my destination
                //in case I'm moving
                socket.emit('move', { x: me.x, y: me.y, destinationX: me.destinationX, destinationY: me.destinationY });
            }

            console.log("There are now " + Object.keys(players).length + " players");

        }
    );


    //when somebody clicks to move, update the destination (not the position)
    socket.on('playerMoved',
        function (p) {
            console.log(p.id + " moves to: " + p.destinationX + " " + p.destinationY);

            //make sure the player exists
            if (players.hasOwnProperty(p.id)) {
                players[p.id].x = p.x;
                players[p.id].y = p.y;
                players[p.id].destinationX = p.destinationX;
                players[p.id].destinationY = p.destinationY;
            }
        });


    //when somebody disconnects
    socket.on('playerDisconnected',
        function (p) {
            console.log("Player " + p.id + " disconnected");
            delete players[p.id];
            console.log("There are now " + Object.keys(players).length + " players");
        }
    );

    //when connected the server sends a game state, I can use it to populate my player list
    socket.on('gameState',
        function (gameState) {
            console.log("Receiving game state");
            for (var playerId in gameState.players) {
                if (gameState.players.hasOwnProperty(playerId)) {


                    //copy players to my local player object
                    var p = gameState.players[playerId];

                    //create player objects for all the other players 
                    if (players[playerId] == null) {

                        players[playerId] = {
                            color: p.color
                        }
                    }

                    //the server doesn't keep track of all the positions
                    //I'm gonna wait for the other players' latest positions which they'll 
                    //send as soon as they detect me

                }
            }
        }

    );


    //when somebody talks
    socket.on('playerTalked',
        function (p) {
            console.log("new message from " + p.id + ": " + p.message);
            var playerId = p.id;
            //make sure the player exists in the client
            if (players.hasOwnProperty(p.id)) {
                //the canvas continuously refresh and
                //the speech bubble needs to be rendered for a while
                //so I create a counter
                players[p.id].message = p.message;
                players[p.id].messageTime = p.message.length * MESSAGE_TIME;
            }
        }

    );

    //when a server message arrives
    socket.on('serverMessage',
        function (msg) {
            if (socket.id) {
                console.log("Message from server: " + msg);
            }
        }

    );

    socket.open();

}

//this p5 function is called continuously 60 times per second by default
function draw() {
    //draw an off white background so I can see it
    background(240, 240, 240);

    //iterate through the players
    for (var playerId in players) {
        if (players.hasOwnProperty(playerId)) {

            var p = players[playerId];

            //make sure the coordinates are non null since I may have created a player
            //but I may still be waiting for the first update
            if (p.x != null && p.y != null) {

                //position and destination are different, move
                if (p.x != p.destinationX || p.y != p.destinationY) {

                    //a series of vector operations to move toward a point at a linear speed

                    // create vectors for position and dest.
                    var destination = createVector(p.destinationX, p.destinationY);
                    var position = createVector(p.x, p.y);

                    // Calculate the distance between your destination and position
                    var distance = destination.dist(position);

                    // this is where you actually calculate the direction
                    // of your target towards your rect. subtraction dx-px, dy-py.
                    var delta = destination.sub(position);

                    // then you're going to normalize that value
                    // (normalize sets the length of the vector to 1)
                    delta.normalize();

                    // then you can multiply that vector by the desired speed
                    var increment = delta.mult(SPEED * deltaTime / 1000);

                    /*
                    IMPORTANT
                    deltaTime The system variable deltaTime contains the time difference between 
                    the beginning of the previous frame and the beginning of the current frame in milliseconds.
                    the speed is not based on the client framerate which can be variable but on the actual time that passes
                    between frames. Replace deltaTime with 30 and uncomment the random frameRate at the beginning
                    */

                    //increment the position
                    position.add(increment);

                    //calculate new distance
                    var newDistance = position.dist(createVector(p.destinationX, p.destinationY));

                    //if I got farther than I was originally I overshot so set position to destination
                    if (newDistance > distance) {
                        p.x = p.destinationX;
                        p.y = p.destinationY;
                    }
                    else {
                        p.x = position.x;
                        p.y = position.y;
                    }


                }

                //draw a square of the appropriate color
                noStroke();
                rectMode(CENTER);
                fill(p.color);
                rect(p.x, p.y, 20, 20);

                //check if the player has messages
                if (p.messageTime != null) {

                    //check if the last message expired
                    if (p.messageTime > 0) {
                        //draw the message
                        fill(p.color);
                        textSize(20);
                        textAlign(CENTER, BASELINE);
                        text(p.message, p.x, p.y - 30);
                        //decrease the counter
                        p.messageTime -= deltaTime / 1000;
                    }
                }
            }

        }
    }

    //

}


//My inputs

//when I hits send
function talk(msg) {
    socket.emit('talk', msg);
}

//when I click to move
function canvasClicked() {
    if (me != null)
        socket.emit('move', { x: me.x, y: me.y, destinationX: mouseX, destinationY: mouseY });
}

//For better user experience I automatically focus on the chat textfield upon pressing a key
function keyPressed() {

    var field = document.getElementById("chatField");
    field.focus();
}




