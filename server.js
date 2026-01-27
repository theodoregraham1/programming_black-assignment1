"use strict"
const app_initialiser = require("./app");

const hostname = "127.0.0.1";
const port = 8080;

const app = app_initialiser("./data/birds.json", "./data/taxa.json");

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
});