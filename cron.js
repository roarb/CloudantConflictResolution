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