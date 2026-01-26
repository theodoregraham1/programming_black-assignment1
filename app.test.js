const app = require("./app");

const request = require("supertest");

describe("Test /get/entity/taxon/", () => {
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
        const INCORRECT_TAXA = [null, -1];

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
