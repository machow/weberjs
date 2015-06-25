# events are functions that return event handlers


onKeyDown = (opts) ->
    return (event) ->
        for opt in opts
            if event.key == opt.key then return opt.do


onDefault = (opts) ->
    (event) ->
        console.log(this)
        console.log 'calling default event'
        if Array.isArray(opts) then return opts
        else return opts.do
        
events = {
    keydown: onKeyDown,
    click: onDefault,
    doubleclick: onDefault,
    mouseenter: onDefault,
    mouseleave: onDefault
}

window.events = events
