/**
 *  Netatmo weather station skill for amazon Alexa
 * 
 * Author: Peer David
 * Date: 23.12.2016
 * Modifier: Matthias Ressel
 * DAte: 13.01.2017
 */

/**
 * App ID for the skill
 */
var APP_ID = null; 

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');
var https = require('https');
var querystring = require('querystring');


/*
 * ERROR CODES
 */
var ERR_READ_DATA = "Beim auslesen der Daten ist ein Fehler aufgetreten.";


/**
 * To read more about inheritance in JavaScript, see the link below.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Netatmo = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Netatmo.prototype = Object.create(AlexaSkill.prototype);
Netatmo.prototype.constructor = Netatmo;


Netatmo.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Netatmo onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};


Netatmo.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Netatmo onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var responseText = "";
    this.askForLocation(session, response, responseText);
};


Netatmo.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Netatmo onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};


Netatmo.prototype.intentHandlers = {    
    "Module": function (intent, session, response) {
        var self = this;
        setLocationNameFromIntentSlots(session, intent.slots);
        var locationName = session.attributes.locationName;
        setImFromLocationName(session, locationName);

        self.getData(session, function(data){
            var responseText = "";
            if(!session.attributes.sensorName){
                self.askForSensor(data, session, response, responseText);
            } else {
                // If we have all informations we dont ask the user again
                self.tellSensorInformations(intent, session, response);
            }
        }, function(err){
            response.tell(ERR_READ_DATA);       
        });
    },


    "Temperature": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;

        this.tellSensorInformations(intent, session, response);
    },

    "Humidity": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;

        this.tellSensorInformations(intent, session, response);
    },

    "COZWEI": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;

        this.tellSensorInformations(intent, session, response);
    },

    "Noise": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;

        this.tellSensorInformations(intent, session, response);
    },

    "Pressure": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;

        this.tellSensorInformations(intent, session, response);
    },
    
    "Wind": function (intent, session, response) {
        var sensorName = convertIntentToSensorName(intent.name);
        session.attributes.sensorName = sensorName;
        session.attributes.locationName = "Wind";

        this.tellSensorInformations(intent, session, response);
        session.attributes.sensorName = "gustStrength";

        this.tellSensorInformations(intent, session, response);
        session.attributes.sensorName = sensorName;
    },    

    "AMAZON.HelpIntent": function (intent, session, response) {
        responseText = "Mit Wetterstation kannst du deine privaten Wetter daten abfragen. "
        this.askForLocation(session, response, responseText);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        response.tell("Ciao und einen schönen Tag.");
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        response.tell("Servus und bis zum nächsten mal.");
    }
};


Netatmo.prototype.tellSensorInformations = function(intent, session, response){
    var self = this;

    self.getData(session, function(data){

        // Get location name from session or intent
        if(!session.attributes.locationName){
            setLocationNameFromIntentSlots(session, intent.slots);
        }
        var locationName = session.attributes.locationName;
        setImFromLocationName(session, locationName);
        
        var im = session.attributes.im;
        if(!locationName){
            var responseText = "";
            self.askForLocation(session, response, responseText);
            return;
        }

        var module = self.readModule(locationName, data);
        if(!module){
            var responseText = im + locationName + " ist keine Wetterstation vorhanden. \n";
            self.askForLocation(session, response, responseText);
            return;
        }

        // Get sensor name from session
        var sensorName = session.attributes.sensorName;
        if(!sensorName){
            self.askForSensor(data, intent, session, response, responseText);
            return;
        }

        if(module[sensorName] == null){
            var germanSensorName = convertToGermanSensorName(sensorName);
            var responseText = "Die Wetterstation " + im + locationName + " hat keinen " + germanSensorName + " Sensor. \n";
            self.askForSensor(data, session, response, responseText);
            return;
        }

        // Everything succeeded, so return the value
        var responseText = getResponseTextForSensor(module, sensorName, im, locationName);
        var cardTitle = "Wetterstation - " + locationName;
        var cardContent = sensorName + ": " + module[sensorName];
        response.tellWithCard(responseText, cardTitle, cardContent);

    }, function(err){
        response.tell(ERR_READ_DATA);
    });
}

Netatmo.prototype.askForLocation = function(session, response, responseText){
    var self = this;
    self.getData(session, function(data){
        var locations = self.readLocationNames(data);
        var reprompText = session.attributes.sensorName 
                ? "Von welchem Ort sollte ich den " + convertToGermanSensorName(session.attributes.sensorName) +" Sensor auslesen? \n"
                : "Von welchem Ort möchtest du Daten wissen?";
        var speechOutput = responseText + "Du hast an den folgenden Orten Sensoren. \n " + locations.join(".\n ") + "\n \n" + reprompText;
        response.ask(speechOutput, reprompText);

    }, function(err){
        var speechOutput = "Mit Wetterstation kannst du deine privaten Wetter daten abfragen. Von welchem Ort möchtest du Daten wissen?";
        var reprompText = "Von welchem Ort möchtest du Daten wissen?";
        response.ask(speechOutput, reprompText);
    });
}


Netatmo.prototype.askForSensor = function(data, session, response, responseText){
    var locationName = session.attributes.locationName;
    var im = session.attributes.im;

    var module = this.readModule(locationName, data);
    if(!module){
        response.tell(im + locationName + " ist keine Wetterstation vorhanden.");
        return;
    }

    var germanSensors = [];
    for(var i = 0; i < module.supported_sensors.length; i++){
        var sensorName = module.supported_sensors[i];
        var germanName = convertToGermanSensorName(sensorName);
        germanSensors.push(germanName);
    }

    var speechOutput = responseText + "Die Wetterstation " + im + locationName  + " hat die folgenden Sensoren. \n "+ germanSensors.join(".\n ") +
                        ". Welchen Wert möchtest du " + im + locationName + " wissen?";
    var reprompText = "Welchen Wert möchtest du " + im + locationName + " wissen?";
    response.ask(speechOutput, reprompText);
}


Netatmo.prototype.readLocationNames = function(data){
    var devices = data.body.devices;
    var modules = data.body.modules;
    var locations = [];

    // Search in modules (outside of house)
    for (var i = 0; i < modules.length; i++){
        var module = modules[i];
        if (module.module_name != "Regen" && module.module_name != "Wind") {
            locations.push(module.module_name);
        }
    }

    // Search in devices (inside of house)
    for (var i = 0; i < devices.length; i++){
        var device = devices[i];
        locations.push(device.module_name);
    }

    return locations;
}


Netatmo.prototype.readModule = function(locationName, data){
    var devices = data.body.devices;
    var modules = data.body.modules;
    var locationName = locationName.toLowerCase();
    var locations = [];

    // Search in devices (inside of house)
    for (var i = 0; i < devices.length; i++){
        var device = devices[i];
        if(device.module_name.toLowerCase() === locationName){
            var ret = device.dashboard_data;
            ret.supported_sensors = device.data_type;
            return ret;
        }
    }

    // Search in modules (outside of house)
    for (var i = 0; i < modules.length; i++){
        var device = modules[i];
        if(device.module_name.toLowerCase() === locationName){
            var ret = device.dashboard_data;
            ret.supported_sensors = device.data_type;
            return ret;
        }
    }

    return null;
}


Netatmo.prototype.getData = function(session, onResponse, onError){

    // If it is already stored in our session, we have nothing to do
    if(session.attributes.data){
        console.log("Loading netatmo data from session.");
        onResponse(session.attributes.data);
        return;
    }

    console.log("Loading netatmo data from https://api.netatmo.net");
    this.getAccessToken(function(accessToken){
        var options = {
            host: 'api.netatmo.net',
            path: '/api/devicelist',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(accessToken)
            }
        };

        var storeIntoSession = function(data){
            session.attributes.data = data;
            onResponse(data);
        }

        sendRequest(accessToken, options, storeIntoSession, onError);
    }, onError);
}


Netatmo.prototype.getAccessToken = function(onResponse, onError){
    var content = querystring.stringify({
        'grant_type'    : 'password',
        'client_id'     : process.env.CLIENT_ID,
        'client_secret' : process.env.CLIENT_SECRET,
        'username'      : process.env.USER_ID,
        'password'      : process.env.PASSWORD,
        'scope'         : 'read_station'
    });

    var options = {
        host: 'api.netatmo.net',
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(content)
        }
    };

    var createAccessToken = function(parsedResponse){
        var accessToken = querystring.stringify({
            'access_token'  : parsedResponse.access_token
        });
        onResponse(accessToken);
    };

    sendRequest(content, options, createAccessToken, onError);
}

function setImFromLocationName(session, locationName) {
    session.attributes.im = "im ";
    if (locationName == "balkon" || locationName == "dach") {
        session.attributes.im = "auf dem ";
    }
}


function setLocationNameFromIntentSlots(session, intentSlots){
    if(!intentSlots || !intentSlots.Location || !intentSlots.Location.value){
        return;
    }

    session.attributes.locationName = intentSlots.Location.value;
}


function sendRequest(content, options, onResponse, onError){
    var responseStr = '';
    var req = https.request(options, function(res) {
        console.log("Status Code | ", res.statusCode);
        console.log("Headers | ", res.headers);

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log("Body Chunk | " + chunk);
            responseStr += chunk;
        });

        res.on('error', function (err) {
            console.log("A res. error occured | "+ err);
        });

        res.on('end', function() {
            var parsedResponse = JSON.parse(responseStr);
            console.log("Parsed body | " + JSON.stringify(parsedResponse));
            if (onResponse) {
                onResponse(parsedResponse);
            }
        });
    });

    req.on('error', function(err){
        console.log('A req. error occured | ' + err)
        onError(err);
    });
    req.write(content);
    req.end();
}


function convertIntentToSensorName(intentName){
    if(intentName === "COZWEI"){
        return "CO2";
    } else if (intentName === "Wind") {
        return "WindStrength";
    }

    return intentName;
}


function getResponseTextForSensor(module, sensorName, im, locationName){
    var val = convertToGermanNumber(module[sensorName]);
    if(sensorName === "Temperature")  {
        return im + locationName + " hat es " + val + " grad. \n";

    } else if (sensorName === "CO2"){
        return "Der CO2-Wert " + im + locationName + " beträgt " + val + " ppm. \n";

    } else if( sensorName === "Humidity"){
        return "Die Luftfeuchtigkeit " + im + locationName + " beträgt " + val + " prozent. \n";

    }  else if( sensorName === "Noise"){
        return "Die Lautstärke " + im + locationName + " beträgt " + val + " dezibel. \n";
    
    } else if( sensorName === "Pressure"){
        return "Der Luftdruck " + im + locationName + " beträgt " + val + " milli bar. \n";
    } else if( sensorName === "WindStrength"){
        var val2 = convertToGermanNumber(module["GustStrength"]);
        return "Auf dem Balkon herrscht Windstärke " + val + " mit Böen der Stärke " + val2 + ".\n";
        
    } 


    // Unknown sensor, use default
    return "Der " + sensorName + " wert liegt bei " + val + ". \n";
}

function kphToBeaufort(kph) {
    if (kph < 1) {
        return 0;
    } else if (kph < 6) {
        return 1;
    } else if (kph < 12) {
        return 2; 
    } else if (kph < 20) {
        return 3;
    } else if (kph < 29) {
        return 4;
    } else if (kph < 39) {
        return 5;
    } else if (kph < 50) {
        return 6;
    } else if (kph < 62) {
        return 7;
    } else if (kph < 75) {
        return 8;
    } else {
        return 9;
    }
}


function convertToGermanSensorName(sensorName){
    if(sensorName === "Temperature")  {
        return "Temperatur";

    } else if (sensorName === "CO2"){
        return "C.O. zwei";

    } else if( sensorName === "Humidity"){
        return "Luftfeuchtigkeit";

    }  else if( sensorName === "Noise"){
        return "Lautstärke";
    
    } else if( sensorName === "Pressure"){
        return "Luftdruck";
        
    } else if( sensorName === "WindStrength"){
        return "Wind";
    } else if( sensorName === "GustStrength"){
        return "Böe";
    }

    // Unknown sensor, use default
    return sensorName;
}


function convertToGermanNumber(num){
    return num.toString().replace(".", ",");
}


/**
 * Create the handler that responds to the Alexa Request.
 */
exports.handler = function (event, context) {
    var netatmo = new Netatmo();
    netatmo.execute(event, context);
};
