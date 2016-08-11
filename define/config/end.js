'use strict';

var END = require('../activity.js').end;

module.exports = [
    'end',
    
    null,
    
    function (config) {
        var queue = config.queue,
            len = queue.length,
            last = config.last;

        config.finalized = true;
        
        if (!last) {
            throw new Error(
                'workflow has ended prematurely [' + config.name + ']');
        }

        queue[len++] = '$';

    }
]; 