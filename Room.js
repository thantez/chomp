class Room{

   constructor(name, player_name, player_socket, board){
      this.name = name
      this.first_player = {
         id: player_name,
         socket: player_socket
      }
      this.board = board
      this.second_player = {
         id: '',
         socket: null
      }
      this.status = 1;
   }

   is_complete(){
      return this.second_player.socket !== null
   }

   set_second_player(id, socket){
      this.second_player.id = id
      this.second_player.socket = socket
   }

   get_name(){
      return this.name
   }

   send_data_from(sender_id, data, msg = 'data'){
      if(this.is_complete()){
         if(this.first_player.id === sender_id){
            this.second_player.socket.emit(msg, data)
         } else {
            this.first_player.socket.emit(msg, data)
         }
      }
   }

   get_turn(){
      // true = first player's turn
      // false = second player's turn
      return this.turn
   }

   change_turn_and_board(board){
      this.turn = !this.turn
      this.board = board
   }

   get_board(){
      return this.board
   }

   send_in_game_data(e){
      this.first_player.socket.emit(e, {
         another_player: {id: this.second_player.id},
         room_name: this.name,
         board: this.board,
         your_turn: this.turn,
         initialized_with_my_board: true,
         game_status: this.status === 1
      })
      this.second_player.socket.emit(e, {
         another_player: {id: this.first_player.id},
         room_name: this.name,
         board: this.board,
         your_turn: !this.turn,
         initialized_with_my_board: false,
         game_status: this.status === 1
      })
   }

   start(){
      this.turn = Math.random() > 0.5
      this.send_in_game_data('start')
   }

   end(rooms, players_map){
      if(this.is_complete()){
         this.second_player.socket.disconnect()
         delete players_map[this.second_player.id]
         this.second_player.socket.leave(this.name)
      }
      this.first_player.socket.disconnect()
      delete players_map[this.first_player.id]
      this.first_player.socket.leave(this.name)
      return rooms.filter(r => r !== this)
   }

   destroy(){
      this.second_player = undefined
   }

   is_my_turn(id){
      if(this.is_complete()){
         if((this.second_player.id === id && this.turn === false)||(this.first_player.id === id && this.turn === true)){
            return true
         } else {
            return false
         }
      } else {
         return false
      }
   }

   is_lose(num = undefined){
      if(num){
         return num === 0
      }
         return this.board[0][0] == 0
   }

   get_another_player(id){
      return this.first_player.id === id ? this.second_player : this.first_player
   }

   set_status(status_code){
      //  1: active
      //  0: deactive
      // -1: ended
      // -2: deleted
      this.status = status_code
   }

   get_status(){
      return this.status
   }

   find_by_id(id){
      return id === this.first_player.id ? this.first_player : (this.second_player.id === id ? this.second_player : null)
   }
}


module.exports = Room