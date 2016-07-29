'use strict';

var SYMBOL = require('./symbol.js');

SYMBOL.register('action', {
    
    '@extend': 'guard',
    
    configure: function (config) {
        config.guard = null;
    },
    
    guard: function (name, callback) {
        var config = this.config;
        var guard;
        
        if (typeof name !== 'string') {
            callback = name;
            name = '[guard?]';
        }
        
        
        if (symbol.is('guard', callback)) {
            guard = callback;
        }
        else if (callback instanceof Function) {
            guard = symbol('guard');
            guard.callback(callback);
            
        }
        else {
            throw new Error('invalid [callback] parameter');
        }
        
        config.guard = guard;
        guard = null;
        return this;
    }
});
