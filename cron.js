var cron = require("node-cron");
var childProcess = require('child_process'),
    ls;

console.log('cron tab started');
cron.schedule('* */1 * * *', function() { // 1-26-17 updated equipmentID
    console.log("every minute");
    ls = childProcess.exec('node index', function(err, stdout, stderr){
        if (err){
            console.log(err);
        }
        console.log(stdout); console.log(stderr);
    });
});