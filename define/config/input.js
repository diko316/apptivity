'use strict';

var ACTIVITY = require('../activity.js');

module.exports = [
    'input',
    
    null,
    
    function (config, name) {
        var queue = config.queue,
            len = queue.length,
            notempty = len;
        var action;
        
        if (!name || typeof name !== 'string') {
            throw new Error('Input should have a field name');
        }
        
        action = ACTIVITY.create('input', name);

        queue[len++] = action.id;
        
        if (notempty) {
            queue[len++] = '.';
        }
        config.last = action;

    }
]; 