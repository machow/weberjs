var Templates = runner.Templates,
    TrialTimeline = runner.TrialTimeline

describe('runner:Templates', function(){
    var getParams = Templates.getParams,
        functize = Templates.functize,
        getProperty = Templates.getProperty

    it('converts column-like data to row data', function(){
        var colData = {a: [1,2], b: [3,4]}; 
        var rowData = [{a: 1, b: 3}, {a: 2, b: 4}];

        expect(Templates.colsToRows(colData)).toEqual(rowData);

    });

    it('parses strings like {{A}}', function(){
        entry = "{{A}}";
        params = getParams(entry);
        expect(params).toEqual({A: []});
    });

    it('parses strings like " {{A}}"', function(){
        entry = " {{A}}";
        params = getParams(entry);
        expect(params).toEqual({A: []});
    });

    it('parses strings like "boring"', function(){
        entry = "boring";
        params = getParams(entry);
        expect(params).toEqual({});
    });

    it('parses a flat object', function(){
        template = {a1: "{{A1}}"};
        params = getParams(template);
        expect(params).toEqual({A1: ['a1']});
    });
    it('parses nested objects', function(){
        template = {a1: {a2: "{{A2}}"}};
        params = getParams(template);
        expect(params).toEqual({A2: ['a1', 'a2']});
    });

    it('parses lists', function(){
        template = [0, "{{L1}}", 2];
        params = getParams(template);
        expect(params).toEqual({L1: ['1']});

    });
    it('parses objects nesting lists', function(){
        template = {a1: [0, "{{L1}}", 2]};
        params = getParams(template);
        expect(params).toEqual({L1: ['a1', '1']});

    });

    // getProperty
    it("retrieves correct property from nested path (e.g. ['a1', '1'])", function(){
        template = {a1: [0, "{{L1}}", 2]};
        path = getParams(template)['L1'];
        expect(getProperty(template, path)).toEqual("{{L1}}")

    });

    it("sets properties from nested paths (e.g. ['a1', '1'])", function(){
        template = {a1: [0, "{{L1}}", 2]};
        path = getParams(template)['L1'];
        getProperty(template, path, 'newval');
        expect(getProperty(template, path)).toEqual("newval");
    });

    // functize
    it("functizes a single argument", function(){
        template = {a1: "{{A1}}"};
        newTemplate = Templates.functize(template)({A1: "new A1 value"});
        expect(newTemplate).toEqual({a1: "new A1 value"});
    });

    it("functizes multiple arguments", function(){
        template = {a1: "{{A1}}",
                    b1: ["{{L0}}", 1, "{{L2}}"],
                    c1: {c2: "{{C2}}"}
        }
        newTemplate = Templates.functize(template)({A1: '_A1', L0: '_L0', L2: '_L2', C2: '_C2'});
        expect(newTemplate).toEqual({
            a1: "_A1",
            b1: ['_L0', 1, '_L2'],
            c1: {c2: '_C2'}
        })
    });
});

