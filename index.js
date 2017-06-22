var Cloudant = require('cloudant');
var nodemailer = require('nodemailer');
var config = require("./config.json");
var cloudant = Cloudant(config.cAuth);
var sensordb = cloudant.db.use("monnit-hbs");
var fs = require('fs');

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'Packlytics@gmail.com',
        pass: '14?hxzekaW7D1X'
    }
});
// setup email data with unicode symbols
var mailOptions = {
    from: '"Packlytics -- Cloudant Cleaning Run" <packlytics@gmail.com>', // sender address
    to: 'rhoehn24@gmail.com', // list of receivers
    subject: 'Cloudant Cleanup Run', // Subject line
    text: 'tmp', // plain text body
    html: '<b>tmp</b>' // html body
};

// TODO: we'll need a location to host this and run on a cron - node-red can't reproduce this code correctly.
var conflictReport = [];
var docIds = [];
sensordb.list(function(err, data){
    if (err){
        console.log(err);
    } else {
        for (var i = 0; i < data.rows.length; i++){
            docIds.push(data.rows[i].id);
            latestWins(sensordb, data.rows[i].id, "unixLastReceived", function(err, data){
                if(err){
                    console.log(err);
                } else {
                    conflictReport.push("Resolved "+data.length+" conflicts for document: "+data[0].id);
                    console.log("Resolved "+data.length+" conflicts for document: "+data[0].id);
                }
            });
        }
        setTimeout(function(){
            var reportWrite = {"runtime": new Date(), "conflictReport": conflictReport};
            fs.writeFileSync('./logs/conflict.json', JSON.stringify(reportWrite), 'utf-8');
            if (conflictReport.length > 0){
                // email out a notice
                // send mail with defined transport object
                var html = "<ul>";
                for (var i = 0; i < conflictReport.length; i++){
                    html += "<li>"+conflictReport[i]+"</li>";
                }
                html += "</ul>";
                mailOptions.html = html;
                transporter.sendMail(mailOptions, function(err, info){
                    if (err){
                        console.log(err);
                        return false;
                    } else {
                        console.log('Message %s sent: %s', info.messageId, info.response);
                        return true;
                    }
                });
            }
        }, 120000); // 2min
    }
});


// In a database 'db' (a nano object), that has document with id 'docid', resolve the
// conflicts by choosing the revision with the highest field 'fieldname'.
function latestWins(db, docid, fieldname, callback) {

    // fetch the document with open_revs=all
    db.get(docid, {open_revs:'all'}, function(err, data) {

        // return if document isn't there
        if (err) {
            return callback("Document could not be fetched");
        }

        // remove 'deleted' leaf nodes from the list
        var doclist = filterList(data);
        // console.log(doclist);
        // if the there is only <=1 revision left, the document is either deleted
        // or not conflcited; either way, we're done
        if (doclist.length <= 1) {
            return callback("Document is not conflicted.");
        }

        // sort the array of documents by the supplied fieldname
        // our winner will be the last object in the sorted array
        doclist.sort(function(a, b ){ return a[fieldname]-b[fieldname]});
        var last = doclist.pop(); // remove the winning revision from the array

        // turn the remaining leaf nodes into deletions
        doclist = convertToDeletions(doclist);
        // console.log(doclist);
        // now we can delete the unwanted revisions
        db.bulk({docs: doclist}, callback);

    });
}

// In a database 'db' (a nano object), that has document with id 'docid', resolve the
// conflicts by choosing the revision with the highest field 'fieldname'.
function removeOld(db, docid, fieldname, callback) {

    // fetch the document with open_revs=all
    db.get(docid, {open_revs:'all'}, function(err, data) {

        // return if document isn't there
        if (err) {
            return callback("Document could not be fetched");
        }

        // remove 'deleted' leaf nodes from the list
        var doclist = filterList(data);
        // console.log(doclist);
        // if the there is only <=1 revision left, the document is either deleted
        // or not conflcited; either way, we're done
        if (doclist.length <= 1) {
            return callback("Document is not conflicted.");
        }

        // sort the array of documents by the supplied fieldname
        // our winner will be the last object in the sorted array
        doclist.sort(function(a, b ){ return a[fieldname]-b[fieldname]});
        doclist.splice(doclist.length-1,1); // remove the winning revision from the array
        for (var i = 0; i < doclist.length; i++){
            if (i < 30){
                sensordb.destroy(doclist[i]._id, doclist[i]._rev, function(err, result){
                    if (err) { console.log(err); }
                    else {
                        console.log(result);
                    }
                })
            }

        }
        // callback(1,2);

        // // turn the remaining leaf nodes into deletions
        // doclist = convertToDeletions(doclist);
        // // console.log(doclist);
        // // now we can delete the unwanted revisions
        // db.bulk({docs: doclist}, callback);

    });
}


// this function takes the list of revisions and removes any deleted or not 'ok' ones.
// returns a flat array of document objects
function filterList (list, excluderev) {
    var retval = [];
    for (var i in list) {
        if (list[i].ok && !list[i].ok._deleted) {
            if (!excluderev || (excluderev && list[i].ok._rev != excluderev)) {
                retval.push(list[i].ok);
            }
        }
    }
    return retval;
}

// convert the incoming array of document to an array of deletions - {_id:"x",_rev:"y",_deleted:true}
function convertToDeletions(list) {
    var retval = [];
    for (var i in list) {
        var obj = { _id:list[i]._id, _rev:list[i]._rev, _deleted: true };
        retval.push(obj);
    }
    return retval;
}

// copy the contents of object b into object a
function objmerge(a,b) {
    for (var i in b) {
        if (i != "_id" && i != "_rev") {
            a[i] = b[i];
        }
    }
    return a;
}
