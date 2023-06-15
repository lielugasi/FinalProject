const clientsR = require("./clients");
const professionalsR = require("./proffesionals");
const eventsR = require("./events");
const logInR = require("./logIn");
exports.routesInit = (app) => {
    app.use("/", logInR);
    app.use("/clients", clientsR);
    app.use("/proffesionals", professionalsR);
    app.use("/events", eventsR);
}