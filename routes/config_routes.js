const clientsR = require("./clients");
const professionalsR = require("./proffesionals");
const eventsR = require("./events");
const usersR = require("./users");
exports.routesInit = (app) => {
    app.use("/users", usersR);
    app.use("/clients", clientsR);
    app.use("/proffesionals", professionalsR);
    app.use("/events", eventsR);
}