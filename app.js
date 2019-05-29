const room = require('./Room')
const err = require('./errors')
const https = require('https')
const express = require('express')
const app = express()
const http = require('http').Server(app)

const PORT = process.env.PORT || 8000
const URL = process.env.URL || '127.0.0.1'

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD + '/web'));

app.get('/', (req, res) => {
   res.sendFile(process.env.PWD + '/web/index.html');
});

// socket.io
const io = require('socket.io')(http)

let room_list = []
let players_map = {}
count = () => {
   return Object.keys(players_map).length
}

io.on('connection', (socket) => {
   let id = socket.id
   let current_room, current_room_name

   socket.use((packet, next) => {
      if(packet[0] === 'init' || current_room){
         next()
      } else {
         socket.emit('err', err['init'])
      }
   });

   //functions
   function cancel(){
      if(current_room){
         console.log(`+++an user disconnected with this id: ${id}`)
         io.to(current_room_name).emit('destroy')
         room_list = current_room.end(room_list, players_map)
      }
   }

   function lose(_data){
      if (current_room && current_room.is_complete()) {
         if (current_room.is_my_turn(id)) {
            current_room.send_data_from(id, {}, 'win')
            socket.emit('lose')
            let winner = current_room.get_another_player(id)
            io.to(current_room_name).emit('end', {
               winner: winner.id,
               loser: id
            })
            //TODO: save game information
            room_list = current_room.end(room_list, players_map)
         } else {
            socket.emit('err', err['turn'])
         }
      } else {
         socket.emit('err', err['wait'])
      }
   }

   // init
   socket.once('init', (data) => {
      id = data.id
      if(id in players_map){
         return socket.emit('err',err['id'])
      }
      if(!id){
         return socket.emit('err',err['empty_id'])
      }
      players_map[id] = socket
      if (count() % 2 == 0) {
         current_room = room_list[room_list.length - 1]
         current_room.set_second_player(id, socket)
         current_room_name = current_room.get_name()
      } else {
         current_room = new room(`room${room_list.length}`, id, socket, data.board)
         current_room_name = current_room.get_name()
         room_list.push(current_room)
      }
      socket.join(current_room_name)
      if (current_room.is_complete()) {
         current_room.start()
      } else {
         io.to(current_room_name).emit('wait');
      }
      console.log(`--a new user connected with this id: ${id}`)
   })

   // event handlers
   socket.on('data', (data) => {
      if (current_room.is_complete()) {
         if (current_room.is_my_turn(id) && !current_room.is_lose()) {
            current_room.change_turn_and_board(data.board)
            current_room.send_data_from(id, data)
         } else if (current_room.is_lose()){
            return lose(data)
         } else {
            socket.emit('err', err['turn'])
         }
      } else {
         socket.emit('err', err['wait'])
      }
   })

   socket.once('disconnect', cancel)
   socket.once('cancel', cancel)
   socket.once('lose', lose)
      
});


setInterval(() => {
   https.get(URL).on('err', (e) => {
      console.error(e)
   })
}, 300000)

http.listen(PORT, function () {
   console.log('listening on ' + PORT);
});