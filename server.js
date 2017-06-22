var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');

var cron = require("node-cron");
var childProcess = require('child_process'),
    ls;

cron.schedule('* */1 * * *', function() {
    ls = childProcess.exec('node index', function(err, stdout, stderr){
        // if (err){
        //     console.log(err);
        // }
        // console.log(stdout); console.log(stderr);
    });
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

/* Endpoint to greet and add a new visitor to database.
 * Send a POST request to localhost:3000/api/visitors with body
 * {
 * 	"name": "Bob"
 * }
 */

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */

// load local VCAP configuration  and service credentials
// var vcapLocal;
// try {
//     vcapLocal = require('./vcap-local.json');
//     console.log("Loaded local VCAP", vcapLocal);
// } catch (e) { }

// const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}
//
// const appEnv = cfenv.getAppEnv(appEnvOpts);
//
// if (appEnv.services['cloudantNoSQLDB']) {
//     // Load the Cloudant library.
//     var Cloudant = require('cloudant');
//
//     // Initialize database with credentials
//     var cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
//
//     //database name
//     var dbName = 'mydb';
//
//     // Create a new "mydb" database.
//     cloudant.db.create(dbName, function(err, data) {
//         if(!err) //err if database doesn't already exists
//             console.log("Created database: " + dbName);
//     });
//
//     // Specify the database we are going to use (mydb)...
//     mydb = cloudant.db.use(dbName);
// }

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});