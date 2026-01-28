"use strict"

const app_initialiser = require("./app");

const request = require("supertest");
const fs = require("fs");
const path = require("path");

const TEST_FILES = {birds: "./test/birds.json", taxa: "./test/taxa.json"};

let app;

function clear_files(files) {
    for (const k in files) {
        try {
            fs.writeFileSync(files[k], "");
        } catch (e) {
            fs.mkdirSync(path.dirname(files[k]));
        }
    }
}

// File checking tests can sometimes fail as the asynchronous file writing hasn't finished yet
// This is essential to ensure the blocking loop remains unobstructed but would not work in a production scale website with any large number of users

beforeAll(() => {
    clear_files(TEST_FILES);

    app = app_initialiser(TEST_FILES.birds, TEST_FILES.taxa);
});

let valid_taxa = [
    {name: "order1", father: 0, level: 3, description: "test"},
    {name: "family1", father: 1, level: 2, description: "test"},
    {name: "genus1", father: 2, level: 1, description: "test"},
    {name: "order2", father: 0, level: 3, description: "test"},
    {name: "family2", father: 1, level: 2, description: "test"},
    {name: "genus2", father: 2, level: 1, description: "test"},
];

let valid_birds = [
    {name: "bird1", species: "species1", genus: 3, description: "test"},
    {name: "bird2", species: "species2", genus: 3, description: "test", picture: "..."},
    {name: "bird3", species: "species3", genus: 6, description: "test", picture: "..."},
]

