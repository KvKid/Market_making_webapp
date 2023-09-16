require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const http = require('http');
const MongoStore = require('connect-mongo');
const socketIo = require('socket.io');
let GameLogic = require('./main_logic.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 3000;

// Environment variables and configurations
const DATABASE_NAME = "logindetails";
const password = encodeURIComponent(process.env.MONGO_DB_PASSWORD);
const uri = `mongodb+srv://kitendo09:${password}@cluster0.9fchwyc.mongodb.net/?retryWrites=true&w=majority`;

// Middleware
app.use(express.static('public'));
app.use(cors());
app.use(express.json());
function ensureBasicSubscription(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login.' });
    }
    const usersCollection = client.db(DATABASE_NAME).collection("users");
    usersCollection.findOne({ _id: new require('mongodb').ObjectId(req.session.userId) }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'User not found. Please login again.' });
        }
        if (user.subscriptionStatus !== "basic") {
            return res.status(403).json({ message: 'You need a basic subscription to access this feature.' });
        }
        next();
    });
}

io.on('connection', (socket) => {
    console.log('a user connected');
    // import {GameLogic} from './main_logic.js';
    
    // Create a new game instance for this user
    let game = new GameLogic();
    
    // Get table cards for a specific round
    socket.on('get_table_cards', (round) => {
        let response = game.get_table_cards(round);
        socket.emit('update_table_cards', response);
    });

    // Get player card for a given index
    socket.on('get_player_card', (idx) => {
        console.log("socket on server:")
        console.log(typeof idx)
        console.log("is game defined:")
        console.log(game)
        let response = game.get_player_card(idx);
        socket.emit('update_player_card', response);
    });

    // Player's turn making markets
    socket.on('player_turn_making_markets', (idx) => {
        let response = game.player_turn_making_markets(idx);
        socket.emit('update_markets', response);
    });

    // Player acts on markets
    socket.on('your_turn_acting_on_markets', (data) => {
        let response = game.your_turn_acting_on_markets(data['b_or_s_or_n'], data['player']);
        socket.emit('update_acting_on_markets', response);
    });

    // Player sets their own market
    socket.on('your_turn_making_markets', (data) => {
        let response = game.your_turn_making_markets(data['player'], [data['bid'],data['ask']]);
        socket.emit('update_your_market', response);
    });

    // Get markets for the current round
    socket.on('get_markets', () => {
        let response = game.get_markets();
        socket.emit('update_markets_for_round', response);
    });

    // Player acts on existing markets
    socket.on('player_acts_on_markets', (idx) => {
        let response = game.player_acts_on_markets(idx);
        socket.emit('update_player_actions', response);
    });

    // Get scores for all players
    socket.on('get_score', () => {
        let response = game.get_score();
        socket.emit('update_score', response);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('user disconnected');
        // Handle any game state changes on player disconnect, if needed.
    });
});


app.post('/charge', async (req, res) => {
    const { token, amount, currency, description } = req.body;
    console.log(req.body)
    // Validate the amount
    let intamount = parseInt(amount)
    if (!intamount || typeof intamount !== 'number' || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }
    try {
        const charge = await stripe.charges.create({
            amount: intamount, // in cents
            currency: currency || 'usd',
            description: description || 'Charge description',
            source: token, 
        });
        console.log(charge.status)
        if (charge.status === 'succeeded') {
            return res.json({ success: true, message: 'Payment successful!' });
        } else {
            console.log('Stripe payment failed:', charge);
            return res.status(500).json({ success: false, message: `Payment failed. Reason: ${charge.failure_message}` });
        }   
    } catch (error) {
        console.error('Stripe charge error:', error);
        return res.status(500).json({ success: false, message: 'Payment processing failed.', error: error.message });
    }
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: uri,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }
}));
app.use(express.static('public'));

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    if (err) {
        console.error("Failed to connect to MongoDB:", err);
        return;
    }
    console.log("Connected to MongoDB");
});




// Routes

