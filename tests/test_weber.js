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
describe('test weber', function(){
    function short_pause(callback){
        setTimeout(callback, 150)
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

        web = new Recorder(c);
        shapes = web.group.children;
        web.paper.view.onFrame = function(event){
            web.runBlocks(performance.now());
        };
    });

    it('draws a rectangle immediately', function(done){
        web.addBlock(create_stream());
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

        web.addBlock(entry);
        short_pause(function(){
            var r = shapes['rect'];
            expect(r).toBeDefined();
            expect(r.position.x).toEqual(25);
            done();
        });
    });

    it('responds to events in type: add', function(done){
        web.addBlock(create_stream(['event']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(r.strokeWidth).toEqual(5);
            done();
        });
    });

    it('responds to events as separate entry', function(done){
        web.addBlock(create_stream(['eventEntry']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(r.strokeWidth).toEqual(5);
            done();
        });
    });

    it('uses log in type: add', function(done){
        web.addBlock(create_stream(['log']));
        short_pause(function(){
            expect(web.logger.crntEntry()).toEqual({'position.x': 25, 'position.y': 25});
            done()
        })
    });

    it('uses log as separate entry', function(done){
        web.addBlock(create_stream(['logEntry']));
        short_pause(function(){
            expect(web.logger.crntEntry()).toEqual({'position.x': 25, 'position.y': 25});
            done()
        })
    });

    it('logs strokeWidth change in event', function(done){
        web.addBlock(create_stream(['logInEvent', 'event']));
        emit_then_pause('rect', 'doubleclick', function(){
            expect(web.logger.crntEntry()).toEqual({strokeWidth: 5});
            done();
        });
    });

    it('removeAll entries', function(done){
        entry = create_stream();
        entry.push({
            type: 'removeAll',
            time: 100
        });
        web.addBlock(entry);
        short_pause(function(){
            expect(shapes['rect']).toBeUndefined();
            done()
        });
    });

    it('clearBlock(s) entries', function(done){
        entry = create_stream();
        entry.push({
            type: 'clearBlock',
            time: 50
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
            time: 100,
        });
        web.addBlock(entry);
        short_pause(function(){
            expect(shapes['rect']).toBeDefined();
            expect(shapes['rect2']).toBeUndefined();
            done();
        });
    });
})
