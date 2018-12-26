var io=require('socket.io-client');

var Service, Characteristic;

module.exports = function (homebridge) {
    console.log("Loading homebridge volumio. homebridge API version: " + homebridge.version);
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-volumio", "volumio", VolumioAccessory);
};

function VolumioAccessory(log, config) {
    this.log = log;
    this.name = config.name;
    this.volumioUrl = "http://" + (config.name || "volumio").toLowerCase();
    this.socket = io.connect(this.volumioUrl);
    console.log('connecting to ' + this.volumioUrl);
    this.play = false;

    
    //Report disconnection
    this.socket.on('disconnect', function () {
        console.log('Client Disconnected');
    });

    
}

VolumioAccessory.prototype = {

    volumioConnected: function() {
        this.log('Client Connected');
    },

    volumioStateChanged: function(data) {
        this.log('Volumio state changed:');
        this.log('status = ', data.status);
        this.play = data.status == 'play';
        this.log('play = ' + this.play);
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function () {
        //Report successful connection
        this.socket.on('connect', this.volumioConnected.bind(this));
        
        //Notify on player state changes, this includes volume changes, songs etc
        this.socket.on('pushState', this.volumioStateChanged.bind(this));

        this.log("Creating information!");
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Volumio.org")
            .setCharacteristic(Characteristic.Model, "Volumio")
            .setCharacteristic(Characteristic.SerialNumber, "0-0-0");

        this.log("Creating Lightbulb");
        var lightBulbService = new Service.Lightbulb("volumio living");

        this.log("... configuring On characteristic");
        lightBulbService
            .getCharacteristic(Characteristic.On)
            .on("get", this.getPlayState.bind(this))
            .on("set", this.setPlayState.bind(this));

        /*
        this.log("... adding volume characteristic");
        speakerService
            .addCharacteristic(new Characteristic.Volume())
            .on("get", this.getVolume.bind(this))
            .on("set", this.setVolume.bind(this));
        */
        return [informationService, lightBulbService];
    },

    getPlayState: function (callback) {
        this.log("getPlayState() called");
        callback(null, this.play);
    },

    setPlayState: function (play, callback) {
        this.log("setPlayState() called");
        this.log(play);
        this.play = play;

        if(play)
            this.socket.emit('play');
        else
            this.socket.emit('stop');

        callback();
    },

    /*
    getVolume: function (callback) {
        this._httpRequest(this.stateUrl, "", "GET", function (error, response, body) {
            if (error) {
                this.log("getVolume() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getVolume() request returned http error: %s", response.statusCode);
                callback(new Error("getVolume() returned http error " + response.statusCode));
            }
            else {
                let obj = JSON.parse(body);
                let volume = parseInt(obj.volume);
                this.log("Speaker's volume is at  %s %", volume);

                callback(null, volume);
            }
        }.bind(this));
    },

    setVolume: function (volume, callback) {
        let url = this.volume.setUrl.replace("%s", volume);

        this._httpRequest(url, "", "GET", function (error, response, body) {
            if (error) {
                this.log("setVolume() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setVolume() request returned http error: %s", response.statusCode);
                callback(new Error("setVolume() returned http error " + response.statusCode));
            }
            else {
                this.log("setVolume() successfully set volume to %s", volume);

                callback(undefined, body);
            }
        }.bind(this));
    },
    */
    _httpRequest: function (url, body, method, callback) {
        request(
            {
                url: url,
                body: body,
                method: method,
                rejectUnauthorized: false
            },
            function (error, response, body) {
                callback(error, response, body);
            }
        )
    }
};