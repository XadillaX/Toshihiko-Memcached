# Toshihiko-Memcached

The memcached support for Toshihiko as an addon.

## Installation

```sh
$ npm install toshihiko-memcached
```

## How to Use

When you define a Toshihiko, you could pass the object into `cache` option:

```javascript
var T = require("toshihiko");
var toshihiko = new T.Toshihiko("database", "username", "", {
    cache: {
        name: "memcached",
        servers: [ "localhost:11211", ... ],
        options: { prefix: "_" }
    }
});
```

> `name` must be `memcached` and then Toshihiko will search for the package `toshihiko-memcached`.
>
> `servers` may be a string or an array stands for the server addresses.
>
> `options` is the options for memcached, you can refer to https://github.com/3rd-Eden/node-memcached#options.

Otherwise, you may create this object by yourself and pass the created object into cached:

```javascript
var Memcached = require("toshihiko-memcached");
var object = Memcached.create(SERVRES, OPTIONS);
var toshihiko = new T.Toshihiko(DATABASE, USERNAME, PASSWORD, {
    cache: object
});
```

or

```javascript
var Memcached = require("toshihiko-memcached");
var object = new Memcached(SERVRES, OPTIONS);
var toshihiko = new T.Toshihiko(DATABASE, USERNAME, PASSWORD, {
    cache: object
});
```

And then you may enjoy the cache layer of Toshihiko!

## Contribution

You're welcome to make pull requests or issues!

「雖然我覺得不怎麼可能有人會關注我」

