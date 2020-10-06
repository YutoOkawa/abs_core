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

exports.authoritysetup = function(ctx, tpk, rng) {
    var keypair = {};
    var ask = {};
    var apk = {};
    var tmax = Object.keys(tpk["atr"]).length;

    var r = new ctx.BIG(0);
    r.rcopy(ctx.ROM_CURVE.CURVE_Order);

    var a0 = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    var a = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    var b = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    
    setOpt(ask, "a0", a0);
    setOpt(ask, "a", a);
    setOpt(ask, "b", b);
    setOpt(ask, "atr", tpk["atr"]);

    var A0 = ctx.PAIR.G2mul(tpk["h0"], a0);
    setOpt(apk, "A0", A0);

    for (var i=1; i<tmax+1; i++) {
        var A = ctx.PAIR.G2mul(tpk["h"+String(i)], a);
        setOpt(apk, "A"+String(i), A);
    }

    for (var i=1; i<tmax+1; i++) {
        var B = ctx.PAIR.G2mul(tpk["h"+String(i)], b);
        setOpt(apk, "B"+String(i), B);
    }

    var c = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    var C = ctx.PAIR.G1mul(tpk["g"], c);
    setOpt(apk, "C", C);

    setOpt(keypair, "ask", ask);
    setOpt(keypair, "apk", apk);

    return keypair;
};

exports.generateattributes = function(ctx, ask, attriblist, rng){
    var ska = {};

    var KBase = generateG1Element(rng);
    setOpt(ska, "KBase", KBase);

    var r = new ctx.BIG(0);
    r.rcopy(ctx.ROM_CURVE.CURVE_Order);

    // invA0 := 1/a0
    var invA0 = new ctx.BIG(0);
    invA0.copy(ask["a0"]);
    invA0.invmodp(r);

    var K0 = ctx.PAIR.G1mul(KBase, invA0);
    setOpt(ska, "K0", K0);

    for(var i=0; i<attriblist.length; i++) {
        var attrNum = ask["atr"][attriblist[i]]
        var exp = new ctx.BIG(0);
        exp.copy(ask["b"]);
        exp.imul(attrNum);
        exp.add(ask["a"]);
        exp.invmodp(r);
        var Ku = ctx.PAIR.G1mul(KBase, exp);
        setOpt(ska, "K"+String(attrNum), Ku);
    }

    return ska;
};

exports.sign = function(ctx) {

};

exports.verify = function(ctx) {

};