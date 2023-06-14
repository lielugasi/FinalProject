const jwt=require("jsonwebtoken");
const{config}=require("../config/secret");
exports.auth=async(req,res,next)=>{
    let token=req.header("x-api-key");
    if(!token){
        return res.status(400).json({msg:"You must send a token"});
    }
    try{
        let decodeToken=jwt.verify(token,config.tokenSecret);
        req.tokenData=decodeToken;
        next();
    }
    catch(err){
        return res.status(401).json({msg:"Token not valid or expired"});
    }
}

exports.authAdmin=async(req,res,next)=>{
    let token=req.header("x-api-key");
    if(!token){
        return res.status(400).json({msg:"You must send a token"});
    }
    try{
        let decodeToken=jwt.verify(token,config.tokenSecret);
        if(decodeToken.role!="admin"){
            return res.status(401).json({msg:"Unauthorized"});
        }
        req.tokenData=decodeToken;
        next(); 
    }
    catch(err){
        console.log(err);
        res.status(401).json({msg:"Token invalid or expired, log in again or you are a hacker"})
    }
}