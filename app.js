const express=require("express");
const http=require("http");
const path=require("path");
const cors=require("cors");
const{routesInit}=require("./routes/config_rotes");
require("./db/mongoConnect");

const app=express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));
routesInit(app);
let port=process.env.PORT||3000;
const server=http.createServer(app);
server.listen(port);


