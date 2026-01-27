"use strict";

/*
    Images could be served locally, however I believe this falls out of scope for the project. It also leads to a
    greater issue with source and copyright
 */

const fs = require("node:fs");
const path = require("path");

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
    }

    removeByField(field, value) {
        let edited = false;
        for (const entry of this.#data) {
            if (entry[field] === value) {
                this.#map.delete(entry.id);
                edited = true;
            }
        }
        if (edited) {
            this.regenerateList();
        }
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

    isValid(entity) {
        let i = 0;
        for (const key in entity) {
            if (this.required_fields.includes(key)) {
                i++;
            } else if (!this.optional_fields.includes(key)) {
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

    regenerateList() {
        this.#data = [];
        for (const v of this.#map.values()) {
            this.#data.push(v);
        }

        this.#writeback();
    }

    #writeback() {
        // Non-blocking write to file
        fs.writeFile(
            this.#file_name,
            JSON.stringify(this.#data, null, 4),
            (e)=> {
                if (e) {
                    fs.mkdirSync(path.dirname(this.#file_name));
                    this.#writeback();
                }
            }
        );
    }

    getList() {
        return this.#data;
    }
}

class BirdsData extends EntityData {
    // Class chosen over an object for readability and reality-mimicking sake

    // Singleton class
    static #initialised = false;

    constructor(file_name) {
        // Enforce singleton
        if (BirdsData.#initialised) {
            throw new Error("Singleton class can only be initialised once");
        } else {
            BirdsData.#initialised = true;
        }

        super(
            file_name,
            [],
            ["name", "species", "genus", "description"],
            ["picture"]
        )

        this.taxa_data = undefined;
    }

    setTaxaData(taxaData) {
        this.taxa_data = taxaData;
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
    
    removeById(id) {
        super.removeById(id);
        this.regenerateList();
    }

    isValid(bird) {
        if (!super.isValid(bird)) {
            return false;
        }

        return this.#isValidGenus(bird.genus)
    }

    #isValidGenus(genus_id) {
        const father = this.taxa_data.findById(genus_id);

        return father && (father.level === 1);
    }
}

class TaxaData extends EntityData {
    // Singleton class
    static #initialised = false;

    // Class chosen over an object for readability and reality-mimicking sake
    constructor(file_name) {
        // Enforce singleton
        if (TaxaData.#initialised) {
            throw new Error("Singleton class can only be initialised once");
        } else {
            TaxaData.#initialised = true;
        }

        super(
            file_name,
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

    setBirdsData(birds_data) {
        this.birds_data = birds_data;
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
        this.regenerateList();
    }

    #removeTaxon(taxon) {
        if (taxon.id === 0) {
            throw new Error("Cannot delete Aves");
        }

        if (taxon.level === 1) {
            this.birds_data.removeByField("genus", taxon.id);
        } else {
            for (const child of this.findByField("father", taxon.id)) {
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

exports.TaxaData = TaxaData;
exports.BirdsData = BirdsData;
