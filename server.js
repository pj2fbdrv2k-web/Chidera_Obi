require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔒 Secure Connection using Render Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("⚡ SnapStake Cloud Database connected successfully.");

// --- SNAPSTAKE API ROUTES ---

// 1. Get User Profile and Balance
app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// 2. Claim Daily Bonus (Increases balance by 500)
app.post('/api/user/daily-bonus', async (req, res) => {
    const { userId } = req.body;

    // Get current balance
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

    if (fetchError) return res.status(400).json({ error: fetchError.message });

    const newBalance = (profile.balance || 0) + 500;

    // Update balance in database
    const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select()
        .single();

    if (updateError) return res.status(400).json({ error: updateError.message });
    res.json({ message: "💰 500 Bonus units added successfully!", balance: data.balance });
});

// 3. Submit Quiz / Update Score
app.post('/api/quiz/submit', async (req, res) => {
    const { userId, pointsEarned } = req.body;

    const { data, error } = await supabase
        .from('profiles')
        .update({ last_score: pointsEarned })
        .eq('id', userId)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "🏆 Quiz score updated!", user: data });
});

// Root check route
app.get('/', (req, res) => {
    res.send('SnapStake Backend Engine is live and connected to Supabase.');
});

app.listen(PORT, () => {
    console.log(`🚀 SnapStake Server running live on port ${PORT}`);
});
