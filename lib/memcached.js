/**
 * XadillaX created at 2015-03-05 16:26:20
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
"use strict";

require("algorithmjs");

var 囍 = require("lodash");
var _Memcached = require("memcached");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var Scarlet = require("scarlet-task");
var async = require("async");

var MEMCACHED_COMMAND_MAX_LENGTH = 250;

function push(target, arr) {
    for(var i = 0; i < arr.length; i++) {
        target.push(arr[i]);
    }
}

function __sortFunc(a, b) {
    return a < b;
}

/**
 * Toshihiko Memcached
 * @param {Object} servers refer to https://github.com/3rd-Eden/node-memcached#server-locations
 * @param {Object} options refer to https://github.com/3rd-Eden/node-memcached#options, and you may give a prefix
 * @constructor
 */
var Memcached = function(servers, options) {
    EventEmitter.call(this);

    this.servers = servers;
    this.options = options;
    this.prefix = (options && options.prefix) ? options.prefix : "";

    if(options) {
        delete options.prefix;
    }

    this.memcached = new _Memcached(this.servers, this.options);

    var self = this;
    this.memcached.on("failure", function(details) {
        self.emit("failure", details);
    });
    this.memcached.on("reconnecting", function(details) {
        self.emit("reconnecting", details);
    });

    if(options && options.customizeKey) {
        this._getKey = options.customizeKey.bind(this);
    }
};

util.inherits(Memcached, EventEmitter);

/**
 * set customize key function
 * @param {Function} func the function
 */
Memcached.prototype.setCustomizeKeyFunc = function(func) {
    this._getKey = func.bind(this);
};

/**
 * get key value
 * @param {String} dbName the database name
 * @param {String} tableName the table name
 * @param {String|Object} key the primary key
 * @param {String} the keyname in memcached
 */
Memcached.prototype._getKey = function(dbName, tableName, key) {
    if(typeof key !== "object") {
        return this.prefix + dbName + ":" + tableName + ":" + key;
    }

    // get primary keys
    var keys = 囍.keys(key);
    if(!keys.length) {
        return this.prefix + dbName + ":" + tableName;
    } else if(keys.length === 1) {
        return this.prefix + dbName + ":" + tableName + ":" + key[keys[0]];
    }

    var minlen = 1;
    for(var i = 0; i < keys.length; i++) {
        for(var j = i + 1; j < keys.length; j++) {
            var ml = Math.min(keys[i].length, keys[j].length);
            for(var k = 0; k < ml; k++) {
                if(keys[i][k] !== keys[j][k]) {
                    if(k > minlen) {
                        minlen = k;
                    }
                    break;
                }
            }

            if(k === ml && k > minlen) {
                minlen = k;
            }
        }
    }

    // sort keys
    keys.qsort(__sortFunc);

    // add keys to memcached key
    var base = this.prefix + dbName + ":" + tableName;
    for(var i = 0; i < keys.length; i++) {
        base += ":";
        base += keys[i].substr(0, minlen);
        base += key[keys[i]];
    }

    return base;
};

/**
 * _getKeys
 *
 * @param {String} dbName database name
 * @param {String} tableName table name
 * @param {Array} keys the primary keys
 * @return {Array} return the keynames in memcached
 */
Memcached.prototype._getKeys = function(dbName, tableName, keys) {
    var self = this;
    return keys.map(function(key) {
        return self._getKey(dbName, tableName, key);
    });
};

/**
 * delete one cached data
 * @param {String} dbName database name
 * @param {String} tableName table name
 * @param {String|Object} key primary key
 * @param {Function} callback the callback function
 */
Memcached.prototype.deleteData = function(dbName, tableName, key, callback) {
    key = this._getKey(dbName, tableName, key);
    this.memcached.del(key, callback);
};

/**
 * delete one or more cached data
 * @param {String} dbName database name
 * @param {String} tableName table name
 * @param {Array} keys primary keys array
 * @param {Function} callback the callback function
 */
Memcached.prototype.deleteKeys = function(dbName, tableName, keys, callback) {
    var self = this;
    async.eachLimit(keys, 10, function(key, callback) {
        self.deleteData(dbName, tableName, key, callback);
    }, function(err) {
        callback(err);
    });
};

/**
 * set cached data
 * @param {String} dbName database name
 * @param {String} tableName table name
 * @param {String|Object} key the primary key
 * @param {Object} data the data
 * @param {Function} callback the callback function
 */
Memcached.prototype.setData = function(dbName, tableName, key, data, callback) {
    key = this._getKey(dbName, tableName, key);
    this.memcached.set(key, data, 0, callback);
};

/**
 * get crowd of data
 * @param {Array} keys the memcached keys
 * @param {Function} callback the callback function
 */
Memcached.prototype._getCrowdOfData = function(keys, callback) {
    this.memcached.getMulti(keys, function(err, data) {
        if(err) {
            return callback(err);
        }

        var result = [];
        for(var i = 0; i < keys.length; i++) {
            if(data[keys[i]]) {
                result.push(data[keys[i]]);
            }
        }
        callback(undefined, result);
    });
};

/**
 * get data
 * @param {String} dbName database name
 * @param {String} tableName table name
 * @param {Array|String|Object} keys the primary key(s)
 * @param {Function} callback the callback function
 */
Memcached.prototype.getData = function(dbName, tableName, keys, callback) {
    var self = this;

    if(!util.isArray(keys)) {
        keys = [keys];
    }

    // generate memcached keys
    keys = this._getKeys(dbName, tableName, keys);

    // no data to find
    if(!keys.length) {
        return callback(undefined, []);
    }

    // only one data to find
    if(keys.length === 1) {
        this.memcached.get(keys[0], function(err, data) {
            if(err) {
                return callback(err);
            }

            if(undefined === data) {
                return callback(undefined, []);
            }

            callback(undefined, [ data ]);
        });
        return;
    }

    // otherwise...
    var crowd = [ [] ];
    var str = "get";
    for(var i = 0; i < keys.length; i++) {
        str += " ";
        str += keys[i];

        if(str.length > MEMCACHED_COMMAND_MAX_LENGTH) {
            crowd.push([]);
            str = "get";
            str += " ";
            str += keys[i];
        }

        crowd[crowd.length - 1].push(keys[i]);
    }

    var errs = [];
    var result = [];
    var scarlet = new Scarlet(1);

    var scarletProcessor = function(TO) {
        var keys = TO.task;
        self._getCrowdOfData(keys, function(err, data) {
            return err ? errs.push(err) : push(result, data), scarlet.taskDone(TO);
        });
    };

    // get crowd of data one by one
    for(var i = 0; i < crowd.length; i++) {
        scarlet.push(crowd[i], scarletProcessor);
    }

    // the `done` function
    scarlet.afterFinish(crowd.length, function() {
        return callback(errs.length ? errs[0] : undefined, result);
    });
};

module.exports = Memcached;

