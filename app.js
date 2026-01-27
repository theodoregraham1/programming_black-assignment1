"use strict";
const {BirdsData, TaxaData} = require("./classes");
const express = require("express");

function initialise(birds_filename, taxa_filename) {
// birds_data and taxa_data are global variables. The program relies on the blocking loop to protect them from dangerous issues

    let birds_data = new BirdsData(birds_filename)
    let taxa_data = new TaxaData(taxa_filename);

    birds_data.setTaxaData(taxa_data);
    taxa_data.setBirdsData(birds_data);

    const app = express();

    app.use(express.static("static"));
    app.use(express.json());

    app.get("/", (req, res) => {
        res.redirect("index.html");
    });

    app.post("/add/bird/", (req, res) => {
        // For adding check that the item doesn't already exist, if it does replace it

        // Validate data
        const {name, species, genus, picture, description} = req.body;

        if (
            typeof name !== "string" || typeof species !== "string"
            || typeof genus !== "number" || typeof picture !== "string"
            || typeof description !== "string"
        ) {
            res.statusCode = 400;
            res.contentType("text/plain")
            res.send("Data in request is invalid")
            return;
        }

        try {
            let bird = {
                "name": name,
                "species": species.toLowerCase(),
                "genus": genus,
                "picture": picture,
                "description": description
            };
            bird = birds_data.push(bird);

            console.log("/add/bird/: New bird successfully written to file")

            res.statusCode = 200;
            res.contentType("application/json");
            res.send(JSON.stringify(bird));

        } catch (e) {
            console.log("/add/bird:", e);

            res.statusCode = 400;
            res.contentType("application/json");
            res.send(JSON.stringify(e));
        }
    });

    app.post("/add/taxon/", (req, res) => {
        // Data per level: father, name, description, id
        let {father, name, description, level} = req.body;

        if (
            typeof name !== "string" || typeof father !== "number"
            || typeof description !== "string" || typeof level !== "number"
        ) {
            res.statusCode = 400;
            res.contentType("text/plain")
            res.send("Data in request is invalid")
            return;
        }

        try {
            let taxon = {
                "name": capitalise(name),
                "description": description,
                "father": father,
                "level": level
            };

            taxa_data.push(taxon);

            console.log("/add/taxon/: New taxon successfully written to file")

            res.statusCode = 200;
            res.contentType("application/json");
            res.send(taxon);

        } catch (e) {
            res.statusCode = 400;
            res.contentType("application/json");
            res.send(JSON.stringify(e));
        }
    });

    app.delete("/delete/:type/:id", (req, res) => {
        let {type, id} = req.params;
        id = parseInt(id);

        if (isNaN(id) || typeof type !== "string") {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Invalid parameters");
        }

        try {
            switch (type) {
                case "taxon":
                    // don't allow Aves to be deleted
                    if (id !== 0) {
                        let taxon = taxa_data.findById(id);

                        // If the entry doesn't exist simply do nothing (don't throw an error)
                        if (taxon) {
                            taxa_data.removeById(taxon.id);
                        }
                    }
                    break;

                case "bird":
                    birds_data.removeById(id);
                    break;

                default:
                    // Premature break on error
                    console.log("/delete/: Error invalid entity type");

                    res.statusCode = 400;
                    res.contentType("text/plain");
                    res.send("Invalid entity type");
                    return;
            }

            console.log(`/delete/${type}/: Entry of id ${id} deleted`);

            res.statusCode = 200;
            res.send();
        } catch (e) {
            res.statusCode = 400;
            res.contentType("application/json");
            res.send(JSON.stringify(e));
        }
    });

    app.put("/edit/:type/", (req, res) => {
        let {type} = req.params;
        let {id} = req.body;

        if (typeof type !== "string" || typeof id !== "number") {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Invalid parameters");
        }

        try {
            res.statusCode = 200;
            res.contentType("application/json");

            switch (type) {
                case "taxon": {
                    taxa_data.edit(id, req.body)
                    res.send(taxa_data.findById(id));
                    break;
                }

                case "bird": {
                    birds_data.edit(id, req.body)
                    res.send(JSON.stringify(birds_data.findById(id)));
                    break;
                }

                default:
                    // Premature break on error
                    console.log("/get/entity/: Error, invalid entity type");

                    res.statusCode = 400;
                    res.contentType("text/plain");
                    res.send("Invalid entity type");
                    return;
            }
        } catch (e) {
            console.log(e);

            res.statusCode = 400;
            res.contentType("application/json");
            res.send(JSON.stringify(e));
        }
    });

    app.get("/get/entity/:type/:id", (req, res) => {
        let {type, id} = req.params;
        id = parseInt(id);

        if (isNaN(id) || typeof type !== "string") {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Error: Invalid parameters");
            return;
        }

        let data;
        switch (type) {
            case "taxon":
                data = taxa_data.findById(id);
                break;

            case "bird":
                data = birds_data.findById(id);
                break;
            default:
                // Premature break on error
                console.log("/get/entity/: Error invalid entity type");

                res.statusCode = 400;
                res.contentType("text/plain");
                res.send("Invalid entity type");
                return;
        }

        console.log(`/get/entity/: ${type} number ${id} queried`)
        if (data) {
            res.statusCode = 200;
            res.contentType("application/json");
            res.send(JSON.stringify(data));

        } else {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Entity does not exist");
        }
    });

    app.get("/get/birds/random/:n", (req, res) => {
        let {n} = req.params;

        n = parseInt(n);
        if (isNaN(n)) {
            res.statusCode = 400;
            res.contentType("text/plain")
            res.send("Request is invalid")
            return;
        }

        if (n >= birds_data.size()) {
            res.statusCode = 200;
            res.contentType("application/json");
            res.send(JSON.stringify(birds_data.getList()));
            return;
        }

        let birds = [];
        let i = 0;
        while (i < n) {
            let k = Math.floor(Math.random() * birds_data.size());

            let bird = birds_data.getList()[k];
            if (bird && !birds.includes(bird)) {
                birds.push(bird);
                i++
            }
        }

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(birds))
    });

    app.get("/get/children/:father", (req, res) => {
        let {father} = req.params;

        father = parseInt(father);

        if (isNaN(father)) {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Error: parameter must be a number");
            return;
        }
        let taxon = taxa_data.findById(father);

        if (!taxon) {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Entity does not exist");
            return;
        }

        let children;
        if (taxon.level !== 1) {
            children = taxa_data.findByField("father", father);
        } else {
            children = birds_data.findByField("genus", father);
        }
        console.log(`/get/children/: Children of ${father} queried`)

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(children));
    });

    app.get("/get/level/:level", (req, res) => {
        let {level} = req.params;

        level = parseInt(level);

        if (isNaN(level) || level < 1 || level > 4) {
            res.statusCode = 400;
            res.contentType("text/plain");
            res.send("Error: parameter must be a number");
            return;
        }

        console.log(`/get/level/: level ${level} queried`);

        res.statusCode = 200;
        res.contentType("application/json")
        res.send(JSON.stringify(taxa_data.findByField("level", level)));
    });

    app.get("/list/:type", (req, res) => {
        let {type} = req.params;

        let data;
        switch (type) {
            case "taxon":
                data = taxa_data.getList();
                break;

            case "bird":
                data = birds_data.getList();
                break;

            default:
                // Premature break on error
                console.log("/list/: Error invalid entity type");

                res.statusCode = 400;
                res.contentType("text/plain");
                res.send("Invalid entity type");
                return;
        }

        console.log(`/list/: ${type} data queried`);

        res.statusCode = 200;
        res.contentType("application/json")
        res.send(JSON.stringify(data));
    });

    return app;
}
module.exports = initialise;

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1, s.size).toLowerCase()
}
