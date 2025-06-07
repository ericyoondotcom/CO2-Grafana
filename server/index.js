const express = require("express");
const client = require("prom-client");

const app = express();
const port = 1500;

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const co2gauge = new client.Gauge({
    name: "co2_concentration",
    help: "CO2 concentration in ppm"
});

register.registerMetric(co2gauge);

setInterval(() => {
    co2gauge.set(Math.floor(Math.random() * 1000) + 400);
    console.log("CO2 concentration updated");
}, 5000);

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.listen(port, () => {
    console.log(`Listening on ${port}`);
});
