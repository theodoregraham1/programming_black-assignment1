"use strict";

const http = require("node:http");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

const fileRegex = /\/\w+\.\w+/;

const server = http.createServer((req, res) => {

    req.on("error", (err) => {
        console.error(err);
    })
    res.on("error", (err) => {
        console.error(err);
    })

    const { url, method, headers } = req;

    if (fileRegex.test(url)) {
        // FIXME: this assumes all files are in the same directory and gives access to ALL files in that directory
        res.statusCode = 200;
        res.setHeader("content-type", "html");

        const readStream = fs.createReadStream(`.${url}`);
        let fileData = []
        readStream
            .on("data", (chunk) => {
                res.write(chunk.toString());
            })
            .on("end", () => {
                res.end();
            });
    }
});

server.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}/index.html`)
})