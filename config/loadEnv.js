const dotenv = require("dotenv");

function loadEnv() {
    //Load .env
    dotenv.config();

    //Load .env.local
    dotenv.config({ path: ".env.local" });
}

module.exports = loadEnv;