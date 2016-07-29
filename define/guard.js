'use strict';

require('./symbol.js').register('guard', {
    
    configure: function (config) {
        config.callback = null;
    },
    
    initialize: function (callback) {
        if (callback) {
            this.callback(callback);
        }
    },
    
    callback: function (callback) {
        if (callback instanceof Function) {
            this.config.callback = callback;
        }
        return this;
    }
});
