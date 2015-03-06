/**
 * XadillaX created at 2015-03-05 16:51:12
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
var Memcached = module.exports = require("./lib/memcached");

/**
 * create toshihiko memcacehd
 * @param {String|Array} servers the servers addresses
 * @param {Object} options the memcached options
 * @return {Memcached} the memcacehd wrapper
 */
module.exports.create = function(servers, options) {
    return new Memcached(servers, options);
};