app.use((req, res, next) => {
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${req.url}`);
    next();
});


app.post('/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    console.log("[Webhook] Received a webhook request");

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WH_SECRET);
    } catch (err) {
        console.error("[Webhook Error] Error constructing event from Stripe:", err.message);
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    // Log the entire event (useful for debugging, but in production, you might want to omit sensitive data)
    console.log("[Webhook] Event received from Stripe:", event.type, JSON.stringify(event));

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('[Webhook] PaymentIntent was successful:', paymentIntent.id);

            const userEmail = paymentIntent.metadata.email;

            const usersCollection = client.db(DATABASE_NAME).collection("users");
            const user = await usersCollection.findOne({ email: userEmail });

            if(user) {
                await usersCollection.updateOne({ email: userEmail }, { $set: { subscriptionStatus: "basic" } });
                console.log(`[Database Update] Updated subscription status for user: ${userEmail}`);
            } else {
                console.warn(`[Database Warning] No user found with email: ${userEmail}`);
            }
            
            break;
        case 'charge.failed':
            const charge = event.data.object;
            console.error('[Webhook] Charge failed:', charge.id);
            break;
        default:
            console.warn("[Webhook Warning] Unhandled event type:", event.type);
            return res.status(400).end();
    }

    // Return a 200 response to acknowledge the event was received
    console.log("[Webhook] Successfully processed the event:", event.type);
    res.json({ received: true });
});

app.post('/register', async (req, res) => {
    const { email,firstName,lastName, password,confirmpassword, dob, country } = req.body;
    console.log(req.body)

    if (!email) {
        return res.status(400).json({ status: 'fail', message: 'Email is required.' });
    }else if(!firstName){
        return res.status(400).json({ status: 'fail', message: 'First Name is required.' });
    }else if(!lastName){
        return res.status(400).json({ status: 'fail', message: 'Last Name is required.' });
    }else if(!password){
        return res.status(400).json({ status: 'fail', message: 'Password is required.' });
    }
    if (confirmpassword != password) {
        return res.status(400).json({ status: 'fail', message: 'Passwords don\'t match.' });
    }

    // Check if the username contains only alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(firstName) && !/^[a-zA-Z0-9_]+$/.test(firstName)) {
        return res.status(400).json({ status: 'fail', message: 'First and Last Names can only contain letters, numbers, and underscores.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usersCollection = client.db(DATABASE_NAME).collection("users");

    // Check if a user with the same username already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ status: 'fail', message: 'Email already exists.' });
    }

    try {
        await usersCollection.insertOne({ 
            email,
            firstName,
            lastName, 
            password: hashedPassword, 
            dob,
            country,
            subscriptionStatus: "free"
        });
        res.json({ status: 'success', message: 'User registered' });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ status: 'fail', message: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by username
        const usersCollection = client.db(DATABASE_NAME).collection("users");
        const user = await usersCollection.findOne({ email: email });


        // Check if user exists
        if (!user) {
            return res.status(400).json({ message: 'User does not exist.' });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password); // Assuming bcrypt was used to hash passwords
        if (!isMatch) {
            return res.status(400).json({ message: 'Password is incorrect.' });
        }

        // If everything is fine, login successful (perhaps generate a token or set a session here)
        req.session.userId = user._id; // assuming user is an object with an _id property
        res.json({ message: 'Login successful.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});
app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        // Serve the static dashboard HTML file.
        res.sendFile(path.join(__dirname, 'public/dashboard.html'));
    } else {
        res.redirect('/login');
    }
});

app.get('/subscriptions', (req, res) => {
    if (req.session.userId) {
        // Serve the static dashboard HTML file.
        res.sendFile(path.join(__dirname, 'public/subscriptions.html'));
    } else {
        res.redirect('/login');
    }
});


app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ message: 'Error logging out.' });
        }
        res.json({ message: 'Logged out successfully.' });
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).json({ message: 'Please login.' });
}

// Usage:
app.get('/premium-content', ensureAuthenticated, (req, res) => {
    // This route will only be accessible if the user is logged in
    res.json({ data: 'Premium content.' });
});

// Use this if you have an API key from OpenAI.
// const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

app.use(express.static('public')); // This serves static files from the 'public' directory.

// When someone accesses the root URL, serve the landing.html page.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/landing.html'));
});

app.get('/mental-math.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/mental-math.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/signup.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/game.html'));
});


app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/isLoggedIn', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/ask-time', async (req, res) => {
    try {
        // Mock response for demonstration purposes.
        // If you have an OpenAI API key, you'd replace the below lines with the commented lines after it.
        const mockResponse = {
            data: {
                choices: [{
                    text: "It's currently 12:00 PM." // This is a mock response; in reality, GPT-3 wouldn't know the actual time.
                }]
            }
        };
        const apiKey = process.env.OPENAI_API_KEY;

        /*
        // Uncomment and use this to make an actual request to OpenAI's GPT-3.
        const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
            prompt: "What's the time?",
            max_tokens: 50
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        */
        res.json({ response: mockResponse.data.choices[0].text });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Failed to get response' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
server.listen(PORT, () => {
    console.log('Server is running on port 3000');
});
