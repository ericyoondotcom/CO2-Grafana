import express from "express";
import client from "prom-client";
import AuthConnect from "authconnect-djs";
import fetch from "node-fetch";
import {NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET, NETATMO_DEVICE_ID} from "./secrets.js";
import { access } from "fs";

const PORT = 1500;
const NETATMO_SCOPES = "read_station";
const GUILD_ID_FAKE = "weather";

const app = express();

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const co2gauge = new client.Gauge({
    name: "co2_concentration",
    help: "CO2 concentration in ppm"
});
register.registerMetric(co2gauge);

const auth = new AuthConnect({
    netatmo: {
        clientId: NETATMO_CLIENT_ID,
        clientSecret: NETATMO_CLIENT_SECRET,
    },
});
auth.registerService("netatmo", {
    authUrl: "https://api.netatmo.com/oauth2/authorize?client_id={{CLIENT_ID}}&redirect_uri={{REDIR}}&scope={{SCOPE}}&state={{STATE}}",
    tokenUrl: "https://api.netatmo.com/oauth2/token",
});
auth.useDefaultDataHandlers("./auth-data.json");

async function init() {
    if(await auth.isGuildLoggedIn("netatmo", GUILD_ID_FAKE)) {
        setInterval(poll, 15000);
        poll();
    } else {
        const url = auth.generateAuthURL("netatmo", GUILD_ID_FAKE, NETATMO_SCOPES);
        console.log("Please visit the following URL to log in to Netatmo:");
        console.log(url);
        console.log("After logging in, kill and restart the server.");
    }
}

async function poll() {
    try {
        const accessToken = await auth.getAccessToken("netatmo", GUILD_ID_FAKE);
        const now = Math.floor(Date.now() / 1000);
        const oneHourAgo = now - 3600;
        const params = new URLSearchParams({
            device_id: NETATMO_DEVICE_ID,
            date_begin: oneHourAgo,
            date_end: now,
            scale: "30min",
            type: "co2",
        });
        const res = await fetch(`https://api.netatmo.com/api/getmeasure?${params.toString()}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
        const json = await res.json();
        const values = json.body[0].value;
        const latest = values[values.length - 1][0];
        console.log((new Date()).toISOString(), "\t\t", latest);
        co2gauge.set(latest);
    } catch(e) {
        console.error("Error polling Netatmo API:", e);
    }
}

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
    setTimeout(() => {
        init();
    }, 1000); // We need to wait for AuthConnect to initialize
});
