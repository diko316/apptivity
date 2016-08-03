'use strict';

module.exports = [
    'handler',
    
    null,
    
    function (config, handler) {
        var current = config.lastAction;
        
        if (!current) {
            throw new Error('no activity to handle');
        }
        
        if (current.handler) {
            throw new Error(
                    'activity [' + current.name + '] already has handler');
        }
        
        if (!(handler instanceof Function)) {
            throw new Error('invalid [handler] parameter');
        }
        
        current.handler = handler;
        
    }];