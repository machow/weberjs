view.size = [500, 500]
class Sketcher
    constructor: (options) ->
        {@id, @key} = options

        @history = []
        @current = group: null, item: null
        @buffer = []
        @state
        @start = Date.now()

        @style = {}

    draw: (seg) ->
        {points, time} = seg
        path = new Path((new Point(p[0], p[1]) for p in points))
        path.strokeColor = 'black'
        @history.push(path)
        return path

    regTimed: (seg, relTime) ->
        {points, time} = seg
        relTime ?= time[0]

        drawTime = (Date.now() + t - relTime for t in time)
        crnt_ii = 0
        console.log(drawTime)

        # make new path
        path = new Path()

        @buffer.push (crntTime) ->
            #console.log((a < crntTime for a in drawTime))
            while drawTime[crnt_ii] < crntTime
                p = points[crnt_ii]
                path.add(new Point p[0], p[1])
                crnt_ii += 1
                console.log new Point(p[0], p[1])
                console.log((a < crntTime for a in drawTime))
            return crnt_ii
            
    drawTimed: (time) ->
        f(time) for f in @buffer
        return null

    toggle: (state) ->
        if 'draw' in state
            state.draw

    newPath: (cnfg) ->
        # TODO change to take item directly?
        for own k, v of @style
            cnfg[k] = v unless k in cnfg

        @current.group.addChild(path = new Path(cnfg))

        return path
    
    endPath: (path) ->
        @history.push(pathToData(path))

        
    pathToData: (path) ->
        data = points: [], time: []
        for seg in path._segments
            data.points.push([seg.point.x, seg.point.y])
            data.time.push(seg.point._time)

        data.name = path.name
        data.group = path.group

        return data

    timeFromStart: (restart) ->
        unless restart?
            @start = Date.now()
            return 0

        Date.now() - @start


    ###
    # TOOLS
    ###
    @tools = {}
    @tools.draw = new Tool()

    # drawing tool
    @tools.draw.onMouseDown = (event) ->
        path = new Path(
            segments: [event.point]
            strokeColor: 'black'
        )
        path._segments[0]._time = @timeFromeStart()

    @tools.draw.onMouseDrag = (event) ->
        path.add(event.point)
        segmentCount = path.segments.length

        textItem.content = "#{segmentCount} points"

    @tools.draw.onMouseUp = (event) ->
        segmentCount = path.segments.length
        
        textItem.content = "#{segmentCount} points"





sketch = new Sketcher({id: 'abc', key: 123})

# TEMPORARY GLOBALS
path = null

textItem = new PointText(
    content: ''
    point: new Point(20, 30)
    fillColor: 'black'
)

toolDraw = new Tool()
toolDraw.activate()
# OKAY WE'RE FREE NOW

#view.onFrame = () ->
#    sketch.drawTimed(Date.now())


sketch.regTimed({
    points: [[100, 200], [200, 300], [300, 400]]
    time:   [1000, 2000, 5000]
    })
        


points = (new Point(p[0],p[1]) for p in [[100, 200], [300, 500]])
#points2 =  [new Point(130, 200), new Point(300, 400)]
path = new Path(points)
path.strokeColor = 'black'
#
#path2 = new Path([new Point(130, 200), new Point(300, 400)])
#path2.strokeColor = 'red'
#
#path3 = new Path()
#path3.strokeColor = 'black'
#path3.add(new Point(100, 200))
#path3.add(new Point(300, 400))
window.path = path
#window.points = points
#window.points2 = points2
window.tool = tool
    




