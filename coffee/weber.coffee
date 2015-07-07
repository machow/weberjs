#paper.setup(document.getElementById('myCanvas'))

class Recorder
    constructor: (canvasId, history, group) ->
        @history = if history? then history else []
        @registered = {}
        @logger = new Logger()
        #@channels = {}
        @playing = []
        @events = window.events #TODO better modularization
        
        # setup new paperscope
        @paper = new paper.PaperScope()
        @paper.setup(canvasId)

        @group = if group then group else new @paper.Group(name:'default')

    getProperty: (obj, prop) ->
        # gets nested properties separated by '.'
        # adapted from: http://stackoverflow.com/a/6491615
        for attr in  prop.split('.')
            obj = obj[attr]

        return obj

    add: (item, options, events, log) ->
        if typeof item is 'string'
            Cls = @getProperty(@paper, item)
            p_obj = new Cls(options)
            @history.push {
                type: 'add'
                item: item
                options: options
                events: events
                time: Date.now()
            }
            @group.addChild(p_obj)

            @updateOn(p_obj, events) if events
            @log(p_obj, log)         if log

            return p_obj
        else throw "item must be the name of a paper object"


    update: (name, method, options) ->
        # look object up by name if necessary
        obj = if typeof name is 'string' then @group.children[name] else name
        
        if not obj
            throw "paper object not found, wrong name: " + name + "?"

        tmp = obj[method](options)
        @history.push {
            type: 'update'
            method: method
            name: obj.name
            options: options
            time: Date.now()
        }
        return tmp

    updateOn: (name, event, options) ->
        # copied from update TODO should consolidate?
        # look object up by name if necessary
        obj = if typeof name is 'string' then @group.children[name] else name
        
        if not obj
            throw "paper object not found, wrong name: " + name + "?"

        if typeof event is "string"
            handler = @streamWrapper(@events[event](options))
            obj.on(event, handler)
        else 
            # event is object with event names as keys
            for key, opts of event
                handler = @streamWrapper(@events[key](opts))
                obj.on(key, handler)

    log: (name, props) ->
        obj = if typeof name is 'string' then @group.children[name] else name
        
        @logger.log(obj, props)

    logMethod: (method, options) ->
        @logger[method](options)



    streamWrapper: (handler) ->
        return (event) =>
            if stream = handler(event) then @addStream(stream, context: event.target)

    removeAll: () ->
        @group.removeChildren()
        

    playEntry: (entry, context) ->
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...
        switch entry.type
            when "add"
                @add(entry.item, entry.options, entry.events, entry.log)
            when "update"
                # TODO this should just be a wrapper, and not contain logic
                entry.name ?= context
                @update(entry.name, entry.method, entry.options)
            when "updateOn"
                @updateOn(entry.name, entry.event, entry.options)
            when "clearStream"
                @clearStream(entry.name)
            when "removeAll"
                @removeAll()
            when "register"
                @register(entry.name, entry.options)
            when "addStream"
                @addStream(entry.name, entry.options)
            when "log"
                @log(entry.name, entry.props)
            when "logMethod"
                @logMethod(entry.method, entry.options)
            # ignore "metadata"


    addStream: (disc, opts) ->
        # Metadata
        # TODO: clean up this name business
        if typeof disc == 'string'
            name = disc
            disc = @registered[name]
            console.log(disc)

        if disc[0].type == 'metadata'
            meta = disc[0]
            console.log(meta)
            name = meta.name || ''
        else name = ''

        # relative timing
        if not opts?.relStart
            # first item plays instantly
            offsetTime = performance.now() - disc[0]['time']
        else offsetTime = performance.now() - opts.relStart

        if opts?.callback then callback = opts.callback

        context = opts?.context
        crnt_ii = 0
        length = disc.length
        f = (crntTime) =>
            while (entry = disc[crnt_ii]) and entry.time + offsetTime < crntTime
                console.log(entry)
                @playEntry(entry, context)
                crnt_ii++
            remaining = length - crnt_ii
            if not remaining then callback?()
            return remaining

        @playing.push [name, f]
        return f
                
    clearStream: (name) ->
        # TODO this is inefficient lookup, should use hash table?
        if not name? then @playing = []
        else 
            if not Array.isArray(name) then name = [name]
            for stream, ii in @playing
                if stream[0] in name then @playing.splice(ii, 1)

        return @playing.length

    runStream: (crntTime) ->
        for stream, ii in @playing by -1
            out = if stream then stream[1](crntTime)  # this is a hack to keep names
            if not out then @playing.splice(ii, 1)
        return ii

    register: (name, stream) ->
        if typeof name == 'object' then @registered = name
        else @registered[name] = stream
        
#    groupToData: (flatten) ->
#        # TODO matchName is passed to match
#        allData = (@pathToData(obj) for obj in @group.children)
#
#        if flatten then return [].concat.apply([], allData)[0]
#
#        allData
#
#    pathToData: (name, data) ->
#        if typeof name is 'string' then path = @group.children[name] else path = name
#
#        data = if typeof data is 'string' then @data[data] = {x: [], y: []} 
#        else data ?= x: [], y: []
#        path = path.clone()
#        path.remove()
#        path.flatten(2)
#        for seg in path._segments
#            data.x.push(seg._point.x)
#            data.y.push(seg._point.y)
#
#        data.name = path.name
#        data.group = path.group
#
#        return data

window.Recorder = Recorder
