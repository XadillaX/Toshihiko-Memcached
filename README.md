# Toshihiko Memcached (Cache Layout)

[![travis.ci](https://img.shields.io/travis/XadillaX/Toshihiko-Memcached.svg)](https://travis-ci.org/XadillaX/Toshihiko-Memcached)
[![coveralls](https://img.shields.io/coveralls/XadillaX/Toshihiko-Memcached.svg)](https://coveralls.io/r/XadillaX/Toshihiko-Memcached)
[![License](https://img.shields.io/npm/l/toshihiko-memcached.svg?style=flat)](https://www.npmjs.org/package/toshihiko-memcached)
[![Dependency Status](https://david-dm.org/XadillaX/Toshihiko-Memcached.svg)](https://david-dm.org/XadillaX/Toshihiko-Memcached)
[![Toshihiko-Memcached](http://img.shields.io/npm/v/toshihiko-memcached.svg)](https://www.npmjs.org/package/toshihiko-memcached)
[![Toshihiko-Memcached](http://img.shields.io/npm/dm/toshihiko-memcached.svg)](https://www.npmjs.org/package/toshihiko-memcached)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://github.com/XadillaX/Toshihiko-Memcached)

The memcached support for Toshihiko as an addon.

## Installation

```sh
$ npm install toshihiko-memcached --save
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

### Customize Key Generate Function

A new feature for memcached is that you can custom your memcached key generate function now!

You may pass the function at the very beginning:

```javascript
new Memcached(servers, { custormizeKey: function(db, table, keys) { return ...; } });
```

Another way is you can pass throw the function below:

```javascript
memcached.setCustomizeKeyFunc(function(db, table, keys) { return ...; });
```

You should pay attention to `db`, `table` and `keys` which stand for database name, table name, primary keys with their value.

> `keys` maybe a single value (when `typeof keys !== "object"`); it maybe an object contains key-value pairs `key name -> value`.
>
> Eg.
>
> ```json
> { "userId": 12, "boardId": 12 }
> ```

So here's an example customize function:

```javascript
function(db, table, keys) {
    var base = this.prefix + db + "_" + table;
    if(typeof keys !== "object") return base + ":" + keys;

    for(var key in keys) {
        base += ":";
        base += key;
        base += keys[key];
    }

    return base;
}
```

## Contribution

You're welcome to make pull requests or issues!

「雖然我覺得不怎麼可能有人會關注我」
