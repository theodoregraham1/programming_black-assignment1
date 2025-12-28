"use strict";

const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

// Files
// Images could be served locally, however I believe this falls out of scope for the project
const TAXA_FILENAME = "./taxa.json";
try {
    var taxa_data = JSON.parse(fs.readFileSync(TAXA_FILENAME, "utf-8"));
} catch (e) {
    // If it does not exist, create it with just Aves in it
    taxa_data = [{
        id: 0,
        name: "Aves",
        description: "The order containing all birds",
        parent: null
    }]
    fs.writeFileSync(TAXA_FILENAME, JSON.stringify(taxa_data))
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

// For adding check that the item doesn't already exist, if it does replace it
app.post("/add/species/", (req, res) => {
    // Data per bird: genus, picture, name, id, description

    // Validate data
    const {name, genus, picture, description} = req.body;

    if (!name || !genus || !description) {
        res.statusCode = 406;
        res.send("Error: missing data from request")
        return;
    }
    let bird = {
        "id": birds_data.length, // If you allow deletion, this will produce duplicates
        "name": name,
        "genus": genus,
        "picture": picture,
        "description": description
    };
    birds_data.push(bird);

    // Non-blocking write to file
    fs.writeFile(BIRDS_FILENAME, JSON.stringify(birds_data, null, 4), (err) => {
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
    let {parent, name, description} = req.body;

    if (!name || (!parent && !(parent === 0)) || !description) {
        res.statusCode = 406;
        res.send("Error: missing data from request");
        return;
    }

    let taxon = {
        "id": taxa_data.length,
        "name": name,
        "description": description,
        "parent": parent
    };

    taxa_data.push(taxon);

    fs.writeFile(TAXA_FILENAME, JSON.stringify(taxa_data, null, 4), (err) => {
        if (err) {
            res.statusCode = 500;
            res.contentType("text/plain")
            res.send("Error in writing new entry to file");
        }
    });

    console.log("/add/level/: New taxon successfully written to file")

    res.statusCode = 200;
    res.send(taxon);
});

app.post("/search/", (req, res) => {

});

app.get("/get/entity/:type/:id", (req, res) => {
    let {type, id} = req.params;

    res.contentType("application/json");

    if (!id || !type) {
        res.statusCode = 406;
        res.send(JSON.stringify({}));
    }

    try {
        id = parseInt(id);

        let data;
        switch (type) {
            case "taxon":
                data = findByID(taxa_data, id);
                break;
            case "bird":
                data = findByID(birds_data, id);
                break;
            default:
                // Premature break on error
                throw new Error("Invalid type")
        }
        res.statusCode = 200;
        res.send(JSON.stringify(data));
    } catch (e) {
        res.statusCode = 406;
        res.send(JSON.stringify(e));
    }
});

app.get("/get/levels/:parent", (req, res) => {
    let  {parent} = req.params;

    res.contentType("application/json");

    if (!parent) {
        res.statusCode = 406;
        res.send(JSON.stringify({}));
    }

    parent = parseInt(parent);

    let children = findByField(taxa_data, "parent", parent);

    res.statusCode = 200;
    res.send(JSON.stringify(children));
})

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
});

function findByID(data, id) {
    return findByField(data, "id", id)[0];
}

function findByField(data, field, value) {
    let out = []
    data.forEach(d => {
        if (d[field] === value) {
            out.push(d);
        }
    })
    return out;
}