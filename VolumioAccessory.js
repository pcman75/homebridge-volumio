
 class VolumioAccessory {
    constructor(log, config) {
        this.log = log;
        this.name = config.name || "Volumio";
        this.stateUrl = "http://" + this.name.toLowerCase() + ".local/api/v1/getstate";
        this.requests = [];

        this.volume = {};
        this.mute = {};

        let url0 = "http://" + this.name.toLowerCase() + ".local/api/v1/commands/?";
        this.volume.setUrl = url0 + "cmd=volume&volume=%s";
        this.mute.onUrl = url0 + "cmd=volume&volume=mute";
        this.mute.offUrl = url0 + "cmd=volume&volume=unmute";
    }

    clearRequests() {
        if (this.requests.length > 0) {
            this.log('cleaning %s requests', this.requests.length);
        }
        this.requests.forEach((req) => {
            req.abort();
        });
        this.requests = [];
    }

    identify(callback) {
        this.log("Identify requested!");
        callback();
    }

    getServices() {
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

        this.log("... adding volume characteristic");
        lightBulbService
            .addCharacteristic(new Characteristic.Brightness())
            .on("get", this.getVolume.bind(this))
            .on("set", this.setVolume.bind(this));
        return [informationService, lightBulbService];
    }

    getPlayState(callback) {
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
                let muted = (obj.status == 'play');
                this.log("Speaker status is currently %s", muted ? "play" : "not play");
                callback(null, muted);
            }
        }.bind(this));
    }

    setPlayState(muted, callback) {
        let url = muted ? this.mute.onUrl : this.mute.offUrl;

        this._httpRequest(url, "", "GET", function (error, response, body) {
            if (error) {
                this.log("setPlayState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("setMuteState() returned http error " + response.statusCode));
            }
            else {
                this.log("setPlayState() successfully set mute state to %s", muted ? "play" : "stop");

                callback(undefined, body);
            }
        }.bind(this));
    }

    getVolume(callback) {
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
    }

    setVolume(volume, callback) {
        this.clearRequests();
        let url = this.volume.setUrl.replace("%s", volume);

        this.requests.push(this._httpRequest(url, "", "GET", function (error, response, body) {
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
        }.bind(this)));
    }

    _httpRequest(url, body, method, callback) {
        return request(
            {
                url: url,
                body: body,
                method: method,
                rejectUnauthorized: false
            },
            function (error, response, body) {
                callback(error, response, body);
            }
        );

    }
};

module.exports.VolumioAccessory;