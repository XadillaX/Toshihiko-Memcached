/**
 * XadillaX created at 2015-03-05 16:51:12
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
var Memcached = module.exports = require("./lib/memcached");

module.exports.create = function(servers, options) {
    return new Memcached(servers, options);
};

