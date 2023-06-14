const clientsR = require("./clients");
const professionalsR = require("./proffesionals");
const eventsR = require("./events");
exports.routesInit = (app) => {
    
    app.use("/clients", clientsR);
    app.use("/proffesionals", professionalsR);
    app.use("/events", eventsR);
}