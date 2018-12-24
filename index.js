var request = require("request");
var Service, Characteristic;

module.exports = function (homebridge) {
    console.log("Loading homebridge volumio. homebridge API version: " + homebridge.version);
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-volumio", "volumio", VolumioAccessory);
};

function VolumioAccessory(log, config) {
    this.log = log;
    this.name = (config.name || "Volumio").toLowerCase();
    this.stateUrl = "http://" + this.name + ".local/api/v1/getstate";

    this.volume = {};
    this.mute = {};

    let url0 = "http://" + this.name + ".local/api/v1/commands/?";
    this.volume.setUrl = url0 + "cmd=volume&volume=%s";
    this.mute.onUrl = url0 + "cmd=volume&volume=mute";
    this.mute.offUrl = url0 + "cmd=volume&volume=unmute";
}

VolumioAccessory.prototype = {

    identify: function (callback) {
        this.log("Identify requested!");
        callback();
    },

    getServices: function () {
        this.log("Creating information!");
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Volumio.org")
            .setCharacteristic(Characteristic.Model, "Volumio")
            .setCharacteristic(Characteristic.SerialNumber, "0-0-0");

        this.log("Creating speaker!");
        var speakerService = new Service.Lightbulb(this.name);

        this.log("... configuring On characteristic");
        speakerService
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
        return [informationService, speakerService];
    },

    getPlayState: function (callback) {
        this._httpRequest(this.stateUrl, "", "GET", function (error, response, body) {
            if (error) {
                this.log("getMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("getMuteState() returned http error " + response.statusCode));
            }
            else {
                let obj = JSON.parse(body);
                let muted = (obj.mute == 'true');
                this.log("Speaker is currently %s", muted ? "MUTED" : "NOT MUTED");
                callback(null, muted);
            }
        }.bind(this));
    },

    setPlayState: function (muted, callback) {
        let url = muted ? this.mute.onUrl : this.mute.offUrl;

        this._httpRequest(url, "", "GET", function (error, response, body) {
            if (error) {
                this.log("setMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("setMuteState() returned http error " + response.statusCode));
            }
            else {
                this.log("setMuteState() successfully set mute state to %s", muted ? "ON" : "OFF");

                callback(undefined, body);
            }
        }.bind(this));
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