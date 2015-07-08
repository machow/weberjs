getProperty = (obj, path, assign) ->
    for attr in path[0...path.length-1] # leave out last item
        obj = obj[attr]

    lastAttr = path[-1..]
    if assign? then return obj[lastAttr] = assign
    else return obj[lastAttr]

getParams = (template) ->
    params = {}
    parse = (thing, key) ->
        # takes object and converts any fields with {{varname}} to argument of fn

        # if object
        if (thing?) and (thing instanceof Object)
            nameBucket = []
            for own k, v of thing
                if argnames = parse(v, k)
                    for argname in argnames
                        params[argname].unshift(k)
                        nameBucket.push(argname)
            return nameBucket
             
        # if string
        else if typeof thing is "string"
            re = /{{(.*?)}}/
            match = re.exec(thing)
            if match? 
                params[match[1]] = []
                return [match[1]]

    parse(template)
    return params

functize = (template, copy=true) ->
    # deep copy, using deepCopy from lodash would be faster
    params = getParams(template)

    (cnfg) ->
        if copy then crnt_template = JSON.parse(JSON.stringify(template))
        else crnt_template = template

        for arg, val of cnfg 
            path = params[arg]
            getProperty(crnt_template, path, val)
        return crnt_template 

window.runner = 
    _getProperty: getProperty,
    _getParams: getParams,
    functize: functize
