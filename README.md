# apptivity

An activity workflow player that sequentially runs action, condition, fork, merge and prompt input actions.

This library has the following features.

1. Convinient and rich [definition API](#usage_definition) to define and configure Workflow activities and actions. It helps developers to focus on overall activity logic before detailing them with their implementations.

2. Flexible definition API allows splitting of Worfklow activity definition with their implementation keeping files and directories of Workflow modules organized.

3. Workflow activities and actions are more predictable as they each publish an [immutable](https://www.npmjs.com/package/immutable) state objects containing unique state name, action name, request data, and response data.

4. Activity action supports asynchronous runs by supplying `callback` functions that returns Promise Object when defining Action implementations with [handler(callback:Function)](#ActivityAPI_handler) or [guard(callback:Function)](#ActivityAPI_guard).

5. Workflows' internal Finite State Machine can be exported into any custom JSON schema using [workflow.trasform(workflowName:String)](#transform)

## Installation

This little library is packaged by npm. Source can be found in [github repository](https://github.com/diko316/apptivity)

```sh
npm install apptivity --save
```

## Usage

<a name="usage_definition"></a>Create a Workflow activity and chain-configure actions with definition API.

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
Run the newly created Workflow activity and monitor state changes.

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

Listen to other running Workflow activity sessions' `state-change` event.

```javascript
var stopListening = workflow.subscribe("createUser", "state-change",
								function (session, data) {
                                	console.log("what should I do with this?");
                                });
// I change my mind, I don't have to listen to "createUser" workflow's  "state-change" events
stopListening();
```
> **Note**: You can subscribe a workflow event anytime even if workflow do not exist.


Export the workflow into Finite State Machine configuration to create an instance of [javascript-state-machine](https://www.npmjs.com/package/javascript-state-machine).

```javascript
var StateMachine = require("javascript-state-machine");

var createUserStateMachine = StateMachine.create(
								workflow.transform('createUser'));

```


## API

### workflow(name:*String*):*sessionAPI*

Creates session endpoint object from a registered workflow. The session object has the following convinience methods to handle most of the use-cases to manage a Workflow session:

1. **sessionAPI.on**(**eventName**:*String|RegExp*, **handler**:*Function*):*sessionAPI*
	Listen to events specific to the current session.

2. **sessionAPI.un**(**eventName**:*String|RegExp*, **handler**:*Function*):*sessionAPI*
	Removes event listener specific to the current session.

3. **sessionAPI.purge**():*sessionAPI*
	Removes all listeners of the current session.

4. **sessionAPI.run**(**inputData**:*Mixed*, **context**:*Mixed*):*Promise*
	Runs the Workflow session with `inputData` parameter as initial request data. `context` parameter becomes `this` for all action guards and handlers. Default `context` is `global` for NodeJS or `window` for browsers.

5. **sessionAPI.runOnce**(**inputData**:*Mixed*, **context**:*Mixed*):*Promise*
	Runs the Workflow session then destroys it when done.

6. **sessionAPI.answer**(**value**:*Mixed*):*sessionAPI*
	Reply to prompts whenever the session runs an input action.

7. **sessionAPI.get**():*Session*
	Returns the underlying *Session* instance that processes the Workflow.

8. **sessionAPI.currentPrompt**():*String*
	Returns the currently active prompt *(action name)* that session currently waiting is must for an answer. It can be answered by calling `sessionAPI.answer(Mixed) or session.asnwer(Mixed)`. Returns `false` if no prompt is waiting.

9. **sessionAPI.currentState**():*[Immutable](http://facebook.github.io/immutable-js)*
	Returns [Immutable](https://facebook.github.io/immutable-js) or scalar value of the last process output.


10. **sessionAPI.destroy**():*[Immutable](http://facebook.github.io/immutable-js)*
	Destroys the session and applies the necessary cleanup.

### <a name="ActivityAPI"></a> workflow.create(name:*String*):*Activity*

Creates and registers workflow and returns Activity Object in order chain-define actions. The following are the actions that Activity can configure:

1. **Activity.action**(**actionName**:*String*):*Activity*
	Creates action activity.

2. **Activity.describe**(**description**:*String*, [**nextLine**:*String*]):*Activity*
	Describes the last defined action.

3. **Activity.guard**([**name**:*String*], **condition**:*String|Function*):*Activity*
	Guards the action from calling its handler. Defined handler and the rest of the actions will not run when `condition` function returns a rejected Promise.
>	**Note:** `condition` parameter can also be a named [task](#namedTask) where it can be defined later.
>
>	Guard `condition` runs with `input` and `session` arguments like the example below
>
>	**handler**(**input**:*Mixed*, **session**:*Session*)
```javascript
function guard(input, session) {
	var context = this;
    return Promise.reject("no entry!");
}
```

4. <a name="ActivityAPI_handler"></a> **Activity.handler**(**handler**:*String|Function*):*Activity*
	Defines the callback of the action. The returned data or resolved Promise of the `handler` parameter becomes the response data of the current action and input data of the next action. If action is the last one then it will become the reponse data of the whole activity.
>	**Note:** `handler` parameter can also be a named [task](#namedTask) where it can be defined later.
>
>	Handler `handler` like guard `condition` runs with `input` and `session` arguments like the example below
>
>	**handler**(**input**:*Mixed*, **session**:*Session*)))
```javascript
function handler(input, session) {
	var context = this;
    return processInput(input);
}
```
> **Warning**: Action must be defined first before chain-calling **describe()**, **guard()** and **handler()**.

5. **Activity.input**(**actionName**:*String*):*Activity*
	Creates an action that waits for input before running the handler. Input actions are answered by calling `sessionAPI.answer(input:Mixed)` or `sesion.answer(input:Mixed)` replacing the action's request data with `input` argument.
> Warning: prompt is called after guard callback is executed.

6. **Activity.end**():*Activity*
	Creates an action that abruptly ends the whole Workflow. The input for this action becomes the last output and state data of the Workflow session.

7. **Activity.condition**(**activity**:*Activity*, [**other**:*Activity*, ...]):*Activity*
	Runs the first `activity` (and `other` parameters) that satisfies the guard condition of their first action.
>	Activities having guard of their first actions are evaluated first before falling back to running activity having unguarded first action. Other activities after that will be ignored. So, It is pointless to add two or more activities having their first action unguarded.
>	Treat activity having an unguarded first action as the only `else` block of the `if` and `else if` blocks.

8. **Activity.fork**(**activity**:*Activity*, [**other**:*Activity*, ...]):*Activity*
	Creates an action that forks and simultaneously run all defined `activity` (and `other` parameters) and merges all action output when each activities were done running. Merged output is an object with property names named after first action of each forked activities.
    Example output object is `{ activity1: output, activity2: output}` after running the forked activities defined below:
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
Finds named workflow defined in `workflowName` parameter. Returns `true` if workflow exist or `false` otherwise.

### workflow.subscribe([workflowName:*String*], eventName:*String|RegExp*, handler:Function):*Function*

Subscribes all session events filtered by `workflowName` and `eventName` parameters and returns an unsubscribe Function. `workflowName` parameter is optional and matches all workflow events when omitted.

The following are the events the session can broadcast with their callback parameters:

1. **process-start** (**session**:*sessionAPI*, **stateData**:*[Immutable](http://facebook.github.io/immutable-js)*)
	Event is broadcasted after running the first process for the first time. Usually the first action of the root workflow.

2. **process-end** (**session**:*sessionAPI*, **stateData**:*[Immutable](http://facebook.github.io/immutable-js)*)
	Event is broadcasted after running the last process. Usually the last action of the root workflow or if the workflow encounters an abrupt **end** action.

3. **state-change** (**session**:*sessionAPI*, **stateData**:*[Immutable](http://facebook.github.io/immutable-js)*)
	Event is broadcasted after action was completely processed.

4. **prompt** (**session**:*sessionAPI*, **actionName**:*String*, **input**:*Mixed*)
	Event is broadcasted after workflow encounters an **input** action and waiting for an answer.

5. **answer** (**session**:*sessionAPI*, **actionName**:*String*, **input**:*Mixed*)
	Event is broadcasted after workflow has answered a prompt from an **input** action by calling `session.answer(data)` or `sessionAPI.answer(data)`.

5. **destroy** (**session**:*sessionAPI*)
	Event is broadcasted after workflow session is destroyed. After this event, other session process will be killed and apply cleanup to the current workflow session.


### workflow.activity(activityName:*String*):*Activity*
Creates a standalone [Activity](#ActivityAPI) which will be further configured by chain-defining its actions and action attributes. This is useful when defining `condition` options and `fork` actions as their parameters like the example below:
```javascript
var workflow = require("apptivity");

workflow.create("myActivity").
	condition(
    	workflow.activity("removeData").
        	guard("data/checkpermission").
            handler("data/doRemove"),

		workflow.activity("showMessage").
        	handler("data/showPermissionError")
    );
```

### <a name="namedTask"></a>workflow.task(name:*String*, runner:*Function*):*workflowAPI*

Registers named tasks. Useful for assigning named task to action handlers and guards when splitting definition and implementation into separate files.

>	**Warning!** Named task can only be registered once. Registering task with the same name of an existing task will throw an exception from this method.


### <a name="createTransformer"></a>workflow.createTransformer(name:*String*, handler:*Function*):*workflowAPI*

Registers a named transformer to customize the exported Finite State Machine definition object. Named transformers are used as `transformer` parameter of the [workflow.transform(workflowName, transformer)](#transform) method.

`handler` Function is the middleware used to customize **state name**, **node name**, **node definition object**, and **resulting FSM definition object** while building the exported object in [workflow.transform(workflowName, transformer)](#transform) method.

`handler` Function's basic parameter is `handler(type:String, operation:Object, [others...])`. Other parameters excluding `operation` will vary according to `type` parameter.

1. <a name="createTransformer_initialize"></a>**handler**(**type**:`"initialize"`, **operation**:*Object*, **fsmName**:*String*, **configSettings**:*Object*):*Object*
Customizes the resulting FSM definition object by returning customization object. As for now, only `transitions:Object|Array` property in returned customization object is processed.

2. **handler**(**type**:`"state"`, **operation**:*Object*, **stateName**:*String*, **stateType**:*String*):*String*
Customizes state name by returning new `stateName` String.
`stateType` parameter determines the nature of the state. Possible values of `stateType` is **link**, **condition**, **fork**, and **end**.

3. **handler**(**type**:`"node"`, **operation**:*Object*, **customStateName**:*String*, **proposedNode**:*Object*):*String*
Customizes node name by returning new `nodeName` String. Default node name is `Activity.prototype.id`.
node definition properties can be customized by replacing or adding properties in `proposedNode` object parameter.

4. **handler**(**type**:`"transition"`, **operation**:*Object*, **sourceCustomStateName**:*String*, **customNodeName**:*Object*, **targetCustomStateName**):*Mixed*
Customizes transition definition.
Transition is a row in State Table of a Finite State Machine which contains the following columns: `sourceCustomStateName`, `customNodeName` and `targetCustomStateName`.
There are two possible type of value to return depeding on the `transitions` property customized in ["initialize"](#createTransformer_initialize) phase.

 * **Array transitions** should return `Object` value representing the transition. Default transition value is `{ from: "sourceState", name: "nodeName", to: "targetState" }`. Returning non-object value will use the latter default value as transitions item.
 * **Object transitions** can return any value representing the target state. Default target state is the `targetCustomStateName` parameter. Returning `null` or `undefined` will use the default `targetCustomStateName` parameter.

### <a name="trasform"></a>workflow.transform(workflowName:*String*, [transformer:*String|Function*]):*workflowAPI*

Exports internal Finite State Machine of `workflowName` workflow using the optional `transformer` parameter middleware. The optional `transformer` parameter can be any of the descriptions below:

 * Providing String `transformer` parameter of `transform()` method will use the registered transformer defined with [workflow.createTransformer(name:*String*, handler:*Function*):*workflowAPI*](#createTransformer) method.
 * Providing Function `transformer` parameter of `transform()` method will directly use `transformer` parameter as customization callback middleware.
 * Leaving out `transformer` parameter will use `"default"` transformer which results into an exported Object used to create an instance of [javascript-state-machine](https://www.npmjs.com/package/javascript-state-machine) with `action` property containing node definitions.


## License

[MIT](https://opensource.org/licenses/MIT)

