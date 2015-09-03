# Events ----------------------------------------------------------------------

getProperty = (obj, prop) ->
    # gets nested properties separated by '.'
    # adapted from: http://stackoverflow.com/a/6491615
    for attr in  prop.split('.')
        obj = obj[attr]

    return obj

compile = (options, event) ->
    # traverses entire options object, replacing entries that begin with '@'
    # with corresponding event information
    parse = (thing, key, parent) ->
        # if object then recurse
        if (thing?) and (thing instanceof Object)
            parse(v, k, thing) for own k, v of thing
            
        # if string, end recursion
        else if typeof thing is "string" and thing[0] is '@'
            # uses @propname to get info from event
            prop = getProperty(event, thing[1..])
            # replace entry with that info
            parent[key] = prop

        return null

    # Deep copy then parse, TODO replace copy func with something more performant
    optionsCopy = JSON.parse(JSON.stringify(options))
    console.log("options copy is....!!!!!----!!!!!!")
    console.log optionsCopy

    parse(optionsCopy)
    return optionsCopy

onKeyDown = (obj, opts, stitch) ->
    handler =  (event) ->
        console.log('key down')
        # key presses are specified as keyname : thread in opts
        # other options may be specified in there, such as singleUse
        if opts[event.key]
            thread = opts[event.key]
            if opts.singleUse
                console.log("removing #{event.type}")
                obj.off(event.type, handler)
            new_thread = compile(thread, event)
            return stitch.addThread(new_thread, context: event)
        else if opts['log']
            stitch.logger.log(event, opts['log'])
        return null


onDefault = (obj, opts, stitch) ->
    (event) ->
        console.log(this)
        console.log 'calling default event'
        if Array.isArray(opts)
            new_thread = compile(opts, event)
            return stitch.addThread(new_thread, context: event)
        else return opts()


        
paperEvents = {
    compile: compile, # TODO, out of this object
    keydown: onKeyDown,
    click: onDefault,
    doubleclick: onDefault,
    mouseenter: onDefault,
    mouseleave: onDefault,
    mousedrag: onDefault
}

window.events = paperEvents

# requires logger.coffee, events
class paperPlugin
    constructor: (stitch) ->
        # setup new paperscope and places two objects on stitch..
        #   paper: paperscope for project
        #   paperEvents: custom event handlers defined above
        @paper = new paper.PaperScope()
        @paper.setup(stitch.canvasId)
        new @paper.Tool()
        @paper.view.on 'frame', () -> stitch.runThreads(performance.now())

        # TODO replace with layer   
        @group = new @paper.Group(name:'default')

        # TODO, shallow copy   
        @paperEvents = paperEvents

        @stitch = stitch
        for ii in ['add', 'update', 'updateOn', 'log', 'logMethod', 'removeAll']
            stitch.method[ii] = @[ii].bind(@)

    add: ({item, options, events, log, duration}) ->
        if typeof item is not 'string'
            throw "item must be the name of a paper object"

        Cls = @getProperty(@paper, item)
        p_obj = new Cls(options)
        #stitch.history.push {
        #    type: 'add'
        #    item: item
        #    options: options
        #    events: events
        #    time: Date.now()
        #}
        @group.addChild(p_obj)

        @updateOn(name: p_obj, event: events) if events
        @log(name: p_obj, props: log)         if log
        @removeAfter(p_obj, duration) if duration

        return p_obj

    update: ({name, method, options, events, log, duration}, thread) ->
        # look object up by name if necessary
        if not name
            obj = thread.context.target
        else if typeof name is 'string' then obj = @group.children[name]
        
        if not obj
            throw "paper object not found, wrong name: " + name + "?"

        tmp = obj[method](options)
        #stitch.history.push {
        #    type: 'update'
        #    method: method
        #    name: obj.name
        #    options: options
        #    time: Date.now()
        #}

        #@updateOn(name: obj, event: events) if events
        @log(name: obj, props: log) if log
        @removeAfter(obj, duration) if duration
        return tmp

    updateOn: ({name, event, options, duration}, ctxt) ->
        # copied from update TODO should consolidate?
        # look object up by name if necessary
        
        obj = if typeof name is 'string' then @group.children[name] else name

        if not name then obj = @paper.tool
        else if not obj
            throw "paper object not found, wrong name: " + name + "?"


        if typeof event is "string"
            handler = @paperEvents[event](obj, options, @stitch)
            obj.on(event, handler)
            
            if duration 
                setTimeout ( -> obj.off(event, handler)), duration

            console.log('attaching event handler')
            #obj.on(event, handler)
        else 
            # event is object with event names as keys
            for key, opts of event
                handler = @paperEvents[key](obj, opts, @stitch)
                obj.on(key, handler)
                if duration
                    setTimeout ( -> obj.off(key, handler)), duration

    log: ({name, props}, thread) ->
        if not name then obj = thread.context.target
        else if typeof name is 'string' then obj = @group.children[name]
        else obj = name
        
        @stitch.logger.log(obj, props)

    logMethod: ({method, options}) ->
        @stitch.logger[method](options)

    removeAll: () ->
        @group.removeChildren()

    removeAfter: (obj, time) ->
        setTimeout ( -> obj.remove()), time
        
    getProperty: (obj, prop) ->
        # gets nested properties separated by '.'
        # adapted from: http://stackoverflow.com/a/6491615
        for attr in  prop.split('.')
            obj = obj[attr]

        return obj

paperPluginConstructor = (stitch) ->
    stitch.plugin.paper = new paperPlugin(stitch)

window.paperPlugin = paperPluginConstructor
