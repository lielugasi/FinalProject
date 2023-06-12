const mongoose=require('mongoose');
const {config}=require("../config/secret");
main().catch(err=>console.log(err))

async function main(){
    await mongoose.connect(`mongodb+srv://${config.userDb}:${config.passwordDb}@cluster0.selpolk.mongodb.net/fullstack23`);
    console.log("mongo connect fullstack23");
}