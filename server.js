"use strict";

const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

// Files
// Images could be served locally, however I believe this falls out of scope for the project
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
app.use(express.json());

app.get("/", (req, res) => {
    res.redirect("index.html");
});

app.get("/index/card/", (req, res) => {
    let id = Math.floor(Math.random()*birds_data.size);

    let bird = findByID(birds_data, id)

    res.send(JSON.stringify(bird))
});

app.get("/browse/:level/", (req, res) => {

});

app.post("/add/species/", (req, res) => {
    // Data per bird: genus, picture, name, id, description

    // Validate data
    const {name, genus, picture, description} = req.body;

    if (!name || !genus || !description) {
        res.statusCode = 406;
        res.send("Error: missing data from request")
    }
    let bird = {
        "id": birds_data.size, // If you allow deletion, this will produce duplicates
        "name": name,
        "genus": genus,
        "picture": picture,
        "description": description
    };
    birds_data.push(bird);

    // Non-blocking write to file
    fs.writeFile(BIRDS_FILENAME, JSON.stringify(birds_data), (err) => {
        if (err) {
            res.statusCode = 500;
            res.contentType("text/plain")
            res.send("Error in writing new entry to file");
        }
    }); // There's a better way to write this

    console.log("/add/species/: New bird successfully written to file")

    res.statusCode = 200;
    res.contentType("application/json")
    res.send(JSON.stringify({"id": bird.id}));
});

app.post("/add/level/", (req, res) => {
    // Data per level: parent, name, description, id
    console.log(req.body);
    let {parent, name, description} = req.body;

    if (!name || !parent || !description) {
        res.statusCode = 406;
        res.send("Error: missing data from request")
    }

    taxoms_data.add({
        "id": taxoms_data.size,
        "name": name,
        "parent": parent,
        "description": description
    });

    fs.writeFile(TAXOMS_FILENAME, JSON.stringify(taxoms_data), (err) => {
        if (err) {
            res.statusCode = 500;
            res.contentType("text/plain")
            res.send("Error in writing new entry to file");
        }
    });

    res.statusCode = 200;
    res.send();
});

app.post("/search/", (req, res) => {

});

app.get("/get/levels/:parent", (req, res) => {
    const {parent} = req.params;

    let children = findByField(taxoms_data, "parent", parent);

    res.statusCode = 200;
    res.contentType("application/json");
    res.send(JSON.stringify(children));
})

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

function findByField(data, field, value) {
    let out = []
    for (let i=0; i<data.size; i++) {
        if (data[i][field] === value) {
            out.push(data[i]);
        }
    }
    return out;
}