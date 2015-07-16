var getProperty = runner._getProperty,
    getParams = runner._getParams,
    functize = runner.functize,
    TrialTimeline = runner.TrialTimeline

describe('test runner', function(){
    //var log, obj
    //beforeEach(function(){
    //});
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
        newTemplate = functize(template)({A1: "new A1 value"});
        expect(newTemplate).toEqual({a1: "new A1 value"});
    });

    it("functizes multiple arguments", function(){
        template = {a1: "{{A1}}",
                    b1: ["{{L0}}", 1, "{{L2}}"],
                    c1: {c2: "{{C2}}"}
        }
        newTemplate = functize(template)({A1: '_A1', L0: '_L0', L2: '_L2', C2: '_C2'});
        expect(newTemplate).toEqual({
            a1: "_A1",
            b1: ['_L0', 1, '_L2'],
            c1: {c2: '_C2'}
        })
    });
});

describe('test runner:TrialRunner', function(){
    var TR, min_TR
    beforeEach(function(){
        trials = [{id: "0", trial: function(){return 'a'}},
                      {id: "1", trial: function(){return 'b'}},
                      {id: "2", trial: function(){return 'c'}}]
        min_TR = new TrialTimeline()
        full_TR = new TrialTimeline(trials, function(chunk){return chunk()});
    });
    it('adds chunks', function(){
        min_TR.add("0", 'a chunk');
        min_TR.add("1", 'another');
        expect(min_TR.trialTimeline).toEqual([{id: "0", trial: 'a chunk'}, {id: "1", trial: 'another'}]);
    });

    it('takes a custom run function', function(){
        var TR = new TrialTimeline([], function(chunk){return 'custom ' + chunk});
        TR.add("0", 'chunk');
        var result = TR.runCrntChunk();
        expect(result).toEqual('custom chunk');
    });

    it('can nextChunk then runCrntChunk', function(){
        full_TR.nextChunk();
        var result = full_TR.runCrntChunk();
        expect(result).toEqual('b');
    });

    it('can goToChunk', function(){
        var chunk2 = full_TR.goToChunk("2");
        expect(chunk2).toEqual(Number(trials[2].id));

        var result = full_TR.runCrntChunk();
        expect(result).toEqual('c');
    })
});
