(function() {
  var compile, events, getProperty, onDefault, onKeyDown,
    hasProp = {}.hasOwnProperty;

  getProperty = function(obj, prop) {
    var attr, i, len, ref;
    ref = prop.split('.');
    for (i = 0, len = ref.length; i < len; i++) {
      attr = ref[i];
      obj = obj[attr];
    }
    return obj;
  };

  compile = function(options, event) {
    var optionsCopy, parse;
    parse = function(thing, key, parent) {
      var k, prop, v;
      if ((thing != null) && (thing instanceof Object)) {
        for (k in thing) {
          if (!hasProp.call(thing, k)) continue;
          v = thing[k];
          parse(v, k, thing);
        }
      } else if (typeof thing === "string" && thing[0] === '@') {
        prop = getProperty(event, thing.slice(1));
        parent[key] = prop;
      }
      return null;
    };
    optionsCopy = JSON.parse(JSON.stringify(options));
    console.log("options copy is....!!!!!----!!!!!!");
    console.log(optionsCopy);
    parse(optionsCopy);
    return optionsCopy;
  };

  onKeyDown = function(obj, opts, stitch) {
    var handler;
    return handler = function(event) {
      var new_thread, pressed, thread;
      console.log('key down');
      for (pressed in opts) {
        if (!hasProp.call(opts, pressed)) continue;
        thread = opts[pressed];
        if (event.key === pressed) {
          if (opts.singleUse) {
            console.log("removing " + event.type);
            obj.off(event.type, handler);
          }
          new_thread = compile(thread, event);
          return stitch.addThread(new_thread, {
            context: event.target,
            event: event
          });
        }
      }
      return null;
    };
  };

  onDefault = function(obj, opts, stitch) {
    return function(event) {
      var new_thread;
      console.log(this);
      console.log('calling default event');
      if (Array.isArray(opts)) {
        new_thread = compile(opts, event);
        return stitch.addThread(new_thread, {
          context: event.target,
          event: event
        });
      } else {
        return opts();
      }
    };
  };

  events = {
    compile: compile,
    keydown: onKeyDown,
    click: onDefault,
    doubleclick: onDefault,
    mouseenter: onDefault,
    mouseleave: onDefault,
    mousedrag: onDefault
  };

  window.events = events;

}).call(this);

(function() {
  var Logger, getProperty,
    hasProp = {}.hasOwnProperty;

  getProperty = function(obj, prop) {
    var attr, i, len, ref;
    ref = prop.split('.');
    for (i = 0, len = ref.length; i < len; i++) {
      attr = ref[i];
      obj = obj[attr];
    }
    return obj;
  };

  Logger = (function() {
    function Logger(data, crnt_ii) {
      this.data = data != null ? data : [{}];
      this.crnt_ii = crnt_ii != null ? crnt_ii : 0;
      this.hash = {
        '#time': function() {
          return performance.now();
        }
      };
    }

    Logger.prototype.log = function(obj, properties) {
      return this.createEntry(obj, properties, this.data[this.crnt_ii]);
    };

    Logger.prototype.update = function(records) {
      var entry, k, v;
      entry = this.data[this.crnt_ii];
      for (k in records) {
        if (!hasProp.call(records, k)) continue;
        v = records[k];
        entry[k] = v;
      }
      return entry;
    };

    Logger.prototype.createEntry = function(obj, properties, entry) {
      var i, key, len, prop;
      if (entry == null) {
        entry = {};
      }
      if (!Array.isArray(properties)) {
        for (key in properties) {
          if (!hasProp.call(properties, key)) continue;
          prop = properties[key];
          entry[key] = this.parse(obj, prop);
        }
      } else {
        for (i = 0, len = properties.length; i < len; i++) {
          prop = properties[i];
          entry[prop] = this.parse(obj, prop);
        }
      }
      return entry;
    };

    Logger.prototype.parse = function(obj, prop) {
      if (prop.startsWith('#')) {
        return this.hash[prop]();
      } else {
        return getProperty(obj, prop);
      }
    };

    Logger.prototype.nextEntry = function() {
      this.data.push({});
      return this.crnt_ii++;
    };

    Logger.prototype.crntEntry = function() {
      return this.data[this.crnt_ii];
    };

    return Logger;

  })();

  window.Logger = Logger;

}).call(this);

(function() {
  var Templates, Thread, TrialTimeline,
    hasProp = {}.hasOwnProperty;

  Templates = {
    colsToRows: function(obj) {
      var data, entry, i, ii, key, len, ref, row;
      data = [];
      for (key in obj) {
        if (!hasProp.call(obj, key)) continue;
        ref = obj[key];
        for (ii = i = 0, len = ref.length; i < len; ii = ++i) {
          entry = ref[ii];
          row = data[ii] || (data[ii] = {});
          row[key] = entry;
        }
      }
      return data;
    },
    getProperty: function(obj, path, assign) {
      var attr, i, lastAttr, len, ref;
      ref = path.slice(0, path.length - 1);
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        obj = obj[attr];
      }
      lastAttr = path.slice(-1);
      if (assign != null) {
        return obj[lastAttr] = assign;
      } else {
        return obj[lastAttr];
      }
    },
    getParams: function(template) {
      var params, parse;
      params = {};
      parse = function(thing, key) {
        var argname, argnames, i, k, len, match, nameBucket, re, v;
        if ((thing != null) && (thing instanceof Object)) {
          nameBucket = [];
          for (k in thing) {
            if (!hasProp.call(thing, k)) continue;
            v = thing[k];
            if (argnames = parse(v, k)) {
              for (i = 0, len = argnames.length; i < len; i++) {
                argname = argnames[i];
                params[argname].unshift(k);
                nameBucket.push(argname);
              }
            }
          }
          return nameBucket;
        } else if (typeof thing === "string") {
          re = /{{(.*?)}}/;
          match = re.exec(thing);
          if (match != null) {
            params[match[1]] = [];
            return [match[1]];
          }
        }
        return null;
      };
      parse(template);
      return params;
    },
    functize: function(template, copy) {
      var params;
      if (copy == null) {
        copy = true;
      }
      params = this.getParams(template);
      return (function(_this) {
        return function(cnfg) {
          var arg, crnt_template, path, val;
          if (copy) {
            crnt_template = JSON.parse(JSON.stringify(template));
          } else {
            crnt_template = template;
          }
          for (arg in params) {
            path = params[arg];
            val = cnfg[arg];
            _this.getProperty(crnt_template, path, val);
          }
          return crnt_template;
        };
      })(this);
    },
    makeTrials: function(template, cnfgTable, timeline) {
      var functized, i, ii, len, prefix, row, trial;
      if (timeline == null) {
        timeline = new TrialTimeline();
      }
      functized = this.functize(template);
      if (!Array.isArray(cnfgTable)) {
        cnfgTable = this.colsToRows(cnfgTable);
      }
      prefix = timeline.makeIdRoot('auto');
      console.log(prefix);
      for (ii = i = 0, len = cnfgTable.length; i < len; ii = ++i) {
        row = cnfgTable[ii];
        trial = functized(row);
        timeline.add(prefix + "-" + ii, trial);
      }
      return timeline;
    }
  };

  TrialTimeline = (function() {
    function TrialTimeline(timeline, run) {
      var entry, i, len;
      if (timeline == null) {
        timeline = [];
      }
      this.run = run;
      this.trialTimeline = [];
      this.chunkIds = {};
      this.active = false;
      this.crnt_chunk = 0;
      for (i = 0, len = timeline.length; i < len; i++) {
        entry = timeline[i];
        this.add(entry.id, entry.trial);
      }
    }

    TrialTimeline.prototype.add = function(id, trial) {
      var chunk;
      if (id == null) {
        id = "";
      }
      if (id in this.chunkIds) {
        throw "id already in use";
      } else {
        this.chunkIds[id] = this.trialTimeline.length;
      }
      chunk = {
        id: id,
        trial: trial
      };
      return this.trialTimeline.push(chunk);
    };

    TrialTimeline.prototype.makeIdRoot = function(id) {
      var incr, new_id, unique;
      unique = (function(_this) {
        return function(id) {
          var k, re;
          re = new RegExp(id);
          return (Object.keys(_this.chunkIds).length === 0) || ((function() {
            var ref, results;
            ref = this.chunkIds;
            results = [];
            for (k in ref) {
              if (!hasProp.call(ref, k)) continue;
              results.push(re.test(k));
            }
            return results;
          }).call(_this)).some(function(ii) {
            return ii;
          });
        };
      })(this);
      if (!unique(id)) {
        incr = 0;
        while (!unique(id)) {
          new_id = incr++;
        }
        return new_id;
      } else {
        return id;
      }
    };

    TrialTimeline.prototype.nextChunk = function() {
      this.crnt_chunk++;
      if (this.crnt_chunk < this.trialTimeline.length) {
        return this.trialTimeline[this.crnt_chunk];
      }
    };

    TrialTimeline.prototype.goToChunk = function(chunkId) {
      return this.crnt_chunk = this.chunkIds[chunkId];
    };

    TrialTimeline.prototype.runNext = function() {
      this.nextChunk();
      return this.runCrnt();
    };

    TrialTimeline.prototype.runChunk = function(chunkId) {
      this.goToChunk(chunkId);
      return this.runCrnt();
    };

    TrialTimeline.prototype.runCrnt = function() {
      var chunk;
      this.active = true;
      console.log("running trial " + this.crnt_chunk);
      chunk = this.trialTimeline[this.crnt_chunk];
      if (chunk) {
        return this.run(chunk.trial);
      } else {
        return this.end();
      }
    };

    TrialTimeline.prototype.runFirst = function() {
      this.crnt_chunk = 0;
      return this.runCrnt();
    };

    TrialTimeline.prototype.run = function(rawChunk) {
      return rawChunk();
    };

    TrialTimeline.prototype.end = function() {
      return null;
    };

    TrialTimeline.prototype.reset = function() {
      this.trialTimeline = [];
      this.chunkIds = {};
      return this.crnt_chunk = 0;
    };

    return TrialTimeline;

  })();

  Thread = (function() {
    function Thread(disc, arg1) {
      this.disc = disc;
      this.callback = arg1.callback, this.context = arg1.context, this.event = arg1.event, this.playEntry = arg1.playEntry;
      this.name = "";
      this.crnt_ii = 0;
      this.children = [];
      this.active = false;
      if (this.disc[0].type === 'metadata') {
        this.parseMetaData(this.disc[0]);
      }
      this.startTime = performance.now();
    }

    Thread.prototype.parseMetaData = function(arg1) {
      this.name = arg1.name;
    };

    Thread.prototype.run = function(crntTime) {
      var entry, remaining;
      while ((entry = this.disc[this.crnt_ii]) && (entry.time === void 0 || entry.time + this.startTime < crntTime)) {
        console.log(entry);
        this.playEntry(entry, this.context, this.event);
        this.crnt_ii++;
      }
      remaining = this.disc.length - this.crnt_ii;
      if (!remaining) {
        console.log('spent');
        if (this.activeChildren().length === 0) {
          if (typeof this.callback === "function") {
            this.callback();
          }
          this.active = false;
        }
      }
      return remaining;
    };

    Thread.prototype.addChild = function(child) {
      return this.children.push(child);
    };

    Thread.prototype.activeChildren = function() {
      var block, i, len, ref, results;
      ref = this.children;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        block = ref[i];
        if (block.active) {
          results.push(block);
        }
      }
      return results;
    };

    Thread.prototype.end = function() {
      return this.crnt_ii = this.disc.length;
    };

    return Thread;

  })();

  window.runner = {
    Templates: Templates,
    TrialTimeline: TrialTimeline,
    Thread: Thread
  };

}).call(this);

