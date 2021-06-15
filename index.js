const CTX = require("amcl-js").CTX;

var ctx = new CTX("BN254");

const abs = require("./abs");
const cyrpto = require("crypto");

var outputBytes = function(G) {
    var W = [];
    G.toBytes(W, true);
    console.log(W);
}

function generateG1Element(rng) {
    // var seed = ctx.FP.rand(rng);
    // var G = ctx.ECP.map2point(seed);
    // return G;
    var r = new ctx.BIG(0);
    r.rcopy(ctx.ROM_CURVE.CURVE_Order);
    var G = ctx.ECP.generator();
    var seed = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    return ctx.PAIR.G1mul(G, seed);
}

function generateG2Element(rng) {
    // var seed = ctx.FP2.rand(rng);
    // var H = ctx.ECP2.map2point(seed);
    // return H;
    var r = new ctx.BIG(0);
    r.rcopy(ctx.ROM_CURVE.CURVE_Order);
    var H = ctx.ECP2.generator();
    var seed = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
    return ctx.PAIR.G2mul(H, seed);
}

function BIG_moddiv(a1, b1, m) {
    var d = new ctx.DBIG(0);
    var a = new ctx.BIG(0);
    var b = new ctx.BIG(0);

    a.copy(a1);
    b.copy(b1);
    a.mod(m);
    b.invmodp(m);

    d = ctx.BIG.mul(a, b);
    var r = d.mod(m);
    return r;
}

var i;
// 乱数の初期化
var RAW = [];
var rng = new ctx.RAND();
rng.clean();
for (i=0;i<100;i++) {
    var buff = cyrpto.randomBytes(8);
    var hex = buff.toString("hex");
    RAW[i]=parseInt(hex, 16);
}
rng.seed(100,RAW);

var r = new ctx.BIG(0);
r.rcopy(ctx.ROM_CURVE.CURVE_Order);

var G = ctx.ECP.generator();
var H = ctx.ECP2.generator();

var GH = ctx.PAIR.initmp();
GH = ctx.PAIR.ate(H, G);
var v = ctx.PAIR.fexp(GH);

var a = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
var divA = new ctx.BIG(0);
divA.copy(a);
// console.log(a);
// console.log(divA);
divA.invmodp(r);
console.log(divA);
var aG = ctx.PAIR.G1mul(G, a);
var aGH = ctx.PAIR.ate(H, aG);
aGH = ctx.PAIR.fexp(aGH);
// outputBytes(aGH);
var divGH = ctx.PAIR.ate(H, aG);
divGH = ctx.PAIR.fexp(divGH);
divGH = ctx.PAIR.GTpow(divGH, divA)
// outputBytes(divGH);
// outputBytes(v);
console.log(v.equals(divGH));
// outputBytes(ctx.PAIR.GTpow(aGH, divA));
// outputBytes(v);
console.log(ctx.PAIR.GTpow(aGH, divA).equals(v));

var one = new ctx.BIG(1);
divA = BIG_moddiv(one, a, r);
console.log(divA);

var r0 = ctx.BIG.randtrunc(r, 16*ctx.ECP.AESKEY, rng);
var h0 = generateG2Element(rng);
var KBase = generateG1Element(rng);
var K0 = ctx.PAIR.G1mul(KBase, divA);
var A0 = ctx.PAIR.G2mul(h0, a);
var Y = ctx.PAIR.G1mul(KBase, r0);
var W = ctx.PAIR.G1mul(K0, r0);
var eWA0 = ctx.PAIR.initmp();
eWA0 = ctx.PAIR.ate(A0, W);
eWA0 = ctx.PAIR.fexp(eWA0);
var eYh0 = ctx.PAIR.initmp();
eYh0 = ctx.PAIR.ate(h0, Y);
eYh0 = ctx.PAIR.fexp(eYh0);
console.log(eWA0.equals(eYh0));

var aKBase = ctx.PAIR.G1mul(KBase, a);
var eaKBaseh0 = ctx.PAIR.ate(h0, aKBase);
eaKBaseh0 = ctx.PAIR.fexp(eaKBaseh0);
var eKBaseh0 = ctx.PAIR.ate(h0, KBase);
eKBaseh0 = ctx.PAIR.fexp(eKBaseh0);
console.log(eaKBaseh0.equals(ctx.PAIR.GTpow(eKBaseh0, a)));

var sGH = ctx.PAIR.initmp()
var s = ctx.BIG.randtrunc(r, 2 * ctx.CURVE_Order, rng);
var sG = ctx.PAIR.G1mul(G, s);
sGH = ctx.PAIR.ate(H, sG);
var sgh = ctx.PAIR.fexp(sGH);
// outputBytes(sgh);

var powGH = ctx.PAIR.GTpow(v, s);
// outputBytes(powGH);

var tpk = abs.trusteesetup(ctx, ["Aqours", "AZALEA", "GuiltyKiss", "CYaRon"], rng);
// console.log(tpk);
var keypair = abs.authoritysetup(ctx, tpk, rng);
// console.log(keypair.ask);
// console.log(keypair.apk);

var ska = abs.generateattributes(ctx, keypair["ask"],["Aqours"], rng);
// console.log(ska);

var sign = abs.sign(ctx, tpk, keypair.apk, ska, "HelloWorld", "Aqours OR AZALEA", rng);
// console.log(sign);

var eWA0 = ctx.PAIR.initmp();
eWA0 = ctx.PAIR.ate(keypair.apk.A0, sign.W);
var v = ctx.PAIR.fexp(eWA0);

var eYh0 = ctx.PAIR.initmp();
eYh0 = ctx.PAIR.ate(tpk.h0, sign.Y);
var x = ctx.PAIR.fexp(eYh0);

console.log(v.equals(x));