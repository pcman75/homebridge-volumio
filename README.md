# Homebridge Plugin

With this plugin you can create HomeKit service for [Volumio](https://volumio.org/).

Speakers were introduced within the HomeKit protocol in iOS 10. However the Home App from Apple doesn't support
controlling speakers.

As a workaround, the accessory is declared as "Lightbulb" and you can control the volume by controling the "lightbulb Brightness"

## Installation
Follow the instructions to install homebridge [HomeBridge Repo](https://github.com/nfarina/homebridge)

To install the `homebridge-volumio` plugin, run `sudo npm install -g homebridge-volumio`

### Configuration
The plugin is configured as part of your Homebridge config.json file.
Example addition to existing config.json:
```
    "accessories": [
        {
            "accessory": "volumio",
            "name": "living speakers"
        }
    ]
```
If your volumio server name is different than the default 'volumio', specify it by "server" parameter.

Example:
```
    "accessories": [
        {
            "accessory": "volumio",
            "name": "living speakers",
            "server": "http://living.local"
        }
    ]
```

### Thanks
Plugin inspired from [ygageot/homebridge-volumio](https://github.com/ygageot/homebridge-volumio)
