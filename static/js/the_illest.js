var socket = new io();

socket.on('connect', function() {
    socket.emit('enter', '');
})
var mapdata;


var receiver = document.querySelector(".chatbox");
var intel_box = document.querySelector('.intel_box');

socket.on('swag', function(data) {
    receiver.innerHTML += "<br>" + data;
});

socket.on('intel', function(data){
    intel_box .innerHTML += "<br>" + data;
});
socket.on('game', function(data){
    if(data.length > 0){
        mapdata = data;
       // draw();
    }else {
        document.querySelector(".current_location").innerHTML = "x: " + data.x + " y:" + data.y;

    }
    console.log(mapdata);
    

});
var inputter = document.querySelector("#inputter");
var nicker = document.querySelector("#nicker");

nicker.addEventListener('keypress', (keycode) => {
    if(keycode.which == 13){
        socket.emit('nickname', nicker.value);
        nicker.outerHTML = '';
    }
});
inputter.addEventListener('keypress', (keycode) => {
    if(keycode.which == 13){
        socket.emit('swag', inputter.value);
        inputter.value = "";

    }
})

window.addEventListener('keydown', (keycode) => {
    /* up */
    if(keycode.which == 38){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'up');
        
    }
    /* right */
    else if(keycode.which == 39){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'right');
        
    }
    /* left */
    else if(keycode.which == 37){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'left');

    }
    /* down */
    else if(keycode.which == 40){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'down');

    }
})

let type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }


let gameWidth = 576;
let gameHeight = 576;
let tileAmount = 9;

let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;
let app = new PIXI.Application({width: gameWidth, height: gameHeight});

app.renderer.backgroundColor = 0xaaaaaa;

document.querySelector("#gamebox").appendChild(app.view);

loader.add("images/grass.png")
.add("dudeImage", "images/dude.png")
.add("evilImage", "images/evil.png")
.add("treeImage", "images/tree.png")
.load(setup);




function setup() {
    let grass = new Sprite(resources['images/grass.png'].texture);

    //app.stage.addChild(grass);
    app.ticker.add(delta => gameLoop(delta));

    console.log('setup done');

}

function gameLoop(delta){
    let tile = Math.floor(gameWidth / tileAmount);

    let background = new PIXI.Container();
    background.zIndex = 1;

    let foreground = new PIXI.Container();

    let dude = new Sprite(resources['dudeImage'].texture);

    app.stage.removeChildren();


    for(var i = 0; i < mapdata.length; i++){
        for(var j = 0; j < mapdata[i].length; j++){
            var start_x = Math.floor(i * tile);
            var start_y = Math.floor(j * tile);

            if(mapdata[i][j] == 4){
                let forestTile = new Sprite(resources['treeImage'].texture);
                forestTile.x = start_x;
                forestTile.y = start_y;
                background.addChild(forestTile);

            }
            if(mapdata[i][j] == 3){
                let grassTile = new Sprite(resources['images/grass.png'].texture);
                grassTile.x = start_x;
                grassTile.y = start_y;
                background.addChild(grassTile);
                
            }
            if(mapdata[i][j] == 1){
                let grassTile = new Sprite(resources['images/grass.png'].texture);
                grassTile.x = start_x;
                grassTile.y = start_y;
                background.addChild(grassTile);
                dude.x = start_x;
                dude.y = start_y;
                foreground.addChild(dude);
            }
            if(mapdata[i][j] == 2){
                let grassTile = new Sprite(resources['images/grass.png'].texture);
                grassTile.x = start_x;
                grassTile.y = start_y;
                
                background.addChild(grassTile);
                let evilDude = new Sprite(resources['evilImage'].texture);
                evilDude.x = start_x;
                evilDude.y = start_y
                foreground.addChild(evilDude);
            }
        }
    }
    app.stage.addChild(background);
    app.stage.addChild(foreground);

    //console.log(app.stage.children.length);

}



