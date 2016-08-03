'use strict';


module.exports = [
    'finalize',
    
    null,
    
    function (config) {
        var current = config.current,
            fsm = config.fsm;
        
        if (config.finalized) {
            return;
        }
        
        if (!current) {
            throw new Error('there is no action to finalize');
        }
        
        fsm.end(current, config.name);
        config.finalized = true;
        
    }];
