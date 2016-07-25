'use strict';

var define = use('fsm/define.js');

it('should create a state map without errors',
    function () {
        var result = false,
            error = 'none';
        
        //try {
            result = define([
                'createUser',
                    '# create a User',
                    '>formLaunched',
                        '# launch create form',
                        
                    '[validated]',
                        '# must validate before anything else',
                        function () {
                            console.log('data must be validated');
                        },
                        
                    '>submit',
                        '# at this stage, this state must wait',
                        function () {
                            console.log('submitting!');
                        },
                        
                'formLaunched',
                    '>getWebForm',
                        '# get from from http server',
                        
                    '>render',
                        '# render webform'
                
            ]);

        //}
        //catch (e) {
        //    console.warn(e);
        //    error = e.toString();
        //}
        
        assert(result !== false, error);
        
    });