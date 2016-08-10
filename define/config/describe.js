'use strict';

module.exports = [
    'describe',
    
    null,
    
    function (config) {
        var list = Array.prototype.slice.call(arguments, 1),
            current = config.last;
        var c, l, dl, item, descriptions;
        
        if (!current) {
            throw new Error('no activity to describe');
        }
        
        descriptions = current.descriptions;
        
        if (!descriptions) {
            descriptions = current.descriptions = [];
        }
        dl = descriptions.length;
        
        for (c = -1, l = list.length; l--;) {
            item = list[++c];
            if (item && typeof item === 'string') {
                descriptions[dl++] = item;
            }
        }
    }
];