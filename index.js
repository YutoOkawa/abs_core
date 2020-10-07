const CTX = require("amcl-js").CTX;

var ctx = new CTX("BN254");

const abs = require("./abs");
const cyrpto = require("crypto");

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
// console.log(divA);
var aG = ctx.PAIR.G1mul(G, a);
var aGH = ctx.PAIR.ate(H, aG);
aGH = ctx.PAIR.fexp(aGH);
// outputBytes(aGH);
var divGH = ctx.PAIR.ate(H, aG);
divGH = ctx.PAIR.fexp(divGH);
divGH = ctx.PAIR.GTpow(divGH, divA)
// outputBytes(divGH);
// outputBytes(v);
// outputBytes(ctx.PAIR.GTpow(aGH, divA));
// outputBytes(v);

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