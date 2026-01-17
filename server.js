"use strict";

const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

/*
    Images could be served locally, however I believe this falls out of scope for the project. It also leads to a
    greater issue with source and copyright
 */

// TODO add levels to taxa
const TAXA_FILENAME = "./taxa.json";
let taxa_data;
try {
    taxa_data = JSON.parse(fs.readFileSync(TAXA_FILENAME, "utf-8"));
} catch (e) {
    // If it does not exist, create it with just Aves in it
    taxa_data = [{
        id: 0,
        name: "Aves",
        description: "The class containing all birds",
        parent: null,
        level: 4
    }]
    fs.writeFileSync(TAXA_FILENAME, JSON.stringify(taxa_data))
}

const BIRDS_FILENAME = "./birds.json";
let birds_data;
try {
    birds_data = JSON.parse(fs.readFileSync(BIRDS_FILENAME, "utf-8"));
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

app.get("/index/cards/:n", (req, res) => {
    let {n} = req.params;

    n = parseInt(n);
    if (isNaN(n)) {
        res.statusCode = 406;
        res.contentType("text/plain")
        res.send("Request is invalid")
        return;
    }

    if (n >= birds_data.length) {
        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(birds_data));
        return;
    }

    let birds = []
    for (let i=0; i<n; i++) {
        let id = Math.floor(Math.random() * birds_data.length);

        let bird = findByID(birds_data, id);
        if (!bird || findByID(birds, id)) {
            i--;
        } else {
            birds.push(bird);
        }
    }

    res.statusCode = 200;
    res.contentType("application/json");
    res.send(JSON.stringify(birds))
});

// For adding check that the item doesn't already exist, if it does replace it
app.post("/add/species/", (req, res) => {
    // Data per bird: genus, picture, name, id, description
    // Validate data
    const {name, species, genus, picture, description} = req.body;

    if (
        typeof name !== "string" || typeof species !== "string"
        || typeof genus !== "number" || typeof picture !== "string"
        || typeof description !== "string"
    ) {
        res.statusCode = 406;
        res.contentType("text/plain")
        res.send("Data in request is invalid")
        return;
    }

    try {
        let bird = {
            "id": birds_data.length, // If you allow deletion, this will produce duplicates
            "name": name,
            "species": species.toLowerCase(),
            "genus": genus,
            "picture": picture,
            "description": description
        };
        birds_data.push(bird);

        writeBirds();

        console.log("/add/species/: New bird successfully written to file")

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(bird));

    } catch (e) {
        console.log("/add/species:", e);

        res.statusCode = 500;
        res.contentType("text/plain");
        res.send("Error in writing new entry to file");
    }
});

app.post("/add/level/", (req, res) => {
    // Data per level: parent, name, description, id
    let {parent, name, description, level} = req.body;

    if (
        typeof name !== "string" || typeof parent !== "number"
        || typeof description !== "string" || typeof level !== "number"
    ) {
        res.statusCode = 406;
        res.contentType("text/plain")
        res.send("Data in request is invalid")
        return;
    }

    try {
        let taxon = {
            "id": taxa_data.length,
            "name": capitalise(name),
            "description": description,
            "parent": parent,
            "level": level
        };

        taxa_data.push(taxon);

        writeTaxa();

        console.log("/add/level/: New taxon successfully written to file")

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(taxon);
    } catch (e) {
        res.statusCode = 500;
        res.contentType("text/plain");
        res.send("Error in writing new entry to file");
    }
});

app.get("/get/entity/:type/:id", (req, res) => {
    let {type, id} = req.params;
    id = parseInt(id);

    if (isNaN(id) || typeof type !== "string") {
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: Invalid parameters");
    }

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
            console.log("/get/entity/: Error invalid entity type");

            res.statusCode = 404;
            res.contentType("text/plain");
            res.send("Invalid entity type");
            return;
    }

    console.log(`/get/entity/: ${type} number ${id} queried`)

    res.statusCode = 200;
    res.contentType("application/json");
    res.send(JSON.stringify(data));
});

app.get("/get/levels/:parent", (req, res) => {
    let {parent} = req.params;

    parent = parseInt(parent, 10);

    if (isNaN(parent)) {
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: parameter must be a number");
    }

    let children = findByField(taxa_data, "parent", parent);
    if (children.length === 0) {
        children = findByField(birds_data, "genus", parent);
    }
    console.log(children);
    console.log(`/get/levels/: Children of ${parent} queried`)

    res.statusCode = 200;
    res.contentType("application/json");
    res.send(JSON.stringify(children));
});

app.get("/delete/:type/:id", (req, res) => {
    let {type, id} = req.params;
    id = parseInt(id);

    if (isNaN(id) || typeof type !== "string") {
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: Invalid parameters");
    }

    try {
        switch (type) {
            case "taxon":
                // don't allow Aves to be deleted
                if (id !== 0) {
                    let taxon = findByID(taxa_data, id);

                    if (taxon) {
                        deleteTaxon(taxon); //fixme
                        writeTaxa();
                    }
                }
                break;

            case "bird":
                birds_data = deleteByField(birds_data, "id", id);
                writeBirds()
                break;

            default:
                // Premature break on error
                console.log("/get/entity/: Error invalid entity type");

                res.statusCode = 404; // todo handle 404s
                res.contentType("text/plain");
                res.send("Invalid entity type");
                return;
        }
    } catch (e) {
        res.statusCode = 500;
        res.contentType("application/json");
        res.send(JSON.stringify(e));
    }

    res.statusCode = 200;
    res.send();
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
});

function findByID(data, id) {
    return findByField(data, "id", id)[0];
}

function findByField(data, field, value) {
    // Linear search with indistinct values
    let out = [];
    for (const d of data) {
        if (d[field] === value) {
            out.push(d);
        }
    }
    return out;
}

function deleteByField(data, field, value) {
    // Due to size changing if multiple items are removed, uses a reconstruct approach
    // Maintains order of elements
    let out = [];
    for (let i=0; i < data.length; i++) {
        let d = data[i];
        if (d[field] !== value) {
            out.push(d);
        }
    }
    return out;
}

function deleteTaxon(taxon) {
    // delete a taxon and all its children recursively
    // base case when taxon is a genus
    // this is editing a var so need to be very careful
    // maybe change it to a class
    if (taxon.level === 1) {
        taxa_data = deleteByField(birds_data, "genus", taxon.id);

    } else {
        for (const child of findByField(taxa_data, "parent", taxon.id)) {
            deleteTaxon(child);
        }
    }

    taxa_data = deleteByField(taxa_data, "id", taxon.id);
}

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1, s.size).toLowerCase()
}

function writeFileErrorThrower(e) {
    if (e) {
        throw e;
    }
}

function writeBirds() {
    // Non-blocking write to file
    fs.writeFile(
        BIRDS_FILENAME,
        JSON.stringify(birds_data, null, 4),
        writeFileErrorThrower
    );
}

function writeTaxa() {
    fs.writeFile(
        TAXA_FILENAME,
        JSON.stringify(taxa_data, null, 4),
        writeFileErrorThrower
    );
}