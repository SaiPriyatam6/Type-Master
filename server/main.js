const { MongoClient } = require("mongodb");
const express = require("express");
const path = require("path");
var bodyParser = require('body-parser');

require("dotenv").config();

const uri = process.env.URI;
const client = new MongoClient(uri);
const database = client.db("TYPESPEED");
const collection = database.collection("scores");

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static(path.join(__dirname, '../')))
app.use("./js", express.static(path.join(__dirname, '../js')))

app.get("/", (req, res) => {
    res.sendFile('index.html', {root: path.join(__dirname, '../')})
})

app.post("/senddata", (req, res) => {
    collection.findOne({"userID": req.body.userID}).then((resp) => {
        if (resp == null) {
            const dbData = {userID: req.body.userID, scores: [req.body.wpm]};
            collection.insertOne(dbData);
        } else {
            var scores = resp.scores;
            scores.push(req.body.wpm);
            const dbData = {userID: req.body.userID, scores: scores};
            collection.findOneAndReplace({"userID": req.body.userID}, dbData);
        }
    })
    res.send("done!!");
})

app.listen(5000, () => {
    console.log("server started");
});