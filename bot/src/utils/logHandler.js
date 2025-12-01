var mysql = require("mysql");

let db;

const logToDB = (text, config) => {

    if (!config.logToDB || !process.env.MYSQL_HOST) {
        return;
    }

    if (!db) {
        db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DB,
        });

        db.connect((err) => {
        if (err) {
            console.log("Failed to connect to db: " + err);
        }
        });
    }

    let query = "INSERT INTO logs (log) VALUES ('" + text.replace("'", "''") + "') --";

    db.query(query, (err) => {
        if (err) {
            console.log("Failed to insert log into db: " + err);
        }
    });
}

const logText = (text, config) => {
    console.log(text);
    logToDB(text, config);
}

const logError = (error, config) => {
    console.log(error);
    
    if (!config.logToDB || !process.env.MYSQL_HOST) {
        return;
    }

    if (!db) {
        db = mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DB,
        });

        db.connect((err) => {
        if (err) {
            console.log("Failed to connect to db: " + err);
        }
        });
    }

    let query = "INSERT INTO errors (error) VALUES ('" + error.replace("'", "''") + "') --";

    db.query(query, (err) => {
        if (err) {
            console.log("Failed to insert error into db: " + err);
        }
    });
}

const logTranscription = (transcription, translation, config) => {

    if (!config.logToDB || !process.env.MYSQL_HOST) {
        return;
    }

    if (!db) {
        db = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASS,
            database: process.env.MYSQL_DB,
        });

        db.connect((err) => {
            if (err) {
            console.log("Failed to connect to db: " + err);
            }
        });
        }

        // log to db
        if (transcription && translation) {
        let query;
        if (config.transcriptionOnly) {
            query =
            "INSERT INTO translations (transcription, user) VALUES " +
            "('" +
            transcription.replace("'", "''") +
            "', '" +
            user.username +
            "') --";
        } else {
            query =
            "INSERT INTO translations (transcription, translation, user) VALUES " +
            "('" +
            transcription.replace("'", "''") +
            "', '" +
            translation.replace("'", "''") +
            "', '" +
            user.username +
            "') --";
        }

        db.query(query, (err) => {
            if (err) {
            console.log("Failed to insert translation into db: " + err);
            }
        });
    }
}

module.exports = { logText, logError, logTranscription };