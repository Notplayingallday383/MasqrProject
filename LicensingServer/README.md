# Masqr Licensing Server

The masqr licensing server isn't too hard to use, First make sure you install the dependencies and setup your ENV file, an example of how your ENV file should look like has already been provided, if your confused on how to get a key, you can generate one using [gnupg](https://gnupg.org/download/index.html) like so:

```bash
gpg --gen-random --armor 1 24
```

Put the output from that into the array in the ENV file where "psk-key-here" is present

Next, you can start the server now using `node index.js`, The licensing server should now be life on port 8004. And just like that your licensing server is ready for production use.

## Generating keys

If your trying to setup a way to generate keys in a bot or a command or something along those lines its relatively simple to do, just make sure your aware of [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). For the example below, its going to be in JS as a majority of bots use Discord.JS

```js
async function getKey() {
    const response = await fetch('http://localhost:8004/newlicense', {
        headers: {
            "PSK": "your-psk-from-earlier-here"
        }
    })
    return await response.json()
}

await getKey()
```

> The PSK header's value **MUST** match the one provided in the ENV file or else it **WILL NOT** work
