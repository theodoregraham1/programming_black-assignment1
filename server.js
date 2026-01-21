"use strict";

const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

/*
    Images could be served locally, however I believe this falls out of scope for the project. It also leads to a
    greater issue with source and copyright
 */
// birds_data and taxa_data are global variables. The program relies on the blocking loop to protect them from dangerous issues

class EntityData {
    // Super class for TaxaData and BirdData singleton classes
    #data;
    #map;
    #file_name;
    #nextId = 0

    constructor(file_name, default_data, required_fields, optional_fields) {
        this.#file_name = file_name;
        this.required_fields = required_fields;
        this.optional_fields = optional_fields;

        try {
            this.#data = JSON.parse(fs.readFileSync(file_name, "utf-8"));
        } catch (e) {
            this.#data = default_data;
            this.#writeback();
        }

        this.#map = new Map();
        for (const d of this.#data) {
            this.#map.set(d.id, d);

            if (d.id >= this.#nextId) {
                this.#nextId = d.id+1;
            }
        }
    }

    size() {
        return this.#data.length;
    }

    findByField(field, value) {
        // Linear search with indistinct values
        let out = [];
        for (const d of this.#data) {
            if (d[field] === value) {
                out.push(d);
            }
        }
        return out;
    }

    findById(id) {
        return this.#map.get(id);
    }

    push(entity) {
        entity.id = this.#generateId();
        this.#data.push(entity);
        this.#writeback();

        this.#map.set(entity.id, entity);

        return entity;
    }

    removeById(id) {
        // Assume ids are unique
        this.#map.delete(id);
        this.#regenerateList();
    }

    removeByField(field, value) {
        for (const entry of this.#map.entries()) {
            if (entry.value[field] === value) {
                this.#map.delete(entry.key);
            }
        }
        this.#regenerateList();
    }

    edit(id, new_fields, editable_fields) {
        // Does not validate anything
        // Must be overloaded by children to be safe
        let entity = this.#map.get(id);

        for (const field of editable_fields) {
            if (field in new_fields) {
                entity[field] = new_fields[field];
            }
        }

        this.#writeback();
        return entity;
    }

    getList() {
        return this.#data;
    }

    isValid(entity) {
        let i = 0;
        for (const key in entity) {
            if (key in this.required_fields) {
                i++;
            } else if (!key in this.optional_fields) {
                return false;
            }
        }
        return i === this.required_fields.length;
    }

    #generateId() {
        const out = this.#nextId;
        this.#nextId++;
        return out;
    }

    #regenerateList() {
        this.#data = [];
        for (const v of this.#map.values()) {
            this.#data.push(v);
        }
    }

    #writeback() {
        // Non-blocking write to file
        fs.writeFile(
            this.#file_name,
            JSON.stringify(this.#data, null, 4),
            (e)=> {if (e) {throw e;}}
        );
    }

}

let birds_data;
let taxa_data;

class BirdsData extends EntityData {
    // Class chosen over an object for readability and reality-mimicking sake

    // Singleton class
    static #initialised = false;

    constructor() {
        // Enforce singleton
        if (BirdsData.#initialised) {
            throw new Error("Singleton class can only be initialised once");
        } else {
            BirdsData.#initialised = true;
        }

        super(
            "./birds.json",
            [],
            ["name", "species", "genus", "description"],
            ["picture"]
        )
    }

    push(bird) {
        // Assumes input data is of valid types
        if (!this.isValid(bird)) {
            throw new TypeError("Invalid entity pushed")
        }

        return super.push(bird);
    }

    edit(id, new_fields) {
        let editable_fields = ["name", "species", "description", "picture"];

        if ("genus" in new_fields) {
            if (this.#isValidGenus(new_fields.genus)) {
                editable_fields.push("genus")
            } else {
                throw new TypeError("Invalid taxon to set as father");
            }
        }
        return super.edit(id, new_fields, editable_fields);
    }

    isValid(bird) {
        if (!super.isValid(bird)) {
            return false;
        }

        return this.#isValidGenus(bird.genus)
    }

    #isValidGenus(genus_id) {
        const father = taxa_data.findById(genus_id);

        return father && (father.level === 1);
    }
}
birds_data = new BirdsData();

class TaxaData extends EntityData {
    // Singleton class
    static #initialised = false;

