const room = require('./Room')
const err = require('./errors')
const https = require('https')
const morgan = require('morgan')
const express = require('express')
const app = express()
const http = require('http').Server(app)

const PORT = process.env.PORT || 8000
const URL = process.env.URL || ''

process.env.PWD = process.cwd()

app.use(express.static(process.env.PWD + '/web'));
app.use(morgan('combined'))

// socket.io
const io = require('socket.io')(http)

let room_list = []
let players_map = {}
count = () => {
   return Object.keys(players_map).length
}
let disconnection_timeout

io.on('connection', (socket) => {
   console.log('unknown connection with id: ' + socket.id)
   
   // timer for any connected socket!
   let time_counter = 0;
   let timer = setInterval(() => {
      socket.emit('timer', time_counter++)
   }, 1000)
   socket.on('set_timer', (num) => {
      if (typeof num === 'number') {
         time_counter = num
      } else if (typeof num.num === 'number') {
         time_counter = num.num
      } else if (typeof num === 'string') {
         time_counter = parseInt(num)
      } else if (typeof num.num === 'string') {
         time_counter = parseInt(num.num)
      }
   })
   
   
   // main program
   let id = socket.id
   let current_room, current_room_name
   
   socket.use((packet, next) => {
      if (packet[0] === 'cancel') {
         next()
      } else if (packet[0] === 'init' || packet[0] === 'set_timer' || current_room) {
         if (current_room && current_room.get_status() === 0) {
            socket.emit('err', err['disable_game'])
            return
         }
         next()
      } else {
         socket.emit('err', err['init'])
      }
   });
   
   //functions
   function lose(_) {
      if (current_room && current_room.is_complete()) {
         if (current_room.is_my_turn(id)) {
            
            //TODO: save game information
            
            end(0, `${id} eat toxic chocolate`)
         } else {
            socket.emit('err', err['turn'])
         }
      } else {
         socket.emit('err', err['wait'])
      }
   }

   function end(code, reason) {

      current_room.set_status(-1)

      if (current_room.is_complete()) {
         let winner = current_room.get_another_player(id)
         let loser = current_room.find_by_id(id)


         io.to(current_room_name).emit('end', {
            code,
            reason,
            winner: winner.id,
            loser: loser.id
         })

         winner.socket.disconnect()
         loser.socket.disconnect()
      } else {
         let loser = id

         io.to(current_room_name).emit('end', {
            code,
            reason,
            loser: loser.id
         })

         socket.disconnect()
      }

      current_room.destroy()
      room_list = room_list.filter(r => r !== current_room)

      console.log(`room ${current_room_name} removed`)
   }

   // init
   socket.once('init', (data) => {
      id = data.id
      if (id in players_map) {
         if (players_map[id]) {
            return socket.emit('err', err['id'])
         } else {
            room_list.forEach(room => {
               let founded_player = room.find_by_id(id)
               if (founded_player) {
                  current_room = room
                  room.set_status(1)
                  founded_player.socket = socket
                  founded_player.id = id
                  players_map[id] = socket
                  if (!room.is_complete()) {
                     io.emit('wait')
                  } else {
                     room.send_in_game_data('in_game')
                  }
                  clearTimeout(disconnection_timeout)
                  return
               }
            });
            if (!players_map[id]) {
               throw new Error(players_map[id])
            }
         }
      }
      if (!id) {
         return socket.emit('err', err['empty_id'])
      }
      players_map[id] = socket
      if (count() % 2 == 0) {
         current_room = room_list[room_list.length - 1]
         current_room.set_second_player(id, socket)
         current_room_name = current_room.get_name()
      } else {
         current_room = new room(`room${room_list.length}`, id, socket, data)
         current_room_name = current_room.get_name()
         room_list.push(current_room)
      }
      socket.join(current_room_name)
      if (current_room.is_complete()) {
         current_room.start()
      } else {
         io.to(current_room_name).emit('wait');
      }
      console.log(`player ${id} connected`)
   })

   // event handlers
   socket.on('data', (data) => {
      if(!data){
         socket.emit('err', err['null_data'])
      }
      if (current_room.is_complete()) {
         if (current_room.is_my_turn(id) && !current_room.is_lose(data.num)) {
            current_room.change_turn_and_board(data)
            current_room.send_data_from(id, data)
         } else if (current_room.is_lose(data.num)) {
            return lose(data)
         } else {
            socket.emit('err', err['turn'])
         }
      } else {
         socket.emit('err', err['wait'])
      }
   })

   socket.once('disconnect', () => {
      if (current_room) {
         //initialized socket
         if (current_room.get_status() === -1) {
            // room is ended by canceling or long time disconnection
            delete players_map[id]
            socket.leave(current_room_name)

            console.log(`player ${id} removed`)
         } else {
            // a client disconnected

            let life_time = 30000

            socket.to(current_room_name).emit('pause', {
               life_time
            })
            current_room.set_status(0)

            // suspend
            players_map[id] = null

            disconnection_timeout = setTimeout(() => {
               // check that client comes back or not!
               if (!players_map[id]) {
                  let winner = current_room.get_another_player(id)
                  let loser = current_room.find_by_id(id)

                  io.to(current_room_name).emit('end', {
                     code: 2,
                     reason: `player ${loser.id} disconnected`,
                     winner: winner.id,
                     loser: loser.id
                  })
                  current_room.set_status(-1)

                  winner.socket.disconnect()

                  delete players_map[id]
                  socket.leave(current_room_name)

                  current_room.destroy()
                  room_list = room_list.filter(r => r !== current_room)

                  console.log(`room ${current_room_name} removed`)
               }
            }, life_time)
         }

         console.log(`player ${id} disconnected`)
      } else {
         console.log('unknown disconnection ' + socket.id)
      }
      clearInterval(timer)
   })

   socket.once('cancel', () => {
      end(1, `${id} left the game`)
   })

   socket.once('lose', lose)

});



http.listen(PORT, function () {
   console.log('listening on ' + PORT);
   if (URL !== '') {
      setInterval(() => {
         https.get(URL).on('err', (e) => {
            console.error(e)
         })
      }, 300000)
   }
});