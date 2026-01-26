const app = require("./app");

const request = require("supertest");
const {response} = require("express");

describe("Test getters", () => {
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
                )
                done();
            })
    });

    test("Erraneous taxon called", async () => {
        const response = await request(app).get("/get/entity/taxon/null");

        expect(response.ok).toBeFalsy();
        expect(response.statusCode).toBe(400);

    })
});
