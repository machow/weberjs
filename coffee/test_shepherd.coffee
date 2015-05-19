trialInstructs =
    clear: [
        type: "clearStreams"
        time: 0
    ,
        type: "removeAll"
        time: 0
    ],
    introDraw: [
        type: "add"
        item: "PointText"
        options:
            point: [250, 20]
            justification: 'center'
            content: 'Draw any shape, then release mouse to submit'
            strokeColor: 'black'
            name: 'instructionsText'
        time: 500
    ],
    introCopy: [
        type: "removeAll"
        time: 0
    ,
        type: "add"
        item: "PointText"
        options:
            point: [250, 250]
            justification: 'center'
            content: 'Starting Trial'
            strokeColor: 'black'
            name: 'instructionsText'
        time: 500
    ,
        type: "update"
        name: 'instructionsText'
        method: 'remove'
        time: 2000
    ]
    removeStim: [
        type: "groupToData"
        flatten: true
        dataName: "stimShape"
        time: 3200
    ,
        type:"update"
        name: 'demoItem'
        method: 'remove'
        time: 6000
    ]
    cueCopy: [
        type: "add"
        item: "Path.Rectangle"
        options:
            from: [0, 0]
            to: [600, 600]
            fillColor: 'lightgreen'
        time: 7000
        name: "copyCue"
    ,
        type: "removeAll"
        time: 7500
    ]


ir = new ImageRater()
task =  {
    crntStim: null
    demo: true
    expStims: []
    demoCopy: () ->
        @trialCopy () -> 
            tour.next()
            window.tool.activate()

    trialCopy: (callback) ->
        callback ?= () -> window.tool.activate()
        window.rec.playEntry(entry) for entry in trialInstructs.clear
        window.recUser.playEntry(entry) for entry in trialInstructs.clear
        {introCopy, cueCopy, removeStim} = trialInstructs
        @crntStim = if @demo then @stimGenerator() else @expStims.pop()

        if not @crntStim then @replay()
        stream = [].concat(introCopy, @crntStim, removeStim, cueCopy)
        window.rec.addStream(stream, callback:callback)
    score: () ->
        data = []
        {x:data[0], y:data[1]} = window.recUser.groupToData(true)
        {stimShape} = window.rec.data
        stimData = [stimShape.x, stimShape.y]
        console.log "stimData:"
        console.log(stimData)
        console.log(data)
        align = ir.procrustes(data, stimData, 50)
        window.align = align
        rec.add('Path.Rectangle', 
            from: [0,0]
            to: [600,600]
            fillColor: 'lightblue'
        )
        window.scored = rec.playEntry(
            type: 'add'
            item: 'Path'
            options: 
                segments: numeric.transpose(align.final)
                strokeColor: 'black'
        )
        rec.playEntry(@crntStim)
        
        window.recUser.removeAll()
        window.notool.activate()

        if not @demo 
            setTimeout ( -> task.trialCopy()), 2000

    stimGenerator: () ->
        type: "add"
        item: "Path.Star"
        options:
            center: [210 + Math.random() * 80, 210 + Math.random() * 80]
            radius1: Math.random() * 50 + 100
            radius2: Math.random() * 50 + 100
            points: Math.floor(Math.random() * 4 + 3)
            strokeColor: 'black'
            name: 'demoItem'
        time: 3000

    run: (Niters) ->
        @expStims.push @stimGenerator() for ii in [1..Niters] by 1
        @demo = false
        @trialCopy()

    replay: () ->
        tour2.start()
        recHist = window.rec.history
        recUHist = window.recUser.history
        opts = relStart: recHist[0].time
        window.rec.addStream(recHist)
        window.rec.addStream(recUHist, opts)
}

tour = new Shepherd.Tour
    defaults:
        classes: 'shepherd-element shepherd-open shepherd-theme-arrows task-width'
        scrollTo: false

tour.addStep 'welcome',
    text: 'Welcome to the example drawing task!'
    buttons: [
        text: 'Next'
        action: tour.next
    ]
.addStep 'instructs-1',
    text: "On each round of this task, you'll be presented with a line drawing.
           Your job is to recreate that line drawing as best as you can. 
           \n
           Click next to go through an example"
    buttons: [
        text: 'Next'
        action: tour.next
    ] 
.addStep 'instructs-2', 
    text: """
        First an image is displayed briefly for you to remember. 
        <br>
        <br>
        After the screen flashes green, you may draw the image.
        <br>
        <br>"""
    attachTo: '.container right'
    buttons: [
        text: 'Start'
        action: () -> task.demoCopy()
    ]
.addStep 'instructs-3',
    text: "Next, try drawing the image you just saw.  
           If you can't remember exactly, just make your best guess.
           <br><br>
           When you are finished, press Spacebar."
    attachTo: '.container right'
    buttons: [
        text: 'Repeat'
        action: () -> task.trialCopy()
    ,
        text: 'Next'
        action: tour.next
    ]
.addStep 'instructs-4',
    text: "Great! Now you will begin the actual task. Remember to do your best!"
    buttons: [
        text: 'Begin'
        action: () ->
            tour.hide()
            task.run(2)
    ]

tour2 = new Shepherd.Tour
    defaults:
        classes: 'shepherd-element shepherd-open shepherd-theme-arrows task-width'
        scrollTo: false

tour2.addStep 'replay-time',
    text: "That's it! Now enjoy a replay of the task.."
    attachTo: '.container right'
    buttons: false

tour.start()
window.task = task
window.ir = ir
