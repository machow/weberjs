# TODO dup from weber.coffee, make utils script?
getProperty = (obj, prop) ->
    # gets nested properties separated by '.'
    # adapted from: http://stackoverflow.com/a/6491615
    for attr in  prop.split('.')
        obj = obj[attr]

    return obj

class Logger
    constructor: (@data = [{}], @crnt_ii = 0) ->
        @hash = 
            '#time': -> performance.now()
    
    log: (obj, properties) ->
        @createEntry(obj, properties, @data[@crnt_ii])

    update: (records) ->
        entry = @data[@crnt_ii]
        entry[k] = v for own k, v of records

        return entry

    createEntry: (obj, properties, entry = {}) ->
        if not Array.isArray(properties)
            for own key, prop of properties
                entry[key] = @parse(obj, prop)
        else 
            # assumes properties is list, and sets property as key name
            for prop in properties then entry[prop] = @parse(obj, prop)

        return entry

    parse: (obj, prop) ->
        # special treatment of strings starting with hash
        if prop.startsWith('#') then @hash[prop]()
        # look up property from object
        else getProperty(obj, prop)

    nextEntry: () ->
        @data.push({})
        @crnt_ii++
    
    crntEntry: () ->
        @data[@crnt_ii]

window.Logger = Logger