describe("Test /add/", () => {
    test("Add valid taxa", async () => {
        let i = 1;

        for (const object of valid_taxa) {
            let response = await request(app).post("/add/taxon/")
                .send(object);

            object.id = i;
            i++;
            object.name = capitalise(object.name);

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    });

    test("Add invalid taxa", async () => {
        let invalid_taxa = [
            {father: 0, level: 3, description: "test"},
            {name: "invalid", level: 3, description: "test"},
            {name: "invalid", father: 0, description: "test"},
            {name: "invalid", father: 0, level: 3},
            {name: "invalid", father: 0, level: 2, description: "test"},
            {name: "invalid", father: null, level: 4, description: "test"},
        ]

        for (const object of invalid_taxa) {
            let response = await request(app).post("/add/taxon/")
                .send(object);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
        }
    });

    test("Add valid birds", async () => {
        let i = 0;

        for (const object of valid_birds) {
            let response = await request(app).post("/add/bird")
                .send(object);

            object.id = i;
            i++;
            if (!object.picture) {
                object.picture = "";
            }

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    });

    test("Add invalid birds", async () => {
        let invalid_birds = [
            {species: "invalid", genus: 3, description: "test"},
            {name: "invalid", genus: 3, description: "test"},
            {name: "invalid", species: "invalid", description: "test"},
            {name: "invalid", species: "invalid", genus: 3},
            {name: "invalid", species: "invalid", genus: 2, description: "test", picture: "..."},
            {name: "invalid", species: "invalid", genus: 0, description: "test", picture: "..."},
            {name: "invalid", species: "invalid", genus: -1, description: "test", picture: "..."},
        ]

        for (const object of invalid_birds) {
            let response = await request(app).post("/add/bird/")
                .send(object);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
        }
    });

    test("Post-add taxa file check", () => {
        let taxa_data = JSON.parse(fs.readFileSync(TEST_FILES.taxa, "utf-8"));

        expect(valid_taxa.length).toBe(6);
        expect(taxa_data.length).toBe(7); // aves not included
        for (const t of valid_taxa) {
            expect(taxa_data).toContainEqual(t);
        }
    });

    test("Post-add birds file check", () => {
        let birds_data = JSON.parse(fs.readFileSync(TEST_FILES.birds, "utf-8"));

        expect(valid_birds.length).toBe(3);
        expect(birds_data.length).toBe(3);
        for (const t of valid_birds) {
            expect(birds_data).toContainEqual(t);
        }
    });
})

describe("Test /get/entity/", () => {
    test("Base taxon queried", (done) => {
        request(app).get("/get/entity/taxon/0")
            .then(response => {
                expect(response.statusCode).toBe(200);
                expect(response.headers["content-type"]).toMatch(/json/);

                expect(response.body).toEqual(
                    expect.objectContaining({
                        id: 0,
                        father: null,
                        level: 4,
                        name: "Aves"
                    })
                );

                // Setup later tests
                valid_taxa.push(response.body);

                done();
            })
    });

    test("Other valid taxa queried", async () => {
        for (const object of valid_taxa) {
            let response = await request(app).get(`/get/entity/taxon/${object.id}`)

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    })

    test("Invalid taxa queried", async () => {
        const INCORRECT_TAXA = [null, -1, valid_taxa.length**2];

        for (const taxon of INCORRECT_TAXA) {
            const response = await request(app).get(`/get/entity/taxon/${taxon}`);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toMatch(/text/);
        }
    })

    test("Incorrect URL queried", async () => {
        const response = await request(app).get("/get/entity/test/0");

        expect(response.ok).toBeFalsy();
        expect(response.statusCode).toBe(400);
    });

    test("Valid birds queried", async () => {
        for (const object of valid_birds) {
            let response = await request(app).get(`/get/entity/bird/${object.id}`)

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    });

    test("Invalid birds queried", async () => {
        const INVALID_BIRDS = [null, -1, valid_birds.length**2];

        for (const bird of INVALID_BIRDS) {
            const response = await request(app).get(`/get/entity/taxon/${bird}`);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
        }
    })
});

describe("Test /list/", () => {
    test("List birds", async () => {
        let response = await request(app).get("/list/bird");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        for (const b of valid_birds) {
            expect(response.body).toContainEqual(b);
        }
    });

    test("List taxa", async () => {
        let response = await request(app).get("/list/taxon");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        for (const t of valid_taxa) {
            expect(response.body).toContainEqual(t);
        }
    });
});

describe("Test /get/birds/random/", () => {
    test("Random selection", async () => {
        let response = await request(app).get("/get/birds/random/2");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body.length).toBe(2);

        for (const b of response.body) {
            expect(valid_birds).toContainEqual(b);
        }
    });

    test("At table length", async () => {
        let response = await request(app).get("/get/birds/random/3");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body.length).toBe(3);

        for (const b of valid_birds) {
            expect(response.body).toContainEqual(b);
        }
    });

    test("Above table length", async () => {
        let response = await request(app).get("/get/birds/random/5");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body.length).toBe(3);

        for (const b of valid_birds) {
            expect(response.body).toContainEqual(b);
        }
    });

    test("Non-integer parameter", async () => {
        const INVALID_BIRDS = [null, -1, "test"];

        for (const bird of INVALID_BIRDS) {
            const response = await request(app).get(`/get/birds/random/${bird}`);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
        }
    });
});

describe("Test /get/children/", () => {
    test("Base taxon's children", async () => {
        const response = await request(app).get("/get/children/0");

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body.length).toBe(2);

        for (const ob of response.body) {
            expect(ob.level).toBe(3);
            expect(ob.father).toBe(0);
            expect(valid_taxa).toContainEqual(ob);
        }
    });

    test("Children of high-order taxa", async () => {
        for (const taxon of valid_taxa) {
            if (taxon.level !== 1) {
                const response = await request(app).get(`/get/children/${taxon.id}`);

                expect(response.ok).toBeTruthy();
                expect(response.statusCode).toBe(200);
                expect(response.headers["content-type"]).toMatch(/json/);

                for (const ob of response.body) {
                    expect(ob.level).toBe(taxon.level-1);
                    expect(ob.father).toBe(taxon.id);
                    expect(valid_taxa).toContainEqual(ob);
                }

                for (const t of valid_taxa) {
                    if (t.father=== taxon.id) {
                        expect(response.body).toContainEqual(t);
                    }
                }
            }
        }
    });

    test("Children of genera", async () => {
        for (const taxon of valid_taxa) {
            if (taxon.level === 1) {
                const response = await request(app).get(`/get/children/${taxon.id}`);

                expect(response.ok).toBeTruthy();
                expect(response.statusCode).toBe(200);
                expect(response.headers["content-type"]).toMatch(/json/);

                for (const ob of response.body) {
                    expect(ob.genus).toBe(taxon.id);
                    expect(valid_birds).toContainEqual(ob);
                }

                for (const b of valid_birds) {
                    if (b.genus === taxon.id) {
                        expect(response.body).toContainEqual(b);
                    }
                }
            }
        }
    });
});

describe("Test /get/level/", () => {
    test("Valid levels", async () => {
        for (let i=1; i<=4; i++) {

            let response = await request(app).get(`/get/level/${i}`);

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            for (const ob of response.body) {
                expect(ob.level).toBe(i);
                expect(valid_taxa).toContainEqual(ob);
            }

            for (const b of valid_taxa) {
                if (b.level === i) {
                    expect(response.body).toContainEqual(b);
                }
            }
        }
    });

    test("Invalid levels", async () => {
        const INVALID_LEVELS = [null, -1, "test", 0, 5, 10000];

        for (const level of INVALID_LEVELS) {
            const response = await request(app).get(`/get/level/${level}`);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toMatch(/text/);
        }
    })
});

