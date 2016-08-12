'use strict';

var END = require('../activity.js').end;

module.exports = [
    'end',
    
    null,
    
    function (config) {
        var queue = config.queue,
            len = queue.length,
            last = config.last,
            end = END;

        config.finalized = true;
        
        queue[len++] = end.id;
        
        if (last) {
            queue[len++] = '.';
        }
        
        config.last = end;

    }
]; 