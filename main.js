class GAME {
    constructor(num_players, num_table_cards, num_rounds) {
        this.num_table_cards = num_table_cards;
        this.num_players = num_players;
        this.num_rounds = num_rounds;
        this.markets = [];
        this.markets_for_round = {}
        let N = this.num_players;

        // Build the Deck
        let Deck = Array.from({length: 10}, (_, i) => i + 1);
        for (let elem = 1; elem <= 3; elem++) {
            Deck = Deck.concat(Array.from({length: 10}, (_, i) => i + 1));
        }

        // Shuffle and split cards between players and the table
        let shuffled_cards = this.shuffleArray(Deck).slice(0, this.num_players + this.num_table_cards);
        this.player_cards = shuffled_cards.slice(0, N);
        this.table_cards = shuffled_cards.slice(N);
        this.final_sum = shuffled_cards.reduce((a, b) => a + b, 0);

        // Find the mean of the Deck which should be 5.5
        this.mean = Deck.reduce((a, b) => a + b, 0) / Deck.length;

        // Log the player scores
        this.playerscores = Array(this.num_players).fill(0);
    }

    // Mimic the random shuffle of the array 
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // swap elements
        }
        return array;
    }

    EV(cards_known_to_player) {
        return cards_known_to_player.reduce((a, b) => a + b, 0) + 
               this.mean * (this.num_table_cards + this.num_players - cards_known_to_player.length);
    }

    randomNormal(mean, stdDev) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    }

    player_make_market_initial(cards_known_to_player) {
        const asset_ev = this.EV(cards_known_to_player);
        const l_bound = 1;
        const u_bound = 2;
        const deviation = Math.max(Math.min(this.randomNormal(1.5, 0.4), u_bound), l_bound);
        const cond = [asset_ev - deviation, asset_ev + deviation];
        console.log(`The market made is ${cond}`)
        return cond;
    }

    player_make_market(cards_known_to_player, markets) {
        const asset_ev = this.EV(cards_known_to_player);
        const a = Math.random();
        console.log("PLAYER MAKING MARKETS")
        console.log(typeof(markets))
        console.log(markets)
        let weighting_for_market_to_play;
        if (markets.length === 0) {
            weighting_for_market_to_play = asset_ev;

        } else if (markets.length === 1) {
            console.log(`when markets have length 1: ${markets}`)
            weighting_for_market_to_play = a * this.mean_func(markets) + (1 - a) * asset_ev;
        } else {
            console.log(`when markets have more than length 1: ${markets}`)
            weighting_for_market_to_play = a * this.mean_func(markets) + (1 - a) * asset_ev;

        }
        console.log(`Markets weighting:weighting_for_market_to_play`)
        console.log(weighting_for_market_to_play)

        const l_bound = 1;
        const u_bound = 2;
        const deviation = Math.max(Math.min(this.randomNormal(1.5, 0.4), u_bound), l_bound);
        const cond = [weighting_for_market_to_play - deviation, weighting_for_market_to_play + deviation];
        return cond;
    }

    act_on_market(market, player, cards_known_to_player) {
        console.log("market is:")
        console.log(market)
        if (market.length === 0) return;
        let b_or_s_n = 'n';
        if (Math.random() < 0.5) { // Toss a coin
            console.log(`Calling Act on Market Function: [${player}] Ev - ${this.EV(cards_known_to_player)} with ${market} and cards ${cards_known_to_player}`);
            if (this.EV(cards_known_to_player) < market[0]) {
                console.log(`Player ${player} SELLS the market at ${market[0]}`);
                b_or_s_n = 's'
                this.playerscores[player] += market[0] - this.final_sum;
            } else if (this.EV(cards_known_to_player) > market[1]) {
                console.log(`Player ${player} BUYS at ${market[1]}`);
                this.playerscores[player] += this.final_sum - market[1];
                b_or_s_n = 'b'
            } else {
                b_or_s_n = 'n'
            }
        }
        return b_or_s_n
    }

    mean_func(lists) {
        let totalSum = 0;
        let totalCount = 0;
      
        for (let i = 0; i < lists.length; i++) {
          for (let j = 0; j < lists[i].length; j++) {
            totalSum += lists[i][j];
            totalCount++;
          }
        }
      
        return totalSum / totalCount;
      }
}
// In the file where GameLogic is defined
module.exports = GAME;

// const num_players = 4;
// const num_table_cards = 3;
// const num_rounds = 3;
// const game = new GAME(num_players, num_table_cards, num_rounds);

// for (let round = 0; round < game.num_rounds; round++) {
//     console.log(`ROUND ${round}`);
//     const markets_for_round = {};

//     for (let idx = 0; idx < game.num_players; idx++) {
//         console.log(`Player ${idx} turn:`);

//         if (idx === 0) {
//             const player_idx_market = game.player_make_market_initial([...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)]);
//             console.log(`Player ${idx} has ${[...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)]} with EV ${game.EV([...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)])} and makes: ${player_idx_market}`);

//             markets_for_round[idx.toString()] = player_idx_market;

//             for (let player = 0; player < game.num_players; player++) {
//                 if (player !== idx) {
//                     game.act_on_market(player_idx_market, player, [...game.player_cards.slice(player, player + 1), ...game.table_cards.slice(0, round)]);
//                 }
//             }
//         } else {
//             let markets_for_round_string = "";
//             for (const market of Object.values(markets_for_round)) {
//                 markets_for_round_string += `${market} `;
//             }

//             const player_idx_market = game.player_make_market([...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)], Object.values(markets_for_round));
            
//             console.log(`Current market as input: ${markets_for_round_string}`);
//             console.log(`Player ${idx} has ${[...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)]} with EV ${game.EV([...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)])} and makes: ${player_idx_market}`);
//             console.log(`Player ${idx} knows these cards: ${[...game.player_cards.slice(idx, idx + 1), ...game.table_cards.slice(0, round)]}`);

//             markets_for_round[idx.toString()] = player_idx_market;

//             for (let player = 0; player < game.num_players; player++) {
//                 if (player !== idx) {
//                     game.act_on_market(player_idx_market, player, [...game.player_cards.slice(player, player + 1), ...game.table_cards.slice(0, round)]);
//                 }
//             }
//         }
//         console.log(`Scores: ${game.playerscores}\n`);
//     }
// }

