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
        @paper.view.on 'frame', () => @runThreads(performance.now())

        @group = new @paper.Group(name:'default')

        # Trial Runner
        @TR = new runner.TrialTimeline([])
        for chunk, ii in chunks 
            @TR.add(ii, chunk)

        @TR.runFunc = (chunk) =>
            done = => @TR.nextChunk() and @TR.runCrntChunk()
            if typeof chunk is "object"
                @addThread(chunk, callback: done)
            else if typeof chunk is "function"
                chunk(done)

    run: -> @TR.runCrntChunk()

   # attachPaperChunk: () =>
   #     # Drives TrialRunner for stream blocks
   #     f = () =>
   #         remaining = @runThread(performance.now())
   #         if not remaining
   #             @TR.runCrntChunk()
   #         else 
   #             # No more trials, end and remove handler
   #             @TR.end()
   #             @paper.view.off('frame', f)

   #    @paper.view.on('frame', f)

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
            handler = @blockContextWrapper(@events[event](options))
            obj.on(event, handler)
        else 
            # event is object with event names as keys
            for key, opts of event
                handler = @blockContextWrapper(@events[key](opts))
                obj.on(key, handler)

    log: (name, props) ->
        obj = if typeof name is 'string' then @group.children[name] else name
        
        @logger.log(obj, props)

    logMethod: (method, options) ->
        @logger[method](options)

    blockContextWrapper: (handler) ->
        return (event) =>
            if stream = handler(event) then @addThread(stream, context: event.target)

    removeAll: () ->
        @group.removeChildren()
        

    playEntry: (entry, context, event) =>
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...
        entry.name ?= context
        switch entry.type
            when "add"
                @add(entry.item, entry.options, entry.events, entry.log)
            when "update"
                # TODO this should just be a wrapper, and not contain logic
                @update(entry.name, entry.method, entry.options)
            when "updateOn"
                @updateOn(entry.name, entry.event, entry.options)
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
