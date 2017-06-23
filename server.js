var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
var fs = require('fs');
var ejs = require('ejs');

var cron = require("node-cron");
var childProcess = require('child_process'),
    ls;

cron.schedule('0 */1 * * *', function() {
    ls = childProcess.exec('node index', function(err, stdout, stderr){
        // if (err){
        //     console.log(err);
        // }
        // console.log(stdout); console.log(stderr);
    });
});

app.set('views', __dirname + "/views");
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/", function (request, response) {
    fs.readFile('./logs/conflict.json', 'utf-8', function(err, data){
        if (err){
            console.log(err);
            response.render('index.js', {"err": err, "monnithbs": "err"})
        }
        response.render('index.ejs', {"err": "", "monnithbs": data})
    })
});

//serve static file (index.html, images, css)
// app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});