// Generated by CoffeeScript 1.9.2
(function() {
  var Recorder, current_user, notool, obj, path_num, rec, recUser, tool,
    slice = [].slice;

  Recorder = (function() {
    function Recorder(history, group) {
      this.history = history != null ? history : [];
      this.group = group ? group : new Group({
        name: 'default'
      });
      this.channels = {};
      this.playing = [];
      this.data = {};
      this.channels[this.group.name] = this.group;
    }

    Recorder.prototype.getProperty = function(obj, prop) {
      var attr, i, len, ref;
      ref = prop.split('.');
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        obj = obj[attr];
      }
      return obj;
    };

    Recorder.prototype.add = function() {
      var Cls, extra, item, options, p_obj;
      item = arguments[0], options = arguments[1], extra = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (typeof item === 'string') {
        Cls = this.getProperty(paper, item);
        p_obj = (function(func, args, ctor) {
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })(Cls, [options].concat(slice.call(extra)), function(){});
        this.history.push({
          type: 'add',
          item: item,
          options: options,
          extra: extra,
          time: Date.now()
        });
        this.group.addChild(p_obj);
        return p_obj;
      } else {
        throw "item must be the name of a paper object";
      }
    };

    Recorder.prototype.update = function(name, method, options) {
      var obj, tmp;
      if (typeof name === 'string') {
        obj = this.group.children[name];
      } else {
        name;
      }
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
      return tmp;
    };

    Recorder.prototype.removeAll = function() {
      this.history.push({
        type: "removeAll",
        time: Date.now()
      });
      return this.group.removeChildren();
    };

    Recorder.prototype.playEntry = function(entry) {
      switch (entry.type) {
        case "add":
          if (entry.extra) {
            return this.add.apply(this, [entry.item, entry.options].concat(slice.call(entry.extra)));
          } else {
            return this.add(entry.item, entry.options);
          }
          break;
        case "update":
          return this.update(entry.name, entry.method, entry.options);
        case "clearStreams":
          return this.clearStreams();
        case "removeAll":
          return this.removeAll();
        case "pathToData":
          return this.pathToData(entry.name, entry.data);
        case "groupToData":
          return this.groupToData(entry.flatten, entry.dataName);
      }
    };

    Recorder.prototype.addStream = function(to, opts) {
      var callback, crnt_ii, disc, f, length, offsetTime, old_g, ref, self;
      if (opts != null ? opts.clear : void 0) {
        old_g = this.group.remove();
        this.group = new Group({
          name: (ref = opts != null ? opts.name : void 0) != null ? ref : 'default'
        });
      }
      disc = typeof to === 'string' ? this.history.slice(0, +to + 1 || 9e9) : to;
      if (!(opts != null ? opts.relStart : void 0)) {
        offsetTime = performance.now() - disc[0]['time'];
      } else {
        offsetTime = performance.now() - opts.relStart;
      }
      if (opts != null ? opts.callback : void 0) {
        callback = opts.callback;
      }
      self = this;
      crnt_ii = 0;
      length = disc.length;
      this.playing.push(f = function(crntTime) {
        var remaining;
        while (disc[crnt_ii] && disc[crnt_ii].time + offsetTime < crntTime) {
          self.playEntry(disc[crnt_ii]);
          crnt_ii++;
        }
        remaining = length - crnt_ii;
        if (!remaining) {
          if (typeof callback === "function") {
            callback();
          }
        }
        return remaining;
      });
      return f;
    };

    Recorder.prototype.clearStreams = function(stream_ii) {
      if (stream_ii == null) {
        this.playing = [];
      }
      return this.playing.length;
    };

    Recorder.prototype.runStream = function(crntTime) {
      var i, ii, out, ref, stream;
      ref = this.playing;
      for (ii = i = ref.length - 1; i >= 0; ii = i += -1) {
        stream = ref[ii];
        out = stream ? stream(crntTime) : void 0;
        if (!out) {
          this.playing.splice(ii, 1);
        }
      }
      return ii;
    };

    Recorder.prototype.groupToData = function(flatten, dataName) {
      var data, i, j, len, len1, obj, ref, ref1;
      if (flatten) {
        data = {
          x: [],
          y: []
        };
        ref = this.group.children;
        for (i = 0, len = ref.length; i < len; i++) {
          obj = ref[i];
          this.pathToData(obj, data);
        }
      } else {
        ref1 = this.group.children;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          obj = ref1[j];
          data = this.pathToData(obj);
        }
      }
      if (dataName) {
        this.data[dataName] = data;
      }
      return data;
    };

    Recorder.prototype.pathToData = function(name, data) {
      var i, len, path, ref, seg;
      if (typeof name === 'string') {
        path = this.group.children[name];
      } else {
        path = name;
      }
      data = typeof data === 'string' ? this.data[data] = {
        x: [],
        y: []
      } : data != null ? data : data = {
        x: [],
        y: []
      };
      path = path.clone();
      path.remove();
      path.flatten(2);
      ref = path._segments;
      for (i = 0, len = ref.length; i < len; i++) {
        seg = ref[i];
        data.x.push(seg._point.x);
        data.y.push(seg._point.y);
      }
      data.name = path.name;
      data.group = path.group;
      return data;
    };

    return Recorder;

  })();

  rec = new Recorder();

  path_num = 0;

  current_user = 'user-' + path_num;

  obj = null;

  recUser = new Recorder();

  tool = new Tool();

  tool.onMouseDown = function(event) {
    current_user = 'user-' + path_num;
    if (obj == null) {
      obj = recUser.add('Path', {
        segment: [event.point.x, event.point.y],
        name: current_user,
        strokeColor: 'black'
      });
    }
    return path_num++;
  };

  tool.onMouseDrag = function(event) {
    obj = recUser.update(current_user, 'add', [event.point.x, event.point.y]);
    return null;
  };

  tool.onMouseUp = function(event) {
    return obj = null;
  };

  tool.onKeyDown = function(event) {
    if (event.key === 'space') {
      return task.score();
    }
  };

  notool = new Tool();

  notool.activate();

  view.onFrame = function(event) {
    return rec.runStream(performance.now());
  };

  window.rec = rec;

  window.recUser = recUser;

  window.Recorder = Recorder;

  window.tool = tool;

  window.notool = notool;

}).call(this);
