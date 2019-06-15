const WIDTH = 35;
const HEIGHT = 35;
const LIGHT_BROWN = "#FFD8C6";
const BROWN = "#714F45";
const DARK_BROWN = "#4e342e";
const BACK_BROWN = LIGHT_BROWN;

let font, img;
let board = [];
let gameLength = 10;
let fill_board = () => {return Array.from(Array(gameLength), () => Array.from(Array(gameLength), () => 1 ))}
let data = []
let socket, turn, id, opp_name, ends_flag, wait_flag, pause_flag = false

function preload() {
   // Ensure the .ttf or .otf font stored in the assets directory
   // is loaded before setup() and draw() are called
   font = loadFont('./MyriadSetPro-Semibold.ttf');
   img = loadImage('./sk.png');
 }

function setup() {
   let canv = createCanvas(350, 350);
   canv.parent("canv");

   board = fill_board()

   let d = 25; // rect width and height with stroke and space
   let s = 3.5;
   let w = 1.5; // stroke weight

   image(img, s+w, s+w, d, d);

   noLoop()
}

function draw() {

   if(ends_flag){
      return
   }

   background(DARK_BROWN);

   for(let i = 0; i < gameLength; i++){
      for(let j = 0; j < gameLength; j++){
         let d = 24; // rect width and height with stroke and space
         let s = 3; // spcae
         let w = 3; // stroke weight
         let y = i * WIDTH + s + w;
         let x = j * HEIGHT + s + w;
         if(board[i][j] === 1){
            fill(DARK_BROWN);
            noStroke();
            rect(x, y, d, d);
            // Draw yellow semi box
            strokeWeight(w);
            stroke(LIGHT_BROWN);
            line(x, y, x + d, y);
            line(x, y, x, y + d);
            // draw black semi box
            strokeWeight(w);
            stroke(BROWN);
            line(x + d, y, x + d, y + d);
            line(x, y + d, x + d, y + d);

            if(i===0 && j ===0){
               image(img, s+3*w, s+3*w, d-4*w, d-4*w);
            }
         } else {
            fill(LIGHT_BROWN);
            noStroke();
            rect(x-s-w, y-s-w, d+4*s, d+4*s);
         }
      }
   }
   
   let t = 'Cut the board. For restart, click on toxic chocolate!' // TODO: board?
   if(turn){
      t = 'Your turn'
   } else {
      if(turn === false){
         t = 'Your opponent\'s turn, '+ opp_name
      } else if (wait_flag) {
         t = 'Please wait'
      } 
   }
   $('#information').text(t)
}

function mousePressed(){
   if(!(mouseX >= 0 && mouseX < 10 * WIDTH && mouseY >= 0 && mouseY < 10 * WIDTH) || turn === false || pause_flag || wait_flag){
      return
   }
   let y = Math.floor(mouseX / WIDTH)
   let x = Math.floor(mouseY / HEIGHT)
   let num = x * 10 + y
   if(board[x][y]===0){
      return
   }
   for(let i = x; i < gameLength; i++){
      for(let j = y; j < gameLength; j++){
         board[i][j] = 0;
      }
   }
   console.log(board)
   if(socket){
      if(board[0][0] === 0){
         socket.emit('lose')
      } else {
         socket.emit('data', { board, num })
         turning()
      }
   } else {
      if(board[0][0] === 0){
         board = fill_board()
      }
   }
   r()
}

$('document').ready(() => {
   $("#name").val(faker.name.findName())
})

function start() {
   socket = io();

   id = $("#name").val()
   
   socket.emit('init', {
      board,
      id
   })

   socket.on('err', (data) => {
      alert(data.msg)
   })

   socket.on('disconnect', () => {
      if(!ends_flag){
         $('body').empty()
         let disconnectionConfirm = confirm('Disconnection! Do you want to refresh?')
         if(disconnectionConfirm){
            window.location.reload()
         }
      }
   })

   socket.on('wait', () => {
      $("#button").val('cancel')
      $("#button").attr("onclick","cancel()")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      
      wait_flag = true
      pause_flag = false

      r()
   })

   socket.on('start', (data) => {
      console.log(data)
      $("#button").val('cancel')
      $("#button").attr("onclick","cancel()")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      pause_flag = false
      wait_flag = false

      turn = data.your_turn

      $('#opp').text('play against ' + data.another_player.id + ' in room ' + data.room_name)

      opp_name = data.another_player.id

      board = data.board

      r()
   })

   socket.on('pause', () => {
      pause_flag = true
      alert('geme paused!')
   }) 

   socket.on('in_game', (data) => {

      $("#button").val('cancel')
      $("#button").attr("onclick","cancel()")
      $("#name").remove()
      $("#button").css('margin-left', '130px')
      pause_flag = false
      wait_flag = false

      turn = data.your_turn
      // turn

      $('#opp').text('play against ' + data.another_player.id + ' in room ' + data.room_name)

      opp_name = data.another_player.id

      board = data.board
      alert('conection established')
      
      r();
   })

   socket.on('data', (data) => {
     console.log(data)
      if(data.num) {
         let num = data.num
         let y = num % 10
         num = parseInt(num / 10)
         let x = num

         for(let i = x; i < gameLength; i++){
            for(let j = y; j < gameLength; j++){
               board[i][j]=0
            }
         }
      } else {
         board = data.board
      }

      turning()

      r()
      
   })

   socket.on('end', (data) => {
      ends_flag = true
      $('#canv').empty()
      $("#button").val('refresh')
      $("#button").attr("onclick","window.location.reload()")
      if(data.winner === id){
         $('#information').text(`${data.reason}. Winner winner, Chicken dinner!`)
      } else {
         $('#information').text(`${data.reason}. You are a loser`)
      }
   })
}

function cancel(){
   let cancelConfirm = confirm("Do you want to cancel?");
   if(cancelConfirm){
      socket.emit('cancel')
   }
}

function turning(){
   turn = !turn
}

function r(){
   // loop for a little time!
   loop()
   noLoop()
}