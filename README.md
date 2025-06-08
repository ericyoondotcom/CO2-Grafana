# Netatmo Weather Station <-> Grafana

## Setup

### Setup Grafana Alloy

Install and set up Grafana Alloy as detailed [here](https://grafana.com/docs/alloy/latest/set-up/install/linux/).

Configure Alloy to start at boot by following the instructions [here](https://grafana.com/docs/alloy/latest/set-up/run/linux/).

Copy `misc/config.alloy` to `/etc/alloy/config.alloy`, changing your URL, user ID, and password to your own.

### Setup NodeJS

First, install dependencies:
```bash
npm install
```

Then, copy `server/secrets.js.template` to `server/secrets.js` and fill in your Netatmo API credentials.

We'll use PM2 to run the NodeJS script in the background.

```bash
npm i -g pm2
cd server
pm2 start index.js --name co2 --exp-backoff-restart-delay=100
pm2 save
```
