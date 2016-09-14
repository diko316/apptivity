'use strict';

var TASK = require('../task.js');

module.exports = [
    'handler',
    
    null,
    
    function (config, handler) {
        var name = handler,
            current = config.last;
        
        if (!current) {
            throw new Error('no activity to handle');
        }
        
        if (current.handler) {
            throw new Error(
                    'activity [' + current.name + '] already has handler');
        }
        
        if (handler && typeof handler === 'string') {
            handler = function (data) {
                var fn = TASK(name);
                
                if (fn) {
                    return fn.apply(this, arguments);
                }
                console.warn("handler for [" + current.name +
                            "] activity named " + name +
                            " is not yet implemented.");
                return data;
            };
        }
        else if (!(handler instanceof Function)) {
            throw new Error('invalid [handler] parameter');
        }
        
        
        current.handler = handler;
        
    }];