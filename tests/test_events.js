
describe('paperPlugin events', function(){
    it('compiles a single attribute (e.g. {x: "@x"})', function(){
        expect(events.compile({a: '@x'}, {x: 2})).toEqual({a: 2});
    });

    it('compiles an array of attributes (e.g. ["@x", "@y"])', function(){
        var out = events.compile(["@x", "@y"], {x: 1, y: 2});
        expect(out).toEqual([1, 2]);
    });
});
