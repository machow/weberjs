// Generated by CoffeeScript 1.9.2
(function() {
  var ir, task, tour, trialInstructs;

  trialInstructs = {
    clear: [
      {
        type: "clearStreams",
        time: 0
      }, {
        type: "removeAll",
        time: 0
      }
    ],
    introDraw: [
      {
        type: "add",
        item: "PointText",
        options: {
          point: [250, 20],
          justification: 'center',
          content: 'Draw any shape, then release mouse to submit',
          strokeColor: 'black',
          name: 'instructionsText'
        },
        time: 500
      }
    ],
    introCopy: [
      {
        type: "removeAll",
        time: 0
      }, {
        type: "add",
        item: "PointText",
        options: {
          point: [250, 250],
          justification: 'center',
          content: 'Starting Trial',
          strokeColor: 'black',
          name: 'instructionsText'
        },
        time: 500
      }, {
        type: "update",
        name: 'instructionsText',
        method: 'remove',
        time: 2000
      }
    ],
    removeStim: [
      {
        type: "pathToData",
        name: "demoItem",
        data: "stimShape",
        time: 3200
      }, {
        type: "update",
        name: 'demoItem',
        method: 'remove',
        time: 6000
      }
    ],
    cueCopy: [
      {
        type: "add",
        item: "Path.Rectangle",
        options: {
          from: [0, 0],
          to: [600, 600],
          fillColor: 'lightgreen'
        },
        time: 8000,
        name: "copyCue"
      }, {
        type: "removeAll",
        time: 8500
      }
    ]
  };

  ir = new ImageRater();

  task = {
    crntStim: null,
    demo: true,
    expStims: [],
    demoCopy: function() {
      return this.trialCopy(function() {
        tour.next();
        return window.tool.activate();
      });
    },
    trialCopy: function(callback) {
      var cueCopy, entry, i, introCopy, len, ref, removeStim, stream;
      if (callback == null) {
        callback = function() {
          return window.tool.activate();
        };
      }
      ref = trialInstructs.clear;
      for (i = 0, len = ref.length; i < len; i++) {
        entry = ref[i];
        window.rec.playEntry(entry);
      }
      introCopy = trialInstructs.introCopy, cueCopy = trialInstructs.cueCopy, removeStim = trialInstructs.removeStim;
      this.crntStim = this.demo ? this.stimGenerator() : this.expStims.pop();
      stream = [].concat(introCopy, this.crntStim, removeStim, cueCopy);
      return window.rec.addStream(stream, {
        callback: callback
      });
    },
    score: function() {
      var align, data, ref, stimData, stimShape;
      data = [];
      ref = window.recUser.groupToData(true), data[0] = ref.x, data[1] = ref.y;
      stimShape = window.rec.data.stimShape;
      stimData = [stimShape.x, stimShape.y];
      console.log("stimData:");
      console.log(stimData);
      console.log(data);
      align = ir.procrustes(data, stimData, 50);
      window.align = align;
      rec.add('Path.Rectangle', {
        from: [0, 0],
        to: [600, 600],
        fillColor: 'lightblue'
      });
      window.scored = rec.playEntry({
        type: 'add',
        item: 'Path',
        options: {
          segments: numeric.transpose(align.final)
        }
      });
      rec.playEntry(this.crntStim);
      window.scored.strokeColor = 'black';
      window.recUser.removeAll();
      window.notool.activate();
      if (!this.demo) {
        return setTimeout((function() {
          return task.trialCopy();
        }), 2000);
      }
    },
    stimGenerator: function() {
      return {
        type: "add",
        item: "Path.Star",
        options: {
          center: [210 + Math.random() * 80, 210 + Math.random() * 80],
          radius1: Math.random() * 50 + 100,
          radius2: Math.random() * 50 + 100,
          points: Math.floor(Math.random() * 4 + 3),
          strokeColor: 'black',
          name: 'demoItem'
        },
        time: 3000
      };
    },
    run: function(Niters) {
      var i, ii, ref;
      for (ii = i = 1, ref = Niters; i <= ref; ii = i += 1) {
        this.expStims.push(this.stimGenerator());
      }
      this.demo = false;
      return this.trialCopy();
    }
  };

  tour = new Shepherd.Tour({
    defaults: {
      classes: 'shepherd-element shepherd-open shepherd-theme-arrows task-width',
      scrollTo: false
    }
  });

  tour.addStep('welcome', {
    text: 'Welcome to the example drawing task!',
    buttons: [
      {
        text: 'Next',
        action: tour.next
      }
    ]
  }).addStep('instructs-1', {
    text: "On each round of this task, you'll be presented with a line drawing. Your job is to recreate that line drawing as best as you can. \n Click next to go through an example",
    buttons: [
      {
        text: 'Next',
        action: tour.next
      }
    ]
  }).addStep('instructs-2', {
    text: "First an image is displayed briefly for you to remember. \n<br>\n<br>\n<br>\n<br>\nClick Repeat to watch again.",
    attachTo: '.container right',
    when: {
      show: function() {
        return task.demoCopy();
      }
    },
    buttons: [
      {
        text: 'Repeat',
        action: task.demoCopy
      }, {
        text: 'Next',
        action: tour.next
      }
    ]
  }).addStep('instructs-3', {
    text: "Next, try drawing the image you just saw. If you can't remember exactly, just make your best guess. \n When you are finished, press Spacebar.",
    attachTo: '.container right',
    buttons: [
      {
        text: 'Repeat',
        action: function() {
          return task.trialCopy();
        }
      }, {
        text: 'Next',
        action: tour.next
      }
    ]
  }).addStep('instructs-4', {
    text: "Great! Now you will begin the actual task. Remember to do your best!",
    buttons: [
      {
        text: 'Begin',
        action: function() {
          tour.hide();
          return task.run(5);
        }
      }
    ]
  });

  tour.start();

  window.task = task;

  window.ir = ir;

}).call(this);