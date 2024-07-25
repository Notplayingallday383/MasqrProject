/*
* Masqr Project - Backend validator
* to set this up you'll want to create a few files, in addition to adding this to your next app
* those files include Checkfailed.html - this will be your fallback failure page
* placeholder.svg, a default image for v0.dev sites
*
* OPTIONAL 
* a folder named Masqrd in your server directory
* inside Masqrd, an individual masqd page for when domain fails for EACH domain
* for example, if anura.christmas fails to validate, it will serve ./Masqrd/anura.christma.html
*/

import express from "express";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

// Masqr Constants
const LICENSE_SERVER_URL = "https://license.mercurywork.shop/validate?license=";
const whiteListedDomains = ["anura.pro", "anura.mercurywork.shop", "anura.christmas"]; // Add any public domains you have here
const failureFile = fs.readFileSync("Checkfailed.html", "utf8");
const idFile = "ids.txt"
const placeholder = fs.readFileSync("placeholder.svg", "utf8"); // For v0.dev websites

let storedIDs = [];
if (fs.existsSync(idFile)) {
    storedIDs = fs.readFileSync(idFile, "utf8").split("\n").filter(Boolean);
}
// Save the storedIDs incase your server shits itself or something
setTimeout(() => {
    fs.writeFile(idFile, storedIDs.join("\n"));
}, 5000);

const app = express();

app.use(cookieParser())

// Congratulations! Masqr failed to validate, this is either your first visit or you're a FRAUD
async function MasqFail(req, res) {
        if (!req.headers.host) {
                // no bitch still using HTTP/1.0 go away
                return;
        }
        const unsafeSuffix = req.headers.host + ".html"
        let safeSuffix = path.normalize(unsafeSuffix).replace(/^(\.\.(\/|\\|$))+/, '');
        let safeJoin = path.join(process.cwd()+"/Masqrd", safeSuffix);
        try {
                await fs.promises.access(safeJoin) // man do I wish this was an if-then instead of a "exception on fail"
                const failureFileLocal = await fs.promises.readFile(safeJoin, "utf8");
                res.setHeader("Content-Type", "text/html"); 
                res.send(failureFileLocal);
                return;
        } catch(e) {
                res.setHeader("Content-Type", "text/html"); 
                res.send(failureFile);
                return;
        }
}

// Woooooo masqr yayyyy (said no one)
app.use(async (req, res, next) => {
    if (req.headers.host && whiteListedDomains.includes(req.headers.host)) {
            next();
            return;
    }
    if (req.url.includes("placeholder.svg")) {
        res.setHeader("Content-Type", "image/svg+xml");
        res.send(placeholder);
        return;
    }
    if (req.url.includes("/bare/")) { // replace this with your bare endpoint
        next();
        return;
        // Bypass for UV and other bares
    }

    const authheader = req.headers.authorization;
    
    if (req.cookies["authcheck"]) {
        const isVerified = storedIDs.includes(req.cookies["authcheck"]);
        if (isVerified) {
            next();
            return;
        } else {
            res.setHeader("Content-Type", "text/html"); 
            return res.status(401).send(failureFile);
        }
    }


    if (req.cookies['refreshcheck'] != "true") {
        res.cookie("refreshcheck",  "true",  {maxAge: 10000}) // 10s refresh check
        MasqFail(req, res) 
        return;
    }
    
    if (!authheader) {
        res.setHeader('WWW-Authenticate', 'Basic'); // Yeah so we need to do this to get the auth params, kinda annoying and just showing a login prompt gives it away so its behind a 10s refresh check
        res.status(401);
        MasqFail(req, res) 
        return;
    }
 
    const auth = Buffer.from(authheader.split(' ')[1],
        'base64').toString().split(':');
    const user = auth[0];
    const pass = auth[1];

    const licenseCheck = ((await (await fetch(LICENSE_SERVER_URL + pass + "&host=" + req.headers.host)).json()))["status"]
    console.log(LICENSE_SERVER_URL + pass + "&host=" + req.headers.host +" returned " +licenseCheck)
    if (licenseCheck == "License valid") {
        storedIDs.push();
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters[randomIndex];
        }
        res.cookie("authcheck", code, {expires: new Date((Date.now()) + (365*24*60*60 * 1000))}) // authorize session, for like a year, by then the link will be expired lol
        res.send(`<script> window.location.href = window.location.href </script>`) // fun hack to make the browser refresh and remove the auth params from the URL
        return;
    }
    
    MasqFail(req, res)
    return; 
})
