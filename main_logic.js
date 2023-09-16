const GAME = require('./main.js');
class Game_logic {
    constructor(){
        let num_players = 5;
        let num_rounds = 3;
        let num_table_cards = 5;
        this.gameInstance = new GAME( num_players, num_table_cards, num_rounds);
        // this.is_first_turn = true;
        console.log("constructor has run")
        this.round = -1;
    }

    get_table_cards(round){
        return {
            'table_cards': this.gameInstance.table_cards.slice(0,round),
            'success': true
        }
    }

    get_player_card(idx){
        console.log(this.gameInstance.player_cards)
        console.log(typeof this.gameInstance.player_cards)
        console.log(typeof idx)
        console.log(idx)
        return{
            'player_card' : this.gameInstance.player_cards[idx],
            'success' : true
        }
    }

    your_turn_making_markets(idx,player_idx_market){//Conv input to json and parse accoridngly
        this.lastMarket = player_idx_market;
        this.gameInstance.markets_for_round[idx.toString()] = player_idx_market;
        return{
            'success' : true
        }
    }

    your_turn_acting_on_markets(b_or_s_or_n,your_idx){
        let market = this.lastMarket;
        if (b_or_s_or_n === 's') {
            this.gameInstance.playerscores[your_idx] += market[0] - this.gameInstance.final_sum;
        }else if (b_or_s_or_n === 'b'){
            this.gameInstance.playerscores[your_idx] += this.gameInstance.final_sum - market[1];
        }
        return {
            'success' : true
        }
    }

    get_markets(){
        return{
            'markets_for_round ' : this.gameInstance.markets_for_round,
            'success' : true
        }
    }

    player_turn_making_markets(idx){
        if (idx === 0){
            this.round +=1
            this.gameInstance.markets_for_round = {}
            const player_idx_market = this.gameInstance.player_make_market_initial([...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)]);
            console.log(`Player ${idx} has ${[...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)]} with EV ${this.gameInstance.EV([...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)])} and makes: ${player_idx_market}`);

            this.gameInstance.markets_for_round[idx.toString()] = player_idx_market;

            // for (let player = 0; player < this.gameInstancenum_players; player++) {
            //     if (player !== idx) {
            //         this.gameInstanceact_on_market(player_idx_market, player, [...this.gameInstanceplayer_cards.slice(player, player + 1), ...this.gameInstancetable_cards.slice(0, round)]);
            //     }
            // }
            this.lastMarket = player_idx_market;
        } else{
            let markets_for_round_string = "";
            for (const market of Object.values(this.gameInstance.markets_for_round)) {
                markets_for_round_string += `${market} `;
            }

            const player_idx_market = this.gameInstance.player_make_market([...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)], Object.values(this.gameInstance.markets_for_round));
            
            console.log(`Current market as input: ${markets_for_round_string}`);
            console.log(`Player ${idx} has ${[...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)]} with EV ${this.gameInstance.EV([...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)])} and makes: ${player_idx_market}`);
            console.log(`Player ${idx} knows these cards: ${[...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)]}`);

            this.gameInstance.markets_for_round[idx.toString()] = player_idx_market;

            // for (let player = 0; player < this.gameInstancenum_players; player++) {
            //     if (player !== idx) {
            //         this.gameInstanceact_on_market(player_idx_market, player, [...this.gameInstanceplayer_cards.slice(player, player + 1), ...this.gameInstancetable_cards.slice(0, round)]);
            //     }
            // }
            this.lastMarket = player_idx_market;
        }
        return {
            'player' : idx,
            'markets' : this.gameInstance.markets_for_round[idx.toString()],
            'success' : true
        }
    }


    player_acts_on_markets(idx){
        return {
            'player' : idx,
            'b_or_s_or_n' : this.gameInstance.act_on_market(this.lastMarket,idx,[...this.gameInstance.player_cards.slice(idx, idx + 1), ...this.gameInstance.table_cards.slice(0, this.round)]),
            'success' : true
        }
    }

    get_score(){
        return {
            'player_scores' : this.gameInstance.player_scores,
            'success' : true
        }
    }
    
}
module.exports = Game_logic;

// let game = new GAME_logic()

// //Lets play the game:
// console.log(game.get_table_cards())
// let idx = 0;
// console.log(game.player_turn_making_markets(0));
// console.log(game.player_turn_making_markets(1));
// console.log(game.your_turn_acting_markets('b',2,game.lastMarket));
// console.log(game.your_turn_making_markets(2,[35,36]));
// console.log(game.player_acting_markets)