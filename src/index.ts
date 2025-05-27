const express = require("express");
const path = require("path");
import * as dotenv from "dotenv";

import { DB } from "./db";

dotenv.config();

const app = express();
const server = express();

server.use(express.text());

app.get("/*.html", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.listen(process.env.CLIENT_PORT);

console.log(`Client running at Port ${process.env.CLIENT_PORT} 🚀 ..`);

server.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    `${process.env.HOSTNAME}:${process.env.CLIENT_PORT}`,
  );
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type",
  );

  next();
});

server.get("/tracker", (req, res) => {
  res.sendFile(path.join(__dirname, "/tracker.js"));
});

server.post("/track", async (req, res) => {
  try {
    const list = JSON.parse(req.body);
    await Promise.all(list.map((item) => DB.validateTrack(item)));
    res.sendStatus(200);
    await DB.saveTracksList(list);
  } catch (e) {
    res.sendStatus(422);
    console.error("e", e);
  }
});

server.listen(process.env.SERVER_PORT);

console.log(`Server running at Port ${process.env.SERVER_PORT} 🚀 ..`);
