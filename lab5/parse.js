var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

app.get('/',function(req,res){
    res.send('Hello!');
})

app.get('/form',function(req,res){
    res.sendFile('/form.html', {root: __dirname});
})

app.get('/event/:eventId/loc/:locId',function(req,res){
    var eventid = req.params.eventId;
    var locid = req.params.locId;
    var display = "Event ID: "+ eventid + "<br \>Loc ID: " +locid;
    
    res.send(display);
});

app.post('/event/:eventId/loc/:locId',urlencodedParser,function(req,res){
    var eventid = req.params.eventId;
    var locid = req.params.locId;

    var display = "Event ID: "+ eventid + "<br \>Loc ID: " + locid + "<br \>Login ID:" + req.body.loginId ;
    res.send(display);


})

var server = app.listen(8081, function (){
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host ,port);
})