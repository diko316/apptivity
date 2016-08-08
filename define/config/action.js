'use strict';

var ACTIVITY = require('../activity.js');

module.exports = [
    'action',
    
    null,
    
    function (config, name) {
        var last = config.end,
            action = ACTIVITY.create(name);
            
        config.end = action;
        
        if (last) {
            last.next = action;
        }
        else {
            config.start = action;
        }

    }
]; 