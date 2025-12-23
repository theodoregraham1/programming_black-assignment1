"use strict";

const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

const TAXOMS_FILENAME = "./taxoms.json";
try {
    var taxoms_data = JSON.parse(fs.readFileSync(TAXOMS_FILENAME, "utf-8"));
} catch (e) {
    // If it does not exist, create it with just Aves in it
    taxoms_data = [{
        id: 0,
        name: "Aves",
        description: "The order containing all birds",
        parent: null
    }]
    fs.writeFileSync(TAXOMS_FILENAME, JSON.stringify(taxoms_data))
}

const BIRDS_FILENAME = "./birds.json";
try {
    var birds_data = JSON.parse(fs.readFileSync(BIRDS_FILENAME, "utf-8"));
} catch (e) {
    birds_data = [];
    fs.writeFileSync(BIRDS_FILENAME, JSON.stringify(birds_data));
}

const app = express();

app.use(express.static("static"));

app.get("/", (req, res) => {
    res.redirect("index.html");
});

app.get("/index/card/", (req, res) => {
    let id = Math.floor(Math.random()*birds_data.size);

    let bird = birds_data
});

app.get("/browse/:level/", (req, res) => {

});

app.post("/add/", (req, res) => {
    // Data per bird: genus, picture, name, id, description

    birds_data.size()
});

app.post("/search/", (req, res) => {

});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
});

function findByID(data, id) {
    for (let i=0; i<data.size; i++) {
        if (data[i].id === id) {
            return data[i];
        }
    }
    return null
}