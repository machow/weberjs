class ImageRater
    constructor: () ->
        null

    mean: (M) ->
        means = ( (arr.reduce (t, s) -> t + s) / arr.length for arr in M )

    scale: (M) ->
        # there's a bug in this fnc, so norm2 returns the squared L2 norm
        s = Math.sqrt(numeric.norm2(M) / (M[0].length * 2))
        {scaled: numeric.div(M, s), s: s}

    rotateAlign: (src, ref) ->
        # apply procruste's rotation (minimize SSD)
        N = src[0].length - 1
        [x, y] = src
        [w, z] = ref
        
        num = den = 0
        for ii in [0..N] by 1
            num += w[ii]*y[ii] - z[ii]*x[ii]
            den += w[ii]*x[ii] + z[ii]*y[ii]
            #console.log num
        theta = Math.atan(num / den)
        return theta
    
    procrustes: (src, ref, nIters) ->
        if true
            src = src.slice()
            ref = ref.slice()

        refMean = @mean(ref)
        srcMean = @mean(src)

        
        src = [numeric.sub(src[0], srcMean[0]), numeric.sub(src[1], srcMean[1])]
        ref = [numeric.sub(ref[0], refMean[0]), numeric.sub(ref[1], refMean[1])]

        {scaled:src, s: srcS} = @scale(src)
        {scaled:ref, s: refS} = @scale(ref)

        srcT = numeric.transpose(src)

        refWide = numeric.transpose(ref)
        tree = createKDTree(refWide)

        N = src[0].length - 1
        theta = 0
        for cycle in [0..nIters] by 1
            # get new ref based on nearest neighbor
            num = den = 0
            for ii in [0..N] by 1
                x = src[0][ii]; y = src[1][ii]
                [w, z] = refWide[ tree.nn([x, y]) ]
                
                num += x*z - y*w
                den += x*w + y*z
            dtheta = Math.atan(num / den)
            rotMat = [[Math.cos(dtheta), -Math.sin(dtheta)],
                      [Math.sin(dtheta),  Math.cos(dtheta)]]
            
            src = numeric.dot(rotMat, src)
            theta += dtheta
            #{scaled:src, s: srcS} = @scale(src)
            #console.log(srcS)
            console.log(cycle)
        add = numeric.add
        mul = numeric.mul
        final = [
            add(mul(src[0], refS), refMean[0]), 
            add(mul(src[1], refS), refMean[1])
        ]


        return {mean: refMean, scale: refS, rot: rotMat, src: src, final:final}
    
    longToWide: (arr) ->
        ([arr[0][ii], arr[1][ii]] for ii in [0..arr[0].length] by 1)

window.ImageRater = ImageRater
