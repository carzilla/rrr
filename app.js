
const express = require('express')
const app = express()
var mysql = require('mysql')
var http = require('http').Server(app)
var socket = require('socket.io')(http)
var npc = require('./npc.js');


app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static('static'));


app.get('/', (req, res) => {
    res.render('index', {title: 'REBOOT. REFRESH. RESTART.'})
})


const TILE_GRASS = 3;
const TILE_TREE = 4;
const ENEMY_FATTY = 5;
const STATE_DEAD = 0;
const STATE_RUNNING = 1;
const STATE_FULL = 2;
const PLAYER_ALIVE = 1;
const PLAYER_DEAD = 2;




let gameMap;
let gameState = STATE_DEAD;


npcs = new Array();
nicknames = new Map();
playerLocations = new Map();

function randomizer(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function lookupName(id){
    return nicknames.get(id) ? nicknames.get(id) : id;
}

/**
 * Initialize a player. Checks if there is a need to generate a map or not.
 * @param {string} id 
 */
function initializePlayer(id){
    /* Check the gameState. If it's the first player, we need to generate a map too */
    checkGamestate();
    /* Add the player to the map of players */
    playerLocations.set(id, {x: randomizer(100), y: randomizer(100), last_direction: '', state: PLAYER_ALIVE});
}

function checkGamestate(){
    if(gameState == STATE_DEAD){
        generateMap();
    }
    if(gameState == STATE_RUNNING){
        if(playerLocations.length === 0){
            gameState == STATE_DEAD;
        }
    }
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
    checkGamestate();
}
/**
 * Handles attacks
 * @param {string} id 
 */
function handleAttack(id){
    let player = playerLocations.get(id);
    let d = player.last_direction.direction;
    let adj = player.last_direction.adjustment;
    let target_coord = {x: player.x, y: player.y};
    if(d == 'x'){
        target_coord.x = player.x + adj;
    }
    if(d == 'y'){
        target_coord.y = player.y + adj;
    }


    playerLocations.forEach((cur, key) => {
        console.log("checking");
        if(cur.x == target_coord.x && cur.y == target_coord.y){
            cur.state = PLAYER_DEAD;
            let nickname = (nicknames.get(key) ? nicknames.get(key) : key ) ;
            socket.sockets.emit("killfeed", nickname);
            socket.sockets.to(key).emit("youded", (nicknames.get(id) ? nicknames.get(id) : id ));

            //socket.broadcast.emit("killfeed", nickname);
        }
        
    });

    return target_coord;

}

/**
 * Generates map at initial stage of the game.
 */
function generateMap(){
    console.log("generating map");
    gameMap = create2DArray(100, 100);
    /* Generate enviorment */
    for(let x = 0; x < gameMap.length; x++){
        for(let y = 0; y < gameMap[x].length; y++){
            if(randomizer(10) == 9){                
                gameMap[x][y] = TILE_TREE;
            }
            else {
                gameMap[x][y] = TILE_GRASS;
            }

        }
    }


    /* Add fatties to the map */
    let fattyAmount = (randomizer(100) > 90) ? 2 : 1;
    
    /* Generate fatties */
    for(let i = 0; i <fattyAmount; i++){
        let isValid = false;
        while(!isValid){
            let potential_x = randomizer(100);
            let potential_y = randomizer(100);

            if(validPosition(potential_x, potential_y, npc.Fatty.getWidth, npc.Fatty.getWidth)){
                let tmp = new npc.Fatty(potential_x, potential_y);
                isValid = true;
                npcs.push(tmp);
            }
        }

    }



    gameState = STATE_RUNNING;
    
}
/**
 * Function that checks if a position is a valid position. Can be used for generating NPCs.
 * @param {int} x 
 * @param {int} y 
 * @param {int} width 
 * @param {int} height 
 */
function validPosition(x, y, width = 1, height = 1){
    for(let px = 0; px < width; px++){
        if(gameMap[x + px][y] == TILE_TREE){
            return false;
        }
    }
    for(let py = 0; py < height; py++){
        if(gameMap[x][y + py] == TILE_TREE){
            return false;
        }
    }

    return true;
}
/**
 * 
 * @param {string} id 
 * @param {char} axis 
 * @param {int} adjustment 
 */
function movePlayer(id, axis, adjustment){
    if(playerLocations.get(id).state == PLAYER_DEAD){
        return;
    }
    let player_x = playerLocations.get(id).x;
    let player_y = playerLocations.get(id).y;
    if(axis == 'y'){
        if(player_y + adjustment < 0 || player_y + adjustment > 99){

        }else {
            if(gameMap[player_x][player_y + adjustment] == TILE_TREE){
                return;
            }
            
            playerLocations.set(id, {x: player_x, y: player_y + adjustment, last_direction: {direction: axis, adjustment: adjustment}});
        }
    }
    if(axis == 'x'){
        if(player_x + adjustment < 0 || player_x + adjustment > 99){

        }else {
            if(gameMap[player_x + adjustment][player_y] == TILE_TREE){
                return;
            }

            playerLocations.set(id, {x: player_x + adjustment, y: player_y, last_direction: {direction: axis, adjustment: adjustment}});
        }

    }

}

/***
 * sends map to player
 */
function renderMap(id){
    var playerX = playerLocations.get(id).x;
    var playerY = playerLocations.get(id).y;

    start_x = playerX - 4;
    start_y = playerY - 4;

    var locs = create2DArray(9, 9);
    
    for(var [target, loc] of playerLocations){
        if(loc.state == PLAYER_DEAD){
            continue;
        }
        var tmpx = parseInt(loc.x);
        var tmpy = parseInt(loc.y);
        if((tmpx >= start_x && tmpx <= playerX + 4) && (tmpy >= start_y && tmpy <= playerY + 4)){
            if(target == id){
                locs[tmpx - start_x][tmpy - start_y] = 1;
            }
            else {
                locs[tmpx - start_x][tmpy - start_y] = 2;
            }
            
        }
    }

    for(let x = 0; x < locs.length; x++){
        for(let y = 0; y < locs[x].length; y++){
            if(start_x + x < 0 || start_y + y < 0 || start_y + y >= 100 || start_x + x >= 100){                
                continue;
            }
            if(locs[x][y] === undefined){
                locs[x][y] = gameMap[start_x + x][start_y + y];
                
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
        }
    });

    socket.on('attack', (data) => {
        let result = handleAttack(socket.id);
        socket.broadcast.emit('attack', result);
        socket.emit('attack', result);

        
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
            
        }
    
    });

});

http.listen(3000, () => console.log('Example app listening on port 3000!'))