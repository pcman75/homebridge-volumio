"use strict";

let Service, Characteristic;
let request = require("request").defaults({json: true});

module.exports.VolumioAccessory;

module.exports = function (homebridge) {
    console.log("Loading homebridge volumio. homebridge API version: " + homebridge.version);
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-volumio", "volumio", VolumioAccessory);
}

 class VolumioAccessory {
    constructor(log, config) {
        this.log = log;
        this.name = config.name;
        let serverName = (config.server || "http://volumio.local").toLowerCase();
        this.stateUrl = serverName + "/api/v1/getstate";
        this.playCommandUrl = serverName + "/api/v1/commands/?cmd=play";
        this.stopCommandUrl = serverName + "/api/v1/commands/?cmd=stop";
        this.volumeCommandUrl = serverName + "/api/v1/commands/?cmd=volume&volume=";

        this.log("stateUrl = " + this.stateUrl);
    }

    getServices() {
        this.log("Creating information!");
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "volumio.org")
            .setCharacteristic(Characteristic.Model, "volumio")
            .setCharacteristic(Characteristic.SerialNumber, "1-2-3");

        this.log("Creating Lightbulb");
        var lightBulbService = new Service.Lightbulb(this.name);

        this.log("... configuring On characteristic");
        lightBulbService
            .getCharacteristic(Characteristic.On)
            .on("get", this.getPlayState.bind(this))
            .on("set", this.setPlayState.bind(this));

        this.log("... adding volume characteristic");
        lightBulbService
            .addCharacteristic(new Characteristic.Brightness())
            .on("get", this.getVolume.bind(this))
            .on("set", this.setVolume.bind(this));

        return [informationService, lightBulbService];
    }

    getPlayState(callback) {
        request(this.stateUrl, (error, response, body) => {
            if (error) {
                this.log("getPlayState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getPlayState() request returned http error: %s", response.statusCode);
                callback(new Error("getMuteState() returned http error " + response.statusCode));
            }
            else {
                callback(null, body.status === 'play');
            }
        });
    }

    setPlayState(on, callback) {
        let url = on ? this.playCommandUrl : this.stopCommandUrl;

        request(url, (error, response, body) => {
            if (error) {
                this.log("setPlayState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setPlayState() request returned http error: %s", response.statusCode);
                callback(new Error("setPlayState() returned http error " + response.statusCode));
            }
            else {
                this.log("setPlayState() successfully: ", body.response);
                callback(null);
            }
        });
    }

    getVolume(callback) {
        request(this.stateUrl, (error, response, body) => {
            if (error) {
                this.log("getVolume() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getVolume() request returned http error: %s", response.statusCode);
                callback(new Error("getVolume() returned http error " + response.statusCode));
            }
            else {
                this.log("Volume is at  %s %", body.volume);

                callback(null, Number(body.volume));
            }
        });
    }

    setVolume(volume, callback) {
        let url = this.volumeCommandUrl + volume;

        request(url, (error, response, body) => {
            if (error) {
                this.log("setVolume() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setVolume() request returned error: %s", response.statusCode);
                callback(new Error("setVolume() returned error " + response.statusCode));
            }
            else {
                this.log("setVolume() successfully set volume to " + volume);
                callback(null);
            }
        });
    }
}
