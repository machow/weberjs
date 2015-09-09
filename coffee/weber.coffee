class Stitch
    constructor: (@canvasId, blockPlugins  = [],
                             threadPlugins = [window.paperPlugin]) ->
        @history = []
        @playing = []       # threads being played
        @plugin = {}
        @threadMethod = {}
        @blockMethod = {}

        # add default thread methods
        defaultMethods = ['addThread', 'clearThread', 'runThreads', 'register']
        binder = (fn, me) -> () -> fn.apply(me, arguments)
        for m in defaultMethods then @threadMethod[m] = @[m].bind(@)

        @loadPlugin(plugin, @threadMethod) for plugin in threadPlugins
        @loadPlugin(plugin, @blockMethod ) for plugin in blockPlugins

        # modules
        @logger = new Logger()

        @_attachRunners()

    run: -> @TR.start()

    makeTrials: (template, args) ->
        timeline = runner.Templates.makeTrials(template, args, @newTimeline())

    createBlock: (block) ->
        if not @blockMethod.hasOwnProperty(block.type)
            throw "stitch has no blockMethod of type: #{entry.type}"
        @blockMethod[block.type](block, stitch)
        
    playEntry: (entry, thread) =>
        # Consider switching to hash reference? I'm not sure how js compiles
        # switch statements...

        if not @threadMethod.hasOwnProperty(entry.type)
            throw "stitch has no method of type: #{entry.type}"
        else @threadMethod[entry.type](entry, thread, @)

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

    loadPlugin: (plugin, methods) ->
        switch (typeof plugin)
            when 'function' then plugin(@, methods)
            when 'object'
                for own k, f of plugin
                    methods[k] = f if not methods.hasOwnProperty(k)

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
        # todo block name
        for block in blocks
            if Array.isArray(block) then new Thread(block)
            else if typeof block is "object" then @createBlock(block)
            else block

    _timelineFromObject: (obj) ->
        timeline = []


window.Stitch = Stitch
