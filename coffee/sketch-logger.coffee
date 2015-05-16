class Recorder
    constructor: (history, group) ->
        @history = if history? then history else []
        @group = if group then group else new Group(name:'default')
        @channels = {}
        @playing = []
        @data = {}

        @channels[@group.name] = @group

    getProperty: (obj, prop) ->
        # gets nested properties separated by '.'
        # adapted from: http://stackoverflow.com/a/6491615
        for attr in  prop.split('.')
            obj = obj[attr]

        return obj

    add: (item, options, extra...) ->
        if typeof item is 'string'
            Cls = @getProperty(paper, item)
            p_obj = new Cls(options, extra...)
            @history.push {
                type: 'add'
                item: item
                options: options
                extra: extra
                time: Date.now()
            }
            @group.addChild(p_obj)
            return p_obj
        else throw "item must be the name of a paper object"


    update: (name, method, options) ->
        # look object up by name if necessary
        if typeof name is 'string' then obj = @group.children[name] else name
        
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

    removeAll: () ->
        @group.removeChildren()
        

    playEntry: (entry) ->
        switch entry.type
            when "add"
                if entry.extra
                    @add(entry.item, entry.options, entry.extra...)
                else
                    @add(entry.item, entry.options)
            when "update"
                @update(entry.name, entry.method, entry.options)
            when "clearStreams"
                @clearStreams()
            when "removeAll"
                @removeAll()
            when "pathToData"
                @pathToData(entry.name, entry.data)

    addStream: (to, opts) ->
        if opts?.clear
            # remove items named in playback
            old_g = @group.remove()
            @group = new Group(name: opts?.name ? 'default')
        
        # to is either string or array of commands
        disc = if typeof to is 'string' then @history[..to] else to

        if not opts?.relStart
            # first item plays instantly
            offsetTime = performance.now() - disc[0]['time']
        else offsetTime = performance.now() - opts.relStart

        if opts?.callback then callback = opts.callback

        self = @
        crnt_ii = 0
        length = disc.length
        @playing.push f = (crntTime) ->
            while disc[crnt_ii] and disc[crnt_ii].time + offsetTime < crntTime
                self.playEntry(disc[crnt_ii])
                crnt_ii++
            remaining = length - crnt_ii
            if not remaining then callback?()
            return remaining
        return f
                
    clearStreams: (stream_ii) ->
        # TODO this is very incomplete, should change @playing to object
        if not stream_ii? then @playing = []
        return @playing.length

    runStream: (crntTime) ->
        for stream, ii in @playing by -1
            out = if stream then stream(crntTime)
            #console.log(out)
            #console.log(not out)
            if not out then @playing.splice(ii, 1)
        return ii

    groupToData: (flatten) ->
        # TODO matchName is passed to match
        allData = (@pathToData(obj) for obj in @group.children)

        if flatten then return [].concat.apply([], allData)[0]

        allData

    pathToData: (name, data) ->
        if typeof name is 'string' then path = @group.children[name] else path = name

        data = if typeof data is 'string' then @data[data] = {x: [], y: []} 
        else data ?= x: [], y: []
        path = path.clone()
        path.remove()
        path.flatten(2)
        for seg in path._segments
            data.x.push(seg._point.x)
            data.y.push(seg._point.y)

        data.name = path.name
        data.group = path.group

        return data

rec = new Recorder()

#rec.add('Path', {name: 'george', strokeColor: 'black'})
#rec.update('george', 'addSegments', [{x: 100, y: 100}, {x: 200, y: 200}])

# TMP GLOBALS
path_num = 0
current_user = 'user-' + path_num
obj = null
recUser = new Recorder()

tool = new Tool()
tool.activate()
tool.onMouseDown = (event) ->
    current_user = 'user-' + path_num
    obj ?= recUser.add 'Path', 
        segment: [event.point.x, event.point.y]
        name: current_user
        strokeColor: 'black'

    path_num++
    
tool.onMouseDrag = (event) ->
    obj = recUser.update(current_user, 'add', [event.point.x, event.point.y])

    return null
    

tool.onMouseUp = (event) ->
    obj = null

# SERIOUS SPEGHETTI FOR THIS FUNCTION
tool.onKeyDown = (event) ->
    if event.key == 'space' then task.score()


# DUMMY TOOL FOR BLOCKING INPUT
notool = new Tool()

view.onFrame = (event) ->
    rec.runStream(performance.now())


window.rec = rec
window.recUser = recUser
window.Recorder = Recorder
window.tool = tool
window.notool = notool

#star1 = new Path.Star([250, 250], 3, 100, 50)
#star1.strokeColor = 'blue'
#star1.opacity = .7
#star2 = star1.clone()
#star2.strokeColor='red'
#star2.rotation = 25
#star2.scale(2)
#star2.opacity = .7
#
#d1 = rec.pathToData(star1)
#d2 = rec.pathToData(star2)
#
#dst = [d1.x, d1.y]
#src = [d2.x, d2.y]

#window.star1 = star1
#window.star2 = star2
#window.src = src
#window.dst = dst
#window.dst2 = ([dst[0][ii], dst[1][ii]] for ii in [1..dst[0].length] by 1)
#window.alignedup = ir.procrustes(src, dst, 50)