    // Class chosen over an object for readability and reality-mimicking sake
    constructor() {
        // Enforce singleton
        if (TaxaData.#initialised) {
            throw new Error("Singleton class can only be initialised once");
        } else {
            TaxaData.#initialised = true;
        }

        super(
            "./taxa.json",
            [{
                id: 0,
                name: "Aves",
                description: "The class containing all birds.",
                father: null,
                level: 4
            }],
            ["name", "father", "description", "level"],
            []
        );
    }

    push(taxon) {
        if (this.isValid(taxon)) {
            throw new Error("Invalid entity pushed")
        }

        return super.push(taxon);
    }

    edit(id, new_fields) {
        let allowed_fields = ["name", "description"];
        const taxon = this.findById(id);

        if ("father" in new_fields) {
            if (this.#isValidParent(taxon, new_fields.father)) {
                allowed_fields.push("father");
            }
        }

        super.edit(id, new_fields, allowed_fields);
    }

    removeById(id) {
        this.#removeTaxon(this.findById(id));
    }

    #removeTaxon(taxon) {
        if (taxon.id === 0) {
            throw new Error("Cannot delete Aves");
        }

        if (taxon.level === 1) {
            birds_data.removeByField("genus", taxon.id);
        } else {
            for (const child of this.findByField("father", taxon)) {
                // Recursive call down the taxonomy tree to remove children
                this.#removeTaxon(child);
            }
        }
        super.removeById(taxon.id);
    }

    isValid(taxon) {
        if (!super.isValid(taxon)) {
            return false;
        }

        return this.#isValidParent(taxon, taxon.father);
    }

    #isValidParent(taxon, parent_id) {
        const father = this.findById(parent_id);
        return !father || (father.level - taxon.level !== 1)
    }
}
taxa_data = new TaxaData();


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

    if (n >= birds_data.size()) {
        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(birds_data.getList()));
        return;
    }

    let birds = []
    for (let i=0; i<n; i++) {
        let i = Math.floor(Math.random() * birds.size());

        let bird = birds_data.getList()[i];
        if (!bird || bird in birds) {
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
            "name": name,
            "species": species.toLowerCase(),
            "genus": genus,
            "picture": picture,
            "description": description
        };
        bird = birds_data.push(bird);

        console.log("/add/species/: New bird successfully written to file")

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(JSON.stringify(bird));

    } catch (e) {
        console.log("/add/species:", e);

        res.statusCode = 500;
        res.contentType("application/json");
        res.send(JSON.stringify(e));
    }
});

app.post("/add/level/", (req, res) => {
    // Data per level: father, name, description, id
    let {father, name, description, level} = req.body;

    if (
        typeof name !== "string" || typeof father !== "number"
        || typeof description !== "string" || typeof level !== "number"
    ) {
        res.statusCode = 406;
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

        console.log("/add/level/: New taxon successfully written to file")

        res.statusCode = 200;
        res.contentType("application/json");
        res.send(taxon);

    } catch (e) {
        res.statusCode = 500;
        res.contentType("application/json");
        res.send(JSON.stringify(e));
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
            data = taxa_data.findById(id);
            break;

        case "bird":
            data = birds_data.findById(id);
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

app.get("/get/children/:father", (req, res) => {
    let {father} = req.params;

    father = parseInt(father);

    if (isNaN(father)) {
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: parameter must be a number");
        return;
    }
    let taxon = taxa_data.findById(father);

    if (!taxon) {
        res.statusCode = 400;
        res.contentType("text/plain");
        res.send("Entity does not exist");
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
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: parameter must be a number");
        return;
    }

    console.log(`get/level/: level ${level} queried`);

    res.statusCode = 200;
    res.contentType("application/json")
    res.send(JSON.stringify(taxa_data.findByField("level", level)));
})

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

        console.log(`/delete/${type}/: entry of id ${id} deleted`);

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
        res.statusCode = 406;
        res.contentType("text/plain");
        res.send("Error: Invalid parameters");
    }

    try {
        switch (type) {
            case "taxon": {
                taxa_data.edit(id, req.body)
                break;
            }

            case "bird": {
                birds_data.edit(id, req.body)
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
        res.statusCode = 400;
        res.contentType("application/json");
        res.send(JSON.stringify(e));
    }

    res.statusCode = 200;
    res.contentType("application/json");
    res.send(JSON.stringify(taxa_data.findById(id)));
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`)
});

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1, s.size).toLowerCase()
}
