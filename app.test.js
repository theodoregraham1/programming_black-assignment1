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
    {name: "bird2", species: "species2", genus: 6, description: "test", picture: "..."},
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

    test("Add bird", async () => {
        let i = 0;

        for (const object of valid_birds) {
            let response = await request(app).post("/add/bird")
                .send(object);

            object.id = i;
            i++;
            console.log(response.body);

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    });
})

describe("Test /get/entity/", () => {
    test("Base taxon called", (done) => {
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

                valid_taxa.push(response.body);

                done();
            })
    });

    test("Other taxa called", async () => {
        for (const object of valid_taxa) {
            let response = await request(app).get(`/get/entity/taxon/${object.id}`)

            expect(response.ok).toBeTruthy();
            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/json/);

            expect(response.body).toEqual(object);
        }
    })

    test("Erraneous taxon called", async () => {
        const INCORRECT_TAXA = [null, -1, valid_taxa.length**2];

        for (const taxon of INCORRECT_TAXA) {
            const response = await request(app).get(`/get/entity/taxon/${taxon}`);

            expect(response.ok).toBeFalsy();
            expect(response.statusCode).toBe(400);
            expect(response.headers["content-type"]).toMatch(/text/);
        }
    })

    test("Incorrect URL called", async () => {
        const response = await request(app).get("/get/entity/test/0");

        expect(response.ok).toBeFalsy();
        expect(response.statusCode).toBe(400);
        expect(response.headers["content-type"]).toMatch(/text/);
    });
});

describe("Test /get/birds/random", () => {

});

describe("Test /get/children/", () => {

});

describe("Test /get/level/", () => {

});

describe("Test /list/", () => {

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