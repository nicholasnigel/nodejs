var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var mongoose = require('mongoose');

app.use(urlencodedParser);
// Setting Up Connection - - - - - - - - - - - - - - - - - - - - - -
mongoose.connect('mongodb://nigel:nigel@localhost/csci2720');
var db = mongoose.connection;

// Handling Connections - - - - - - - - - - - - - - - - - - - - - - 
db.on('error', console.error.bind(console,
    'Connection error:'));

db.once('open', function(){
    console.log("Connection is open...");
});

// Creating Schema Needed - - - - - - - - - - - - - - - - - - - - - -

var LocationSchema = mongoose.Schema({
    locId: {type: Number, required: true, unique:true },
    name: {type: String, required: true},
    quota: {type: Number}
});

var Location = mongoose.model('Location', LocationSchema);

var EventSchema = mongoose.Schema({
    eventId: {type: Number, required: true, unique: true},
    name: {type: String, required: true},
    loc: {type: mongoose.Schema.Types.ObjectId, ref: 'Location'},
    quota: {type: Number}
});

var Event = mongoose.model('Event', EventSchema);

// Handling Requests - - - - - - - - - - - - - - - - - - - - - - - - - -

// Homepage
app.get('/',function(req,res){
    res.send('Hello!');
})

//  Handle getting a specific eventId
app.get('/event/:eventId',function(req,res) {
    Event.findOne( 
        {eventId: req.params.eventId},'eventId name loc quota',
        function(err, e) {
            if(err)
                res.send(err);
            if(!e)      // If entry with requested eventId doesn't exist, print error message that it doesn't exist
                res.send("Entry doesnt exist");
            else
            {
                // Use findbyId
            Location.findById(e.loc, function(err, location)

            {res.send("This is event "+e.eventId+ ":<br>\n" +
            "Event name: " + e.name + "<br>\n" +
            "Location ID: "+ location.locId + "<br>\n" +
            "Location Name: "+ location.name + "<br>\n" +
            "Event Quota: " + e.quota + "<br>\n")}
            
            

            )}
        }
    )
})


// Handle form submission gotten from event_form.html - - - - - - - - - - - - - - - - - -
app.post('/event', function(req,res){
    // Event -> eventId(number),name(string),loc(obj type),quota(number)
    // Find whether there are any events, if no events-> eventid = 0 , or else eventid = max+1

    Event.find( {} , 'eventId -_id', function(err, events){
        if(err) return next(err);

        var eventid = 0
        if(events.length < 1) { // if length 0, contains nothing
            eventid = 0;
        }
        else {
            // if length >=1 , get the max and add by 1
            var array = [];
            for(let num of events){
                array.push(num.eventId);
            }
            eventid = Math.max.apply(null,array) + 1; // finding maximum event 
        }

        // We can get name immediately from the req.body

        // location and event quota is related to one another
        // find the loc from locId,
        Location.findOne( {locId : req.body['locId']}, function(err, result){
            if(err) console.log(err);

            // if not found, say no such location found
            if(!result)
                res.send("Your requested location does not exist");
            else {
                // if location is found, then check validity, ( whether result.quota <= event_quota)
                if(result.quota < req.body['quota'] ){
                    //if location quota < requested event quota, send response that event can't be created
                    res.send("Such event can't be created: Event quota exceed location quota!");
                }
                else {
                    // if not, then you can create event and save it(store it to database)
                    var e = new Event({
                        eventId: eventid,
                        name: req.body['name'],
                        loc: result._id,
                        quota: req.body['quota']
                    });

                    e.save(function(err){
                        if(err)
                            res.send(err);

                        // use e.loc to findbyId
                        Location.findById(e.loc, function(err,location)
                        {res.status(201).send("Succesfully Created an event:"+"<br>\n" +
                            "Event ID: " + e.eventId + "<br>\n" +
                            "Event Name: " + e.name + "<br>\n" +
                            "Location ID: " + location.locId + "<br>\n" +
                            "Location Name: " + location.name + "<br>\n" +
                            "Event Quota: " + e.quota +"<br>\n"
                        )}
                        )
                    });

                }

            }

        });


    });
    
});

// Handling Delete Request - - - - - - - - - - - - - - - - - - - -

app.delete('/event/:eventId', function(req,res){

    Event.findOneAndRemove({eventId: req.params['eventId']}, function(err, deleted){
        
        if(err)
            return res.status(500).send(err);
        
        
        if(!deleted)
            res.status(500).send("Unable to delete :event not found");
        // deleted contains the data

        else
        {Location.findById(deleted.loc, function(err, location ){
            
            
            
            res.send("Succesfully deleted Event:" + "<br>\n" +
            "Event name: " + deleted.name + "<br>\n" +
            "Location ID: "+ location.locId + "<br>\n" +
            "Location Name: "+ location.name + "<br>\n" +
            "Event Quota: " + deleted.quota + "<br>\n"
            
            ) // end of res.send

        });}

    });


}); //  Delete Request Done

// GET REQUEST, listing all events available - - - - - - - - - - - - - - - - - - - -

