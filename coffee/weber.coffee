class Stitch
    constructor: (canvasId, chunks = {}) ->
        @history = []
        @registered = {}
        @playing = []

        # modules
        @logger = new Logger()
        @events = window.events #TODO better modularization
        @runner = window.runner #TODO just get TrialRunner and Thread
        
        # setup new paperscope
        @paper = new paper.PaperScope()
        @paper.setup(canvasId)
        new @paper.Tool()
        @paper.view.on 'frame', () => @runThreads(performance.now())

        @group = new @paper.Group(name:'default')

        # Trial Runner
        @TR = @newTimeline()
        for chunk, ii in chunks 
            @TR.add(ii, chunk)


    run: -> @TR.runCrnt()

    newTimeline: () ->
        TR = new runner.TrialTimeline([])

        TR.run = (chunk) =>
            done = => TR.runNext()
            if chunk instanceof runner.TrialTimeline
                console.log('running subtimeline')
                chunk.runCrnt()
                
            else if typeof chunk is "object"
                @addThread(chunk, callback: done)
            else if typeof chunk is "function"
                chunk(done, @)

        return TR

    makeTrials: (template, args) ->
        timeline = runner.Templates.makeTrials(template, args, @newTimeline())


    getProperty: (obj, prop) ->
        # gets nested properties separated by '.'
        # adapted from: http://stackoverflow.com/a/6491615
        for attr in  prop.split('.')
            obj = obj[attr]

        return obj

    add: (item, options, events, log, duration) ->
        if typeof item is not 'string'
            throw "item must be the name of a paper object"

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
        @removeAfter(p_obj, duration) if duration

        return p_obj

    update: (name, method, options, log, duration) ->
        # look object up by name if necessary
        console.log(name)
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

        #@updateOn(obj, events) if events
        @log(obj, log) if log
        @removeAfter(obj, duration) if duration
        return tmp

    updateOn: (name, event, options, duration) ->
        # copied from update TODO should consolidate?
        # look object up by name if necessary
        obj = if typeof name is 'string' then @group.children[name] else name

        if not name then obj = @paper.tool
        else if not obj
            throw "paper object not found, wrong name: " + name + "?"


        if typeof event is "string"
            handler = @events[event](obj, options, @)
            obj.on(event, handler)
            
            if duration 
                setTimeout ( -> obj.off(event, handler)), duration

            console.log('attaching event handler')
            #obj.on(event, handler)
        else 
            # event is object with event names as keys
            for key, opts of event
                handler = @events[key](obj, opts, @)
                obj.on(key, handler)
                if duration
                    setTimeout ( -> obj.off(key, handler)), duration

    log: (name, props) ->
        obj = if typeof name is 'string' then @group.children[name] else name
        
        @logger.log(obj, props)

    logMethod: (method, options) ->
        @logger[method](options)

    threadContextWrapper: (handler) ->
        return (event) =>
            if stream = handler(event) then @addThread(stream, context: event.target)

    removeAll: () ->
        @group.removeChildren()

    removeAfter: (obj, time) ->
        setTimeout ( -> obj.remove()), time
        

    playEntry: (entry, context, event) =>
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...

        # TODO: modifying thread entries is BAD
        if context?.name and not entry.name
            entry.name = context.name

        switch entry.type
            when "add"
                @add(entry.item, entry.options, entry.events, entry.log, entry.duration)
            when "update"
                # TODO this should just be a wrapper, and not contain logic
                @update(entry.name, entry.method, entry.options, entry.log)
            when "updateOn"
                @updateOn(entry.name, entry.event, entry.options, entry.duration)
            when "clearThread"
                @clearThread(entry.name)
            when "removeAll"
                @removeAll()
            when "register"
                @register(entry.name, entry.options)
            when "addThread"
                @addThread(entry.name, entry.options)
            when "log"
                @log(entry.name, entry.props)
            when "logMethod"
                @logMethod(entry.method, entry.options)
            when "func"
                entry.func()
            # ignore "metadata"

    addThread: (disc, opts = {}) ->
        if typeof disc is "string"
            disc = @registered[disc]
        opts.playEntry = @playEntry
        block = new runner.Thread(disc, opts)
        @playing.push(block)

    clearThread: (name) ->
        # TODO this is inefficient lookup, should use hash table?
        if not name? then @playing = []
        else 
            if not Array.isArray(name) then name = [name]
            for block, ii in @playing
                if block.name in name 
                    block.end()
                    @playing.splice(ii, 1)

        return @playing.length

    runThreads: (crntTime) =>
        remaining = 0
        remove_ii = []
        for block, ii in @playing by -1
            left = block.run(crntTime)
            if left then remaining++ else @playing.splice(ii, 1)

        return remaining

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

window.Stitch = Stitch
