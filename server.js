"use strict";

const http = require("node:http");
const express = require("express");
const fs = require("node:fs");

const hostname = "127.0.0.1";
const port = 8080;

const staticFileMatcher = /\/static\/\w+\.\w+/;

const app = express();

app.use(express.static("static"));

app.get("/", (req, res) => {
    res.redirect("index.html");
});

app.get("/index/cards", (req, res) => {

});

app.get("/browse/:level/", (req, res) => {

});

app.post("/add/", (req, res) => {

});

app.post("/search/", (req, res) => {

});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`)
});