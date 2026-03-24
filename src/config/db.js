import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async()=>{
    try{
        await mongoose.connect(env.db_url);
        console.log("Database connected");
    }
     catch (err){
    console.log("database not connected:", err.message);
    process.exit(1);

}

};

export default connectDB;