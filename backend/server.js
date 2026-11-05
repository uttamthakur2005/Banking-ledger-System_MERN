const app = require('./src/app')
const connectDB = require('./src/config/db')
require('dotenv').config()

connectDB()

app.listen(8000, ()=> {
    console.log('Server is running on port no 8000');
})