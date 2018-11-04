var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/',function(req,res){
    //res.send("Hello World!");  
    res.sendFile('public/images/haddock.jpg', {root: __dirname});
})

var server = app.listen(8081,function(){
    var host = server.address().address
    var port = server.address().port

    console.log("app listening at http://%s%s",host,port )
})