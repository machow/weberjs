Templates = 
    colsToRows: (obj) ->
        # converts object with columns of data to row-like entries
        # e.g. {a: [1,2], b:[3,4]} to [{a: 1, b: 3}, {a: 2, b: 4}]
        data = []
        for own key of obj
            for entry, ii in obj[key]
                # create new row if needed
                row = data[ii] or data[ii] = {}
                row[key] = entry

        return data
                

    getProperty: (obj, path, assign) ->
        for attr in path[0...path.length-1] # leave out last item
            obj = obj[attr]

        lastAttr = path[-1..]
        if assign? then return obj[lastAttr] = assign
        else return obj[lastAttr]

    getParams: (template) ->
        params = {}
        parse = (thing, key) ->
            # takes object and converts any fields with {{varname}} to argument of fn

            # if object then recurse
            if (thing?) and (thing instanceof Object)
                # array to hold all {{varnames}} in this node and below
                nameBucket = []    
                for own k, v of thing
                    # recurse, and get matching {{varnames}} in child nodes
                    if argnames = parse(v, k)   
                        # prepend current key to path for each {{varname}}
                        for argname in argnames
                            params[argname].unshift(k)
                            nameBucket.push(argname)    # accumulate for passing upward
                return nameBucket
                
            # if string, end recursion
            else if typeof thing is "string"
                re = /{{(.*?)}}/
                match = re.exec(thing)
                if match? 
                    params[match[1]] = []
                    return [match[1]]

            return null

        parse(template)
        return params

    functize: (template, copy=true) ->
        params = @getParams(template)

        (cnfg) =>
            # deep copy, using deepCopy from lodash would be faster
            if copy then crnt_template = JSON.parse(JSON.stringify(template))
            else crnt_template = template

            for arg, path of params
                val = cnfg[arg]
                @getProperty(crnt_template, path, val)
            return crnt_template 

    makeTrials: (template, cnfgTable, timeline = new TrialTimeline()) ->
        functized = @functize(template)
        cnfgTable = @colsToRows(cnfgTable) if not Array.isArray(cnfgTable)

        prefix = timeline.makeIdRoot('auto')
        console.log(prefix)
        
        for row, ii in cnfgTable
            trial = functized(row)
            timeline.add("#{prefix}-#{ii}", trial)

        return timeline


class TrialTimeline
    constructor: (timeline = [], @run) -> 
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

    makeIdRoot: (id) ->
        unique = (id) =>
            re = new RegExp(id)
            
            # keys method not ie8 compatible..
            (Object.keys(@chunkIds).length == 0) or (re.test(k) for own k of @chunkIds).some((ii) -> ii)

        if not unique(id)
            incr = 0
            new_id = incr++ while not unique(id)
            return new_id
        else 
            return id

    nextChunk: () ->
        @crnt_chunk++
        if @crnt_chunk < @trialTimeline.length then @trialTimeline[@crnt_chunk]

    goToChunk: (chunkId) ->
        @crnt_chunk = @chunkIds[chunkId]

    runNext: () ->
        @nextChunk()
        @runCrnt()

    runChunk: (chunkId) ->
        @goToChunk(chunkId)
        @runCrnt()

    runCrnt: () ->
        @active = true
        console.log "running trial #{@crnt_chunk}"
        chunk = @trialTimeline[@crnt_chunk]
        if chunk then @run(chunk.trial) else @end()

    runFirst: () ->
        @crnt_chunk = 0
        @runCrnt()

    run: (rawChunk) ->
        # default running function, likely should be overloaded
        rawChunk()

    end: () ->
        # default end function, should be overloaded
        return null

    reset: () ->
        @trialTimeline = []
        @chunkIds = {}
        @crnt_chunk = 0


class Thread
    constructor: (@disc, {@callback, @context, @playEntry}) ->
        #if typeof disc == 'string'
        #    name = disc
        #    disc = @registered[name]
        #    console.log(disc)

        # parse metadata
        @name = ""
        @crnt_ii = 0
        @children = []
        @active = false

        @disc = [@disc] if not Array.isArray(@disc)
        if @disc[0].type is 'metadata' then @parseMetaData(@disc[0])

        # parse options

        @startTime = performance.now()

    parseMetaData: ({@name}) ->

    run: (crntTime) ->
        while (entry = @disc[@crnt_ii]) and 
              (entry.time is undefined or entry.time + @startTime < crntTime)
            console.log(entry)
            @playEntry(entry, @context)
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
    Templates: Templates
    TrialTimeline: TrialTimeline
    Thread: Thread
