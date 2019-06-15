module.exports = {
   id: {
      code: 1,
      msg: 'send another id'
   },
   turn: {
      code: 2,
      msg: 'not your turn'
   },
   wait: {
      code: 3,
      msg: 'please wait'
   },
   init: {
      code: 4,
      msg: 'you should initialize first'
   },
   empty_id: {
      code: 5,
      msg: 'please send id'
   },
   disable_game: {
      code: 6,
      msg: 'your opponent is disconnected yet'
   },
   null_data: {
      code: 7,
      msg: 'your data event has null data. send correct json with board or num attr.'
   },
   empty_rooms: {
      code: 8,
      msg: 'I don\'t know what happend but we have empty rooms :/'
   },
   player_id: {
      code: 9,
      msg: 'player_id exists but has not socket'
   }
}