(function() {
  var Stitch,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Stitch = (function() {
    function Stitch(canvasId, chunks) {
      var chunk, i, ii, len;
      if (chunks == null) {
        chunks = {};
      }
      this.runThreads = bind(this.runThreads, this);
      this.playEntry = bind(this.playEntry, this);
      this.history = [];
      this.registered = {};
      this.playing = [];
      this.logger = new Logger();
      this.events = window.events;
      this.runner = window.runner;
      this.paper = new paper.PaperScope();
      this.paper.setup(canvasId);
      new this.paper.Tool();
      this.paper.view.on('frame', (function(_this) {
        return function() {
          return _this.runThreads(performance.now());
        };
      })(this));
      this.group = new this.paper.Group({
        name: 'default'
      });
      this.TR = this.newTimeline();
      for (ii = i = 0, len = chunks.length; i < len; ii = ++i) {
        chunk = chunks[ii];
        this.TR.add(ii, chunk);
      }
    }

    Stitch.prototype.run = function() {
      return this.TR.runCrnt();
    };

    Stitch.prototype.newTimeline = function() {
      var TR;
      TR = new runner.TrialTimeline([]);
      TR.run = (function(_this) {
        return function(chunk) {
          var done;
          done = function() {
            return TR.runNext();
          };
          if (chunk instanceof runner.TrialTimeline) {
            console.log('running subtimeline');
            return chunk.runCrnt();
          } else if (typeof chunk === "object") {
            return _this.addThread(chunk, {
              callback: done
            });
          } else if (typeof chunk === "function") {
            return chunk(done, _this);
          }
        };
      })(this);
      return TR;
    };

    Stitch.prototype.makeTrials = function(template, args) {
      var timeline;
      return timeline = runner.Templates.makeTrials(template, args, this.newTimeline());
    };

    Stitch.prototype.getProperty = function(obj, prop) {
      var attr, i, len, ref;
      ref = prop.split('.');
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        obj = obj[attr];
      }
      return obj;
    };

    Stitch.prototype.add = function(item, options, events, log, duration) {
      var Cls, p_obj;
      if (typeof item === !'string') {
        throw "item must be the name of a paper object";
      }
      Cls = this.getProperty(this.paper, item);
      p_obj = new Cls(options);
      this.history.push({
        type: 'add',
        item: item,
        options: options,
        events: events,
        time: Date.now()
      });
      this.group.addChild(p_obj);
      if (events) {
        this.updateOn(p_obj, events);
      }
      if (log) {
        this.log(p_obj, log);
      }
      if (duration) {
        this.removeAfter(p_obj, duration);
      }
      return p_obj;
    };

    Stitch.prototype.update = function(name, method, options, log, duration) {
      var obj, tmp;
      console.log(name);
      obj = typeof name === 'string' ? this.group.children[name] : name;
      if (!obj) {
        throw "paper object not found, wrong name: " + name + "?";
      }
      tmp = obj[method](options);
      this.history.push({
        type: 'update',
        method: method,
        name: obj.name,
        options: options,
        time: Date.now()
      });
      if (log) {
        this.log(obj, log);
      }
      if (duration) {
        this.removeAfter(obj, duration);
      }
      return tmp;
    };

    Stitch.prototype.updateOn = function(name, event, options, duration) {
      var handler, key, obj, opts, results;
      obj = typeof name === 'string' ? this.group.children[name] : name;
      if (!name) {
        obj = this.paper.tool;
      } else if (!obj) {
        throw "paper object not found, wrong name: " + name + "?";
      }
      if (typeof event === "string") {
        handler = this.events[event](obj, options, this);
        obj.on(event, handler);
        if (duration) {
          setTimeout((function() {
            return obj.off(event, handler);
          }), duration);
        }
        return console.log('attaching event handler');
      } else {
        results = [];
        for (key in event) {
          opts = event[key];
          handler = this.events[key](obj, opts, this);
          obj.on(key, handler);
          if (duration) {
            results.push(setTimeout((function() {
              return obj.off(key, handler);
            }), duration));
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    };

    Stitch.prototype.log = function(name, props) {
      var obj;
      obj = typeof name === 'string' ? this.group.children[name] : name;
      return this.logger.log(obj, props);
    };

    Stitch.prototype.logMethod = function(method, options) {
      return this.logger[method](options);
    };

    Stitch.prototype.threadContextWrapper = function(handler) {
      return (function(_this) {
        return function(event) {
          var stream;
          if (stream = handler(event)) {
            return _this.addThread(stream, {
              context: event.target
            });
          }
        };
      })(this);
    };

    Stitch.prototype.removeAll = function() {
      return this.group.removeChildren();
    };

    Stitch.prototype.removeAfter = function(obj, time) {
      return setTimeout((function() {
        return obj.remove();
      }), time);
    };

    Stitch.prototype.playEntry = function(entry, context, event) {
      if ((context != null ? context.name : void 0) && !entry.name) {
        entry.name = context.name;
      }
      switch (entry.type) {
        case "add":
          return this.add(entry.item, entry.options, entry.events, entry.log, entry.duration);
        case "update":
          return this.update(entry.name, entry.method, entry.options, entry.log);
        case "updateOn":
          return this.updateOn(entry.name, entry.event, entry.options, entry.duration);
        case "clearThread":
          return this.clearThread(entry.name);
        case "removeAll":
          return this.removeAll();
        case "register":
          return this.register(entry.name, entry.options);
        case "addThread":
          return this.addThread(entry.name, entry.options);
        case "log":
          return this.log(entry.name, entry.props);
        case "logMethod":
          return this.logMethod(entry.method, entry.options);
        case "func":
          return entry.func();
      }
    };

    Stitch.prototype.addThread = function(disc, opts) {
      var block;
      if (opts == null) {
        opts = {};
      }
      if (typeof disc === "string") {
        disc = this.registered[disc];
      }
      opts.playEntry = this.playEntry;
      block = new runner.Thread(disc, opts);
      return this.playing.push(block);
    };

    Stitch.prototype.clearThread = function(name) {
      var block, i, ii, len, ref, ref1;
      if (name == null) {
        this.playing = [];
      } else {
        if (!Array.isArray(name)) {
          name = [name];
        }
        ref = this.playing;
        for (ii = i = 0, len = ref.length; i < len; ii = ++i) {
          block = ref[ii];
          if (ref1 = block.name, indexOf.call(name, ref1) >= 0) {
            block.end();
            this.playing.splice(ii, 1);
          }
        }
      }
      return this.playing.length;
    };

    Stitch.prototype.runThreads = function(crntTime) {
      var block, i, ii, left, ref, remaining, remove_ii;
      remaining = 0;
      remove_ii = [];
      ref = this.playing;
      for (ii = i = ref.length - 1; i >= 0; ii = i += -1) {
        block = ref[ii];
        left = block.run(crntTime);
        if (left) {
          remaining++;
        } else {
          this.playing.splice(ii, 1);
        }
      }
      return remaining;
    };

    Stitch.prototype.register = function(name, stream) {
      if (typeof name === 'object') {
        return this.registered = name;
      } else {
        return this.registered[name] = stream;
      }
    };

    return Stitch;

  })();

  window.Stitch = Stitch;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5jb2ZmZWUiLCJsb2dnZXIuY29mZmVlIiwicnVubmVyLmNvZmZlZSIsIndlYmVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0RBQUE7SUFBQTs7RUFBQSxXQUFBLEdBQWMsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUdWLFFBQUE7QUFBQTtBQUFBLFNBQUEscUNBQUE7O01BQ0ksR0FBQSxHQUFNLEdBQUksQ0FBQSxJQUFBO0FBRGQ7QUFHQSxXQUFPO0VBTkc7O0VBUWQsT0FBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLEtBQVY7QUFHTixRQUFBO0lBQUEsS0FBQSxHQUFRLFNBQUMsS0FBRCxFQUFRLEdBQVIsRUFBYSxNQUFiO0FBRUosVUFBQTtNQUFBLElBQUcsQ0FBQyxhQUFELENBQUEsSUFBYSxDQUFDLEtBQUEsWUFBaUIsTUFBbEIsQ0FBaEI7QUFDSSxhQUFBLFVBQUE7OztVQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZLEtBQVo7QUFBQSxTQURKO09BQUEsTUFJSyxJQUFHLE9BQU8sS0FBUCxLQUFnQixRQUFoQixJQUE2QixLQUFNLENBQUEsQ0FBQSxDQUFOLEtBQVksR0FBNUM7UUFFRCxJQUFBLEdBQU8sV0FBQSxDQUFZLEtBQVosRUFBbUIsS0FBTSxTQUF6QjtRQUVQLE1BQU8sQ0FBQSxHQUFBLENBQVAsR0FBYyxLQUpiOztBQU1MLGFBQU87SUFaSDtJQWVSLFdBQUEsR0FBYyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUksQ0FBQyxTQUFMLENBQWUsT0FBZixDQUFYO0lBQ2QsT0FBTyxDQUFDLEdBQVIsQ0FBWSxvQ0FBWjtJQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksV0FBWjtJQUVBLEtBQUEsQ0FBTSxXQUFOO0FBQ0EsV0FBTztFQXZCRDs7RUF5QlYsU0FBQSxHQUFZLFNBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxNQUFaO0FBQ1IsUUFBQTtXQUFBLE9BQUEsR0FBVyxTQUFDLEtBQUQ7QUFD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T0FBRCxHQUFXLEdBQTdCO09BQUEsTUFBQTtRQUVJLElBQUcsQ0FBSSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBUDtVQUFnQyxJQUFBLEdBQU8sQ0FBQyxJQUFELEVBQXZDOztBQUNBO0FBQUEsYUFBQSwrQ0FBQTs7VUFDSSxXQUFHLEtBQUssQ0FBQyxJQUFOLEVBQUEsYUFBYyxJQUFkLEVBQUEsSUFBQSxNQUFIO1lBQ0ksS0FBSyxDQUFDLEdBQU4sQ0FBQTtZQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixFQUFoQixFQUFvQixDQUFwQixFQUZKOztBQURKLFNBSEo7O0FBUUEsYUFBTyxJQUFDLENBQUEsT0FBTyxDQUFDO0lBVlA7O3FCQVliLFVBQUEsR0FBWSxTQUFDLFFBQUQ7QUFDUixVQUFBO01BQUEsU0FBQSxHQUFZO01BQ1osU0FBQSxHQUFZO0FBQ1o7QUFBQSxXQUFBLDZDQUFBOztRQUNJLElBQUEsR0FBTyxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVY7UUFDUCxJQUFHLElBQUg7VUFBYSxTQUFBLEdBQWI7U0FBQSxNQUFBO1VBQThCLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixFQUFoQixFQUFvQixDQUFwQixFQUE5Qjs7QUFGSjtBQUlBLGFBQU87SUFQQzs7cUJBU1osUUFBQSxHQUFVLFNBQUMsSUFBRCxFQUFPLE1BQVA7TUFDTixJQUFHLE9BQU8sSUFBUCxLQUFlLFFBQWxCO2VBQWdDLElBQUMsQ0FBQSxVQUFELEdBQWMsS0FBOUM7T0FBQSxNQUFBO2VBQ0ssSUFBQyxDQUFBLFVBQVcsQ0FBQSxJQUFBLENBQVosR0FBb0IsT0FEekI7O0lBRE07Ozs7OztFQThCZCxNQUFNLENBQUMsTUFBUCxHQUFnQjtBQTFPaEIiLCJmaWxlIjoid2ViZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJnZXRQcm9wZXJ0eSA9IChvYmosIHByb3ApIC0+XG4gICAgIyBnZXRzIG5lc3RlZCBwcm9wZXJ0aWVzIHNlcGFyYXRlZCBieSAnLidcbiAgICAjIGFkYXB0ZWQgZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjQ5MTYxNVxuICAgIGZvciBhdHRyIGluICBwcm9wLnNwbGl0KCcuJylcbiAgICAgICAgb2JqID0gb2JqW2F0dHJdXG5cbiAgICByZXR1cm4gb2JqXG5cbmNvbXBpbGUgPSAob3B0aW9ucywgZXZlbnQpIC0+XG4gICAgIyB0cmF2ZXJzZXMgZW50aXJlIG9wdGlvbnMgb2JqZWN0LCByZXBsYWNpbmcgZW50cmllcyB0aGF0IGJlZ2luIHdpdGggJ0AnXG4gICAgIyB3aXRoIGNvcnJlc3BvbmRpbmcgZXZlbnQgaW5mb3JtYXRpb25cbiAgICBwYXJzZSA9ICh0aGluZywga2V5LCBwYXJlbnQpIC0+XG4gICAgICAgICMgaWYgb2JqZWN0IHRoZW4gcmVjdXJzZVxuICAgICAgICBpZiAodGhpbmc/KSBhbmQgKHRoaW5nIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgICAgICAgICAgcGFyc2UodiwgaywgdGhpbmcpIGZvciBvd24gaywgdiBvZiB0aGluZ1xuICAgICAgICAgICAgXG4gICAgICAgICMgaWYgc3RyaW5nLCBlbmQgcmVjdXJzaW9uXG4gICAgICAgIGVsc2UgaWYgdHlwZW9mIHRoaW5nIGlzIFwic3RyaW5nXCIgYW5kIHRoaW5nWzBdIGlzICdAJ1xuICAgICAgICAgICAgIyB1c2VzIEBwcm9wbmFtZSB0byBnZXQgaW5mbyBmcm9tIGV2ZW50XG4gICAgICAgICAgICBwcm9wID0gZ2V0UHJvcGVydHkoZXZlbnQsIHRoaW5nWzEuLl0pXG4gICAgICAgICAgICAjIHJlcGxhY2UgZW50cnkgd2l0aCB0aGF0IGluZm9cbiAgICAgICAgICAgIHBhcmVudFtrZXldID0gcHJvcFxuXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAjIERlZXAgY29weSB0aGVuIHBhcnNlLCBUT0RPIHJlcGxhY2UgY29weSBmdW5jIHdpdGggc29tZXRoaW5nIG1vcmUgcGVyZm9ybWFudFxuICAgIG9wdGlvbnNDb3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zKSlcbiAgICBjb25zb2xlLmxvZyhcIm9wdGlvbnMgY29weSBpcy4uLi4hISEhIS0tLS0hISEhISFcIilcbiAgICBjb25zb2xlLmxvZyBvcHRpb25zQ29weVxuXG4gICAgcGFyc2Uob3B0aW9uc0NvcHkpXG4gICAgcmV0dXJuIG9wdGlvbnNDb3B5XG5cbm9uS2V5RG93biA9IChvYmosIG9wdHMsIHN0aXRjaCkgLT5cbiAgICBoYW5kbGVyID0gIChldmVudCkgLT5cbiAgICAgICAgY29uc29sZS5sb2coJ2tleSBkb3duJylcbiAgICAgICAgIyBrZXkgcHJlc3NlcyBhcmUgc3BlY2lmaWVkIGFzIGtleW5hbWUgOiB0aHJlYWQgaW4gb3B0c1xuICAgICAgICAjIG90aGVyIG9wdGlvbnMgbWF5IGJlIHNwZWNpZmllZCBpbiB0aGVyZSwgc3VjaCBhcyBzaW5nbGVVc2VcbiAgICAgICAgZm9yIG93biBwcmVzc2VkLCB0aHJlYWQgb2Ygb3B0c1xuICAgICAgICAgICAgaWYgZXZlbnQua2V5ID09IHByZXNzZWRcbiAgICAgICAgICAgICAgICBpZiBvcHRzLnNpbmdsZVVzZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlbW92aW5nICN7ZXZlbnQudHlwZX1cIilcbiAgICAgICAgICAgICAgICAgICAgb2JqLm9mZihldmVudC50eXBlLCBoYW5kbGVyKVxuICAgICAgICAgICAgICAgIG5ld190aHJlYWQgPSBjb21waWxlKHRocmVhZCwgZXZlbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0aXRjaC5hZGRUaHJlYWQobmV3X3RocmVhZCwgY29udGV4dDogZXZlbnQudGFyZ2V0LCBldmVudDogZXZlbnQpXG4gICAgICAgIHJldHVybiBudWxsXG5cblxub25EZWZhdWx0ID0gKG9iaiwgb3B0cywgc3RpdGNoKSAtPlxuICAgIChldmVudCkgLT5cbiAgICAgICAgY29uc29sZS5sb2codGhpcylcbiAgICAgICAgY29uc29sZS5sb2cgJ2NhbGxpbmcgZGVmYXVsdCBldmVudCdcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShvcHRzKVxuICAgICAgICAgICAgbmV3X3RocmVhZCA9IGNvbXBpbGUob3B0cywgZXZlbnQpXG4gICAgICAgICAgICByZXR1cm4gc3RpdGNoLmFkZFRocmVhZChuZXdfdGhyZWFkLCBjb250ZXh0OiBldmVudC50YXJnZXQsIGV2ZW50OiBldmVudClcbiAgICAgICAgZWxzZSByZXR1cm4gb3B0cygpXG5cblxuICAgICAgICBcbmV2ZW50cyA9IHtcbiAgICBjb21waWxlOiBjb21waWxlLCAjIFRPRE8sIG91dCBvZiB0aGlzIG9iamVjdFxuICAgIGtleWRvd246IG9uS2V5RG93bixcbiAgICBjbGljazogb25EZWZhdWx0LFxuICAgIGRvdWJsZWNsaWNrOiBvbkRlZmF1bHQsXG4gICAgbW91c2VlbnRlcjogb25EZWZhdWx0LFxuICAgIG1vdXNlbGVhdmU6IG9uRGVmYXVsdCxcbiAgICBtb3VzZWRyYWc6IG9uRGVmYXVsdFxufVxuXG53aW5kb3cuZXZlbnRzID0gZXZlbnRzXG4iLCIjIFRPRE8gZHVwIGZyb20gd2ViZXIuY29mZmVlLCBtYWtlIHV0aWxzIHNjcmlwdD9cbmdldFByb3BlcnR5ID0gKG9iaiwgcHJvcCkgLT5cbiAgICAjIGdldHMgbmVzdGVkIHByb3BlcnRpZXMgc2VwYXJhdGVkIGJ5ICcuJ1xuICAgICMgYWRhcHRlZCBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82NDkxNjE1XG4gICAgZm9yIGF0dHIgaW4gIHByb3Auc3BsaXQoJy4nKVxuICAgICAgICBvYmogPSBvYmpbYXR0cl1cblxuICAgIHJldHVybiBvYmpcblxuY2xhc3MgTG9nZ2VyXG4gICAgY29uc3RydWN0b3I6IChAZGF0YSA9IFt7fV0sIEBjcm50X2lpID0gMCkgLT5cbiAgICAgICAgQGhhc2ggPSBcbiAgICAgICAgICAgICcjdGltZSc6IC0+IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgXG4gICAgbG9nOiAob2JqLCBwcm9wZXJ0aWVzKSAtPlxuICAgICAgICBAY3JlYXRlRW50cnkob2JqLCBwcm9wZXJ0aWVzLCBAZGF0YVtAY3JudF9paV0pXG5cbiAgICB1cGRhdGU6IChyZWNvcmRzKSAtPlxuICAgICAgICBlbnRyeSA9IEBkYXRhW0Bjcm50X2lpXVxuICAgICAgICBlbnRyeVtrXSA9IHYgZm9yIG93biBrLCB2IG9mIHJlY29yZHNcblxuICAgICAgICByZXR1cm4gZW50cnlcblxuICAgIGNyZWF0ZUVudHJ5OiAob2JqLCBwcm9wZXJ0aWVzLCBlbnRyeSA9IHt9KSAtPlxuICAgICAgICBpZiBub3QgQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzKVxuICAgICAgICAgICAgZm9yIG93biBrZXksIHByb3Agb2YgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGVudHJ5W2tleV0gPSBAcGFyc2Uob2JqLCBwcm9wKVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgIyBhc3N1bWVzIHByb3BlcnRpZXMgaXMgbGlzdCwgYW5kIHNldHMgcHJvcGVydHkgYXMga2V5IG5hbWVcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BlcnRpZXMgdGhlbiBlbnRyeVtwcm9wXSA9IEBwYXJzZShvYmosIHByb3ApXG5cbiAgICAgICAgcmV0dXJuIGVudHJ5XG5cbiAgICBwYXJzZTogKG9iaiwgcHJvcCkgLT5cbiAgICAgICAgIyBzcGVjaWFsIHRyZWF0bWVudCBvZiBzdHJpbmdzIHN0YXJ0aW5nIHdpdGggaGFzaFxuICAgICAgICBpZiBwcm9wLnN0YXJ0c1dpdGgoJyMnKSB0aGVuIEBoYXNoW3Byb3BdKClcbiAgICAgICAgIyBsb29rIHVwIHByb3BlcnR5IGZyb20gb2JqZWN0XG4gICAgICAgIGVsc2UgZ2V0UHJvcGVydHkob2JqLCBwcm9wKVxuXG4gICAgbmV4dEVudHJ5OiAoKSAtPlxuICAgICAgICBAZGF0YS5wdXNoKHt9KVxuICAgICAgICBAY3JudF9paSsrXG4gICAgXG4gICAgY3JudEVudHJ5OiAoKSAtPlxuICAgICAgICBAZGF0YVtAY3JudF9paV1cblxud2luZG93LkxvZ2dlciA9IExvZ2dlclxuIiwiVGVtcGxhdGVzID0gXG4gICAgY29sc1RvUm93czogKG9iaikgLT5cbiAgICAgICAgIyBjb252ZXJ0cyBvYmplY3Qgd2l0aCBjb2x1bW5zIG9mIGRhdGEgdG8gcm93LWxpa2UgZW50cmllc1xuICAgICAgICAjIGUuZy4ge2E6IFsxLDJdLCBiOlszLDRdfSB0byBbe2E6IDEsIGI6IDN9LCB7YTogMiwgYjogNH1dXG4gICAgICAgIGRhdGEgPSBbXVxuICAgICAgICBmb3Igb3duIGtleSBvZiBvYmpcbiAgICAgICAgICAgIGZvciBlbnRyeSwgaWkgaW4gb2JqW2tleV1cbiAgICAgICAgICAgICAgICAjIGNyZWF0ZSBuZXcgcm93IGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgIHJvdyA9IGRhdGFbaWldIG9yIGRhdGFbaWldID0ge31cbiAgICAgICAgICAgICAgICByb3dba2V5XSA9IGVudHJ5XG5cbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgICAgICBcblxuICAgIGdldFByb3BlcnR5OiAob2JqLCBwYXRoLCBhc3NpZ24pIC0+XG4gICAgICAgIGZvciBhdHRyIGluIHBhdGhbMC4uLnBhdGgubGVuZ3RoLTFdICMgbGVhdmUgb3V0IGxhc3QgaXRlbVxuICAgICAgICAgICAgb2JqID0gb2JqW2F0dHJdXG5cbiAgICAgICAgbGFzdEF0dHIgPSBwYXRoWy0xLi5dXG4gICAgICAgIGlmIGFzc2lnbj8gdGhlbiByZXR1cm4gb2JqW2xhc3RBdHRyXSA9IGFzc2lnblxuICAgICAgICBlbHNlIHJldHVybiBvYmpbbGFzdEF0dHJdXG5cbiAgICBnZXRQYXJhbXM6ICh0ZW1wbGF0ZSkgLT5cbiAgICAgICAgcGFyYW1zID0ge31cbiAgICAgICAgcGFyc2UgPSAodGhpbmcsIGtleSkgLT5cbiAgICAgICAgICAgICMgdGFrZXMgb2JqZWN0IGFuZCBjb252ZXJ0cyBhbnkgZmllbGRzIHdpdGgge3t2YXJuYW1lfX0gdG8gYXJndW1lbnQgb2YgZm5cblxuICAgICAgICAgICAgIyBpZiBvYmplY3QgdGhlbiByZWN1cnNlXG4gICAgICAgICAgICBpZiAodGhpbmc/KSBhbmQgKHRoaW5nIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgICAgICAgICAgICAgICMgYXJyYXkgdG8gaG9sZCBhbGwge3t2YXJuYW1lc319IGluIHRoaXMgbm9kZSBhbmQgYmVsb3dcbiAgICAgICAgICAgICAgICBuYW1lQnVja2V0ID0gW10gICAgXG4gICAgICAgICAgICAgICAgZm9yIG93biBrLCB2IG9mIHRoaW5nXG4gICAgICAgICAgICAgICAgICAgICMgcmVjdXJzZSwgYW5kIGdldCBtYXRjaGluZyB7e3Zhcm5hbWVzfX0gaW4gY2hpbGQgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgYXJnbmFtZXMgPSBwYXJzZSh2LCBrKSAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBwcmVwZW5kIGN1cnJlbnQga2V5IHRvIHBhdGggZm9yIGVhY2gge3t2YXJuYW1lfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhcmduYW1lIGluIGFyZ25hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2FyZ25hbWVdLnVuc2hpZnQoaylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lQnVja2V0LnB1c2goYXJnbmFtZSkgICAgIyBhY2N1bXVsYXRlIGZvciBwYXNzaW5nIHVwd2FyZFxuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lQnVja2V0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGlmIHN0cmluZywgZW5kIHJlY3Vyc2lvblxuICAgICAgICAgICAgZWxzZSBpZiB0eXBlb2YgdGhpbmcgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIHJlID0gL3t7KC4qPyl9fS9cbiAgICAgICAgICAgICAgICBtYXRjaCA9IHJlLmV4ZWModGhpbmcpXG4gICAgICAgICAgICAgICAgaWYgbWF0Y2g/IFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbbWF0Y2hbMV1dID0gW11cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFttYXRjaFsxXV1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgICBwYXJzZSh0ZW1wbGF0ZSlcbiAgICAgICAgcmV0dXJuIHBhcmFtc1xuXG4gICAgZnVuY3RpemU6ICh0ZW1wbGF0ZSwgY29weT10cnVlKSAtPlxuICAgICAgICBwYXJhbXMgPSBAZ2V0UGFyYW1zKHRlbXBsYXRlKVxuXG4gICAgICAgIChjbmZnKSA9PlxuICAgICAgICAgICAgIyBkZWVwIGNvcHksIHVzaW5nIGRlZXBDb3B5IGZyb20gbG9kYXNoIHdvdWxkIGJlIGZhc3RlclxuICAgICAgICAgICAgaWYgY29weSB0aGVuIGNybnRfdGVtcGxhdGUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRlbXBsYXRlKSlcbiAgICAgICAgICAgIGVsc2UgY3JudF90ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgICAgICAgICAgIGZvciBhcmcsIHBhdGggb2YgcGFyYW1zXG4gICAgICAgICAgICAgICAgdmFsID0gY25mZ1thcmddXG4gICAgICAgICAgICAgICAgQGdldFByb3BlcnR5KGNybnRfdGVtcGxhdGUsIHBhdGgsIHZhbClcbiAgICAgICAgICAgIHJldHVybiBjcm50X3RlbXBsYXRlIFxuXG4gICAgbWFrZVRyaWFsczogKHRlbXBsYXRlLCBjbmZnVGFibGUsIHRpbWVsaW5lID0gbmV3IFRyaWFsVGltZWxpbmUoKSkgLT5cbiAgICAgICAgZnVuY3RpemVkID0gQGZ1bmN0aXplKHRlbXBsYXRlKVxuICAgICAgICBjbmZnVGFibGUgPSBAY29sc1RvUm93cyhjbmZnVGFibGUpIGlmIG5vdCBBcnJheS5pc0FycmF5KGNuZmdUYWJsZSlcblxuICAgICAgICBwcmVmaXggPSB0aW1lbGluZS5tYWtlSWRSb290KCdhdXRvJylcbiAgICAgICAgY29uc29sZS5sb2cocHJlZml4KVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdywgaWkgaW4gY25mZ1RhYmxlXG4gICAgICAgICAgICB0cmlhbCA9IGZ1bmN0aXplZChyb3cpXG4gICAgICAgICAgICB0aW1lbGluZS5hZGQoXCIje3ByZWZpeH0tI3tpaX1cIiwgdHJpYWwpXG5cbiAgICAgICAgcmV0dXJuIHRpbWVsaW5lXG5cblxuY2xhc3MgVHJpYWxUaW1lbGluZVxuICAgIGNvbnN0cnVjdG9yOiAodGltZWxpbmUgPSBbXSwgQHJ1bikgLT4gXG4gICAgICAgIEB0cmlhbFRpbWVsaW5lID0gW11cbiAgICAgICAgQGNodW5rSWRzID0ge31cbiAgICAgICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIEBjcm50X2NodW5rID0gMFxuXG4gICAgICAgIEBhZGQoZW50cnkuaWQsIGVudHJ5LnRyaWFsKSBmb3IgZW50cnkgaW4gdGltZWxpbmVcblxuICAgIGFkZDogKGlkPVwiXCIsIHRyaWFsKSAtPlxuICAgICAgICBpZiBpZCBvZiBAY2h1bmtJZHMgdGhlbiB0aHJvdyBcImlkIGFscmVhZHkgaW4gdXNlXCJcbiAgICAgICAgZWxzZSBAY2h1bmtJZHNbaWRdID0gQHRyaWFsVGltZWxpbmUubGVuZ3RoXG5cbiAgICAgICAgY2h1bmsgPSBpZDogaWQsIHRyaWFsOiB0cmlhbFxuICAgICAgICBAdHJpYWxUaW1lbGluZS5wdXNoKGNodW5rKVxuXG4gICAgbWFrZUlkUm9vdDogKGlkKSAtPlxuICAgICAgICB1bmlxdWUgPSAoaWQpID0+XG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoaWQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMga2V5cyBtZXRob2Qgbm90IGllOCBjb21wYXRpYmxlLi5cbiAgICAgICAgICAgIChPYmplY3Qua2V5cyhAY2h1bmtJZHMpLmxlbmd0aCA9PSAwKSBvciAocmUudGVzdChrKSBmb3Igb3duIGsgb2YgQGNodW5rSWRzKS5zb21lKChpaSkgLT4gaWkpXG5cbiAgICAgICAgaWYgbm90IHVuaXF1ZShpZClcbiAgICAgICAgICAgIGluY3IgPSAwXG4gICAgICAgICAgICBuZXdfaWQgPSBpbmNyKysgd2hpbGUgbm90IHVuaXF1ZShpZClcbiAgICAgICAgICAgIHJldHVybiBuZXdfaWRcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiBpZFxuXG4gICAgbmV4dENodW5rOiAoKSAtPlxuICAgICAgICBAY3JudF9jaHVuaysrXG4gICAgICAgIGlmIEBjcm50X2NodW5rIDwgQHRyaWFsVGltZWxpbmUubGVuZ3RoIHRoZW4gQHRyaWFsVGltZWxpbmVbQGNybnRfY2h1bmtdXG5cbiAgICBnb1RvQ2h1bms6IChjaHVua0lkKSAtPlxuICAgICAgICBAY3JudF9jaHVuayA9IEBjaHVua0lkc1tjaHVua0lkXVxuXG4gICAgcnVuTmV4dDogKCkgLT5cbiAgICAgICAgQG5leHRDaHVuaygpXG4gICAgICAgIEBydW5Dcm50KClcblxuICAgIHJ1bkNodW5rOiAoY2h1bmtJZCkgLT5cbiAgICAgICAgQGdvVG9DaHVuayhjaHVua0lkKVxuICAgICAgICBAcnVuQ3JudCgpXG5cbiAgICBydW5Dcm50OiAoKSAtPlxuICAgICAgICBAYWN0aXZlID0gdHJ1ZVxuICAgICAgICBjb25zb2xlLmxvZyBcInJ1bm5pbmcgdHJpYWwgI3tAY3JudF9jaHVua31cIlxuICAgICAgICBjaHVuayA9IEB0cmlhbFRpbWVsaW5lW0Bjcm50X2NodW5rXVxuICAgICAgICBpZiBjaHVuayB0aGVuIEBydW4oY2h1bmsudHJpYWwpIGVsc2UgQGVuZCgpXG5cbiAgICBydW5GaXJzdDogKCkgLT5cbiAgICAgICAgQGNybnRfY2h1bmsgPSAwXG4gICAgICAgIEBydW5Dcm50KClcblxuICAgIHJ1bjogKHJhd0NodW5rKSAtPlxuICAgICAgICAjIGRlZmF1bHQgcnVubmluZyBmdW5jdGlvbiwgbGlrZWx5IHNob3VsZCBiZSBvdmVybG9hZGVkXG4gICAgICAgIHJhd0NodW5rKClcblxuICAgIGVuZDogKCkgLT5cbiAgICAgICAgIyBkZWZhdWx0IGVuZCBmdW5jdGlvbiwgc2hvdWxkIGJlIG92ZXJsb2FkZWRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlc2V0OiAoKSAtPlxuICAgICAgICBAdHJpYWxUaW1lbGluZSA9IFtdXG4gICAgICAgIEBjaHVua0lkcyA9IHt9XG4gICAgICAgIEBjcm50X2NodW5rID0gMFxuXG5cbmNsYXNzIFRocmVhZFxuICAgIGNvbnN0cnVjdG9yOiAoQGRpc2MsIHtAY2FsbGJhY2ssIEBjb250ZXh0LCBAZXZlbnQsIEBwbGF5RW50cnl9KSAtPlxuICAgICAgICAjaWYgdHlwZW9mIGRpc2MgPT0gJ3N0cmluZydcbiAgICAgICAgIyAgICBuYW1lID0gZGlzY1xuICAgICAgICAjICAgIGRpc2MgPSBAcmVnaXN0ZXJlZFtuYW1lXVxuICAgICAgICAjICAgIGNvbnNvbGUubG9nKGRpc2MpXG5cbiAgICAgICAgIyBwYXJzZSBtZXRhZGF0YVxuICAgICAgICBAbmFtZSA9IFwiXCJcbiAgICAgICAgQGNybnRfaWkgPSAwXG4gICAgICAgIEBjaGlsZHJlbiA9IFtdXG4gICAgICAgIEBhY3RpdmUgPSBmYWxzZVxuXG4gICAgICAgIGlmIEBkaXNjWzBdLnR5cGUgaXMgJ21ldGFkYXRhJyB0aGVuIEBwYXJzZU1ldGFEYXRhKEBkaXNjWzBdKVxuXG4gICAgICAgICMgcGFyc2Ugb3B0aW9uc1xuXG4gICAgICAgIEBzdGFydFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgcGFyc2VNZXRhRGF0YTogKHtAbmFtZX0pIC0+XG5cbiAgICBydW46IChjcm50VGltZSkgLT5cbiAgICAgICAgd2hpbGUgKGVudHJ5ID0gQGRpc2NbQGNybnRfaWldKSBhbmQgXG4gICAgICAgICAgICAgIChlbnRyeS50aW1lIGlzIHVuZGVmaW5lZCBvciBlbnRyeS50aW1lICsgQHN0YXJ0VGltZSA8IGNybnRUaW1lKVxuICAgICAgICAgICAgY29uc29sZS5sb2coZW50cnkpXG4gICAgICAgICAgICBAcGxheUVudHJ5KGVudHJ5LCBAY29udGV4dCwgQGV2ZW50KVxuICAgICAgICAgICAgQGNybnRfaWkrK1xuICAgICAgICByZW1haW5pbmcgPSBAZGlzYy5sZW5ndGggLSBAY3JudF9paVxuICAgICAgICBpZiBub3QgcmVtYWluaW5nIFxuICAgICAgICAgICAgIyBXYWl0IGZvciBhbGwgY2hpbGRyZW4gdG8gYmVjb21lIGluYWN0aXZlIGJlZm9yZSBmaXJpbmcgY2FsbGJhY2tcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzcGVudCcpXG4gICAgICAgICAgICBpZiBAYWN0aXZlQ2hpbGRyZW4oKS5sZW5ndGggaXMgMFxuICAgICAgICAgICAgICAgIEBjYWxsYmFjaz8oKVxuICAgICAgICAgICAgICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgICAgICByZXR1cm4gcmVtYWluaW5nXG5cbiAgICBhZGRDaGlsZDogKGNoaWxkKSAtPlxuICAgICAgICBAY2hpbGRyZW4ucHVzaChjaGlsZClcblxuICAgIGFjdGl2ZUNoaWxkcmVuOiAoKSAtPlxuICAgICAgICBibG9jayBmb3IgYmxvY2sgaW4gQGNoaWxkcmVuIHdoZW4gYmxvY2suYWN0aXZlXG5cbiAgICBlbmQ6ICgpIC0+XG4gICAgICAgIEBjcm50X2lpID0gQGRpc2MubGVuZ3RoXG4gICAgXG5cbndpbmRvdy5ydW5uZXIgPSBcbiAgICBUZW1wbGF0ZXM6IFRlbXBsYXRlc1xuICAgIFRyaWFsVGltZWxpbmU6IFRyaWFsVGltZWxpbmVcbiAgICBUaHJlYWQ6IFRocmVhZFxuIiwiY2xhc3MgU3RpdGNoXG4gICAgY29uc3RydWN0b3I6IChjYW52YXNJZCwgY2h1bmtzID0ge30pIC0+XG4gICAgICAgIEBoaXN0b3J5ID0gW11cbiAgICAgICAgQHJlZ2lzdGVyZWQgPSB7fVxuICAgICAgICBAcGxheWluZyA9IFtdXG5cbiAgICAgICAgIyBtb2R1bGVzXG4gICAgICAgIEBsb2dnZXIgPSBuZXcgTG9nZ2VyKClcbiAgICAgICAgQGV2ZW50cyA9IHdpbmRvdy5ldmVudHMgI1RPRE8gYmV0dGVyIG1vZHVsYXJpemF0aW9uXG4gICAgICAgIEBydW5uZXIgPSB3aW5kb3cucnVubmVyICNUT0RPIGp1c3QgZ2V0IFRyaWFsUnVubmVyIGFuZCBUaHJlYWRcbiAgICAgICAgXG4gICAgICAgICMgc2V0dXAgbmV3IHBhcGVyc2NvcGVcbiAgICAgICAgQHBhcGVyID0gbmV3IHBhcGVyLlBhcGVyU2NvcGUoKVxuICAgICAgICBAcGFwZXIuc2V0dXAoY2FudmFzSWQpXG4gICAgICAgIG5ldyBAcGFwZXIuVG9vbCgpXG4gICAgICAgIEBwYXBlci52aWV3Lm9uICdmcmFtZScsICgpID0+IEBydW5UaHJlYWRzKHBlcmZvcm1hbmNlLm5vdygpKVxuXG4gICAgICAgIEBncm91cCA9IG5ldyBAcGFwZXIuR3JvdXAobmFtZTonZGVmYXVsdCcpXG5cbiAgICAgICAgIyBUcmlhbCBSdW5uZXJcbiAgICAgICAgQFRSID0gQG5ld1RpbWVsaW5lKClcbiAgICAgICAgZm9yIGNodW5rLCBpaSBpbiBjaHVua3MgXG4gICAgICAgICAgICBAVFIuYWRkKGlpLCBjaHVuaylcblxuXG4gICAgcnVuOiAtPiBAVFIucnVuQ3JudCgpXG5cbiAgICBuZXdUaW1lbGluZTogKCkgLT5cbiAgICAgICAgVFIgPSBuZXcgcnVubmVyLlRyaWFsVGltZWxpbmUoW10pXG5cbiAgICAgICAgVFIucnVuID0gKGNodW5rKSA9PlxuICAgICAgICAgICAgZG9uZSA9ID0+IFRSLnJ1bk5leHQoKVxuICAgICAgICAgICAgaWYgY2h1bmsgaW5zdGFuY2VvZiBydW5uZXIuVHJpYWxUaW1lbGluZVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdydW5uaW5nIHN1YnRpbWVsaW5lJylcbiAgICAgICAgICAgICAgICBjaHVuay5ydW5Dcm50KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgdHlwZW9mIGNodW5rIGlzIFwib2JqZWN0XCJcbiAgICAgICAgICAgICAgICBAYWRkVGhyZWFkKGNodW5rLCBjYWxsYmFjazogZG9uZSlcbiAgICAgICAgICAgIGVsc2UgaWYgdHlwZW9mIGNodW5rIGlzIFwiZnVuY3Rpb25cIlxuICAgICAgICAgICAgICAgIGNodW5rKGRvbmUsIEApXG5cbiAgICAgICAgcmV0dXJuIFRSXG5cbiAgICBtYWtlVHJpYWxzOiAodGVtcGxhdGUsIGFyZ3MpIC0+XG4gICAgICAgIHRpbWVsaW5lID0gcnVubmVyLlRlbXBsYXRlcy5tYWtlVHJpYWxzKHRlbXBsYXRlLCBhcmdzLCBAbmV3VGltZWxpbmUoKSlcblxuXG4gICAgZ2V0UHJvcGVydHk6IChvYmosIHByb3ApIC0+XG4gICAgICAgICMgZ2V0cyBuZXN0ZWQgcHJvcGVydGllcyBzZXBhcmF0ZWQgYnkgJy4nXG4gICAgICAgICMgYWRhcHRlZCBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82NDkxNjE1XG4gICAgICAgIGZvciBhdHRyIGluICBwcm9wLnNwbGl0KCcuJylcbiAgICAgICAgICAgIG9iaiA9IG9ialthdHRyXVxuXG4gICAgICAgIHJldHVybiBvYmpcblxuICAgIGFkZDogKGl0ZW0sIG9wdGlvbnMsIGV2ZW50cywgbG9nLCBkdXJhdGlvbikgLT5cbiAgICAgICAgaWYgdHlwZW9mIGl0ZW0gaXMgbm90ICdzdHJpbmcnXG4gICAgICAgICAgICB0aHJvdyBcIml0ZW0gbXVzdCBiZSB0aGUgbmFtZSBvZiBhIHBhcGVyIG9iamVjdFwiXG5cbiAgICAgICAgQ2xzID0gQGdldFByb3BlcnR5KEBwYXBlciwgaXRlbSlcbiAgICAgICAgcF9vYmogPSBuZXcgQ2xzKG9wdGlvbnMpXG4gICAgICAgIEBoaXN0b3J5LnB1c2gge1xuICAgICAgICAgICAgdHlwZTogJ2FkZCdcbiAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnNcbiAgICAgICAgICAgIGV2ZW50czogZXZlbnRzXG4gICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpXG4gICAgICAgIH1cbiAgICAgICAgQGdyb3VwLmFkZENoaWxkKHBfb2JqKVxuXG4gICAgICAgIEB1cGRhdGVPbihwX29iaiwgZXZlbnRzKSBpZiBldmVudHNcbiAgICAgICAgQGxvZyhwX29iaiwgbG9nKSAgICAgICAgIGlmIGxvZ1xuICAgICAgICBAcmVtb3ZlQWZ0ZXIocF9vYmosIGR1cmF0aW9uKSBpZiBkdXJhdGlvblxuXG4gICAgICAgIHJldHVybiBwX29ialxuXG4gICAgdXBkYXRlOiAobmFtZSwgbWV0aG9kLCBvcHRpb25zLCBsb2csIGR1cmF0aW9uKSAtPlxuICAgICAgICAjIGxvb2sgb2JqZWN0IHVwIGJ5IG5hbWUgaWYgbmVjZXNzYXJ5XG4gICAgICAgIGNvbnNvbGUubG9nKG5hbWUpXG4gICAgICAgIG9iaiA9IGlmIHR5cGVvZiBuYW1lIGlzICdzdHJpbmcnIHRoZW4gQGdyb3VwLmNoaWxkcmVuW25hbWVdIGVsc2UgbmFtZVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IG9ialxuICAgICAgICAgICAgdGhyb3cgXCJwYXBlciBvYmplY3Qgbm90IGZvdW5kLCB3cm9uZyBuYW1lOiBcIiArIG5hbWUgKyBcIj9cIlxuXG4gICAgICAgIHRtcCA9IG9ialttZXRob2RdKG9wdGlvbnMpXG4gICAgICAgIEBoaXN0b3J5LnB1c2gge1xuICAgICAgICAgICAgdHlwZTogJ3VwZGF0ZSdcbiAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kXG4gICAgICAgICAgICBuYW1lOiBvYmoubmFtZVxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgICAgICAgICAgdGltZTogRGF0ZS5ub3coKVxuICAgICAgICB9XG5cbiAgICAgICAgI0B1cGRhdGVPbihvYmosIGV2ZW50cykgaWYgZXZlbnRzXG4gICAgICAgIEBsb2cob2JqLCBsb2cpIGlmIGxvZ1xuICAgICAgICBAcmVtb3ZlQWZ0ZXIob2JqLCBkdXJhdGlvbikgaWYgZHVyYXRpb25cbiAgICAgICAgcmV0dXJuIHRtcFxuXG4gICAgdXBkYXRlT246IChuYW1lLCBldmVudCwgb3B0aW9ucywgZHVyYXRpb24pIC0+XG4gICAgICAgICMgY29waWVkIGZyb20gdXBkYXRlIFRPRE8gc2hvdWxkIGNvbnNvbGlkYXRlP1xuICAgICAgICAjIGxvb2sgb2JqZWN0IHVwIGJ5IG5hbWUgaWYgbmVjZXNzYXJ5XG4gICAgICAgIG9iaiA9IGlmIHR5cGVvZiBuYW1lIGlzICdzdHJpbmcnIHRoZW4gQGdyb3VwLmNoaWxkcmVuW25hbWVdIGVsc2UgbmFtZVxuXG4gICAgICAgIGlmIG5vdCBuYW1lIHRoZW4gb2JqID0gQHBhcGVyLnRvb2xcbiAgICAgICAgZWxzZSBpZiBub3Qgb2JqXG4gICAgICAgICAgICB0aHJvdyBcInBhcGVyIG9iamVjdCBub3QgZm91bmQsIHdyb25nIG5hbWU6IFwiICsgbmFtZSArIFwiP1wiXG5cblxuICAgICAgICBpZiB0eXBlb2YgZXZlbnQgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgaGFuZGxlciA9IEBldmVudHNbZXZlbnRdKG9iaiwgb3B0aW9ucywgQClcbiAgICAgICAgICAgIG9iai5vbihldmVudCwgaGFuZGxlcilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZHVyYXRpb24gXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+IG9iai5vZmYoZXZlbnQsIGhhbmRsZXIpKSwgZHVyYXRpb25cblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2F0dGFjaGluZyBldmVudCBoYW5kbGVyJylcbiAgICAgICAgICAgICNvYmoub24oZXZlbnQsIGhhbmRsZXIpXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICAjIGV2ZW50IGlzIG9iamVjdCB3aXRoIGV2ZW50IG5hbWVzIGFzIGtleXNcbiAgICAgICAgICAgIGZvciBrZXksIG9wdHMgb2YgZXZlbnRcbiAgICAgICAgICAgICAgICBoYW5kbGVyID0gQGV2ZW50c1trZXldKG9iaiwgb3B0cywgQClcbiAgICAgICAgICAgICAgICBvYmoub24oa2V5LCBoYW5kbGVyKVxuICAgICAgICAgICAgICAgIGlmIGR1cmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgKCAtPiBvYmoub2ZmKGtleSwgaGFuZGxlcikpLCBkdXJhdGlvblxuXG4gICAgbG9nOiAobmFtZSwgcHJvcHMpIC0+XG4gICAgICAgIG9iaiA9IGlmIHR5cGVvZiBuYW1lIGlzICdzdHJpbmcnIHRoZW4gQGdyb3VwLmNoaWxkcmVuW25hbWVdIGVsc2UgbmFtZVxuICAgICAgICBcbiAgICAgICAgQGxvZ2dlci5sb2cob2JqLCBwcm9wcylcblxuICAgIGxvZ01ldGhvZDogKG1ldGhvZCwgb3B0aW9ucykgLT5cbiAgICAgICAgQGxvZ2dlclttZXRob2RdKG9wdGlvbnMpXG5cbiAgICB0aHJlYWRDb250ZXh0V3JhcHBlcjogKGhhbmRsZXIpIC0+XG4gICAgICAgIHJldHVybiAoZXZlbnQpID0+XG4gICAgICAgICAgICBpZiBzdHJlYW0gPSBoYW5kbGVyKGV2ZW50KSB0aGVuIEBhZGRUaHJlYWQoc3RyZWFtLCBjb250ZXh0OiBldmVudC50YXJnZXQpXG5cbiAgICByZW1vdmVBbGw6ICgpIC0+XG4gICAgICAgIEBncm91cC5yZW1vdmVDaGlsZHJlbigpXG5cbiAgICByZW1vdmVBZnRlcjogKG9iaiwgdGltZSkgLT5cbiAgICAgICAgc2V0VGltZW91dCAoIC0+IG9iai5yZW1vdmUoKSksIHRpbWVcbiAgICAgICAgXG5cbiAgICBwbGF5RW50cnk6IChlbnRyeSwgY29udGV4dCwgZXZlbnQpID0+XG4gICAgICAgICMgQ29uc2lkZXIgc3dpdGNoaW5nIHRvIGhhc2ggcmVmZXJlbmNlPyBJJ20gbm90IHN1cmUgaG93IGpzIGNvbXBpbGVzXG4gICAgICAgICMgc3dpdGNoIHN0YXRlbWVudHMuLi5cblxuICAgICAgICAjIFRPRE86IG1vZGlmeWluZyB0aHJlYWQgZW50cmllcyBpcyBCQURcbiAgICAgICAgaWYgY29udGV4dD8ubmFtZSBhbmQgbm90IGVudHJ5Lm5hbWVcbiAgICAgICAgICAgIGVudHJ5Lm5hbWUgPSBjb250ZXh0Lm5hbWVcblxuICAgICAgICBzd2l0Y2ggZW50cnkudHlwZVxuICAgICAgICAgICAgd2hlbiBcImFkZFwiXG4gICAgICAgICAgICAgICAgQGFkZChlbnRyeS5pdGVtLCBlbnRyeS5vcHRpb25zLCBlbnRyeS5ldmVudHMsIGVudHJ5LmxvZywgZW50cnkuZHVyYXRpb24pXG4gICAgICAgICAgICB3aGVuIFwidXBkYXRlXCJcbiAgICAgICAgICAgICAgICAjIFRPRE8gdGhpcyBzaG91bGQganVzdCBiZSBhIHdyYXBwZXIsIGFuZCBub3QgY29udGFpbiBsb2dpY1xuICAgICAgICAgICAgICAgIEB1cGRhdGUoZW50cnkubmFtZSwgZW50cnkubWV0aG9kLCBlbnRyeS5vcHRpb25zLCBlbnRyeS5sb2cpXG4gICAgICAgICAgICB3aGVuIFwidXBkYXRlT25cIlxuICAgICAgICAgICAgICAgIEB1cGRhdGVPbihlbnRyeS5uYW1lLCBlbnRyeS5ldmVudCwgZW50cnkub3B0aW9ucywgZW50cnkuZHVyYXRpb24pXG4gICAgICAgICAgICB3aGVuIFwiY2xlYXJUaHJlYWRcIlxuICAgICAgICAgICAgICAgIEBjbGVhclRocmVhZChlbnRyeS5uYW1lKVxuICAgICAgICAgICAgd2hlbiBcInJlbW92ZUFsbFwiXG4gICAgICAgICAgICAgICAgQHJlbW92ZUFsbCgpXG4gICAgICAgICAgICB3aGVuIFwicmVnaXN0ZXJcIlxuICAgICAgICAgICAgICAgIEByZWdpc3RlcihlbnRyeS5uYW1lLCBlbnRyeS5vcHRpb25zKVxuICAgICAgICAgICAgd2hlbiBcImFkZFRocmVhZFwiXG4gICAgICAgICAgICAgICAgQGFkZFRocmVhZChlbnRyeS5uYW1lLCBlbnRyeS5vcHRpb25zKVxuICAgICAgICAgICAgd2hlbiBcImxvZ1wiXG4gICAgICAgICAgICAgICAgQGxvZyhlbnRyeS5uYW1lLCBlbnRyeS5wcm9wcylcbiAgICAgICAgICAgIHdoZW4gXCJsb2dNZXRob2RcIlxuICAgICAgICAgICAgICAgIEBsb2dNZXRob2QoZW50cnkubWV0aG9kLCBlbnRyeS5vcHRpb25zKVxuICAgICAgICAgICAgd2hlbiBcImZ1bmNcIlxuICAgICAgICAgICAgICAgIGVudHJ5LmZ1bmMoKVxuICAgICAgICAgICAgIyBpZ25vcmUgXCJtZXRhZGF0YVwiXG5cbiAgICBhZGRUaHJlYWQ6IChkaXNjLCBvcHRzID0ge30pIC0+XG4gICAgICAgIGlmIHR5cGVvZiBkaXNjIGlzIFwic3RyaW5nXCJcbiAgICAgICAgICAgIGRpc2MgPSBAcmVnaXN0ZXJlZFtkaXNjXVxuICAgICAgICBvcHRzLnBsYXlFbnRyeSA9IEBwbGF5RW50cnlcbiAgICAgICAgYmxvY2sgPSBuZXcgcnVubmVyLlRocmVhZChkaXNjLCBvcHRzKVxuICAgICAgICBAcGxheWluZy5wdXNoKGJsb2NrKVxuXG4gICAgY2xlYXJUaHJlYWQ6IChuYW1lKSAtPlxuICAgICAgICAjIFRPRE8gdGhpcyBpcyBpbmVmZmljaWVudCBsb29rdXAsIHNob3VsZCB1c2UgaGFzaCB0YWJsZT9cbiAgICAgICAgaWYgbm90IG5hbWU/IHRoZW4gQHBsYXlpbmcgPSBbXVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgaWYgbm90IEFycmF5LmlzQXJyYXkobmFtZSkgdGhlbiBuYW1lID0gW25hbWVdXG4gICAgICAgICAgICBmb3IgYmxvY2ssIGlpIGluIEBwbGF5aW5nXG4gICAgICAgICAgICAgICAgaWYgYmxvY2submFtZSBpbiBuYW1lIFxuICAgICAgICAgICAgICAgICAgICBibG9jay5lbmQoKVxuICAgICAgICAgICAgICAgICAgICBAcGxheWluZy5zcGxpY2UoaWksIDEpXG5cbiAgICAgICAgcmV0dXJuIEBwbGF5aW5nLmxlbmd0aFxuXG4gICAgcnVuVGhyZWFkczogKGNybnRUaW1lKSA9PlxuICAgICAgICByZW1haW5pbmcgPSAwXG4gICAgICAgIHJlbW92ZV9paSA9IFtdXG4gICAgICAgIGZvciBibG9jaywgaWkgaW4gQHBsYXlpbmcgYnkgLTFcbiAgICAgICAgICAgIGxlZnQgPSBibG9jay5ydW4oY3JudFRpbWUpXG4gICAgICAgICAgICBpZiBsZWZ0IHRoZW4gcmVtYWluaW5nKysgZWxzZSBAcGxheWluZy5zcGxpY2UoaWksIDEpXG5cbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZ1xuXG4gICAgcmVnaXN0ZXI6IChuYW1lLCBzdHJlYW0pIC0+XG4gICAgICAgIGlmIHR5cGVvZiBuYW1lID09ICdvYmplY3QnIHRoZW4gQHJlZ2lzdGVyZWQgPSBuYW1lXG4gICAgICAgIGVsc2UgQHJlZ2lzdGVyZWRbbmFtZV0gPSBzdHJlYW1cbiAgICAgICAgXG5cbiMgICAgZ3JvdXBUb0RhdGE6IChmbGF0dGVuKSAtPlxuIyAgICAgICAgIyBUT0RPIG1hdGNoTmFtZSBpcyBwYXNzZWQgdG8gbWF0Y2hcbiMgICAgICAgIGFsbERhdGEgPSAoQHBhdGhUb0RhdGEob2JqKSBmb3Igb2JqIGluIEBncm91cC5jaGlsZHJlbilcbiNcbiMgICAgICAgIGlmIGZsYXR0ZW4gdGhlbiByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCBhbGxEYXRhKVswXVxuI1xuIyAgICAgICAgYWxsRGF0YVxuI1xuIyAgICBwYXRoVG9EYXRhOiAobmFtZSwgZGF0YSkgLT5cbiMgICAgICAgIGlmIHR5cGVvZiBuYW1lIGlzICdzdHJpbmcnIHRoZW4gcGF0aCA9IEBncm91cC5jaGlsZHJlbltuYW1lXSBlbHNlIHBhdGggPSBuYW1lXG4jXG4jICAgICAgICBkYXRhID0gaWYgdHlwZW9mIGRhdGEgaXMgJ3N0cmluZycgdGhlbiBAZGF0YVtkYXRhXSA9IHt4OiBbXSwgeTogW119IFxuIyAgICAgICAgZWxzZSBkYXRhID89IHg6IFtdLCB5OiBbXVxuIyAgICAgICAgcGF0aCA9IHBhdGguY2xvbmUoKVxuIyAgICAgICAgcGF0aC5yZW1vdmUoKVxuIyAgICAgICAgcGF0aC5mbGF0dGVuKDIpXG4jICAgICAgICBmb3Igc2VnIGluIHBhdGguX3NlZ21lbnRzXG4jICAgICAgICAgICAgZGF0YS54LnB1c2goc2VnLl9wb2ludC54KVxuIyAgICAgICAgICAgIGRhdGEueS5wdXNoKHNlZy5fcG9pbnQueSlcbiNcbiMgICAgICAgIGRhdGEubmFtZSA9IHBhdGgubmFtZVxuIyAgICAgICAgZGF0YS5ncm91cCA9IHBhdGguZ3JvdXBcbiNcbiMgICAgICAgIHJldHVybiBkYXRhXG5cbndpbmRvdy5TdGl0Y2ggPSBTdGl0Y2hcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==