const WIDTH = 35;
const HEIGHT = 35;
const LIGHT_BROWN = "#fcd75f";
const BROWN = "#866C69";
const DARK_BROWN = "#0f0801";
const BACK_BROWN = "#614646";
const GRAY = "#6d6d6d";

let font, img;
let board = [];
let gameLength = 10;
let data = []
let socket, turn, ends, id, opp_name, pause_flag = false, canceled_game = false

function preload() {
   // Ensure the .ttf or .otf font stored in the assets directory
   // is loaded before setup() and draw() are called
   font = loadFont('./MyriadSetPro-Semibold.ttf');
   img = loadImage('./sk.png');
 }

function setup() {
   let canv = createCanvas(350, 450);
   canv.parent("canv");

   board = [
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1]
   ]

   let d = 25; // rect width and height with stroke and space
   let s = 3.5;
   let w = 1.5; // stroke weight

   image(img, s+w, s+w, d, d);
   textFont(font);
   textSize(30);
   textAlign(CENTER, CENTER);

   noLoop();
}

function draw() {
   background(BACK_BROWN);

   for(let i = 0; i < gameLength; i++){
      for(let j = 0; j < gameLength; j++){
         if(board[i][j] === 1){
            let d = 25; // rect width and height with stroke and space
            let s = 3.5;
            let w = 1.5; // stroke weight
            let x = i * WIDTH + s + w;
            let y = j * HEIGHT + s + w;
            fill(BROWN);
            noStroke();
            rect(x, y, d, d);
            // Draw yellow semi box
            strokeWeight(w);
            stroke(LIGHT_BROWN);
            line(x, y, x + d, y);
            line(x, y, x, y + d);
            // draw black semi box
            strokeWeight(w);
            stroke(DARK_BROWN);
            line(x + d, y, x + d, y + d);
            line(x, y + d, x + d, y + d);

            if(i===0 && j ===0){
               loadImage('./sk.png', img => {
                  image(img, s+w, s+w, d, d);
                });
            }
         }
      }
   }
   
   
   textAlign(CENTER);
   fill(LIGHT_BROWN);
   if(turn){
      text('you', width * 0.5, 400);
   } else {
      if(turn === false){
         text(opp_name, width * 0.5, 400);
      } else {
         text('', width * 0.5, 400);
      }
   }
   
}

function mousePressed(){
   if(!(mouseX >= 0 && mouseX < 10 * WIDTH && mouseY >= 0 && mouseY < 10 * WIDTH) || !turn)
      return
   let x = Math.floor(mouseX / WIDTH)
   let y = Math.floor(mouseY / HEIGHT)
   for(let i = x; i < gameLength; i++){
      for(let j = y; j < gameLength; j++){
         board[i][j] = 0;
      }
   }
   loop();
   if(socket){
      socket.emit('data', {board})
   }
   noLoop();
}

function mouseReleased() {
   loop();
   noLoop();
}

$('document').ready(() => {
   $("#name").val(faker.name.findName())
})

function start() {
   ends = false
   socket = io();

   id = $("#name").val()
   
   socket.emit('init', {
      board,
      id
   })

   socket.on('err', (data) => {
      alert(data.msg)
   })

   socket.on('wait', () => {
      $("#button").val('wait...')
      $("#button").attr("onclick","")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      pause_flag = false
   })

   socket.on('start', (data) => {
      loop();

      $("#button").val('cancel')
      $("#button").attr("onclick","cancel()")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      pause_flag = false

      turn = data.your_turn
      // turn

      $('#opp').text('play against ' + data.another_player.id + ' in room ' + data.room_name)

      board = data.board
      noLoop();
   })

   socket.on('disconnect', () => {
      // refresh
   })

   socket.on('pause', () => {
      pause_flag = true
      alert('geme paused!')
   }) 

   socket.on('in_game', (data) => {
      loop();

      $("#button").val('cancel')
      $("#button").attr("onclick","cancel()")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      pause_flag = false

      turn = data.your_turn
      // turn

      $('#opp').text('play against ' + data.another_player.id + ' in room ' + data.room_name)

      board = data.board
      alert('your enemy comes back!')
      
      noLoop();
   })

   socket.on('data', (data) => {
      board = data.board

      turning()
   })

   socket.on('end', (data) => {
      // TODO: text by canvas
   })
}

function cancel(){
   socket.emit('cancel')
   turn_off()
}

function turning(){
   turn = !turn
}