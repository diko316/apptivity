'use strict';

var fsm = use('fsm/index.js');

it('should create a state map without errors',
    function () {
        var result = false,
            error = 'none';
        try {
            result = fsm.define(
                'createUser',
                    '# create a User',
                    '>formLaunched',
                        '# launch create form',
                        
                    '>submit',
                        '# at this stage, this state must wait',
                        function () {
                            console.log('submitting!');
                        },
                        
                        '[validated]',
                        function () {
                            console.log('data must be validated');
                        },
                        
                'formLaunched',
                    '>getWebForm',
                        '# get from from http server',
                        
                    '>render',
                        '# render webform'
                
            );

        }
        catch (e) {
            console.warn(e);
            error = e.toString();
        }
        
        assert(result !== false, error);
        
    });