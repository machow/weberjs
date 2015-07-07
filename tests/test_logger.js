// <reference path="../js/weber.js" />

describe('test logger', function(){
    var log, obj
    beforeEach(function(){
        log = new Logger()
        obj = {a: 'one', time: 2, c: 3} 

    });
    it('creates entries from lists', function(){
        var entry = log.createEntry(obj, ['a', 'c']);
        expect(entry).toEqual({a: 'one', c: 3});
        // a and c attributes
    });

    it('creates entries from objects', function(){
        var entry = log.createEntry(obj, {aa: 'a', cc: 'c'});
        expect(entry).toEqual({aa: 'one', cc: 3});
    });

    it('runs special functions when properties start with #', function(){
        var entry = log.createEntry(obj, {a: 'a', time: '#time'})
        var after = performance.now()
        expect(entry['time']).toBeCloseTo(after, 1) // hack, TODO, time logging?
    });

    it('creates the first log entry', function(){
        log.log(obj, {a: 'a', c: 'c'});
        expect(log.crntEntry()).toEqual({a: 'one', c: 3});
        log.nextEntry();
        expect(log.crntEntry()).toEqual({});
        log.log(obj, ['time']);
        var entry = log.log(obj, {a: 'a', crntTime: '#time'});
        expect(log.crntEntry()).toEqual({time: 2, a: 'one', crntTime: entry.crntTime})
    });
})
