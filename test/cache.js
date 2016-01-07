/**
 * XadillaX created at 2016-01-06 19:09:13 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

var should = require("should");
var Scarlet = require("scarlet-task");

var _package = require("../package");
var cache = require("./preload");

var run = require("sync-runner");

describe("Test for " + _package.name, function() {
    after(function() {
        run("memcached -d");
    });

    describe("# Get Key", function() {
        it("should get __tmtest__foo:bar:1", function(done) {
            cache._getKey("foo", "bar", 1).should.be.eql("__tmtest__foo:bar:1");
            done();
        });

        it("should get __tmtest__foo:bar:a2:b3", function(done) {
            cache._getKey("foo", "bar", {
                a: 2,
                b: 3
            }).should.be.eql("__tmtest__foo:bar:a2:b3");
            done();
        });

        it("should get __tmtest__foo:bar:aab2:aac3", function(done) {
            cache._getKey("foo", "bar", {
                aabd: 2,
                aac: 3
            }).should.be.eql("__tmtest__foo:bar:aab2:aac3");
            done();
        });

        it("should get __tmtest__foo:bar", function(done) {
            cache._getKey("foo", "bar", {}).should.be.eql("__tmtest__foo:bar");
            done();
        });

        it("should get __tmtest__foo:bar:1", function(done) {
            cache._getKey("foo", "bar", {
                _KFJkljsdlkajasdjas: 1
            }).should.be.eql("__tmtest__foo:bar:1");
            done();
        });

        it("should get __tmtest__foo:bar:aa3:aab2", function(done) {
            cache._getKey("foo", "bar", {
                aab: 2,
                aa: 3
            }).should.be.eql("__tmtest__foo:bar:aa3:aab2");
            done();
        });
    });

    describe("# Get Keys", function() {
        it("should get __tmtest__foo:bar:1, __tmtest__foo:bar:2", function(done) {
            cache._getKeys("foo", "bar", [ 1, 2 ]).should.be.eql([
                "__tmtest__foo:bar:1",
                "__tmtest__foo:bar:2"
            ]);
            done();
        });
    });

    describe("# Data", function() {
        it("should set data and get data", function(done) {
            cache.setData("foo", "bar", 1, "{\"foo\":\"bar\"}", function(err, res) {
                should.ifError(err);
                res.should.be.eql(true);

                cache.getData("foo", "bar", 1, function(err, res) {
                    should.ifError(err);
                    JSON.parse(res).should.be.eql({ foo: "bar" });
                    done();
                });
            });
        });

        it("should get crowd of data", function(done) {
            var scarlet = new Scarlet(10);

            function push(to) {
                cache.setData("foo", "bar", to.task, "{\"foo\":\"" + to.task + "\"}", function(err, res) {
                    should.ifError(err);
                    res.should.be.eql(true);
                    scarlet.taskDone(to);
                });
            }

            for(var i = 0; i < 10; i++) {
                scarlet.push(i, push);
            }

            scarlet.afterFinish(10, function() {
                cache.getData("foo", "bar", [
                    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ], function(err, res) {
                    should.ifError(err);
                    res.forEach(function(item, i) {
                        JSON.parse(item).should.be.eql({
                            foo: i.toString()
                        });
                    });
                    done();
                });
            }, false);
        });

        it("should process long keys", function(done) {
            var key1 = "";
            var key2 = "";
            for(var i = 0; i < 200; i++) {
                key1 += "1", key2 += "2";
            }

            cache.getData("foo", "bar", [
                key1,
                1,
                key2,
                2
            ], function(err, res) {
                should.ifError(err);
                res.length.should.be.eql(2);

                res.forEach(function(item, i) {
                    JSON.parse(item).should.be.eql({
                        foo: (i + 1).toString()
                    });
                });

                done();
            });
        });

        it("should get empty array", function(done) {
            cache.getData("foo", "bar", [], function(err, res) {
                should.ifError(err);
                res.should.be.eql([]);

                cache.getData("foo", "bar", [ 20 ], function(err, res) {
                    should.ifError(err);
                    res.should.be.eql([]);
                    done();
                });
            });
        });

        it("should get empty array", function(done) {
            cache.getData("foo", "bar", [], function(err, res) {
                should.ifError(err);
                res.should.be.eql([]);

                cache.getData("foo", "bar", [ 20 ], function(err, res) {
                    should.ifError(err);
                    res.should.be.eql([]);
                    done();
                });
            });
        });


        it("should delete one key", function(done) {
            cache.deleteData("foo", "bar", 1, function(err, res) {
                should.ifError(err);
                res.should.be.eql(true);

                cache.getData("foo", "bar", [
                    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ], function(err, res) {
                    should.ifError(err);
                    res.forEach(function(item, i) {
                        JSON.parse(item).should.be.eql({
                            foo: ((i >= 1) ? i + 1 : i).toString()
                        });
                    });
                    done();
                });
            });
        });


        it("should delete keys", function(done) {
            cache.deleteKeys("foo", "bar", [
                -1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10
            ], function(err) {
                should.ifError(err);

                cache.getData("foo", "bar", [
                    -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
                ], function(err, res) {
                    should.ifError(err);
                    res.should.be.eql([]);
                    done();
                });
            });
        });
    });

    describe("# Customize", function() {
        it("should customize key function", function(done) {
            cache.scope = ':';

            function __(dbName, tableName, key) {
                return this.scope + dbName + tableName + key;
            }

            cache.setCustomizeKeyFunc(__);
            cache._getKey.should.be.eql(__.bind(cache));

            cache._getKey("foo", "bar", 1).should.be.eql(":foobar1");

            done();
        });
    });

    describe("# Connection", function() {
        this.timeout(100000);

        it("should fail", function(done) {
            cache.once("failure", function() {
                done();
            });

            run("./node_modules/.bin/fuck you memcached");
            cache.getData("foo", "bar", [ 1 ], function() {});
            cache.memcached.emit("failure");
        });

        it("should reconnect", function(done) {
            cache.once("reconnecting", function() {
                done();
            });

            cache.memcached.emit("reconnecting");
        });
    });
});
