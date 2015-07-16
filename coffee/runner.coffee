getProperty = (obj, path, assign) ->
    for attr in path[0...path.length-1] # leave out last item
        obj = obj[attr]

    lastAttr = path[-1..]
    if assign? then return obj[lastAttr] = assign
    else return obj[lastAttr]

getParams = (template) ->
    params = {}
    parse = (thing, key) ->
        # takes object and converts any fields with {{varname}} to argument of fn

        # if object
        if (thing?) and (thing instanceof Object)
            nameBucket = []
            for own k, v of thing
                if argnames = parse(v, k)
                    for argname in argnames
                        params[argname].unshift(k)
                        nameBucket.push(argname)
            return nameBucket
             
        # if string
        else if typeof thing is "string"
            re = /{{(.*?)}}/
            match = re.exec(thing)
            if match? 
                params[match[1]] = []
                return [match[1]]

    parse(template)
    return params

functize = (template, copy=true) ->
    # deep copy, using deepCopy from lodash would be faster
    params = getParams(template)

    (cnfg) ->
        if copy then crnt_template = JSON.parse(JSON.stringify(template))
        else crnt_template = template

        for arg, val of cnfg 
            path = params[arg]
            getProperty(crnt_template, path, val)
        return crnt_template 

class TrialTimeline
    constructor: (timeline = [], @runFunc) -> 
        @trialTimeline = []
        @chunkIds = {}
        @active = false
        @crnt_chunk = 0

        @add(entry.id, entry.trial) for entry in timeline

    add: (id="", trial) ->
        if id of @chunkIds then throw "id already in use"
        else @chunkIds[id] = @trialTimeline.length

        chunk = id: id, trial: trial
        @trialTimeline.push(chunk)

    nextChunk: () ->
        @crnt_chunk++
        if @crnt_chunk < @trialTimeline.length then @trialTimeline[@crnt_chunk]
        else return null

    goToChunk: (chunkId) ->
        @crnt_chunk = @chunkIds[chunkId]

    runChunk: (rawChunk) ->
        if @runFunc then @runFunc(rawChunk) else rawChunk()

    runCrntChunk: () ->
        @active = true
        console.log "running trial #{@crnt_chunk}"
        @runChunk(@trialTimeline[@crnt_chunk].trial)

    end: () ->
        return null

    reset: () ->
        @trialTimeline = []
        @chunkIds = {}
        @crnt_chunk = 0


class Thread
    constructor: (@disc, {@callback, @context, @event, @playEntry}) ->
        #if typeof disc == 'string'
        #    name = disc
        #    disc = @registered[name]
        #    console.log(disc)

        # parse metadata
        @name = ""
        @crnt_ii = 0
        @children = []
        @active = false

        if @disc[0].type is 'metadata' then @parseMetaData(@disc[0])

        # parse options

        @startTime = performance.now()

    parseMetaData: ({@name}) ->

    run: (crntTime) ->
        while (entry = @disc[@crnt_ii]) and 
              (entry.time is undefined or entry.time + @startTime < crntTime)
            console.log(entry)
            @playEntry(entry, @context, @event)
            @crnt_ii++
        remaining = @disc.length - @crnt_ii
        if not remaining 
            # Wait for all children to become inactive before firing callback
            console.log('spent')
            if @activeChildren().length is 0
                @callback?()
                @active = false
        return remaining

    addChild: (child) ->
        @children.push(child)

    activeChildren: () ->
        block for block in @children when block.active

    end: () ->
        @crnt_ii = @disc.length
    



window.runner = 
    _getProperty: getProperty,
    _getParams: getParams,
    functize: functize
    TrialTimeline: TrialTimeline
    Thread: Thread