describe('runner:TrialTimeline', function(){
    var TR, min_TR, record, pushOnly, history

    // push to history, then advance TR
    record = function(val) {
        return function(TR){
            history.push(val);
            TR.runNext();
        };
    };

    // push to history only
    pushOnly = function(val) {
        return function() { history.push(val)}
    };

    beforeEach(function(){
        min_TR = new TrialTimeline();

        // full_TR doesn't automatically advance after running a chunk
        // but is for testing moving around a timeline
        full_TR = new TrialTimeline([
            {id: "0", trial: pushOnly('a')},
            {id: "1", trial: pushOnly('b')},
            {id: "2", trial: pushOnly('c')}
        ]);

        history = [];

    });

    it('starts from start method', function(){
        min_TR.add(0, record(0)); min_TR.add(1, record(1));
        min_TR.start();
        expect(history).toEqual([0,1]);

    });

    it('adds chunks', function(){
        min_TR.add("0", 'a chunk');
        min_TR.add("1", 'another', 'atype');
        expect(min_TR.trialTimeline).toEqual([
            {id: "0", trial: 'a chunk', type: undefined}, 
            {id: "1", trial: 'another', type: 'atype'}
        ]);
    });

    it('takes a custom run function', function(){
        var TR = new TrialTimeline([], function(chunk){history.push('custom ' + chunk)});
        TR.add("0", 'chunk');
        TR.runCrnt()
        expect(history).toEqual(['custom chunk']);
    });

    it('can nextChunk then runCrntChunk', function(){
        full_TR.nextChunk();
        full_TR.runCrnt()
        expect(history).toEqual(['b']);
    });

    it('can goToChunk', function(){
        var chunk2 = full_TR.goToChunk("2");

        full_TR.runCrnt();
        expect(history).toEqual(['c']);
    });

    it('runs end callback', function(){
        var done = false;

        full_TR.end = function(){
            done = true
        };
        full_TR.runCrnt()
        for (var ii = 0; ii < 10; ii++){
            full_TR.runNext();
            if (done) break
        }
        expect(ii).toEqual(2);  // 3 chunks in full_TR
    });

    it('has a function block that restarts it several times', function(){
        var count = 0;
        min_TR.add(0, record(0));
        min_TR.add(1, function(TR){
            if (count++ < 2) TR.runChunk('0');
            else TR.runNext();
        });
        min_TR.start()
        expect(history).toEqual([0,0, 0]);
    });

    it('runs a subTimeline', function(){
        var sub_TR = new TrialTimeline();
        min_TR.add(0, record('min_TR0'));
        min_TR.add(1, sub_TR);
        sub_TR.add(0, record('sub_TR0'));
        min_TR.add(2, record('min_TR1'));
        min_TR.start()
        expect(history).toEqual(['min_TR0', 'sub_TR0', 'min_TR1']);
    });


    it('runs an object with start method', function(){
        obj = {
            start: function(TR){
                history.push(this.count);
                this.count++;
                TR.runNext();
            },
            count: 0
        };
        min_TR.add(0, obj);
        min_TR.add(1, obj);
        min_TR.start();
        expect(history).toEqual([0, 1]);
    });

    it('fromJSON(s) a timeline containing functions', function(){
        obj = full_TR.toJSON();


    });

    it('fromJSON(s) a timeline containing a thread', function(){
    });

    it('fromJSON(s) a timeline containing another timeline', function(){
    });

    it('fromJSON(s) a timeline with a new type of object (w/custom parser)', function(){
    });

    it('can makeTrials from template and pars', function(){
    });
});

describe('runner: Thread', function(){
    var Thread = runner.Thread,
        thread,
        result,
        child

    // Thread takes timing events relative to the time of its creation,
    // but expects performance.now() to be passed to thread.run. Since we 
    // just want to have it run, say, a time: 1000ms, we mock performance.now
    // to return 0
    //MockThread.prototype = Object.create(runner.Thread.prototype)

    beforeEach(function(){
        result = []
        thread = new Thread([], {
            playEntry: function(entry) {result.push(entry.time)}
        });
        thread.startTime = 0;
        child = new Thread([], {
            playEntry: function(entry) {result.push(entry.time)}
        });
        child.startTime = 0;
    });

    it('starts from start method', function(){
    });

    it('loops over entries sequentially', function(){
        thread.disc = [{time: 0}, {time: 1000}];
        thread.run(100);
        expect(result).toEqual([0]);
        thread.run(1000);
        expect(result).toEqual([0, 1000]);
    });

    it("will run item later if it's at back of sequence", function(){
        thread.disc = [{time: 1000}, {time: 0}];
        thread.run(100);
        expect(result).toEqual([]);
        thread.run(10000);
        expect(result).toEqual([1000, 0]);
    });

    it("moves forward through entries, no going back", function(){
    });

    it("can take a single entry as object, instead of array", function(){
    });

    it("end() moves entry index, but does not call remaining entries", function(){
    });

    it('goes inactive when finishes entries and no children', function(){
        thread.disc = [{time: 0}];
        expect(thread.active).toBe(true);
        expect(thread.activeChildren()).toEqual([]);
        thread.run(100);
        expect(thread.active).toBe(false);
    });

    it('has child but runs only itself', function(){
        thread.disc = [{time: 0}];
        child.disc = [{time: 100}];
        thread.addChild(child);
        thread.run(1000);
        expect(result).toEqual([0]);
    });

    it('has child and reports activeChildren', function(){
        thread.disc = [{time: 0}];
        thread.callback = function(){ result.push('done')}
        child.disc = [{time: 100}];
        thread.addChild(child);
        // run parent
        thread.run(100);
        expect(thread.activeChildren().length).toBe(1);
        expect(result).toEqual([0]);
        // run child
        child.run(100);
        expect(child.active).toBe(false);
        expect(result).toEqual([0, 100]);
        // callback for parent fires when it is run again
        thread.run(100); // any time should be fine
        expect(result).toEqual([0, 100, 'done']);
    });

    it('passes context argument to the run function', function(){
        thread.context = 1;
        thread.disc = [{time: 1000, val: 1}];
        thread.playEntry = function(entry, context) {
            result.push(entry.val + context)
        };
        thread.run(1000);
        expect(result).toEqual([2]);
    });

    it('converts toJSON', function(){
    });

    it('parses fromJSON', function(){
    });
});
