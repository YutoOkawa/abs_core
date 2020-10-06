const CTX = require("amcl-js").CTX;

var ctx = new CTX("BN254");

var ABS_OK = 0;
var ABS_FAIL = -1;

function generateG1Element(rng) {
    var seed = ctx.FP.rand(rng);
    var G = ctx.ECP.map2point(seed);
    return G;
}

function generateG2Element(rng) {
    var seed = ctx.FP2.rand(rng);
    var H = ctx.ECP2.map2point(seed);
    return H;
}

function setOpt(obj, prop, val) {
    if (val !== undefined) {
        obj[prop] = val;
    } else {
        console.log("undefined")
    }
}

exports.init = function(ctx) {
    var G = ctx.ECP.generator();
    if (G.is_infinity()) {
        return ABS_FAIL
    }
    
    var H = ctx.ECP2.generator();
    if (H.is_infinity()) {
        return ABS_FAIL
    }

    return ABS_OK
};

exports.trusteesetup = function(ctx, attributes, rng) {
    var tpk = {};
    var tmax = attributes.length;
    var G = generateG1Element(rng);
    setOpt(tpk, "g", G);

    for (var i=0; i<tmax+1; i++) {
        var h = generateG2Element(rng);
        setOpt(tpk, "h"+String(i), h);
    }

    var attriblist = {};
    counter = 2;
    for(var i=0; i<attributes.length; i++) {
        attriblist[attributes[i]] = counter;
        counter++;
    }
    setOpt(tpk, "atr", attriblist);

    return tpk;
};

exports.authoritysetup = function(ctx, tpk) {
};

exports.generateattributes = function(ctx){
    
};

exports.sign = function(ctx) {

};

exports.verify = function(ctx) {

};