app.get('/event', function(req,res) {

    Event.find({})
    .populate('loc')
    .exec(function(err, events){
        if(events.length<1 ){
            // If there are no events listed
            res.send("We can't find any event stored in the database");
        }
        else
        {var buffer = "" // buffer of empty string
        for(let event of events){
            buffer = buffer + 
            "Event Name: " + event.name + "<br>\n" + 
            "Location ID: " + event.loc.locId + "<br>\n" +
            "Location Name: " + event.loc.name + "<br>\n" +
            "Event Quota :" + event.quota + "<br>\n"
            +"------------------------------------------"+ "<br>\n";
        }
        res.send(buffer);}
    });
    
}) // end of get req


// GET REQUEST for /localhost:3000/loc with or without query (? .. ) - - - - - - - - - - - - - - - - 
app.get('/loc', function(req,res) {

    if(Object.keys(req.query).length == 0)  // If you Query nothing then list out everything
        {    
        Location.find({})
        .exec(function(err,locations){
            if(locations.length<1)
                res.send("No location found in the database");
            else 
            {var buffer = ""; // Empty string
            for(let location of locations){
                buffer = buffer +
                "Location ID: " + location.locId + "<br>\n" +
                "Location Name: "+ location.name +"<br>\n" +
                "Location Quota: "+ location.quota + "<br>\n"+
                "---------------------------------------" + "<br>\n";
            }//end of for loop
            res.send(buffer);
        }//end of else
    });
        }       // end of if condition on 0 query

    else{ 
        //if you have query ?quota -> find locations that have >= minimum
        var minimum = req.query.quota;

        Location
        .find({
            quota: { $gte: minimum}
        })
        .exec(function(err, locations) {

            if(locations.length < 1) 
                res.send("No such location with quota of at least " + minimum + " found in database");
            else {
                var buffer = ""; // Empty string
            for(let location of locations){
                buffer = buffer +
                "Location ID: " + location.locId + "<br>\n" +
                "Location Name: "+ location.name +"<br>\n" +
                "Location Quota: "+ location.quota + "<br>\n"+
                "---------------------------------------" + "<br>\n";
            }
                res.send(buffer);
            } // end else
        })


    }
    


}); // end of event handler


// GET http://server address/loc/location ID - - - - - - - - - - - - - - - - - -
app.get('/loc/:locId', function(req,res){
    // use req.parmams.locId to locate such location in database Location
    Location
    .findOne({locId: req.params.locId})
    .exec(function(err , location) {
        if(!location)
            res.send('Location with such id does not exist');
        else {
            // Show details of the location 
            res.send("Location Found! Detail: <br>\n" +
                "Location ID: " + location.locId + "<br>\n" +
                "Location Name: " + location.name + "<br>\n" +
                "Location Quota: " + location.quota + "<br>\n"
            );
        } // end else
    });

}); // end of handler

// GET http://server address/event/event ID/loc/location ID Handler - - - - - - - - - - - -

// Show all events that has this event ID or held at this location ID
app.get('/event/:eventId/loc/:locId', function(req,res){
    // Get all events, it will return array of 
    Event
    .find({})
    .populate('loc')
    .exec( function(err, events){
        if(events.length<1) // if array is empty
            res.send("No events stored in database");
        else{
            // iterate through all events, store if eventId or locId mathces
            var buffer = "" // empty string
            
            for(let event of events){
               if(event.eventId == req.params['eventId'] || event.loc.locId ==req.params['locId']){
                    buffer = buffer +
                    "Event ID: "+ event.eventId + "<br>\n"+
                    "Event Name: "+ event.name + "<br>\n" + 
                    "Location ID: "+ event.loc.locId + "<br>\n"+
                    "Location Name: "+ event.loc.name + "<br>\n" +
                    "Event Quota: "+ event.quota + "<br>\n" +
                    "-----------------------------------------<br>\n";
               } //end of if
                // Handle if such event specified doesn't exist
                

            } // end of for loop
            if(buffer == ""){
                res.send("Event with either specified eventId: "+req.params['eventId'] +" and locId: "+req.params['locId'] +" does not exist");
                return;
            }
            res.send(buffer);
        }
        
    });// end fo exec

    

}); // end handler

// POST http://server address/loc - - - - - - - - - - - - - - - - - - - -
app.post('/loc', function(req,res) {
    // From all database in location, get the maximum ID of loc.
    var id = 0;
    Location.find({}, 'locId -_id' ,function(err, locations) {
        if(locations.length < 1)
            id = 0;
        else {
            // if document found, find max of all then add by 1
            var array = [];
            for(let num of locations){
                array.push(num.locId);
            }
            id = Math.max.apply(null,array) + 1; // finding maximum locId
        }   //end else
            // Now we create a new location document getting input from form
            var location = new Location({
                locId: id,
                name: req.body['name'],
                quota: req.body['quota']
            });

            location.save(function(err){
                if(err) res.send(err);
                res.send("Succesfully created a new location: <br>\n" +
                    "Location ID: " + location.locId + "<br>\n" +
                    "Location Name: "+ location.name + "<br>\n" +
                    "Location Quota: "+ location.quota + "<br>\n"
                );

            });
        
    })

}); // end of handler


var server = app.listen(3000);