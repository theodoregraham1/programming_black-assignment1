"use strict";

const http = require("node:http");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

const staticFileMatcher = /\/static\/\w+\.\w+/;


const server = http.createServer((req, res) => {

    req.on("error", (err) => {
        console.error(err);
    })
    res.on("error", (err) => {
        console.error(err);
    })

    const { url, method, headers } = req;

    console.log(`url accessed: ${url}`);

    if (staticFileMatcher.test(url)) {
        // Gives access to all static files (in directory) but only those files

        const fileUrl = "." + url.match(staticFileMatcher)[0];

        const readStream = fs.createReadStream(fileUrl)
            .on("error", (error) => {
                console.error(error)

                res.statusCode = 400;
                res.end();
            });

        res.statusCode = 200;
        res.setHeader("content-type", "html"); // fixme

        readStream.pipe(res);
    } else if (url === "/") {
        res.redirect ="/static/index.html";
        res.end()
    }
});

server.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`)
})