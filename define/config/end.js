'use strict';

var ACTIVITY = require('../activity.js'),
    END = ACTIVITY.end;

module.exports = [
    'end',
    
    null,
    
    function (config) {
        var last = config.end,
            action = END;
            
        config.end = action;
        config.finalized = true;
        
        if (last) {
            last.next = action;
        }
        else {
            throw new Error(
                'workflow has ended prematurely [' + config.name + ']');
        }

    }
]; 