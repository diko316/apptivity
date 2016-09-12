# apptivity

An activity player that runs actions, conditions, fork, merge and prompt inputs. It also has the ability to monitor state changes and data conversions across the workflow while running.

## Installation

This little library is packaged by npm. Source can be found in https://github.com/diko316/apptivity

```sh
npm install apptivity --save
```

## Usage

Require the package and register a workflow.

```javascript
var workflow = require('./index.js');

workflow.create("createUser").
			// create action
			action("fetchFromBackend").
            	describe("fetch something from the backend",
                		"or find something to populate the initial input data",
                        "Remember: [describe], [guard] and [handler] is optional").
				guard(function (input) {
                	return Promise.resolve(input);
                }).
                handler(function (input) {
                	return Ajax.requestAndReturnPromise(input);
                }).
			// your last action
			action("renderAndExit").
            	describe("Nothing special if no [handler]").
                handler(function (data) {
                	return { name: "whatever! your last data will be this" };
                });

```
Run registered workflow. (after the code above)

```javascript
workflow("createUser").
	// register event listener
	on("state-change",
        function (session, data) {
        	console.log("state: ", session.state === data);
            console.log("yes! do something about this immutable [data]");
        }).
	// run the workflow
    run({ name: "first input" });
```

Listen to other workflow sessions running.

```javascript
var stopListening = workflow.subscribe("createUser", "state-change",
								function (session, data) {
                                	console.log("what should I do with this?");
                                });
// I change my mind, I don't have to listen to "createUser" workflow's  "state-change" events
stopListening();
```
> **Note**: You can subscribe anytime even if workflow do not exist.


## API

### workflow(name:*String*):*sessionAPI*

Creates session endpoint object from a registered workflow. The session endpoint object exposes session the following functionalites:

1. **sessionAPI.on**(**eventName**:*String*, **handler**:*Function*):*sessionAPI*
	Listens to events specific to the current session.

2. **sessionAPI.un**(**eventName**:*String*, **handler**:*Function*):*sessionAPI*
	Remove listener to events specific to the current session.

3. **sessionAPI.purge**():*sessionAPI*
	Removes all listeners to the current session.

4. **sessionAPI.run**(**inputData**:*Mixed*, **context**:*Mixed*):*Promise*
	Runs the workflow with the given *inputData* parameter as request data and *context* which becomes `this` for all guards and handlers.

5. **sessionAPI.runOnce**(**inputData**:*Mixed*, **context**:*Mixed*):*Promise*
	Runs the workflow and destroys the session when done.

6. **sessionAPI.answer**(**value**:*Mixed*):*sessionAPI*
	Reply to prompts whenever the session encounters input actions.

7. **sessionAPI.get**():*Session*
	Returns the underlying *Session* instance that processes the workflow.

8. **sessionAPI.currentPrompt**():*String*
	Returns the currently active prompt (action name) that session must answer by calling `sessionAPI.answer(Mixed)`. This will also return `false` if no prompt is on the wait.

9. **sessionAPI.currentState**():*Immutable*
	Returns [Immutable](https://facebook.github.io/immutable-js) or scalar value of the last process output.
> For more info about Immutable values checkout Immutable js in [https://facebook.github.io/immutable-js](https://facebook.github.io/immutable-js)

10. **sessionAPI.destroy**():*Immutable*
	Destroys the session and applies the necessary cleanup.

### workflow.create(name:*String*):*Activity*

Creates and registers workflow and returns Activity Object in order chain-define actions. The following are the actions that Activity can configure:

1. **Activity.action**(**actionName**:*String*):*Activity*
	Creates action activity.

2. **Activity.describe**(**description**:*String*, [**nextLine**:*String*]):*Activity*
	Describes the last defined activity.

3. **Activity.guard**([**name**:*String*], **condition**:*Function*):*Activity*
	Guards the action from calling its handler if condition parameter returns a rejected Promise. This can also be useful if activity is defined as option for **condition** activity.
>	Guard *Condition* parameters will be in this form: **handler**(**input**:*Mixed*, **session**:*Session*)
>	This will allow you to compose guard condition like the one below:
```javascript
function guard(input, session) {
	var context = this;
    return Promise.reject("no entry!");
}
```

4. **Activity.handler**(**handler**:*Function*):*Activity*
	Defines the callback of the action. The returned data or resolved Promise becomes the input of the next action. If action is the last one then it will become the reponse data of the whole activity.
>	Handler parameters will be in this form: **handler**(**input**:*Mixed*, **session**:*Session*)))
>	This will allow you to compose handler like the one below:
>
```javascript
function handler(input, session) {
	var context = this;
    return processInput(input);
}
```
> must have an action defined first before chain-calling **describe()**, **guard()** and **handler()**.

5. **Activity.input**(**actionName**:*String*):*Activity*
	Creates an action that prompts and waits for further input by calling `sessionAPI.answer(Mixed)` before passing it as action input for the action handler.
> Warning: prompt is called after guard callback is executed.

6. **Activity.end**():*Activity*
	Creates an action that abruptly ends the whole workflow. The input for this action becomes the last output and state data of the workflow session.

7. **Activity.condition**(**activity**:*Activity*, [**other**:*Activity*]):*Activity*
	Runs only the first of its activity parameters that satisfies their guard condition. If none of the guarded activity is satisfied, it will run the unguarded activity as a fallback.

8. **Activity.fork**(**activity**:*Activity*, [**other**:*Activity*]):*Activity*
	Creates an action that forks and simultaneously run all defined activities and merges all output by using first forked activity action names as property. So, next action's input should be `{ activity1: output, activity2: output}` if forked activities are written this way:
```javascript
workflow.create("test-fork").
	fork(
		workflow.activity('a1').
        	action('activity1'),
        workflow.activity('a2').
        	action('activity2')
	);
```

### workflow.exist(workflowName:*String*):*Boolean*
Finds `workflowName` workflow from parameter and returns `true` if workflow exists. Returns `false` otherwise.

### workflow.subscribe([workflowName:*String*], eventName:*String*, handler:Function):*Function*

Subscribes to all session events and returns a stopper callback. `workflowName` parameter is optional and matches all workflow events when omitted.

The following are the events the session can broadcast with their callback parameters:

1. **process-start** (**session**:*sessionAPI*, **stateData**:*Immutable*)
	Event is broadcasted after running the first process for the first time. Usually the first action of the root workflow.

2. **process-end** (**session**:*sessionAPI*, **stateData**:*Immutable*)
	Event is broadcasted after running the last process. Usually the last action of the root workflow or if the workflow encounters an **end** action.

3. **state-change** (**session**:*sessionAPI*, **stateData**:*Immutable*)
	Event is broadcasted after action was completely processed.

4. **prompt** (**session**:*sessionAPI*, **actionName**:*String*, **input**:*Mixed*)
	Event is broadcasted after workflow encounters an **input** action and waiting for an answer.

5. **destroy** (**session**:*sessionAPI*)
	Event is broadcasted after workflow session is destroyed. After this event, other session process will be killed and apply cleanup to the current workflow session.

## License

[MIT](https://github.com/primus/eventemitter3/blob/master/LICENSE)