describe("Test /edit/", () => {
    test("Valid edit taxa", async () => {
        const new_taxa = [
            {id: 6, name: "genus2edited", father: 5, description: "testedited"},
            {id: 5, name: "family2edited"},
        ];

        const indices = [5, 4];

        for (let i=0; i<new_taxa.length; i++) {
            const response = await request(app).put("/edit/taxon/")
                .send(new_taxa[i])

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(
                expect.objectContaining(new_taxa[i])
            );

            valid_taxa[indices[i]] = response.body;
        }
    });

    test("Valid edit bird", async () => {
        const new_bird = {id: 2, name: "bird3edited", species: "bird3edited", genus: 6, description: "testedited", picture: "edited"}

        const response = await request(app).put("/edit/bird/")
            .send(new_bird);

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);

        expect(response.body).toEqual(new_bird);

        valid_birds[2] = response.body;
    });

    test("Invalid edits taxon", async () => {
        const invalid_taxa = [
            {id: 0, father: 1},
            {id: 1, level: 1},
            {id: 0, test: "test"}
        ];

        let indices = [6, 0, 6];

        for (let i=0; i<invalid_taxa.length; i++) {
            const response = await request(app).put("/edit/taxon/")
                .send(invalid_taxa[i])

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(valid_taxa[indices[i]]);
        }
    });

    test("Invalid edits bird", async () => {
        const invalid_birds = [
            {id: 0, genus: 0},
            {id: 2, test: "test"},
        ];

        for (const ib of invalid_birds) {
            const response = await request(app).put("/edit/bird/")
                .send(ib);

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(valid_birds[ib.id]);
        }
    });

    test("Post-edit taxon file check", () => {
        let taxa_data = fs.readFileSync(TEST_FILES.taxa, "utf-8");
        taxa_data = JSON.parse(taxa_data);

        expect(taxa_data.length).toBe(valid_taxa.length);
        for (const t of taxa_data) {
            expect(valid_taxa).toContainEqual(t);
        }
    });

    test("Post-edit bird file check", () => {
        let birds_data = fs.readFileSync(TEST_FILES.birds, "utf-8");
        birds_data = JSON.parse(birds_data);

        expect(valid_birds.length).toBe(3);
        expect(birds_data.length).toBe(3);
        for (const t of valid_birds) {
            expect(birds_data).toContainEqual(t);
        }
    })
});

describe("Test /delete/", () => {
    test("Valid delete bird", async () => {
        const response = await request(app).delete(`/delete/bird/2`); // delete bird3

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({});

        // Check delete
        const check_response = await request(app).get("/get/entity/bird/2")
        expect(check_response.body).toEqual({});
    });

    let deleted_taxa_ids = [2, 3];

    test("Valid delete taxon", async () => {
        const response = await request(app).delete(`/delete/taxon/2`); // delete family1

        expect(response.ok).toBeTruthy();
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({});

        // Check delete
        // family1, genus1, genus2 and all birds should be deleted
        for (const i of deleted_taxa_ids) {
            const check_response = await request(app).get(`/get/entity/taxon/${i}`);

            expect(check_response.body).toEqual({});
            expect(check_response.ok).toBeFalsy();
            expect(check_response.statusCode).toBe(400);
        }

        for (const b of valid_birds) {
            const check_response = await request(app).get(`/get/entity/bird/${b.id}`);

            expect(check_response.body).toEqual({});
            expect(check_response.ok).toBeFalsy();
            expect(check_response.statusCode).toBe(400);
        }

    });

    test("Invalid delete of Aves", async () => {
        const response = await request(app).delete(`/delete/taxon}/0`);

        expect(response.ok).toBeFalsy();
        expect(response.statusCode).toBe(400);

        const check_response = await request(app).get("/get/entity/taxon/0");

        expect(check_response.ok).toBeTruthy();
        expect(check_response.statusCode).toBe(200);
    });

    test("Invalid delete entities", async () => {
        let invalid_ids = ["test", 10, 2];

        for (const id of invalid_ids) {
            for (const type of ["taxon", "bird"]) {
                const response = await request(app).delete(`/delete/${type}/${id}`);

                expect(response.ok).toBeFalsy();
                expect(response.statusCode).toBe(400);
            }
        }
    });

    test("Post-delete birds file check", () => {
        valid_birds = [];
        let birds_data = JSON.parse(fs.readFileSync(TEST_FILES.birds, "utf-8"));

        expect(birds_data.length).toBe(0);
        expect(birds_data).toEqual([]);
    });

    test("Post-delete taxa file check", () => {
        let new_valid_taxa = [];

        for (const ob of valid_taxa) {
            if (!deleted_taxa_ids.includes(ob.id)) {
                new_valid_taxa.push(ob);
            }
        }
        valid_taxa = new_valid_taxa

        let taxa_data = fs.readFileSync(TEST_FILES.taxa, "utf-8");
        taxa_data = JSON.parse(taxa_data);

        expect(taxa_data.length).toBe(valid_taxa.length);
        for (const t of taxa_data) {
            expect(valid_taxa).toContainEqual(t);
        }
    });
});

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1, s.size).toLowerCase()
}