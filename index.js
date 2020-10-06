const CTX = require("amcl-js").CTX;

var ctx = new CTX("BN254");

const abs = require("./abs");

var outputBytes = function(G) {
    var W = [];
    G.toBytes(W, true);
    console.log(W);
}

var i;
// 乱数の初期化
var RAW = [];
var rng = new ctx.RAND();
rng.clean();
for (i=0;i<100;i++) RAW[i]=i;
rng.seed(100,RAW);

var r = new ctx.BIG(0);
r.rcopy(ctx.ROM_CURVE.CURVE_Order);

var G = ctx.ECP.generator();
var H = ctx.ECP2.generator();

var GH = ctx.PAIR.initmp();
GH = ctx.PAIR.ate(H, G);
var v = ctx.PAIR.fexp(GH);

var sGH = ctx.PAIR.initmp()
var s = ctx.BIG.randtrunc(r, 2 * ctx.CURVE_Order, rng);
var sG = ctx.PAIR.G1mul(G, s);
sGH = ctx.PAIR.ate(H, sG);
var sgh = ctx.PAIR.fexp(sGH);
outputBytes(sgh);

var powGH = ctx.PAIR.GTpow(v, s);
outputBytes(powGH);

var tpk = abs.trusteesetup(ctx, ["Aqours", "Guilty Kiss", "AZALEA", "CYaRon"], rng);
console.log(tpk);