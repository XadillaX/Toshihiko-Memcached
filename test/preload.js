/**
 * XadillaX created at 2016-01-06 19:10:16 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

var Memcached = require("../");

module.exports = Memcached.create('127.0.0.1:11211', {
    prefix: '__tmtest__',
    customizeKey: Memcached.prototype._getKey,
    
    retry: 100,
    retries: 1000,
    failures: 0,
    timeout: 100,
    reconnect: 100,
    remove: true
});
