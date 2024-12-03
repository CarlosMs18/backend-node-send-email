import dotenv from 'dotenv'
import app from './app.js';

import {connectDB} from './db/db.js'

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT , () => {
    connectDB();
    console.log('Server on port ', PORT);
});

