'use strict';

//var END = require('../activity.js').end;
var ACTIVITY = require('../activity.js');
var END = ACTIVITY.create('end', 'stop');

ACTIVITY.stop = END;

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