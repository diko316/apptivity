'use strict';

var ACTIVITY = require('../activity.js');

module.exports = [
    'action',
    
    null,
    
    function (config, name) {
        var queue = config.queue,
            len = queue.length,
            action = ACTIVITY.create('action', name),
            notempty = len;

        queue[len++] = action.id;
        
        if (notempty) {
            queue[len++] = '.';
        }
        config.last = action;

    }
]; 