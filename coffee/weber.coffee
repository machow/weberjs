class Stitch
    constructor: (@canvasId, pluginsToLoad = [window.paperPlugin]) ->
        @history = []
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

        @_attachRunners()

    run: -> @TR.runCrnt()

    #newTimeline: () ->
    #    TR = new @TrialTimeline([])


    #    TR.run = (chunk) =>
    #        done = => TR.runNext()
    #        if chunk instanceof @TrialTimeline
    #            console.log('running subtimeline')
    #            chunk.runCrnt()
    #            
    #        else if typeof chunk is "object"
    #            @addThread(chunk, callback: done)
    #        else if typeof chunk is "function"
    #            chunk(done, @)

    #    return TR

    makeTrials: (template, args) ->
        timeline = runner.Templates.makeTrials(template, args, @newTimeline())



    playEntry: (entry, thread) =>
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...

        # TODO: modifying thread entries is BAD

        if not @method.hasOwnProperty(entry.type)
            throw "stitch has no method of type: #{entry.type}"
        else @method[entry.type](entry, thread, @)

    addThread: (thread, opts = {}) ->
        if not (thread instanceof @Thread)
            thread = new @Thread(thread, opts)
        @playing.push(thread)

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
            when 'object'
                for own k, f of plugin
                    @method[k] = f if not @method.hasOwnProperty(k)

    _attachRunners: () ->
        # attach TrialTimeline
        class @TrialTimeline extends runner.TrialTimeline

        stitch = @
        @TrialTimeline.prototype.run = (chunk) ->
            if typeof chunk is "function"
                chunk(@, stitch)
            else chunk.start(@, stitch)

        # attach Thread
        class @Thread extends runner.Thread
            playEntry: stitch.playEntry
            start: (TR) ->
                @callback = () -> TR.runNext()
                stitch.addThread(@)
        #
        # Trial Runner
        @TR = new @TrialTimeline()
        #for chunk, ii in chunks 
        #    @TR.add(ii, chunk)

    _compileTimeline: (blocks) ->
        for block in blocks
            if Array.isArray(block) then Thread(block)
            else if typeof block is "object" then @playBlock

        



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
