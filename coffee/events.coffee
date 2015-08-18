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
        for own pressed, thread of opts
            if event.key == pressed
                if opts.singleUse
                    console.log("removing #{event.type}")
                    obj.off(event.type, handler)
                new_thread = compile(thread, event)
                return stitch.addThread(new_thread, context: event.target, event: event)
        return null


onDefault = (obj, opts, stitch) ->
    (event) ->
        console.log(this)
        console.log 'calling default event'
        if Array.isArray(opts)
            new_thread = compile(opts, event)
            return stitch.addThread(new_thread, context: event.target, event: event)
        else return opts()


        
events = {
    compile: compile, # TODO, out of this object
    keydown: onKeyDown,
    click: onDefault,
    doubleclick: onDefault,
    mouseenter: onDefault,
    mouseleave: onDefault,
    mousedrag: onDefault
}

window.events = events
