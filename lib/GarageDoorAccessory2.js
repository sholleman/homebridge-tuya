const BaseAccessory = require('./BaseAccessory');

const GARAGE_DOOR_OPEN = 'open';
const GARAGE_DOOR_CLOSE = 'close';
const GARAGE_DOOR_FOPEN = 'fopen';
const GARAGE_DOOR_FCLOSE = 'fclose';

const GARAGE_DOOR_OPENED = 'opened';
const GARAGE_DOOR_CLOSED = 'closed';
const GARAGE_DOOR_OPENING = 'openning';
const GARAGE_DOOR_CLOSING = 'closing';

class GarageDoorAccessory2 extends BaseAccessory {
    static getCategory(Categories) {
        return Categories.GARAGE_DOOR_OPENER;
    }

    constructor(...props) {
        super(...props);
    }

    _registerPlatformAccessory() {
        const {Service} = this.hap;

        this.accessory.addService(Service.GarageDoorOpener, this.device.context.name);

        super._registerPlatformAccessory();
    }

    _registerCharacteristics(dps) {
        const {Service, Characteristic} = this.hap;
        const service = this.accessory.getService(Service.GarageDoorOpener);
        this._checkServiceName(service, this.device.context.name);

        this.dpAction = this._getCustomDP(this.device.context.dpAction) || '101';
        this.dpStatus = this._getCustomDP(this.device.context.dpStatus) || '102';

        this.currentOpen = Characteristic.CurrentDoorState.OPEN;
        this.currentOpening = Characteristic.CurrentDoorState.OPENING;
        this.currentClosing = Characteristic.CurrentDoorState.CLOSING;
        this.currentClosed = Characteristic.CurrentDoorState.CLOSED;
        this.targetOpen = Characteristic.TargetDoorState.OPEN;
        this.targetClosed = Characteristic.TargetDoorState.CLOSED;
        if (!!this.device.context.flipState) {
            this.currentOpen = Characteristic.CurrentDoorState.CLOSED;
            this.currentOpening = Characteristic.CurrentDoorState.CLOSING;
            this.currentClosing = Characteristic.CurrentDoorState.OPENING;
            this.currentClosed = Characteristic.CurrentDoorState.OPEN;
            this.targetOpen = Characteristic.TargetDoorState.CLOSED;
            this.targetClosed = Characteristic.TargetDoorState.OPEN;
        }

        const characteristicTargetDoorState = service.getCharacteristic(Characteristic.TargetDoorState)
            .updateValue(this._getTargetDoorState(dps[this.dpAction]))
            .on('get', this.getTargetDoorState.bind(this))
            .on('set', this.setTargetDoorState.bind(this));

        const characteristicCurrentDoorState = service.getCharacteristic(Characteristic.CurrentDoorState)
            .updateValue(this._getCurrentDoorState(dps[this.dpStatus]))
            .on('get', this.getCurrentDoorState.bind(this));

        this.device.on('change', changes => {
            console.log('[TuyaAccessory] GarageDoor changed: ' + JSON.stringify(changes));

            if (changes.hasOwnProperty(this.dpStatus)) {
                
                const newCurrentDoorState = this._getCurrentDoorState(changes[this.dpStatus]);
                console.log("[GarageDoorAccessory] new and old CurrentDoorState " + newCurrentDoorState + "  " + characteristicCurrentDoorState.value);
                console.log("[GarageDoorAccessory] old characteristicTargetDoorState " + characteristicTargetDoorState.value);

                if ( newCurrentDoorState == this.currentOpen && 
                     characteristicTargetDoorState.value !== this.targetOpen) 
                    characteristicTargetDoorState.updateValue(this.targetOpen);
                
                if ( newCurrentDoorState == this.currentClosed && 
                     characteristicTargetDoorState.value !== this.targetClosed) 
                    characteristicTargetDoorState.updateValue(this.targetClosed);
                
                
                if (characteristicCurrentDoorState.value !== newCurrentDoorState) characteristicCurrentDoorState.updateValue(newCurrentDoorState);


            }
        });
    }

    getTargetDoorState(callback) {
        this.getState(this.dpStatus, (err, dp) => {
            if (err) return callback(err);

            callback(null, this._getTargetDoorState(dp));
        });
    }

    _getTargetDoorState(dp) {
        console.log("[GarageDoorAccessory] dp " + dp);

        switch (dp) {
            case GARAGE_DOOR_OPENED : 
                return this.targetOpen;
                
            case GARAGE_DOOR_CLOSED :
                return this.targetClosed;
            }
    }

    setTargetDoorState(value, callback) {
        var newValue = GARAGE_DOOR_CLOSE;
        console.log("[GarageDoorAccessory] setTargetDoorState value " + value + " targetOpen " + this.targetOpen + " targetClosed " + this.targetClosed);

        switch (value) {
            case this.targetOpen: 
                newValue = GARAGE_DOOR_OPEN;
                break;
            case this.targetClosed :
                newValue = GARAGE_DOOR_CLOSE;
                break;
            }        
        
        this.setState(this.dpAction, newValue, callback);

    }

    getCurrentDoorState(callback) {
        this.getState(this.dpStatus, (err, dps) => {
            if (err) return callback(err);

            callback(null, this._getCurrentDoorState(dps));
        });
    }

    _getCurrentDoorState(dps) {
        // ToDo: Check other `dps` for opening and closing states
        console.log("[GarageDoorAccessory] dps " + dps);

        switch (dps) {
            case GARAGE_DOOR_OPENED : 
                return this.currentOpen;
                
            case GARAGE_DOOR_OPENING :
                return this.currentOpening;
            
            case GARAGE_DOOR_CLOSING :
               return this.currentClosing;
                
            case GARAGE_DOOR_CLOSED :
                return this.currentClosed;
            }

//        return dps[this.dpAction] ? this.currentOpen : this.currentClosed;
    }
}

module.exports = GarageDoorAccessory;
