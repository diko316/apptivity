'use strict';

module.exports = [
    'action',
    
    null,
    
    function (config, name) {
        var last = config.end;
        var action;
        
        if (!name || typeof name !== 'string') {
            throw new Error('invalid [name] parameter');
        }
        
        config.end = action = {
            type: 'action',
            name: name,
            next: null
        };
        
        if (last) {
            last.next = action;
        }
        else {
            config.start = action;
        }

    }
]; 