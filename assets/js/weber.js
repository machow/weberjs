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
      if (!Array.isArray(this.disc)) {
        this.disc = [this.disc];
      }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImV2ZW50cy5jb2ZmZWUiLCJsb2dnZXIuY29mZmVlIiwicnVubmVyLmNvZmZlZSIsIndlYmVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0RBQUE7SUFBQTs7RUFBQSxXQUFBLEdBQWMsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUdWLFFBQUE7QUFBQTtBQUFBLFNBQUEscUNBQUE7O01BQ0ksR0FBQSxHQUFNLEdBQUksQ0FBQSxJQUFBO0FBRGQ7QUFHQSxXQUFPO0VBTkc7O0VBUWQsT0FBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLEtBQVY7QUFHTixRQUFBO0lBQUEsS0FBQSxHQUFRLFNBQUMsS0FBRCxFQUFRLEdBQVIsRUFBYSxNQUFiO0FBRUosVUFBQTtNQUFBLElBQUcsQ0FBQyxhQUFELENBQUEsSUFBYSxDQUFDLEtBQUEsWUFBaUIsTUFBbEIsQ0FBaEI7QUFDSSxhQUFBLFVBQUE7OztVQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZLEtBQVo7QUFBQSxTQURKO09BQUEsTUFJSyxJQUFHLE9BQU8sS0FBUCxLQUFnQixRQUFoQixJQUE2QixLQUFNLENBQUEsQ0FBQSxDQUFOLEtBQVksR0FBNUM7UUFFRCxJQUFBLEdBQU8sV0FBQSxDQUFZLEtBQVosRUFBbUIsS0FBTSxTQUF6QjtRQUVQLE1BQU8sQ0FBQSxHQUFBLENBQVAsR0FBYyxLQUpiOztBQU1MLGFBQU87SUFaSDtJQWVSLFdBQUEsR0FBYyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUksQ0FBQyxTQUFMLENBQWUsT0FBZixDQUFYO0lBQ2QsT0FBTyxDQUFDLEdBQVIsQ0FBWSxvQ0FBWjtJQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksV0FBWjtJQUVBLEtBQUEsQ0FBTSxXQUFOO0FBQ0EsV0FBTztFQXZCRDs7RUF5QlYsU0FBQSxHQUFZLFNBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxNQUFaO0FBQ1IsUUFBQTtXQUFBLE9BQUEsR0FBVyxTQUFDLEtBQUQ7QUFD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Q29udGVudCI6WyJnZXRQcm9wZXJ0eSA9IChvYmosIHByb3ApIC0+XG4gICAgIyBnZXRzIG5lc3RlZCBwcm9wZXJ0aWVzIHNlcGFyYXRlZCBieSAnLidcbiAgICAjIGFkYXB0ZWQgZnJvbTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjQ5MTYxNVxuICAgIGZvciBhdHRyIGluICBwcm9wLnNwbGl0KCcuJylcbiAgICAgICAgb2JqID0gb2JqW2F0dHJdXG5cbiAgICByZXR1cm4gb2JqXG5cbmNvbXBpbGUgPSAob3B0aW9ucywgZXZlbnQpIC0+XG4gICAgIyB0cmF2ZXJzZXMgZW50aXJlIG9wdGlvbnMgb2JqZWN0LCByZXBsYWNpbmcgZW50cmllcyB0aGF0IGJlZ2luIHdpdGggJ0AnXG4gICAgIyB3aXRoIGNvcnJlc3BvbmRpbmcgZXZlbnQgaW5mb3JtYXRpb25cbiAgICBwYXJzZSA9ICh0aGluZywga2V5LCBwYXJlbnQpIC0+XG4gICAgICAgICMgaWYgb2JqZWN0IHRoZW4gcmVjdXJzZVxuICAgICAgICBpZiAodGhpbmc/KSBhbmQgKHRoaW5nIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgICAgICAgICAgcGFyc2UodiwgaywgdGhpbmcpIGZvciBvd24gaywgdiBvZiB0aGluZ1xuICAgICAgICAgICAgXG4gICAgICAgICMgaWYgc3RyaW5nLCBlbmQgcmVjdXJzaW9uXG4gICAgICAgIGVsc2UgaWYgdHlwZW9mIHRoaW5nIGlzIFwic3RyaW5nXCIgYW5kIHRoaW5nWzBdIGlzICdAJ1xuICAgICAgICAgICAgIyB1c2VzIEBwcm9wbmFtZSB0byBnZXQgaW5mbyBmcm9tIGV2ZW50XG4gICAgICAgICAgICBwcm9wID0gZ2V0UHJvcGVydHkoZXZlbnQsIHRoaW5nWzEuLl0pXG4gICAgICAgICAgICAjIHJlcGxhY2UgZW50cnkgd2l0aCB0aGF0IGluZm9cbiAgICAgICAgICAgIHBhcmVudFtrZXldID0gcHJvcFxuXG4gICAgICAgIHJldHVybiBudWxsXG5cbiAgICAjIERlZXAgY29weSB0aGVuIHBhcnNlLCBUT0RPIHJlcGxhY2UgY29weSBmdW5jIHdpdGggc29tZXRoaW5nIG1vcmUgcGVyZm9ybWFudFxuICAgIG9wdGlvbnNDb3B5ID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvcHRpb25zKSlcbiAgICBjb25zb2xlLmxvZyhcIm9wdGlvbnMgY29weSBpcy4uLi4hISEhIS0tLS0hISEhISFcIilcbiAgICBjb25zb2xlLmxvZyBvcHRpb25zQ29weVxuXG4gICAgcGFyc2Uob3B0aW9uc0NvcHkpXG4gICAgcmV0dXJuIG9wdGlvbnNDb3B5XG5cbm9uS2V5RG93biA9IChvYmosIG9wdHMsIHN0aXRjaCkgLT5cbiAgICBoYW5kbGVyID0gIChldmVudCkgLT5cbiAgICAgICAgY29uc29sZS5sb2coJ2tleSBkb3duJylcbiAgICAgICAgIyBrZXkgcHJlc3NlcyBhcmUgc3BlY2lmaWVkIGFzIGtleW5hbWUgOiB0aHJlYWQgaW4gb3B0c1xuICAgICAgICAjIG90aGVyIG9wdGlvbnMgbWF5IGJlIHNwZWNpZmllZCBpbiB0aGVyZSwgc3VjaCBhcyBzaW5nbGVVc2VcbiAgICAgICAgZm9yIG93biBwcmVzc2VkLCB0aHJlYWQgb2Ygb3B0c1xuICAgICAgICAgICAgaWYgZXZlbnQua2V5ID09IHByZXNzZWRcbiAgICAgICAgICAgICAgICBpZiBvcHRzLnNpbmdsZVVzZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlbW92aW5nICN7ZXZlbnQudHlwZX1cIilcbiAgICAgICAgICAgICAgICAgICAgb2JqLm9mZihldmVudC50eXBlLCBoYW5kbGVyKVxuICAgICAgICAgICAgICAgIG5ld190aHJlYWQgPSBjb21waWxlKHRocmVhZCwgZXZlbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0aXRjaC5hZGRUaHJlYWQobmV3X3RocmVhZCwgY29udGV4dDogZXZlbnQudGFyZ2V0LCBldmVudDogZXZlbnQpXG4gICAgICAgIHJldHVybiBudWxsXG5cblxub25EZWZhdWx0ID0gKG9iaiwgb3B0cywgc3RpdGNoKSAtPlxuICAgIChldmVudCkgLT5cbiAgICAgICAgY29uc29sZS5sb2codGhpcylcbiAgICAgICAgY29uc29sZS5sb2cgJ2NhbGxpbmcgZGVmYXVsdCBldmVudCdcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheShvcHRzKVxuICAgICAgICAgICAgbmV3X3RocmVhZCA9IGNvbXBpbGUob3B0cywgZXZlbnQpXG4gICAgICAgICAgICByZXR1cm4gc3RpdGNoLmFkZFRocmVhZChuZXdfdGhyZWFkLCBjb250ZXh0OiBldmVudC50YXJnZXQsIGV2ZW50OiBldmVudClcbiAgICAgICAgZWxzZSByZXR1cm4gb3B0cygpXG5cblxuICAgICAgICBcbmV2ZW50cyA9IHtcbiAgICBjb21waWxlOiBjb21waWxlLCAjIFRPRE8sIG91dCBvZiB0aGlzIG9iamVjdFxuICAgIGtleWRvd246IG9uS2V5RG93bixcbiAgICBjbGljazogb25EZWZhdWx0LFxuICAgIGRvdWJsZWNsaWNrOiBvbkRlZmF1bHQsXG4gICAgbW91c2VlbnRlcjogb25EZWZhdWx0LFxuICAgIG1vdXNlbGVhdmU6IG9uRGVmYXVsdCxcbiAgICBtb3VzZWRyYWc6IG9uRGVmYXVsdFxufVxuXG53aW5kb3cuZXZlbnRzID0gZXZlbnRzXG4iLCIjIFRPRE8gZHVwIGZyb20gd2ViZXIuY29mZmVlLCBtYWtlIHV0aWxzIHNjcmlwdD9cbmdldFByb3BlcnR5ID0gKG9iaiwgcHJvcCkgLT5cbiAgICAjIGdldHMgbmVzdGVkIHByb3BlcnRpZXMgc2VwYXJhdGVkIGJ5ICcuJ1xuICAgICMgYWRhcHRlZCBmcm9tOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82NDkxNjE1XG4gICAgZm9yIGF0dHIgaW4gIHByb3Auc3BsaXQoJy4nKVxuICAgICAgICBvYmogPSBvYmpbYXR0cl1cblxuICAgIHJldHVybiBvYmpcblxuY2xhc3MgTG9nZ2VyXG4gICAgY29uc3RydWN0b3I6IChAZGF0YSA9IFt7fV0sIEBjcm50X2lpID0gMCkgLT5cbiAgICAgICAgQGhhc2ggPSBcbiAgICAgICAgICAgICcjdGltZSc6IC0+IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgXG4gICAgbG9nOiAob2JqLCBwcm9wZXJ0aWVzKSAtPlxuICAgICAgICBAY3JlYXRlRW50cnkob2JqLCBwcm9wZXJ0aWVzLCBAZGF0YVtAY3JudF9paV0pXG5cbiAgICB1cGRhdGU6IChyZWNvcmRzKSAtPlxuICAgICAgICBlbnRyeSA9IEBkYXRhW0Bjcm50X2lpXVxuICAgICAgICBlbnRyeVtrXSA9IHYgZm9yIG93biBrLCB2IG9mIHJlY29yZHNcblxuICAgICAgICByZXR1cm4gZW50cnlcblxuICAgIGNyZWF0ZUVudHJ5OiAob2JqLCBwcm9wZXJ0aWVzLCBlbnRyeSA9IHt9KSAtPlxuICAgICAgICBpZiBub3QgQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzKVxuICAgICAgICAgICAgZm9yIG93biBrZXksIHByb3Agb2YgcHJvcGVydGllc1xuICAgICAgICAgICAgICAgIGVudHJ5W2tleV0gPSBAcGFyc2Uob2JqLCBwcm9wKVxuICAgICAgICBlbHNlIFxuICAgICAgICAgICAgIyBhc3N1bWVzIHByb3BlcnRpZXMgaXMgbGlzdCwgYW5kIHNldHMgcHJvcGVydHkgYXMga2V5IG5hbWVcbiAgICAgICAgICAgIGZvciBwcm9wIGluIHByb3BlcnRpZXMgdGhlbiBlbnRyeVtwcm9wXSA9IEBwYXJzZShvYmosIHByb3ApXG5cbiAgICAgICAgcmV0dXJuIGVudHJ5XG5cbiAgICBwYXJzZTogKG9iaiwgcHJvcCkgLT5cbiAgICAgICAgIyBzcGVjaWFsIHRyZWF0bWVudCBvZiBzdHJpbmdzIHN0YXJ0aW5nIHdpdGggaGFzaFxuICAgICAgICBpZiBwcm9wLnN0YXJ0c1dpdGgoJyMnKSB0aGVuIEBoYXNoW3Byb3BdKClcbiAgICAgICAgIyBsb29rIHVwIHByb3BlcnR5IGZyb20gb2JqZWN0XG4gICAgICAgIGVsc2UgZ2V0UHJvcGVydHkob2JqLCBwcm9wKVxuXG4gICAgbmV4dEVudHJ5OiAoKSAtPlxuICAgICAgICBAZGF0YS5wdXNoKHt9KVxuICAgICAgICBAY3JudF9paSsrXG4gICAgXG4gICAgY3JudEVudHJ5OiAoKSAtPlxuICAgICAgICBAZGF0YVtAY3JudF9paV1cblxud2luZG93LkxvZ2dlciA9IExvZ2dlclxuIiwiVGVtcGxhdGVzID0gXG4gICAgY29sc1RvUm93czogKG9iaikgLT5cbiAgICAgICAgIyBjb252ZXJ0cyBvYmplY3Qgd2l0aCBjb2x1bW5zIG9mIGRhdGEgdG8gcm93LWxpa2UgZW50cmllc1xuICAgICAgICAjIGUuZy4ge2E6IFsxLDJdLCBiOlszLDRdfSB0byBbe2E6IDEsIGI6IDN9LCB7YTogMiwgYjogNH1dXG4gICAgICAgIGRhdGEgPSBbXVxuICAgICAgICBmb3Igb3duIGtleSBvZiBvYmpcbiAgICAgICAgICAgIGZvciBlbnRyeSwgaWkgaW4gb2JqW2tleV1cbiAgICAgICAgICAgICAgICAjIGNyZWF0ZSBuZXcgcm93IGlmIG5lZWRlZFxuICAgICAgICAgICAgICAgIHJvdyA9IGRhdGFbaWldIG9yIGRhdGFbaWldID0ge31cbiAgICAgICAgICAgICAgICByb3dba2V5XSA9IGVudHJ5XG5cbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgICAgICBcblxuICAgIGdldFByb3BlcnR5OiAob2JqLCBwYXRoLCBhc3NpZ24pIC0+XG4gICAgICAgIGZvciBhdHRyIGluIHBhdGhbMC4uLnBhdGgubGVuZ3RoLTFdICMgbGVhdmUgb3V0IGxhc3QgaXRlbVxuICAgICAgICAgICAgb2JqID0gb2JqW2F0dHJdXG5cbiAgICAgICAgbGFzdEF0dHIgPSBwYXRoWy0xLi5dXG4gICAgICAgIGlmIGFzc2lnbj8gdGhlbiByZXR1cm4gb2JqW2xhc3RBdHRyXSA9IGFzc2lnblxuICAgICAgICBlbHNlIHJldHVybiBvYmpbbGFzdEF0dHJdXG5cbiAgICBnZXRQYXJhbXM6ICh0ZW1wbGF0ZSkgLT5cbiAgICAgICAgcGFyYW1zID0ge31cbiAgICAgICAgcGFyc2UgPSAodGhpbmcsIGtleSkgLT5cbiAgICAgICAgICAgICMgdGFrZXMgb2JqZWN0IGFuZCBjb252ZXJ0cyBhbnkgZmllbGRzIHdpdGgge3t2YXJuYW1lfX0gdG8gYXJndW1lbnQgb2YgZm5cblxuICAgICAgICAgICAgIyBpZiBvYmplY3QgdGhlbiByZWN1cnNlXG4gICAgICAgICAgICBpZiAodGhpbmc/KSBhbmQgKHRoaW5nIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgICAgICAgICAgICAgICMgYXJyYXkgdG8gaG9sZCBhbGwge3t2YXJuYW1lc319IGluIHRoaXMgbm9kZSBhbmQgYmVsb3dcbiAgICAgICAgICAgICAgICBuYW1lQnVja2V0ID0gW10gICAgXG4gICAgICAgICAgICAgICAgZm9yIG93biBrLCB2IG9mIHRoaW5nXG4gICAgICAgICAgICAgICAgICAgICMgcmVjdXJzZSwgYW5kIGdldCBtYXRjaGluZyB7e3Zhcm5hbWVzfX0gaW4gY2hpbGQgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgYXJnbmFtZXMgPSBwYXJzZSh2LCBrKSAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgIyBwcmVwZW5kIGN1cnJlbnQga2V5IHRvIHBhdGggZm9yIGVhY2gge3t2YXJuYW1lfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhcmduYW1lIGluIGFyZ25hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW2FyZ25hbWVdLnVuc2hpZnQoaylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lQnVja2V0LnB1c2goYXJnbmFtZSkgICAgIyBhY2N1bXVsYXRlIGZvciBwYXNzaW5nIHVwd2FyZFxuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lQnVja2V0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGlmIHN0cmluZywgZW5kIHJlY3Vyc2lvblxuICAgICAgICAgICAgZWxzZSBpZiB0eXBlb2YgdGhpbmcgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgIHJlID0gL3t7KC4qPyl9fS9cbiAgICAgICAgICAgICAgICBtYXRjaCA9IHJlLmV4ZWModGhpbmcpXG4gICAgICAgICAgICAgICAgaWYgbWF0Y2g/IFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXNbbWF0Y2hbMV1dID0gW11cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFttYXRjaFsxXV1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICAgICBwYXJzZSh0ZW1wbGF0ZSlcbiAgICAgICAgcmV0dXJuIHBhcmFtc1xuXG4gICAgZnVuY3RpemU6ICh0ZW1wbGF0ZSwgY29weT10cnVlKSAtPlxuICAgICAgICBwYXJhbXMgPSBAZ2V0UGFyYW1zKHRlbXBsYXRlKVxuXG4gICAgICAgIChjbmZnKSA9PlxuICAgICAgICAgICAgIyBkZWVwIGNvcHksIHVzaW5nIGRlZXBDb3B5IGZyb20gbG9kYXNoIHdvdWxkIGJlIGZhc3RlclxuICAgICAgICAgICAgaWYgY29weSB0aGVuIGNybnRfdGVtcGxhdGUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRlbXBsYXRlKSlcbiAgICAgICAgICAgIGVsc2UgY3JudF90ZW1wbGF0ZSA9IHRlbXBsYXRlXG5cbiAgICAgICAgICAgIGZvciBhcmcsIHBhdGggb2YgcGFyYW1zXG4gICAgICAgICAgICAgICAgdmFsID0gY25mZ1thcmddXG4gICAgICAgICAgICAgICAgQGdldFByb3BlcnR5KGNybnRfdGVtcGxhdGUsIHBhdGgsIHZhbClcbiAgICAgICAgICAgIHJldHVybiBjcm50X3RlbXBsYXRlIFxuXG4gICAgbWFrZVRyaWFsczogKHRlbXBsYXRlLCBjbmZnVGFibGUsIHRpbWVsaW5lID0gbmV3IFRyaWFsVGltZWxpbmUoKSkgLT5cbiAgICAgICAgZnVuY3RpemVkID0gQGZ1bmN0aXplKHRlbXBsYXRlKVxuICAgICAgICBjbmZnVGFibGUgPSBAY29sc1RvUm93cyhjbmZnVGFibGUpIGlmIG5vdCBBcnJheS5pc0FycmF5KGNuZmdUYWJsZSlcblxuICAgICAgICBwcmVmaXggPSB0aW1lbGluZS5tYWtlSWRSb290KCdhdXRvJylcbiAgICAgICAgY29uc29sZS5sb2cocHJlZml4KVxuICAgICAgICBcbiAgICAgICAgZm9yIHJvdywgaWkgaW4gY25mZ1RhYmxlXG4gICAgICAgICAgICB0cmlhbCA9IGZ1bmN0aXplZChyb3cpXG4gICAgICAgICAgICB0aW1lbGluZS5hZGQoXCIje3ByZWZpeH0tI3tpaX1cIiwgdHJpYWwpXG5cbiAgICAgICAgcmV0dXJuIHRpbWVsaW5lXG5cblxuY2xhc3MgVHJpYWxUaW1lbGluZVxuICAgIGNvbnN0cnVjdG9yOiAodGltZWxpbmUgPSBbXSwgQHJ1bikgLT4gXG4gICAgICAgIEB0cmlhbFRpbWVsaW5lID0gW11cbiAgICAgICAgQGNodW5rSWRzID0ge31cbiAgICAgICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIEBjcm50X2NodW5rID0gMFxuXG4gICAgICAgIEBhZGQoZW50cnkuaWQsIGVudHJ5LnRyaWFsKSBmb3IgZW50cnkgaW4gdGltZWxpbmVcblxuICAgIGFkZDogKGlkPVwiXCIsIHRyaWFsKSAtPlxuICAgICAgICBpZiBpZCBvZiBAY2h1bmtJZHMgdGhlbiB0aHJvdyBcImlkIGFscmVhZHkgaW4gdXNlXCJcbiAgICAgICAgZWxzZSBAY2h1bmtJZHNbaWRdID0gQHRyaWFsVGltZWxpbmUubGVuZ3RoXG5cbiAgICAgICAgY2h1bmsgPSBpZDogaWQsIHRyaWFsOiB0cmlhbFxuICAgICAgICBAdHJpYWxUaW1lbGluZS5wdXNoKGNodW5rKVxuXG4gICAgbWFrZUlkUm9vdDogKGlkKSAtPlxuICAgICAgICB1bmlxdWUgPSAoaWQpID0+XG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoaWQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMga2V5cyBtZXRob2Qgbm90IGllOCBjb21wYXRpYmxlLi5cbiAgICAgICAgICAgIChPYmplY3Qua2V5cyhAY2h1bmtJZHMpLmxlbmd0aCA9PSAwKSBvciAocmUudGVzdChrKSBmb3Igb3duIGsgb2YgQGNodW5rSWRzKS5zb21lKChpaSkgLT4gaWkpXG5cbiAgICAgICAgaWYgbm90IHVuaXF1ZShpZClcbiAgICAgICAgICAgIGluY3IgPSAwXG4gICAgICAgICAgICBuZXdfaWQgPSBpbmNyKysgd2hpbGUgbm90IHVuaXF1ZShpZClcbiAgICAgICAgICAgIHJldHVybiBuZXdfaWRcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgIHJldHVybiBpZFxuXG4gICAgbmV4dENodW5rOiAoKSAtPlxuICAgICAgICBAY3JudF9jaHVuaysrXG4gICAgICAgIGlmIEBjcm50X2NodW5rIDwgQHRyaWFsVGltZWxpbmUubGVuZ3RoIHRoZW4gQHRyaWFsVGltZWxpbmVbQGNybnRfY2h1bmtdXG5cbiAgICBnb1RvQ2h1bms6IChjaHVua0lkKSAtPlxuICAgICAgICBAY3JudF9jaHVuayA9IEBjaHVua0lkc1tjaHVua0lkXVxuXG4gICAgcnVuTmV4dDogKCkgLT5cbiAgICAgICAgQG5leHRDaHVuaygpXG4gICAgICAgIEBydW5Dcm50KClcblxuICAgIHJ1bkNodW5rOiAoY2h1bmtJZCkgLT5cbiAgICAgICAgQGdvVG9DaHVuayhjaHVua0lkKVxuICAgICAgICBAcnVuQ3JudCgpXG5cbiAgICBydW5Dcm50OiAoKSAtPlxuICAgICAgICBAYWN0aXZlID0gdHJ1ZVxuICAgICAgICBjb25zb2xlLmxvZyBcInJ1bm5pbmcgdHJpYWwgI3tAY3JudF9jaHVua31cIlxuICAgICAgICBjaHVuayA9IEB0cmlhbFRpbWVsaW5lW0Bjcm50X2NodW5rXVxuICAgICAgICBpZiBjaHVuayB0aGVuIEBydW4oY2h1bmsudHJpYWwpIGVsc2UgQGVuZCgpXG5cbiAgICBydW5GaXJzdDogKCkgLT5cbiAgICAgICAgQGNybnRfY2h1bmsgPSAwXG4gICAgICAgIEBydW5Dcm50KClcblxuICAgIHJ1bjogKHJhd0NodW5rKSAtPlxuICAgICAgICAjIGRlZmF1bHQgcnVubmluZyBmdW5jdGlvbiwgbGlrZWx5IHNob3VsZCBiZSBvdmVybG9hZGVkXG4gICAgICAgIHJhd0NodW5rKClcblxuICAgIGVuZDogKCkgLT5cbiAgICAgICAgIyBkZWZhdWx0IGVuZCBmdW5jdGlvbiwgc2hvdWxkIGJlIG92ZXJsb2FkZWRcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgIHJlc2V0OiAoKSAtPlxuICAgICAgICBAdHJpYWxUaW1lbGluZSA9IFtdXG4gICAgICAgIEBjaHVua0lkcyA9IHt9XG4gICAgICAgIEBjcm50X2NodW5rID0gMFxuXG5cbmNsYXNzIFRocmVhZFxuICAgIGNvbnN0cnVjdG9yOiAoQGRpc2MsIHtAY2FsbGJhY2ssIEBjb250ZXh0LCBAZXZlbnQsIEBwbGF5RW50cnl9KSAtPlxuICAgICAgICAjaWYgdHlwZW9mIGRpc2MgPT0gJ3N0cmluZydcbiAgICAgICAgIyAgICBuYW1lID0gZGlzY1xuICAgICAgICAjICAgIGRpc2MgPSBAcmVnaXN0ZXJlZFtuYW1lXVxuICAgICAgICAjICAgIGNvbnNvbGUubG9nKGRpc2MpXG5cbiAgICAgICAgIyBwYXJzZSBtZXRhZGF0YVxuICAgICAgICBAbmFtZSA9IFwiXCJcbiAgICAgICAgQGNybnRfaWkgPSAwXG4gICAgICAgIEBjaGlsZHJlbiA9IFtdXG4gICAgICAgIEBhY3RpdmUgPSBmYWxzZVxuXG4gICAgICAgIEBkaXNjID0gW0BkaXNjXSBpZiBub3QgQXJyYXkuaXNBcnJheShAZGlzYylcbiAgICAgICAgaWYgQGRpc2NbMF0udHlwZSBpcyAnbWV0YWRhdGEnIHRoZW4gQHBhcnNlTWV0YURhdGEoQGRpc2NbMF0pXG5cbiAgICAgICAgIyBwYXJzZSBvcHRpb25zXG5cbiAgICAgICAgQHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXG5cbiAgICBwYXJzZU1ldGFEYXRhOiAoe0BuYW1lfSkgLT5cblxuICAgIHJ1bjogKGNybnRUaW1lKSAtPlxuICAgICAgICB3aGlsZSAoZW50cnkgPSBAZGlzY1tAY3JudF9paV0pIGFuZCBcbiAgICAgICAgICAgICAgKGVudHJ5LnRpbWUgaXMgdW5kZWZpbmVkIG9yIGVudHJ5LnRpbWUgKyBAc3RhcnRUaW1lIDwgY3JudFRpbWUpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlbnRyeSlcbiAgICAgICAgICAgIEBwbGF5RW50cnkoZW50cnksIEBjb250ZXh0LCBAZXZlbnQpXG4gICAgICAgICAgICBAY3JudF9paSsrXG4gICAgICAgIHJlbWFpbmluZyA9IEBkaXNjLmxlbmd0aCAtIEBjcm50X2lpXG4gICAgICAgIGlmIG5vdCByZW1haW5pbmcgXG4gICAgICAgICAgICAjIFdhaXQgZm9yIGFsbCBjaGlsZHJlbiB0byBiZWNvbWUgaW5hY3RpdmUgYmVmb3JlIGZpcmluZyBjYWxsYmFja1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NwZW50JylcbiAgICAgICAgICAgIGlmIEBhY3RpdmVDaGlsZHJlbigpLmxlbmd0aCBpcyAwXG4gICAgICAgICAgICAgICAgQGNhbGxiYWNrPygpXG4gICAgICAgICAgICAgICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIHJldHVybiByZW1haW5pbmdcblxuICAgIGFkZENoaWxkOiAoY2hpbGQpIC0+XG4gICAgICAgIEBjaGlsZHJlbi5wdXNoKGNoaWxkKVxuXG4gICAgYWN0aXZlQ2hpbGRyZW46ICgpIC0+XG4gICAgICAgIGJsb2NrIGZvciBibG9jayBpbiBAY2hpbGRyZW4gd2hlbiBibG9jay5hY3RpdmVcblxuICAgIGVuZDogKCkgLT5cbiAgICAgICAgQGNybnRfaWkgPSBAZGlzYy5sZW5ndGhcbiAgICBcblxud2luZG93LnJ1bm5lciA9IFxuICAgIFRlbXBsYXRlczogVGVtcGxhdGVzXG4gICAgVHJpYWxUaW1lbGluZTogVHJpYWxUaW1lbGluZVxuICAgIFRocmVhZDogVGhyZWFkXG4iLCJjbGFzcyBTdGl0Y2hcbiAgICBjb25zdHJ1Y3RvcjogKGNhbnZhc0lkLCBjaHVua3MgPSB7fSkgLT5cbiAgICAgICAgQGhpc3RvcnkgPSBbXVxuICAgICAgICBAcmVnaXN0ZXJlZCA9IHt9XG4gICAgICAgIEBwbGF5aW5nID0gW11cblxuICAgICAgICAjIG1vZHVsZXNcbiAgICAgICAgQGxvZ2dlciA9IG5ldyBMb2dnZXIoKVxuICAgICAgICBAZXZlbnRzID0gd2luZG93LmV2ZW50cyAjVE9ETyBiZXR0ZXIgbW9kdWxhcml6YXRpb25cbiAgICAgICAgQHJ1bm5lciA9IHdpbmRvdy5ydW5uZXIgI1RPRE8ganVzdCBnZXQgVHJpYWxSdW5uZXIgYW5kIFRocmVhZFxuICAgICAgICBcbiAgICAgICAgIyBzZXR1cCBuZXcgcGFwZXJzY29wZVxuICAgICAgICBAcGFwZXIgPSBuZXcgcGFwZXIuUGFwZXJTY29wZSgpXG4gICAgICAgIEBwYXBlci5zZXR1cChjYW52YXNJZClcbiAgICAgICAgbmV3IEBwYXBlci5Ub29sKClcbiAgICAgICAgQHBhcGVyLnZpZXcub24gJ2ZyYW1lJywgKCkgPT4gQHJ1blRocmVhZHMocGVyZm9ybWFuY2Uubm93KCkpXG5cbiAgICAgICAgQGdyb3VwID0gbmV3IEBwYXBlci5Hcm91cChuYW1lOidkZWZhdWx0JylcblxuICAgICAgICAjIFRyaWFsIFJ1bm5lclxuICAgICAgICBAVFIgPSBAbmV3VGltZWxpbmUoKVxuICAgICAgICBmb3IgY2h1bmssIGlpIGluIGNodW5rcyBcbiAgICAgICAgICAgIEBUUi5hZGQoaWksIGNodW5rKVxuXG5cbiAgICBydW46IC0+IEBUUi5ydW5Dcm50KClcblxuICAgIG5ld1RpbWVsaW5lOiAoKSAtPlxuICAgICAgICBUUiA9IG5ldyBydW5uZXIuVHJpYWxUaW1lbGluZShbXSlcblxuICAgICAgICBUUi5ydW4gPSAoY2h1bmspID0+XG4gICAgICAgICAgICBkb25lID0gPT4gVFIucnVuTmV4dCgpXG4gICAgICAgICAgICBpZiBjaHVuayBpbnN0YW5jZW9mIHJ1bm5lci5UcmlhbFRpbWVsaW5lXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3J1bm5pbmcgc3VidGltZWxpbmUnKVxuICAgICAgICAgICAgICAgIGNodW5rLnJ1bkNybnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZWxzZSBpZiB0eXBlb2YgY2h1bmsgaXMgXCJvYmplY3RcIlxuICAgICAgICAgICAgICAgIEBhZGRUaHJlYWQoY2h1bmssIGNhbGxiYWNrOiBkb25lKVxuICAgICAgICAgICAgZWxzZSBpZiB0eXBlb2YgY2h1bmsgaXMgXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgY2h1bmsoZG9uZSwgQClcblxuICAgICAgICByZXR1cm4gVFJcblxuICAgIG1ha2VUcmlhbHM6ICh0ZW1wbGF0ZSwgYXJncykgLT5cbiAgICAgICAgdGltZWxpbmUgPSBydW5uZXIuVGVtcGxhdGVzLm1ha2VUcmlhbHModGVtcGxhdGUsIGFyZ3MsIEBuZXdUaW1lbGluZSgpKVxuXG5cbiAgICBnZXRQcm9wZXJ0eTogKG9iaiwgcHJvcCkgLT5cbiAgICAgICAgIyBnZXRzIG5lc3RlZCBwcm9wZXJ0aWVzIHNlcGFyYXRlZCBieSAnLidcbiAgICAgICAgIyBhZGFwdGVkIGZyb206IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzY0OTE2MTVcbiAgICAgICAgZm9yIGF0dHIgaW4gIHByb3Auc3BsaXQoJy4nKVxuICAgICAgICAgICAgb2JqID0gb2JqW2F0dHJdXG5cbiAgICAgICAgcmV0dXJuIG9ialxuXG4gICAgYWRkOiAoaXRlbSwgb3B0aW9ucywgZXZlbnRzLCBsb2csIGR1cmF0aW9uKSAtPlxuICAgICAgICBpZiB0eXBlb2YgaXRlbSBpcyBub3QgJ3N0cmluZydcbiAgICAgICAgICAgIHRocm93IFwiaXRlbSBtdXN0IGJlIHRoZSBuYW1lIG9mIGEgcGFwZXIgb2JqZWN0XCJcblxuICAgICAgICBDbHMgPSBAZ2V0UHJvcGVydHkoQHBhcGVyLCBpdGVtKVxuICAgICAgICBwX29iaiA9IG5ldyBDbHMob3B0aW9ucylcbiAgICAgICAgQGhpc3RvcnkucHVzaCB7XG4gICAgICAgICAgICB0eXBlOiAnYWRkJ1xuICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9uc1xuICAgICAgICAgICAgZXZlbnRzOiBldmVudHNcbiAgICAgICAgICAgIHRpbWU6IERhdGUubm93KClcbiAgICAgICAgfVxuICAgICAgICBAZ3JvdXAuYWRkQ2hpbGQocF9vYmopXG5cbiAgICAgICAgQHVwZGF0ZU9uKHBfb2JqLCBldmVudHMpIGlmIGV2ZW50c1xuICAgICAgICBAbG9nKHBfb2JqLCBsb2cpICAgICAgICAgaWYgbG9nXG4gICAgICAgIEByZW1vdmVBZnRlcihwX29iaiwgZHVyYXRpb24pIGlmIGR1cmF0aW9uXG5cbiAgICAgICAgcmV0dXJuIHBfb2JqXG5cbiAgICB1cGRhdGU6IChuYW1lLCBtZXRob2QsIG9wdGlvbnMsIGxvZywgZHVyYXRpb24pIC0+XG4gICAgICAgICMgbG9vayBvYmplY3QgdXAgYnkgbmFtZSBpZiBuZWNlc3NhcnlcbiAgICAgICAgY29uc29sZS5sb2cobmFtZSlcbiAgICAgICAgb2JqID0gaWYgdHlwZW9mIG5hbWUgaXMgJ3N0cmluZycgdGhlbiBAZ3JvdXAuY2hpbGRyZW5bbmFtZV0gZWxzZSBuYW1lXG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgb2JqXG4gICAgICAgICAgICB0aHJvdyBcInBhcGVyIG9iamVjdCBub3QgZm91bmQsIHdyb25nIG5hbWU6IFwiICsgbmFtZSArIFwiP1wiXG5cbiAgICAgICAgdG1wID0gb2JqW21ldGhvZF0ob3B0aW9ucylcbiAgICAgICAgQGhpc3RvcnkucHVzaCB7XG4gICAgICAgICAgICB0eXBlOiAndXBkYXRlJ1xuICAgICAgICAgICAgbWV0aG9kOiBtZXRob2RcbiAgICAgICAgICAgIG5hbWU6IG9iai5uYW1lXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zXG4gICAgICAgICAgICB0aW1lOiBEYXRlLm5vdygpXG4gICAgICAgIH1cblxuICAgICAgICAjQHVwZGF0ZU9uKG9iaiwgZXZlbnRzKSBpZiBldmVudHNcbiAgICAgICAgQGxvZyhvYmosIGxvZykgaWYgbG9nXG4gICAgICAgIEByZW1vdmVBZnRlcihvYmosIGR1cmF0aW9uKSBpZiBkdXJhdGlvblxuICAgICAgICByZXR1cm4gdG1wXG5cbiAgICB1cGRhdGVPbjogKG5hbWUsIGV2ZW50LCBvcHRpb25zLCBkdXJhdGlvbikgLT5cbiAgICAgICAgIyBjb3BpZWQgZnJvbSB1cGRhdGUgVE9ETyBzaG91bGQgY29uc29saWRhdGU/XG4gICAgICAgICMgbG9vayBvYmplY3QgdXAgYnkgbmFtZSBpZiBuZWNlc3NhcnlcbiAgICAgICAgb2JqID0gaWYgdHlwZW9mIG5hbWUgaXMgJ3N0cmluZycgdGhlbiBAZ3JvdXAuY2hpbGRyZW5bbmFtZV0gZWxzZSBuYW1lXG5cbiAgICAgICAgaWYgbm90IG5hbWUgdGhlbiBvYmogPSBAcGFwZXIudG9vbFxuICAgICAgICBlbHNlIGlmIG5vdCBvYmpcbiAgICAgICAgICAgIHRocm93IFwicGFwZXIgb2JqZWN0IG5vdCBmb3VuZCwgd3JvbmcgbmFtZTogXCIgKyBuYW1lICsgXCI/XCJcblxuXG4gICAgICAgIGlmIHR5cGVvZiBldmVudCBpcyBcInN0cmluZ1wiXG4gICAgICAgICAgICBoYW5kbGVyID0gQGV2ZW50c1tldmVudF0ob2JqLCBvcHRpb25zLCBAKVxuICAgICAgICAgICAgb2JqLm9uKGV2ZW50LCBoYW5kbGVyKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBkdXJhdGlvbiBcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0ICggLT4gb2JqLm9mZihldmVudCwgaGFuZGxlcikpLCBkdXJhdGlvblxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYXR0YWNoaW5nIGV2ZW50IGhhbmRsZXInKVxuICAgICAgICAgICAgI29iai5vbihldmVudCwgaGFuZGxlcilcbiAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICMgZXZlbnQgaXMgb2JqZWN0IHdpdGggZXZlbnQgbmFtZXMgYXMga2V5c1xuICAgICAgICAgICAgZm9yIGtleSwgb3B0cyBvZiBldmVudFxuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBAZXZlbnRzW2tleV0ob2JqLCBvcHRzLCBAKVxuICAgICAgICAgICAgICAgIG9iai5vbihrZXksIGhhbmRsZXIpXG4gICAgICAgICAgICAgICAgaWYgZHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCAoIC0+IG9iai5vZmYoa2V5LCBoYW5kbGVyKSksIGR1cmF0aW9uXG5cbiAgICBsb2c6IChuYW1lLCBwcm9wcykgLT5cbiAgICAgICAgb2JqID0gaWYgdHlwZW9mIG5hbWUgaXMgJ3N0cmluZycgdGhlbiBAZ3JvdXAuY2hpbGRyZW5bbmFtZV0gZWxzZSBuYW1lXG4gICAgICAgIFxuICAgICAgICBAbG9nZ2VyLmxvZyhvYmosIHByb3BzKVxuXG4gICAgbG9nTWV0aG9kOiAobWV0aG9kLCBvcHRpb25zKSAtPlxuICAgICAgICBAbG9nZ2VyW21ldGhvZF0ob3B0aW9ucylcblxuICAgIHRocmVhZENvbnRleHRXcmFwcGVyOiAoaGFuZGxlcikgLT5cbiAgICAgICAgcmV0dXJuIChldmVudCkgPT5cbiAgICAgICAgICAgIGlmIHN0cmVhbSA9IGhhbmRsZXIoZXZlbnQpIHRoZW4gQGFkZFRocmVhZChzdHJlYW0sIGNvbnRleHQ6IGV2ZW50LnRhcmdldClcblxuICAgIHJlbW92ZUFsbDogKCkgLT5cbiAgICAgICAgQGdyb3VwLnJlbW92ZUNoaWxkcmVuKClcblxuICAgIHJlbW92ZUFmdGVyOiAob2JqLCB0aW1lKSAtPlxuICAgICAgICBzZXRUaW1lb3V0ICggLT4gb2JqLnJlbW92ZSgpKSwgdGltZVxuICAgICAgICBcblxuICAgIHBsYXlFbnRyeTogKGVudHJ5LCBjb250ZXh0LCBldmVudCkgPT5cbiAgICAgICAgIyBDb25zaWRlciBzd2l0Y2hpbmcgdG8gaGFzaCByZWZlcmVuY2U/IEknbSBub3Qgc3VyZSBob3cganMgY29tcGlsZXNcbiAgICAgICAgIyBzd2l0Y2ggc3RhdGVtZW50cy4uLlxuXG4gICAgICAgICMgVE9ETzogbW9kaWZ5aW5nIHRocmVhZCBlbnRyaWVzIGlzIEJBRFxuICAgICAgICBpZiBjb250ZXh0Py5uYW1lIGFuZCBub3QgZW50cnkubmFtZVxuICAgICAgICAgICAgZW50cnkubmFtZSA9IGNvbnRleHQubmFtZVxuXG4gICAgICAgIHN3aXRjaCBlbnRyeS50eXBlXG4gICAgICAgICAgICB3aGVuIFwiYWRkXCJcbiAgICAgICAgICAgICAgICBAYWRkKGVudHJ5Lml0ZW0sIGVudHJ5Lm9wdGlvbnMsIGVudHJ5LmV2ZW50cywgZW50cnkubG9nLCBlbnRyeS5kdXJhdGlvbilcbiAgICAgICAgICAgIHdoZW4gXCJ1cGRhdGVcIlxuICAgICAgICAgICAgICAgICMgVE9ETyB0aGlzIHNob3VsZCBqdXN0IGJlIGEgd3JhcHBlciwgYW5kIG5vdCBjb250YWluIGxvZ2ljXG4gICAgICAgICAgICAgICAgQHVwZGF0ZShlbnRyeS5uYW1lLCBlbnRyeS5tZXRob2QsIGVudHJ5Lm9wdGlvbnMsIGVudHJ5LmxvZylcbiAgICAgICAgICAgIHdoZW4gXCJ1cGRhdGVPblwiXG4gICAgICAgICAgICAgICAgQHVwZGF0ZU9uKGVudHJ5Lm5hbWUsIGVudHJ5LmV2ZW50LCBlbnRyeS5vcHRpb25zLCBlbnRyeS5kdXJhdGlvbilcbiAgICAgICAgICAgIHdoZW4gXCJjbGVhclRocmVhZFwiXG4gICAgICAgICAgICAgICAgQGNsZWFyVGhyZWFkKGVudHJ5Lm5hbWUpXG4gICAgICAgICAgICB3aGVuIFwicmVtb3ZlQWxsXCJcbiAgICAgICAgICAgICAgICBAcmVtb3ZlQWxsKClcbiAgICAgICAgICAgIHdoZW4gXCJyZWdpc3RlclwiXG4gICAgICAgICAgICAgICAgQHJlZ2lzdGVyKGVudHJ5Lm5hbWUsIGVudHJ5Lm9wdGlvbnMpXG4gICAgICAgICAgICB3aGVuIFwiYWRkVGhyZWFkXCJcbiAgICAgICAgICAgICAgICBAYWRkVGhyZWFkKGVudHJ5Lm5hbWUsIGVudHJ5Lm9wdGlvbnMpXG4gICAgICAgICAgICB3aGVuIFwibG9nXCJcbiAgICAgICAgICAgICAgICBAbG9nKGVudHJ5Lm5hbWUsIGVudHJ5LnByb3BzKVxuICAgICAgICAgICAgd2hlbiBcImxvZ01ldGhvZFwiXG4gICAgICAgICAgICAgICAgQGxvZ01ldGhvZChlbnRyeS5tZXRob2QsIGVudHJ5Lm9wdGlvbnMpXG4gICAgICAgICAgICB3aGVuIFwiZnVuY1wiXG4gICAgICAgICAgICAgICAgZW50cnkuZnVuYygpXG4gICAgICAgICAgICAjIGlnbm9yZSBcIm1ldGFkYXRhXCJcblxuICAgIGFkZFRocmVhZDogKGRpc2MsIG9wdHMgPSB7fSkgLT5cbiAgICAgICAgaWYgdHlwZW9mIGRpc2MgaXMgXCJzdHJpbmdcIlxuICAgICAgICAgICAgZGlzYyA9IEByZWdpc3RlcmVkW2Rpc2NdXG4gICAgICAgIG9wdHMucGxheUVudHJ5ID0gQHBsYXlFbnRyeVxuICAgICAgICBibG9jayA9IG5ldyBydW5uZXIuVGhyZWFkKGRpc2MsIG9wdHMpXG4gICAgICAgIEBwbGF5aW5nLnB1c2goYmxvY2spXG5cbiAgICBjbGVhclRocmVhZDogKG5hbWUpIC0+XG4gICAgICAgICMgVE9ETyB0aGlzIGlzIGluZWZmaWNpZW50IGxvb2t1cCwgc2hvdWxkIHVzZSBoYXNoIHRhYmxlP1xuICAgICAgICBpZiBub3QgbmFtZT8gdGhlbiBAcGxheWluZyA9IFtdXG4gICAgICAgIGVsc2UgXG4gICAgICAgICAgICBpZiBub3QgQXJyYXkuaXNBcnJheShuYW1lKSB0aGVuIG5hbWUgPSBbbmFtZV1cbiAgICAgICAgICAgIGZvciBibG9jaywgaWkgaW4gQHBsYXlpbmdcbiAgICAgICAgICAgICAgICBpZiBibG9jay5uYW1lIGluIG5hbWUgXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmVuZCgpXG4gICAgICAgICAgICAgICAgICAgIEBwbGF5aW5nLnNwbGljZShpaSwgMSlcblxuICAgICAgICByZXR1cm4gQHBsYXlpbmcubGVuZ3RoXG5cbiAgICBydW5UaHJlYWRzOiAoY3JudFRpbWUpID0+XG4gICAgICAgIHJlbWFpbmluZyA9IDBcbiAgICAgICAgcmVtb3ZlX2lpID0gW11cbiAgICAgICAgZm9yIGJsb2NrLCBpaSBpbiBAcGxheWluZyBieSAtMVxuICAgICAgICAgICAgbGVmdCA9IGJsb2NrLnJ1bihjcm50VGltZSlcbiAgICAgICAgICAgIGlmIGxlZnQgdGhlbiByZW1haW5pbmcrKyBlbHNlIEBwbGF5aW5nLnNwbGljZShpaSwgMSlcblxuICAgICAgICByZXR1cm4gcmVtYWluaW5nXG5cbiAgICByZWdpc3RlcjogKG5hbWUsIHN0cmVhbSkgLT5cbiAgICAgICAgaWYgdHlwZW9mIG5hbWUgPT0gJ29iamVjdCcgdGhlbiBAcmVnaXN0ZXJlZCA9IG5hbWVcbiAgICAgICAgZWxzZSBAcmVnaXN0ZXJlZFtuYW1lXSA9IHN0cmVhbVxuICAgICAgICBcblxuIyAgICBncm91cFRvRGF0YTogKGZsYXR0ZW4pIC0+XG4jICAgICAgICAjIFRPRE8gbWF0Y2hOYW1lIGlzIHBhc3NlZCB0byBtYXRjaFxuIyAgICAgICAgYWxsRGF0YSA9IChAcGF0aFRvRGF0YShvYmopIGZvciBvYmogaW4gQGdyb3VwLmNoaWxkcmVuKVxuI1xuIyAgICAgICAgaWYgZmxhdHRlbiB0aGVuIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIGFsbERhdGEpWzBdXG4jXG4jICAgICAgICBhbGxEYXRhXG4jXG4jICAgIHBhdGhUb0RhdGE6IChuYW1lLCBkYXRhKSAtPlxuIyAgICAgICAgaWYgdHlwZW9mIG5hbWUgaXMgJ3N0cmluZycgdGhlbiBwYXRoID0gQGdyb3VwLmNoaWxkcmVuW25hbWVdIGVsc2UgcGF0aCA9IG5hbWVcbiNcbiMgICAgICAgIGRhdGEgPSBpZiB0eXBlb2YgZGF0YSBpcyAnc3RyaW5nJyB0aGVuIEBkYXRhW2RhdGFdID0ge3g6IFtdLCB5OiBbXX0gXG4jICAgICAgICBlbHNlIGRhdGEgPz0geDogW10sIHk6IFtdXG4jICAgICAgICBwYXRoID0gcGF0aC5jbG9uZSgpXG4jICAgICAgICBwYXRoLnJlbW92ZSgpXG4jICAgICAgICBwYXRoLmZsYXR0ZW4oMilcbiMgICAgICAgIGZvciBzZWcgaW4gcGF0aC5fc2VnbWVudHNcbiMgICAgICAgICAgICBkYXRhLngucHVzaChzZWcuX3BvaW50LngpXG4jICAgICAgICAgICAgZGF0YS55LnB1c2goc2VnLl9wb2ludC55KVxuI1xuIyAgICAgICAgZGF0YS5uYW1lID0gcGF0aC5uYW1lXG4jICAgICAgICBkYXRhLmdyb3VwID0gcGF0aC5ncm91cFxuI1xuIyAgICAgICAgcmV0dXJuIGRhdGFcblxud2luZG93LlN0aXRjaCA9IFN0aXRjaFxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9