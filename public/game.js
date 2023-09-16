const socket = io.connect('http://localhost:3000');


const currentRound =   0;  // Or initialize as needed
const num_rounds = 4;
const playerIdx = 3;
let submitPromiseResolver;
let submitPromiseResolver2;

socket.on('update_table_cards', (data) => {
    document.getElementById('tableCards').textContent = JSON.stringify(data);
});

socket.on('update_player_card', (data) => {
    document.getElementById('playerCard').textContent = JSON.stringify(data);
});

socket.on('update_markets', (data) => {
    // console.log('Market is updated');
    // console.log(JSON.stringify(data));
    let marketsValue = data.markets.join(', '); // Convert array to string with comma separation
    document.getElementById('market' + data['player'].toString()).value = marketsValue; // Assuming it's an input field
});

socket.on('update_player_actions',(data)=>{
    console.log("PlayerAction")
    console.log(data)
    console.log(data['b_or_s_or_n'])
    document.getElementById('action' + data['player'].toString()).value = data['b_or_s_or_n'];
});


socket.on('update_score', (data) => {
    document.getElementById('scores').textContent = data['player_scores'];
});

function getTableCards(round) {
    socket.emit('get_table_cards', round);
}

function getPlayerCard(idx) {
    socket.emit('get_player_card', idx);
}

function yourTurnActingOnMarkets(data) {
    let actionData = {
        b_or_s_or_n: 'decision',  // Example, change as needed
        player: playerIdx
    };
    socket.emit('your_turn_acting_on_markets', actionData);
}

// function yourTurnMakingMarkets(data) {
//     socket.emit('your_turn_making_markets', data);
// }
function buyAction(){
    if (submitPromiseResolver2) {
        console.log("Resolving the waiting promise");
        submitPromiseResolver2();  // Resolve the promise
        submitPromiseResolver2 = null;
    }
    socket.emit('your_turn_acting_on_markets',{
        "b_or_s_or_n": 'b',
        "player" : 4
    })
}
function sellAction(){
    if (submitPromiseResolver2) {
        console.log("Resolving the waiting promise");
        submitPromiseResolver2();  // Resolve the promise
        submitPromiseResolver2 = null;
    }
    socket.emit('your_turn_acting_on_markets',{
        "b_or_s_or_n": 's',
        "player" : 4
    })
}
function noAction(){
    if (submitPromiseResolver2) {
        console.log("Resolving the waiting promise");
        submitPromiseResolver2();  // Resolve the promise
        submitPromiseResolver2 = null;
    }
    socket.emit('your_turn_acting_on_markets',{
        "b_or_s_or_n": 'n',
        "player" : 4
    })
}

function submitUserMarkets() {
    console.log("Button Clicked")
    let market1Value = document.getElementById('userMarket1').value;
    let market2Value = document.getElementById('userMarket2').value;
    
    socket.emit('your_turn_making_markets', {
        bid: market1Value,
        ask: market2Value,
        player: 4
    });

    if (submitPromiseResolver) {
        console.log("Resolving the waiting promise");
        submitPromiseResolver();  // Resolve the promise
        submitPromiseResolver = null;
    }
}
function playerActsOnMarkets(idx){
    socket.emit('player_acts_on_markets',idx);
}

function playerTurnMakingMarkets(idx){
    socket.emit('player_turn_making_markets',idx)
}
function getScore() {
    socket.emit('get_score');
}

async function startGame() {
    // Start the game by getting the table cards for the current round
    console.log("Successfully gets table cards");


    let delay = 1000; // Initial delay of 1 second
    for (let round = 0; round < 2; round++) {
        getTableCards(round);
        for (let index = 0; index < 4; index++) {
            document.getElementById('action' + index.toString()).value = '';
        }
        
        for (let idx = 0; idx < 4; idx++) {
            setTimeout(() => {
                playerTurnMakingMarkets(idx);
            }, delay);
            delay += 1000;  // Increment delay by 2 seconds for each player
            
            for (let index = 0; index < 4; index++) {
                if (index != idx){
                    setTimeout(() => {
                        playerActsOnMarkets(index);
                    }, delay);
                    delay+=1000
                }
                

            }
            console.log("You act on the market now:")
            await new Promise((resolve) => {
                submitPromiseResolver2 = resolve;
            });

        };

        console.log("You make markets now")
        await new Promise(resolve => {
            console.log("Waiting")
            submitPromiseResolver = resolve;
            let submitPromiseResolver;
            //AWAIT submitUserMarkets function to be called /button to be pressed here.
        });
    }
    getScore();
    
}
