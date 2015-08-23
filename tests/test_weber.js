/* TODO, test new features:
 *  add, update, updateOn duration argument
*/
create_stream = function(opts){
    if (!opts) opts = [];
    var flashOrange = [
    {
      type: "update",
      method: "set",
      options: {
        strokeColor: 'orange',
        strokeWidth: 5
      },
      time: 0
      
    }];
  
    var demoStream = [
      {
        type: "add",
        item: "Path.Rectangle",
        options: {
          from: [0, 0],
          to: [50, 50],
          strokeColor: 'blue',
          fillColor: 'white',
          name: 'rect'
        },
        time: 0
      }
    ];

    if (opts.indexOf('logInEvent') > -1)
        flashOrange.push({
            type: 'log',
            props: ['strokeWidth']
        });

    if (opts.indexOf('event') > -1)
        demoStream[0].events = { doubleclick: flashOrange };

    if (opts.indexOf('eventEntry') > -1)
        demoStream.push({
            type: 'updateOn',
            name: 'rect',
            event: 'doubleclick',
            options: flashOrange,
        });

    if (opts.indexOf('log') > -1)
        demoStream[0].log = ['position.x', 'position.y'];

    if (opts.indexOf('logEntry') > -1)
        demoStream.push({
            type: 'log',
            name: 'rect',
            props: ['position.x', 'position.y'],
        });

    return demoStream
}

var c, web, shapes;
describe('stitch paperPlugin', function(){
    function short_pause(callback){
        setTimeout(callback, 65)
    }

    function emit_then_pause(name, type, callback) {
        short_pause(function(){
            r = shapes['rect'];
            r.emit(type, {target: r});
            short_pause(callback)
        })
    }

    var div;

    beforeAll(function(){
        div = document.createElement('div');
        // div.style.visibility = 'hidden'
        document.body.appendChild(div);
    });

    beforeEach(function(){
        c = document.createElement('canvas');
        c.setAttribute('keep-alive', 1);
        c.style.width = '50px';
        c.style.height = '50px';
        c.style.margin = "25px";
        c.style.padding = "5px";
        c.style.border = 'solid 1px lightgrey'
        div.appendChild(c);

        web = new Stitch(c);
        shapes = web.plugin.paper.group.children;
    });

    it('draws a rectangle immediately', function(done){
        web.addThread(create_stream());
        short_pause(function(){
            var r = shapes['rect'];
            expect(r).toBeDefined();
            expect(r.position.x).toEqual(25);
            done();
        });
    });

    it('draws a rectangle without time attr immediately', function(done){
        var entry = create_stream();
        delete entry[0].time

        web.addThread(entry);
        short_pause(function(){
            var r = shapes['rect'];
            expect(r).toBeDefined();
            expect(r.position.x).toEqual(25);
            done();
        });
    });

    it('responds to events in type: add', function(done){
        web.addThread(create_stream(['event']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(r.strokeWidth).toEqual(5);
            done();
        });
    });

    it('responds to events as separate entry', function(done){
        web.addThread(create_stream(['eventEntry']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(r.strokeWidth).toEqual(5);
            done();
        });
    });

    it('uses log in type: add', function(done){
        web.addThread(create_stream(['log']));
        short_pause(function(){
            expect(web.logger.crntEntry()).toEqual({'position.x': 25, 'position.y': 25});
            done()
        })
    });

    it('uses log in type: update', function(done){
        var simple = create_stream();
        simple.push({
            type: 'update',
            name: 'rect',
            log: ['strokeWidth'],
            method: 'set',
            options: {
                strokeWidth: 5
            }
        });
        web.addThread(simple);
        short_pause(function(){
            expect(web.logger.crntEntry()).toEqual({strokeWidth: 5});
            done();
        });
    });

    it('uses log as separate entry', function(done){
        web.addThread(create_stream(['logEntry']));
        short_pause(function(){
            expect(web.logger.crntEntry()).toEqual({'position.x': 25, 'position.y': 25});
            done()
        })
    });

    it('logs strokeWidth change in event', function(done){
        web.addThread(create_stream(['logInEvent', 'event']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(web.logger.crntEntry()).toEqual({strokeWidth: 5});
            done();
        });
    });

    it('removeAll entries', function(done){
        entry = create_stream();
        entry.push({
            type: 'removeAll',
            time: 25
        });
        web.addThread(entry);
        short_pause(function(){
            expect(shapes['rect']).toBeUndefined();
            done()
        });
    });

    it('clearThread(s) entries', function(done){
        entry = create_stream();
        entry.push({
            type: 'clearThread',
            name: "", // thread's default name
            time: 0
        },
        {
            type: 'add',
            item: 'Path.Rectangle',
            options: {
                from: [0, 0],
                to: [25, 25],
                strokeColor: 'blue',
                name: 'rect2'
            },
            time: 0,
        });
        web.addThread(entry);
        short_pause(function(){
            expect(shapes['rect']).toBeDefined();
            expect(shapes['rect2']).toBeUndefined();
            done();
        });
    });

    it('executes callback once block w/o children finishes', function(done){
        var circle;
        web.addThread(create_stream(), { callback: function(){
            paper = web.plugin.paper.paper
            circle = new paper.Path.Circle({ center: [25, 25], radius: 25});
            }
        });

        short_pause(function(){
            expect(circle).toBeDefined();
            done()
        });
    });

    it('executes callback once all block children are finished', function(done){
        entry = create_stream();
        entry.push({
            type: 'updateOn',
            name: 'rect',
            event: 'doubleclick',
            options: [{
                    type: 'add',
                    item: 'Path',
                    options: {segments: [[0,0], [100,100]], name: 'pointy'},
                    time: 100
                }]
        });

        var sucess;
        web.addThread(entry, {callback: function() {success = true;}});
        var p;
        emit_then_pause('rect', 'doubleclick', function(){
            p = shapes['pointy'];
            expect(p).toBeUndefined();
            expect(sucess).toBeUndefined();
            setTimeout(function(){
                p = shapes['pointy'];
                expect(p).toBeDefined();  // sign the event has fired
                expect(success).toBe(true);
                done();
            }, 150);
        });
    });

    // Weber with TrialTimeline -----------------------------------------------
    //
    it('runs through simple set of chunks w/TrialTimeline', function(done){
        entry1 = create_stream();
        entry2 = create_stream();
        entry2[0].options.name = 'rect2';

        web.TR.add(0, entry1);
        web.TR.add(1, entry2);
        web.run();
        short_pause(function(){
            expect(shapes['rect']).toBeDefined();
            expect(shapes['rect2']).toBeDefined();
            done()
        });
    });
})


// Test Plugins ---------------------------------------------------------------
describe('stitch core', function(){

    beforeAll(function(){
        div = document.createElement('div');
        div.style.visibility = 'hidden'
        document.body.appendChild(div);
    });

    beforeEach(function(){
        c = document.createElement('canvas');
        c.setAttribute('keep-alive', 1);
        c.style.width = '50px';
        c.style.height = '50px';
        c.style.margin = "25px";
        c.style.padding = "5px";
        c.style.border = 'solid 1px lightgrey'
        div.appendChild(c);

        web = new Stitch(c, {}, []);
        //shapes = web.plugin.paper.group.children;
    });

    it('loadPlugin(s) object', function(){
    });

    it('loadPlugin(s) function', function(){
    });

    it('runs function using a thread', function(){
    });

    it('creates a timeline with single block', function(){
    });

    it('clearThread(s)', function(){
    });

});
