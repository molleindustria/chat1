# Visual Chat

There are plenty of html chat examples using socket, including its official [intro tutorial](https://socket.io/get-started/chat/).  
This one uses p5.js in order to incorporate a visual component: rudimentary avatars and speech bubbles.  

Everything happens via relatively sparse events, avatars move with point and click actions and talk when players click on the form button.  
Aside of broadcasting every player event, the server keeps track of the game state, in particular all the player positions and colors. In this way, when a new player joins they can receive the correct information about all current players.

The movements are entirely resolved on the client-side. For a friendly chat this is not an issue but in a competitive game this could enable cheating. The server *trusts* the client so if a player hacks it (via developer console for example) it could potentially broadcast "game-breaking" information to all players.

All the movements are **frame independent** so clients running at different framerate will see the same results. The speed is multiplied by a deltaTime so it's in pixels per second, not pixel per frame. This is good practice in general but crucial in multiplayer games.

p5.js has a [DOM add-on](https://p5js.org/reference/#group-DOM), which allows the library to handle normal html elements like forms and buttons. It needs to be imported separately, check the index.html header.
