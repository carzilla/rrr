var socket = new io();

socket.on('connect', function() {
    socket.emit('enter', '');
})
var mapdata;



var receiver = document.querySelector(".chatbox");
var intel_box = document.querySelector('.intel_box');
let killfeed = Array();
let x = 0;
let y = 0;

let finalwords = "";
socket.on('swag', function(data) {
    receiver.innerHTML += "<br>" + data;
});

socket.on('intel', function(data){
    intel_box .innerHTML += "<br>" + data;
});
socket.on('attack', function(data){
    addBoom(data);
});
socket.on('killfeed', function(data){
    console.log("BOOM BABY! " + data + " DIED");
    addToKillfeed(data);
    
});
socket.on("youded", function(data){
    console.log(data + 'killed my sorry ass');
    finalwords = data + " pwned you";
});
socket.on('game', function(data){
    if(data.length > 0){
        mapdata = data;
       // draw();
    }else {
        x = data.x;
        y = data.y;
        document.querySelector(".current_location").innerHTML = "x: " + data.x + " y:" + data.y;

    }
    //console.log(mapdata);
    

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
    if(keycode.which == 32){
        let items = document.querySelectorAll(".input_item");
        let focus = false;
        items.forEach((e) => {
            
            if(document.activeElement == e){
                focus = true;
            }
        });

        
        if(!focus){
            PIXI.sound.play('attack');

            socket.emit('attack');
            keycode.preventDefault();
        }
    }
    /* up */
    if(keycode.which == 38){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'up');
        PIXI.sound.play('sfxGrass');
        
    }
    /* right */
    else if(keycode.which == 39){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'right');
        PIXI.sound.play('sfxGrass');
        
    }
    /* left */
    else if(keycode.which == 37){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'left');
        PIXI.sound.play('sfxGrass');

    }
    /* down */
    else if(keycode.which == 40){
        keycode.stopPropagation();
        keycode.preventDefault();
        socket.emit('move', 'down');
        PIXI.sound.play('sfxGrass');

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
let booms = Array();

app.renderer.backgroundColor = 0xaaaaaa;

document.querySelector("#gamebox").appendChild(app.view);

loader.add("images/grass.png")
.add("dudeImage", "images/dude.png")
.add("evilImage", "images/evil.png")
.add("treeImage", "images/tree.png")
.add("boomImage", 'images/boom.png')
.add('attack', 'sfx/attack.mp3')
.add('sfxGrass', 'sfx/grass.mp3')
.add('fattyImage', 'images/fatty.png')
.load(setup);

//PIXI.sound.add('attack', 'sfx/attack.mp3');



function setup() {
    let grass = new Sprite(resources['images/grass.png'].texture);

    //app.stage.addChild(grass);
    app.ticker.add(delta => gameLoop(delta));

    console.log('setup done');

}
function addBoom(boomdata){
    let boom = {data: boomdata, when: Date.now()}
    booms.push(boom);
}
function updateBooms(){
    let now = Date.now();
    for(let i in booms){
        
        if(now - booms[i].when > 500){
            booms.splice(i, 1);
        }
    }
}
function distanceFromPlayer(coords){
    let obj_x = coords.x;
    let obj_y = coords.y;
    let dist_x = x - obj_x;
    let dist_y = y - obj_y;

    return {x: dist_x, y: dist_y};

}

function addToKillfeed(dead_player){
    console.log('added to killfeed');
    killfeed.push({player: dead_player, when: Date.now()});
}
function updateKillfeed(){
    let now = Date.now();
    for(let i in killfeed){
        if(now - killfeed[i].when > 2000){
            killfeed.splice(i, 1);
        }
    }
}

function gameLoop(delta){
    let tile = Math.floor(gameWidth / tileAmount);

    let background = new PIXI.Container();
    background.zIndex = 2;

    let foreground = new PIXI.Container();
    foreground.zIndex = 1;

    let superforeground = new PIXI.Container();

    let dude = new Sprite(resources['dudeImage'].texture);

    app.stage.removeChildren();

    updateBooms();
    updateKillfeed();

    if(mapdata == undefined){
        return;
    }

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

    for(let i in booms){
        let boom = new Sprite(resources['boomImage'].texture);
        let b_dist = distanceFromPlayer(booms[i].data);

        boom.x = Math.floor((4 - b_dist.x) * tile);
        boom.y = Math.floor((4 - b_dist.y) * tile);
        superforeground.addChild(boom);
    }

    for(let i in killfeed){
        console.log("OK?");
        let text = new PIXI.Text(killfeed[i].player + ' GOT ROLFSTOMPED',{fontFamily : 'Arial', fontSize: 24, fill : 0xff1010, align : 'center', dropShadow: true, fontStyle: 'bold'});
        text.y = gameHeight / 2;
        

        superforeground.addChild(text);
    }
    if(finalwords != ""){
        let text = new PIXI.Text(finalwords,{fontFamily : 'Arial', fontSize: 30, fill : 0xff1010, align : 'center', dropShadow: true, fontStyle: 'bold'});
        text.y = gameHeight / 2;
        

        superforeground.addChild(text);

    }
    app.stage.addChild(background);
    app.stage.addChild(foreground);
    app.stage.addChild(superforeground);

    //console.log(app.stage.children.length);

}



