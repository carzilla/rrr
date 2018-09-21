const express = require('express')
const app = express()
var mysql = require('mysql')
var http = require('http').Server(app)
var socket = require('socket.io')(http)



app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('static'));


app.get('/', (req, res) => {
    res.render('index', {title: 'REBOOT. REFRESH. RESTART.'})
})

nicknames = new Map();
playerLocations = new Map();

function randomizer(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function lookupName(id){
    return nicknames.get(id) ? nicknames.get(id) : id;
}

function initializePlayer(id){
    playerLocations.set(id, {x: randomizer(50), y: randomizer(50)});
}

function create2DArray(numRows, numColumns) {
	let array = new Array(numRows); 
 
	for(let i = 0; i < numColumns; i++) {
		array[i] = new Array(numColumns); 
	}
 
	return array; 
}

function removePlayer(id){
    playerLocations.delete(id);
}

function movePlayer(id, axis, adjustment){
    let player_x = playerLocations.get(id).x;
    let player_y = playerLocations.get(id).y;
    if(axis == 'y'){
        if(player_y + adjustment < 0 || player_y + adjustment > 100){

        }else {
            playerLocations.set(id, {x: player_x, y: player_y + adjustment});
        }
    }
    if(axis == 'x'){
        if(player_x + adjustment < 0 || player_x + adjustment > 100){

        }else {
            playerLocations.set(id, {x: player_x + adjustment, y: player_y});
        }

    }

}

function renderMap(id){
    var playerX = playerLocations.get(id).x;
    var playerY = playerLocations.get(id).y;

    start_x = playerX - 4;
    start_y = playerY - 4;

    var locs = create2DArray(9, 9);

    for(var [target, loc] of playerLocations){
        
        var tmpx = parseInt(loc.x);
        var tmpy = parseInt(loc.y);
        if((tmpx >= start_x && tmpx <= playerX + 4) && (tmpy >= start_y && tmpy <= playerY + 4)){
            if(target == id){
                locs[tmpx - start_x][tmpy - start_y] = 1;
            }
            else {
                locs[tmpx - start_x][tmpy - start_y] = 2;
            }
            console.log('found! ' + target + ' origin: ' + id);
        }
    }
    //console.log(locs);

    for(let x = 0; x < locs.length; x++){
        for(let y = 0; y < locs[x].length; y++){
            if(start_x + x < 0 || start_y + y < 0 || start_y + y > 50 || start_x + x > 50){
                console.log('skip' + x + ' ' + y + ' on ' + start_x);
                continue;
            }
            if(locs[x][y] === undefined){
                locs[x][y] = 3;
            }
        }
    }

    return locs;
}

socket.on('connection', function(socket){
    console.log('socket connected' + socket.id);
    /* this is just chats */
    socket.on('swag', function(data){
        var who = lookupName(socket.id);
        
        socket.broadcast.emit('swag', 'from:' + who + ':' + data);
        socket.emit('swag', '<>: ' + data);
    });

    /* internal game movement */
    socket.on('move', (data) => {
        if(data == 'up'){
            movePlayer(socket.id, 'y', -1);
        }
        if(data == 'down'){
            movePlayer(socket.id, 'y', 1);
        }
        if(data == 'left'){
            movePlayer(socket.id, 'x', -1);
        }
        if(data == 'right'){
            movePlayer(socket.id, 'x', 1);
        }
        socket.emit('game', {x: playerLocations.get(socket.id).x, y: playerLocations.get(socket.id).y});
        socket.emit('game', renderMap(socket.id));

        for(var [target, loc] of playerLocations){
            if(target == socket.id){
                continue;
            }
            socket.to(target).emit('game', renderMap(target));
            console.log('sending new map');
        }



    });
    /* nickname changes */
    socket.on('nickname', (data) => {
        socket.broadcast.emit('intel', socket.id + ' is now known as ' + data);
        socket.emit('intel', 'you are now known as ' + data);
        nicknames.set(socket.id, data);
    });

    /* entering game */
    socket.on('enter', (data) => {
        socket.broadcast.emit('intel', socket.id + ' has entered the game');
        initializePlayer(socket.id);
        socket.emit('game', playerLocations.get(socket.id));
        socket.emit('game', renderMap(socket.id));
        
        for(var [target, loc] of playerLocations){
            if(target == socket.id){
                continue;
            }
            socket.to(target).emit('game', renderMap(target));
            console.log('sending new map');
        }
        
    });
    /* handle disconnects */
    socket.on('disconnecting', function(oopsie) {
        var who = lookupName(socket.id);
        socket.broadcast.emit('swag', who + ' has left the server');
        removePlayer(socket.id);
        for(var [target, loc] of playerLocations){
            if(target == socket.id){
                continue;
            }
            socket.to(target).emit('game', renderMap(target));
            console.log('sending new map');
        }
    
    });

});

http.listen(3000, () => console.log('Example app listening on port 3000!'))