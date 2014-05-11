chat-sharelatex
==============

chat-sharelatex is the front-end chat service of the open-source web-based for ShareLaTex (collaborative LaTeX editor),
[ShareLaTeX](https://www.sharelatex.com).
It serves all the HTML pages, CSS and javascript to the client. chat-sharelatex also contains 
a lot of logic around creating and talking in multi-room chat for ShareLaTex projects.

### To run:

Please be sure you have expressjs and socket.io modules installed before running this application.

On Windows/Mac/Linux:

        $ node app.js

After running go to this address:

	http://locahost:3010/

### Credits

This application uses the following:

- Multi-Room Chat Application - by http://udidu.blogspot.com/2012/11/chat-evolution-nodejs-and-socketio.html
- Animate.css library - by Dan Eden: http://daneden.me/animate/
- Avgrung modal - by Hakim El Hattab: http://lab.hakim.se/avgrund/

### Future features

- Chat history with MongoDB and LocalStorage
- Private chat with users

###Enjoy!
