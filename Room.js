class Room{

   constructor(name, player, board){
      this.name = name
      this.player1 = player
      this.board = board
      this.player2 = null
   }

   is_complete(){
      return this.player2
   }

   set_first_player(socket){
      this.player1 = socket
   }

   set_second_player(socket){
      this.player2 = socket
   }

   get_first_player(){
      return this.player1
   }

   get_second_player(){
      return this.player2
   }

   get_name(){
      return this.name
   }

   send_data_from(sender_id, data, msg = 'data'){
      if(this.is_complete()){
         if(this.player1.id === sender_id){
            this.player2.emit(msg, data)
         } else {
            this.player1.emit(msg, data)
         }
      }
   }

   get_turn(){
      // true = first player's turn
      // false = second player's turn
      return this.turn
   }

   change_turn(){
      this.turn = !this.turn
   }

   get_board(){
      return this.board
   }

   start(){
      this.turn = Math.random() > 0.5
      this.player1.emit('start', {
         board: this.board,
         your_turn: this.turn,
         initialized_with_my_board: true
      })
      this.player2.emit('start', {
         board: this.board,
         your_turn: !this.turn,
         initialized_with_my_board: false
      })
   }

   end(rooms, players_map){
      if(this.is_complete()){
         this.player2.disconnect()
         delete players_map[this.player2.id]
         this.player2.leave(this.name)
      }
      this.player1.disconnect()
      delete players_map[this.player1.id]
      this.player1.leave(this.name)
      return rooms.filter(r => r !== this)
   }

   is_my_turn(id){
      if(this.is_complete()){
         if((this.player2.id === id && this.turn === false)||(this.player1.id === id && this.turn === true)){
            return true
         } else {
            return false
         }
      } else {
         return false
      }
   }
}


module.exports = Room