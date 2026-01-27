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
    })
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

});

describe("Test files", () => {

});

describe("Test /delete/", () => {

});

describe("Test /edit/", () => {

});

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1, s.size).toLowerCase()
}