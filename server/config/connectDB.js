const mongoose = require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGOOSE_URI)

        const connection = mongoose.connection

        connection.on('connected', ()=>{
            console.log('ConnecteD to DB');
        })

        connection.on('error', (error)=>{
            console.log('Something is wrong', error);
        })
    }catch(error){
        console.log("Something is wrong", error);
    }
}

module.exports = connectDB;