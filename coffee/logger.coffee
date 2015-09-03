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

    nextEntry: () ->
        @data.push({})
        @crnt_ii++
    
    crntEntry: () ->
        @data[@crnt_ii]

    # Basic logging from properties -------------------------------------------
    log: (obj, properties) ->
        @createEntry(obj, properties, @data[@crnt_ii])

    createEntry: (obj, properties, entry = {}) ->
        if not Array.isArray(properties)
            for own key, prop of properties
                entry[key] = @parse(obj, prop)
        else 
            # assumes properties is list, and sets property as key name
            for prop in properties then entry[prop] = @parse(obj, prop)

        return entry

    parse: (obj, prop) ->
        # cast to string if necessary, e.g. if want to log index of array
        prop = String(prop) if typeof prop is "number"
        # special treatment of strings starting with hash
        if prop.startsWith('#') then @hash[prop]()
        # look up property from object
        else getProperty(obj, prop)

    # Other forms of logging --------------------------------------------------
    update: (records) ->
        # extend current log entry from key: value pairs in records
        entry = @data[@crnt_ii]
        entry[k] = v for own k, v of records

        return entry

    fromSelector: (selector, properties) ->
        # get object from selector, then log properties
        # TODO: allow replacing document with another element?
        obj = document.querySelector(selector)
        @log(obj, properties)




window.Logger = Logger
