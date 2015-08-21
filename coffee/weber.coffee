class Stitch
    constructor: (@canvasId, chunks = {}, pluginsToLoad = [window.paperPlugin]) ->
        @history = []
        @registered = {}    # stored event streams
        @playing = []       # threads being played
        @plugin = {}
        @method = {}

        # add default methods
        defaultMethods = ['addThread', 'clearThread', 'runThreads', 'register']
        binder = (fn, me) -> () -> fn.apply(me, arguments)
        for m in defaultMethods then @method[m] = @[m].bind(@)

        @loadPlugin(plugin) for plugin in pluginsToLoad

        # modules
        @logger = new Logger()
        @runner = window.runner #TODO just get TrialRunner and Thread
        

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



    playEntry: (entry, context, event) =>
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...

        # TODO: modifying thread entries is BAD
        if context?.name and not entry.name
            entry.name = context.name

        if not @method.hasOwnProperty(entry.type)
            throw "stitch has no method of type: #{entry.type}"
        else @method[entry.type](entry)

    addThread: (disc, opts = {}) ->
        if typeof disc is "string"
            disc = @registered[disc]
        opts.playEntry = @playEntry
        block = new runner.Thread(disc, opts)
        @playing.push(block)

    clearThread: ({name}) ->
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

    register: ({name, stream}) ->
        if typeof name == 'object' then @registered = name
        else @registered[name] = stream

    loadPlugin: (plugin) ->
        switch (typeof plugin)
            when 'function' then plugin(@)
            # when 'object'

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
