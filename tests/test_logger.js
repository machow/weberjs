// <reference path="../js/weber.js" />

describe('logger', function(){
    var log, obj
    beforeEach(function(){
        log = new Logger()
        obj = {a: 'one', time: 2, c: 3} 

    });
    it('creates entries from property lists', function(){
        var entry = log.createEntry(obj, ['a', 'c']);
        expect(entry).toEqual({a: 'one', c: 3});
        // a and c attributes
    });

    it('creates entries from property objects', function(){
        var entry = log.createEntry(obj, {aa: 'a', cc: 'c'});
        expect(entry).toEqual({aa: 'one', cc: 3});
    });

    it('runs special functions when properties start with #', function(){
        var entry = log.createEntry(obj, {a: 'a', time: '#time'})
        var after = performance.now()
        expect(entry['time']).toBeCloseTo(after, 1) // hack, TODO, time logging?
    });

    it('allows you to add special functions, e.g. #custom', function(){
        log.hash['#custom'] = function(){ return 'test' };
        var entry = log.createEntry(obj, {a: 'a', custom: '#custom'});
        expect(entry['custom']).toEqual('test');
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

    it('can log an entry from an array object', function(){
        log.log(['a', 'b'], {b: 1});
        expect(log.crntEntry()).toEqual({b: 'b'});
    });

    it('can log a DOM element', function(){
        var el = document.createElement('input');
        el.value = "test";
        log.log(el, ['value']);
        expect(log.crntEntry()).toEqual({value: 'test'});
    });

    it('can log DOM el fromSelector', function(){
        var el = document.createElement('input');
        el.style.display = 'none';
        var id = 'log-input-from-selector'
        el.setAttribute('id', id);
        document.body.appendChild(el);
        log.fromSelector('#' + id, ['id']);
        expect(log.crntEntry()).toEqual({id: id});
    });

    it('can update current entry', function(){
        log.log(obj, ['a', 'time', 'c']); // log entry should be obj now
        log.update({a: 1, d: 3});
        entry = log.crntEntry()
        expect(entry['a']).toBe(1); // updated
        expect(entry['d']).toBe(3); // updated
        expect(entry['c']).toBe(obj['c']); // c is left unchanged
    });
})
