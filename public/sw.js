if (!self.define) {
  let e,
    a = {};
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    a[s] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = s), (e.onload = a), document.head.appendChild(e));
        } else ((e = s), importScripts(s), a());
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, i) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (a[t]) return;
    let n = {};
    const r = (e) => s(e, t),
      d = { module: { uri: t }, exports: n, require: r };
    a[t] = Promise.all(c.map((e) => d[e] || r(e))).then((e) => (i(...e), n));
  };
}
define(["./workbox-3c9d0171"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/PoBC_XsCBOJTvXmUQK7Sr/_buildManifest.js",
          revision: "5518f7e3adc15fa37ca4a7939c665630",
        },
        {
          url: "/_next/static/PoBC_XsCBOJTvXmUQK7Sr/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1056.502c27f352517f4f.js",
          revision: "502c27f352517f4f",
        },
        {
          url: "/_next/static/chunks/1087.a0160d996c5a1847.js",
          revision: "a0160d996c5a1847",
        },
        {
          url: "/_next/static/chunks/111.e677d7b6e641adfa.js",
          revision: "e677d7b6e641adfa",
        },
        {
          url: "/_next/static/chunks/1173-32aad66c3bdbbe75.js",
          revision: "32aad66c3bdbbe75",
        },
        {
          url: "/_next/static/chunks/1204.4524927cf0987148.js",
          revision: "4524927cf0987148",
        },
        {
          url: "/_next/static/chunks/1215.b54477e9a2a2c8d9.js",
          revision: "b54477e9a2a2c8d9",
        },
        {
          url: "/_next/static/chunks/1217.0ac533c301694115.js",
          revision: "0ac533c301694115",
        },
        {
          url: "/_next/static/chunks/123.39e511bbf8877bc6.js",
          revision: "39e511bbf8877bc6",
        },
        {
          url: "/_next/static/chunks/1288.4b5f203b1335bdda.js",
          revision: "4b5f203b1335bdda",
        },
        {
          url: "/_next/static/chunks/1308.b12d14329c6ce849.js",
          revision: "b12d14329c6ce849",
        },
        {
          url: "/_next/static/chunks/133-80c266302832ffe1.js",
          revision: "80c266302832ffe1",
        },
        {
          url: "/_next/static/chunks/1357.ebd6daf6df3c9f9e.js",
          revision: "ebd6daf6df3c9f9e",
        },
        {
          url: "/_next/static/chunks/1426.d25340dcd7590eec.js",
          revision: "d25340dcd7590eec",
        },
        {
          url: "/_next/static/chunks/1435.05f47ff080e896d4.js",
          revision: "05f47ff080e896d4",
        },
        {
          url: "/_next/static/chunks/1439.9ebac77405d801cf.js",
          revision: "9ebac77405d801cf",
        },
        {
          url: "/_next/static/chunks/147-52b53daa07c9690e.js",
          revision: "52b53daa07c9690e",
        },
        {
          url: "/_next/static/chunks/1491.2b174aa80bd73d6e.js",
          revision: "2b174aa80bd73d6e",
        },
        {
          url: "/_next/static/chunks/1554.6a42cdc14f6c27c4.js",
          revision: "6a42cdc14f6c27c4",
        },
        {
          url: "/_next/static/chunks/158.59d33be2b96f09ab.js",
          revision: "59d33be2b96f09ab",
        },
        {
          url: "/_next/static/chunks/1595-23861d5f35f6295e.js",
          revision: "23861d5f35f6295e",
        },
        {
          url: "/_next/static/chunks/1599.e1b6192bf2762110.js",
          revision: "e1b6192bf2762110",
        },
        {
          url: "/_next/static/chunks/1603-e312f5fbdddd1fe9.js",
          revision: "e312f5fbdddd1fe9",
        },
        {
          url: "/_next/static/chunks/1632.f42cd9ac2612354c.js",
          revision: "f42cd9ac2612354c",
        },
        {
          url: "/_next/static/chunks/169.567eeea34494d712.js",
          revision: "567eeea34494d712",
        },
        {
          url: "/_next/static/chunks/1713-22dd2cbce2c01999.js",
          revision: "22dd2cbce2c01999",
        },
        {
          url: "/_next/static/chunks/1755-5eb8270499f20544.js",
          revision: "5eb8270499f20544",
        },
        {
          url: "/_next/static/chunks/1818.e9bbafd71372d8f2.js",
          revision: "e9bbafd71372d8f2",
        },
        {
          url: "/_next/static/chunks/1871.0c9a2e5a01c0a27b.js",
          revision: "0c9a2e5a01c0a27b",
        },
        {
          url: "/_next/static/chunks/1909-3b0d7c335a46ebb6.js",
          revision: "3b0d7c335a46ebb6",
        },
        {
          url: "/_next/static/chunks/1922.fec19300185dd548.js",
          revision: "fec19300185dd548",
        },
        {
          url: "/_next/static/chunks/196-d10911802e5c0f0c.js",
          revision: "d10911802e5c0f0c",
        },
        {
          url: "/_next/static/chunks/1966-5d3f062850146eb3.js",
          revision: "5d3f062850146eb3",
        },
        {
          url: "/_next/static/chunks/1ee530ce.7ac1b065f156b9ef.js",
          revision: "7ac1b065f156b9ef",
        },
        {
          url: "/_next/static/chunks/2.01c2f17fb1b5e09e.js",
          revision: "01c2f17fb1b5e09e",
        },
        {
          url: "/_next/static/chunks/2006.dd2f721de3403c39.js",
          revision: "dd2f721de3403c39",
        },
        {
          url: "/_next/static/chunks/2014.4b823e83a409d2bf.js",
          revision: "4b823e83a409d2bf",
        },
        {
          url: "/_next/static/chunks/2025.ff1a702e96a0cd6d.js",
          revision: "ff1a702e96a0cd6d",
        },
        {
          url: "/_next/static/chunks/2044-42f140546f1c75e9.js",
          revision: "42f140546f1c75e9",
        },
        {
          url: "/_next/static/chunks/2079.3d0a2bb526cba4f8.js",
          revision: "3d0a2bb526cba4f8",
        },
        {
          url: "/_next/static/chunks/2082-63685bfda5ff5833.js",
          revision: "63685bfda5ff5833",
        },
        {
          url: "/_next/static/chunks/2087.8ae23d0bf2880f27.js",
          revision: "8ae23d0bf2880f27",
        },
        {
          url: "/_next/static/chunks/2135.5ac76c0d0f84f4d2.js",
          revision: "5ac76c0d0f84f4d2",
        },
        {
          url: "/_next/static/chunks/2170.3a2d9535ff2163cb.js",
          revision: "3a2d9535ff2163cb",
        },
        {
          url: "/_next/static/chunks/21817e00.1cec0acf951ed810.js",
          revision: "1cec0acf951ed810",
        },
        {
          url: "/_next/static/chunks/2186.003148097484acb1.js",
          revision: "003148097484acb1",
        },
        {
          url: "/_next/static/chunks/2206.d578a06b23cbb4ed.js",
          revision: "d578a06b23cbb4ed",
        },
        {
          url: "/_next/static/chunks/2224.25c4fb03ad008c45.js",
          revision: "25c4fb03ad008c45",
        },
        {
          url: "/_next/static/chunks/2230.f1768fee5cd2a2ba.js",
          revision: "f1768fee5cd2a2ba",
        },
        {
          url: "/_next/static/chunks/2264.ce29ce1b875bb40f.js",
          revision: "ce29ce1b875bb40f",
        },
        {
          url: "/_next/static/chunks/2352.420633ecfff1598d.js",
          revision: "420633ecfff1598d",
        },
        {
          url: "/_next/static/chunks/23736e3b.94ec856e568c7067.js",
          revision: "94ec856e568c7067",
        },
        {
          url: "/_next/static/chunks/246.644e07320807e44d.js",
          revision: "644e07320807e44d",
        },
        {
          url: "/_next/static/chunks/2481.a0e610ada4aa6ef5.js",
          revision: "a0e610ada4aa6ef5",
        },
        {
          url: "/_next/static/chunks/2486-10b9fe71212796a5.js",
          revision: "10b9fe71212796a5",
        },
        {
          url: "/_next/static/chunks/2495-70b3d506beab8c8a.js",
          revision: "70b3d506beab8c8a",
        },
        {
          url: "/_next/static/chunks/2584.e5e50c875c847832.js",
          revision: "e5e50c875c847832",
        },
        {
          url: "/_next/static/chunks/264.bd5aa601b0d69ab7.js",
          revision: "bd5aa601b0d69ab7",
        },
        {
          url: "/_next/static/chunks/2755.87d24f88e96b7697.js",
          revision: "87d24f88e96b7697",
        },
        {
          url: "/_next/static/chunks/2756.3f0f71a2f139dcbf.js",
          revision: "3f0f71a2f139dcbf",
        },
        {
          url: "/_next/static/chunks/284-21fbd6706233a0e2.js",
          revision: "21fbd6706233a0e2",
        },
        {
          url: "/_next/static/chunks/2840-e662c7e691473530.js",
          revision: "e662c7e691473530",
        },
        {
          url: "/_next/static/chunks/2844.4c4ae673fcfb4c87.js",
          revision: "4c4ae673fcfb4c87",
        },
        {
          url: "/_next/static/chunks/2875.d7033f244a0de7aa.js",
          revision: "d7033f244a0de7aa",
        },
        {
          url: "/_next/static/chunks/2985203e.ac572cb0959fdf6e.js",
          revision: "ac572cb0959fdf6e",
        },
        {
          url: "/_next/static/chunks/3014.ca7a493caf33bf82.js",
          revision: "ca7a493caf33bf82",
        },
        {
          url: "/_next/static/chunks/312.84dd55e3e07d9e79.js",
          revision: "84dd55e3e07d9e79",
        },
        {
          url: "/_next/static/chunks/3140.49349c4c6b268050.js",
          revision: "49349c4c6b268050",
        },
        {
          url: "/_next/static/chunks/3183.768ac321efeeeac5.js",
          revision: "768ac321efeeeac5",
        },
        {
          url: "/_next/static/chunks/3194.f0111fa3ac7ad0d0.js",
          revision: "f0111fa3ac7ad0d0",
        },
        {
          url: "/_next/static/chunks/3209.f07c12cdcfc3c1ed.js",
          revision: "f07c12cdcfc3c1ed",
        },
        {
          url: "/_next/static/chunks/3249.7c08e6f3959ab8b6.js",
          revision: "7c08e6f3959ab8b6",
        },
        {
          url: "/_next/static/chunks/3269-0be100b571417694.js",
          revision: "0be100b571417694",
        },
        {
          url: "/_next/static/chunks/329.c9819f55e1ed1456.js",
          revision: "c9819f55e1ed1456",
        },
        {
          url: "/_next/static/chunks/3295-d2b843feff7f2e7c.js",
          revision: "d2b843feff7f2e7c",
        },
        {
          url: "/_next/static/chunks/3296-defdbbe201d69e18.js",
          revision: "defdbbe201d69e18",
        },
        {
          url: "/_next/static/chunks/3307.1b2079d8f1abbf8d.js",
          revision: "1b2079d8f1abbf8d",
        },
        {
          url: "/_next/static/chunks/3371.38c36e1811fc9692.js",
          revision: "38c36e1811fc9692",
        },
        {
          url: "/_next/static/chunks/339-cf23dfdd72d961f9.js",
          revision: "cf23dfdd72d961f9",
        },
        {
          url: "/_next/static/chunks/342.29e0b80e5917b5aa.js",
          revision: "29e0b80e5917b5aa",
        },
        {
          url: "/_next/static/chunks/3470-52eedd7395e5daf4.js",
          revision: "52eedd7395e5daf4",
        },
        {
          url: "/_next/static/chunks/3471.ebbc69fc04b10809.js",
          revision: "ebbc69fc04b10809",
        },
        {
          url: "/_next/static/chunks/357.e3311f7ac780b96c.js",
          revision: "e3311f7ac780b96c",
        },
        {
          url: "/_next/static/chunks/3585.dec157fb8502d872.js",
          revision: "dec157fb8502d872",
        },
        {
          url: "/_next/static/chunks/3621-57e05486fd1b1184.js",
          revision: "57e05486fd1b1184",
        },
        {
          url: "/_next/static/chunks/3652.951736d1d1e8622a.js",
          revision: "951736d1d1e8622a",
        },
        {
          url: "/_next/static/chunks/3653.edfbfb1e887011cd.js",
          revision: "edfbfb1e887011cd",
        },
        {
          url: "/_next/static/chunks/3726.92a2c481a2b9d00d.js",
          revision: "92a2c481a2b9d00d",
        },
        {
          url: "/_next/static/chunks/3901.df1505b22ff03bd4.js",
          revision: "df1505b22ff03bd4",
        },
        {
          url: "/_next/static/chunks/3920.4fcca56bbe25d6a2.js",
          revision: "4fcca56bbe25d6a2",
        },
        {
          url: "/_next/static/chunks/3947-2b27cf3c68a5d498.js",
          revision: "2b27cf3c68a5d498",
        },
        {
          url: "/_next/static/chunks/39a02dcd-d6b3b84ddc411bff.js",
          revision: "d6b3b84ddc411bff",
        },
        {
          url: "/_next/static/chunks/4001-c6b9bc320253bae6.js",
          revision: "c6b9bc320253bae6",
        },
        {
          url: "/_next/static/chunks/4070.d4e06a68e12e3fab.js",
          revision: "d4e06a68e12e3fab",
        },
        {
          url: "/_next/static/chunks/4075.cf0ef2b60c0a50b6.js",
          revision: "cf0ef2b60c0a50b6",
        },
        {
          url: "/_next/static/chunks/4106.7029793043338414.js",
          revision: "7029793043338414",
        },
        {
          url: "/_next/static/chunks/4121.6510a282ec8c2723.js",
          revision: "6510a282ec8c2723",
        },
        {
          url: "/_next/static/chunks/4174.e8ffb57dee79e449.js",
          revision: "e8ffb57dee79e449",
        },
        {
          url: "/_next/static/chunks/4186.de35082662773ae7.js",
          revision: "de35082662773ae7",
        },
        {
          url: "/_next/static/chunks/4241.34c51c4b8a930e14.js",
          revision: "34c51c4b8a930e14",
        },
        {
          url: "/_next/static/chunks/4242-6d8c63bb5a006406.js",
          revision: "6d8c63bb5a006406",
        },
        {
          url: "/_next/static/chunks/4252.d5ab66844adde397.js",
          revision: "d5ab66844adde397",
        },
        {
          url: "/_next/static/chunks/4258-0ae8fdb67aee1ce2.js",
          revision: "0ae8fdb67aee1ce2",
        },
        {
          url: "/_next/static/chunks/4290-4786a4783e2d0921.js",
          revision: "4786a4783e2d0921",
        },
        {
          url: "/_next/static/chunks/4358.8db0b237f86e53aa.js",
          revision: "8db0b237f86e53aa",
        },
        {
          url: "/_next/static/chunks/44072702.35bbe566d46cf27d.js",
          revision: "35bbe566d46cf27d",
        },
        {
          url: "/_next/static/chunks/4437.62add24fc2e45a0c.js",
          revision: "62add24fc2e45a0c",
        },
        {
          url: "/_next/static/chunks/4488.d7d9968bbb01673a.js",
          revision: "d7d9968bbb01673a",
        },
        {
          url: "/_next/static/chunks/45-ef9a4af810faf217.js",
          revision: "ef9a4af810faf217",
        },
        {
          url: "/_next/static/chunks/4537-85ea7aa8feea4c71.js",
          revision: "85ea7aa8feea4c71",
        },
        {
          url: "/_next/static/chunks/4545-592368440e172863.js",
          revision: "592368440e172863",
        },
        {
          url: "/_next/static/chunks/4564-5a64bb0cb6c8f4df.js",
          revision: "5a64bb0cb6c8f4df",
        },
        {
          url: "/_next/static/chunks/4567.956926a524250207.js",
          revision: "956926a524250207",
        },
        {
          url: "/_next/static/chunks/4610-30064827a1cc4c14.js",
          revision: "30064827a1cc4c14",
        },
        {
          url: "/_next/static/chunks/4696.bba6f9e3cf8f4b4e.js",
          revision: "bba6f9e3cf8f4b4e",
        },
        {
          url: "/_next/static/chunks/4711.940cc91dca217ac5.js",
          revision: "940cc91dca217ac5",
        },
        {
          url: "/_next/static/chunks/4721-5e1e8c9ceb60c3d0.js",
          revision: "5e1e8c9ceb60c3d0",
        },
        {
          url: "/_next/static/chunks/4744-46d2eb00fc15e3e5.js",
          revision: "46d2eb00fc15e3e5",
        },
        {
          url: "/_next/static/chunks/4856.424041efc44f1d87.js",
          revision: "424041efc44f1d87",
        },
        {
          url: "/_next/static/chunks/4857.bc2290f933e65286.js",
          revision: "bc2290f933e65286",
        },
        {
          url: "/_next/static/chunks/4871.8b60e503a7db3a55.js",
          revision: "8b60e503a7db3a55",
        },
        {
          url: "/_next/static/chunks/4872.a196d958412721c0.js",
          revision: "a196d958412721c0",
        },
        {
          url: "/_next/static/chunks/4874.44592ecfc19a49ff.js",
          revision: "44592ecfc19a49ff",
        },
        {
          url: "/_next/static/chunks/4931.b98dfab82301270a.js",
          revision: "b98dfab82301270a",
        },
        {
          url: "/_next/static/chunks/5031.5e9a79b49d129999.js",
          revision: "5e9a79b49d129999",
        },
        {
          url: "/_next/static/chunks/510.3943e1728d3f5d48.js",
          revision: "3943e1728d3f5d48",
        },
        {
          url: "/_next/static/chunks/5109.dea9c7f3925ecc42.js",
          revision: "dea9c7f3925ecc42",
        },
        {
          url: "/_next/static/chunks/5144.e6adc622be49c9e3.js",
          revision: "e6adc622be49c9e3",
        },
        {
          url: "/_next/static/chunks/5214.fef267537374a808.js",
          revision: "fef267537374a808",
        },
        {
          url: "/_next/static/chunks/5260.528025a342180733.js",
          revision: "528025a342180733",
        },
        {
          url: "/_next/static/chunks/5520-461127c50a91e5ec.js",
          revision: "461127c50a91e5ec",
        },
        {
          url: "/_next/static/chunks/5562.37a835b60e7ea089.js",
          revision: "37a835b60e7ea089",
        },
        {
          url: "/_next/static/chunks/5582.09356e6cc8459f9e.js",
          revision: "09356e6cc8459f9e",
        },
        {
          url: "/_next/static/chunks/5621.c635d68f58a32c0b.js",
          revision: "c635d68f58a32c0b",
        },
        {
          url: "/_next/static/chunks/5849-731105929dc513ac.js",
          revision: "731105929dc513ac",
        },
        {
          url: "/_next/static/chunks/5903.0882f06e697903dd.js",
          revision: "0882f06e697903dd",
        },
        {
          url: "/_next/static/chunks/5942-5609c49696660976.js",
          revision: "5609c49696660976",
        },
        {
          url: "/_next/static/chunks/597.f636a12bbda4438c.js",
          revision: "f636a12bbda4438c",
        },
        {
          url: "/_next/static/chunks/5997.49349c4c6b268050.js",
          revision: "49349c4c6b268050",
        },
        {
          url: "/_next/static/chunks/6064.4472fc95178ca6bb.js",
          revision: "4472fc95178ca6bb",
        },
        {
          url: "/_next/static/chunks/608.6c2f3179ce7757cb.js",
          revision: "6c2f3179ce7757cb",
        },
        {
          url: "/_next/static/chunks/6110.0ff5e527bae9129b.js",
          revision: "0ff5e527bae9129b",
        },
        {
          url: "/_next/static/chunks/61421ee2-49a7021c2d3e950e.js",
          revision: "49a7021c2d3e950e",
        },
        {
          url: "/_next/static/chunks/6231.fe68c05ee3d84e03.js",
          revision: "fe68c05ee3d84e03",
        },
        {
          url: "/_next/static/chunks/624.09cb29ad807f260a.js",
          revision: "09cb29ad807f260a",
        },
        {
          url: "/_next/static/chunks/6247.ae4be30ef510e784.js",
          revision: "ae4be30ef510e784",
        },
        {
          url: "/_next/static/chunks/63-51fa49701d4cecc9.js",
          revision: "51fa49701d4cecc9",
        },
        {
          url: "/_next/static/chunks/6326-cc98c8c6e26aa60b.js",
          revision: "cc98c8c6e26aa60b",
        },
        {
          url: "/_next/static/chunks/6359.38e767019329f156.js",
          revision: "38e767019329f156",
        },
        {
          url: "/_next/static/chunks/6362-164a99407286d80e.js",
          revision: "164a99407286d80e",
        },
        {
          url: "/_next/static/chunks/6412.ea7ddcc3e2aa68d5.js",
          revision: "ea7ddcc3e2aa68d5",
        },
        {
          url: "/_next/static/chunks/644.8f5e3252824e984d.js",
          revision: "8f5e3252824e984d",
        },
        {
          url: "/_next/static/chunks/6444-647a3343e45029ca.js",
          revision: "647a3343e45029ca",
        },
        {
          url: "/_next/static/chunks/6566.ab710933471e4385.js",
          revision: "ab710933471e4385",
        },
        {
          url: "/_next/static/chunks/6586-822af74c5d3ab288.js",
          revision: "822af74c5d3ab288",
        },
        {
          url: "/_next/static/chunks/6629.3ae8fe9c1687effc.js",
          revision: "3ae8fe9c1687effc",
        },
        {
          url: "/_next/static/chunks/6673-43e975da8c98a29b.js",
          revision: "43e975da8c98a29b",
        },
        {
          url: "/_next/static/chunks/6685.623d598743388bc0.js",
          revision: "623d598743388bc0",
        },
        {
          url: "/_next/static/chunks/6687.0a57d6f9f840fa84.js",
          revision: "0a57d6f9f840fa84",
        },
        {
          url: "/_next/static/chunks/6768.b29e35da407d30af.js",
          revision: "b29e35da407d30af",
        },
        {
          url: "/_next/static/chunks/67ab562c-8c9f7de816f1759a.js",
          revision: "8c9f7de816f1759a",
        },
        {
          url: "/_next/static/chunks/6805.a1e7e5bd76d1d77f.js",
          revision: "a1e7e5bd76d1d77f",
        },
        {
          url: "/_next/static/chunks/6886.88395baed0fbcf78.js",
          revision: "88395baed0fbcf78",
        },
        {
          url: "/_next/static/chunks/6903.c98eb7fd6b7f3e92.js",
          revision: "c98eb7fd6b7f3e92",
        },
        {
          url: "/_next/static/chunks/6fa930d2.c9fa15480ce90d42.js",
          revision: "c9fa15480ce90d42",
        },
        {
          url: "/_next/static/chunks/70-d7f6fa73d5564423.js",
          revision: "d7f6fa73d5564423",
        },
        {
          url: "/_next/static/chunks/7072-2000194fac7a9b37.js",
          revision: "2000194fac7a9b37",
        },
        {
          url: "/_next/static/chunks/7073-7a1891d36bfa8cb8.js",
          revision: "7a1891d36bfa8cb8",
        },
        {
          url: "/_next/static/chunks/7101-ada66f9830cd40aa.js",
          revision: "ada66f9830cd40aa",
        },
        {
          url: "/_next/static/chunks/7130-d13260eb0d0d11a1.js",
          revision: "d13260eb0d0d11a1",
        },
        {
          url: "/_next/static/chunks/7230-790c773eceb2427e.js",
          revision: "790c773eceb2427e",
        },
        {
          url: "/_next/static/chunks/7241.05d2908d9f85d874.js",
          revision: "05d2908d9f85d874",
        },
        {
          url: "/_next/static/chunks/7251-d46ed33524db57f3.js",
          revision: "d46ed33524db57f3",
        },
        {
          url: "/_next/static/chunks/726b69dd-bfe1397ec64fb600.js",
          revision: "bfe1397ec64fb600",
        },
        {
          url: "/_next/static/chunks/7272.653a245811ecf119.js",
          revision: "653a245811ecf119",
        },
        {
          url: "/_next/static/chunks/7336-830c8696e11a979f.js",
          revision: "830c8696e11a979f",
        },
        {
          url: "/_next/static/chunks/7410-bcd47e0de5b77591.js",
          revision: "bcd47e0de5b77591",
        },
        {
          url: "/_next/static/chunks/7510.d561cb6760e9ea9c.js",
          revision: "d561cb6760e9ea9c",
        },
        {
          url: "/_next/static/chunks/7514.d4fa9a8506bcab9f.js",
          revision: "d4fa9a8506bcab9f",
        },
        {
          url: "/_next/static/chunks/756.111c073567bfe9e6.js",
          revision: "111c073567bfe9e6",
        },
        {
          url: "/_next/static/chunks/759.49349c4c6b268050.js",
          revision: "49349c4c6b268050",
        },
        {
          url: "/_next/static/chunks/7692-17b655ada18490bd.js",
          revision: "17b655ada18490bd",
        },
        {
          url: "/_next/static/chunks/7785.ef8f92a33b889b19.js",
          revision: "ef8f92a33b889b19",
        },
        {
          url: "/_next/static/chunks/787.7c61dbf58e56fa55.js",
          revision: "7c61dbf58e56fa55",
        },
        {
          url: "/_next/static/chunks/7884-2a1963cee8b3138e.js",
          revision: "2a1963cee8b3138e",
        },
        {
          url: "/_next/static/chunks/8011.fac9d6fc827edc8f.js",
          revision: "fac9d6fc827edc8f",
        },
        {
          url: "/_next/static/chunks/8023.4b78ef56f3180efc.js",
          revision: "4b78ef56f3180efc",
        },
        {
          url: "/_next/static/chunks/8060.cf8f1e3332abf340.js",
          revision: "cf8f1e3332abf340",
        },
        {
          url: "/_next/static/chunks/8129.3943e1728d3f5d48.js",
          revision: "3943e1728d3f5d48",
        },
        {
          url: "/_next/static/chunks/8228.6ab6dee0dc3f6d40.js",
          revision: "6ab6dee0dc3f6d40",
        },
        {
          url: "/_next/static/chunks/8231.dff42a24984df529.js",
          revision: "dff42a24984df529",
        },
        {
          url: "/_next/static/chunks/8285.17e9de42638fc6eb.js",
          revision: "17e9de42638fc6eb",
        },
        {
          url: "/_next/static/chunks/8308-9a0850d0e5286609.js",
          revision: "9a0850d0e5286609",
        },
        {
          url: "/_next/static/chunks/834.d6730527613fe9e6.js",
          revision: "d6730527613fe9e6",
        },
        {
          url: "/_next/static/chunks/8357.2ae5fd468ce721f5.js",
          revision: "2ae5fd468ce721f5",
        },
        {
          url: "/_next/static/chunks/8378.49349c4c6b268050.js",
          revision: "49349c4c6b268050",
        },
        {
          url: "/_next/static/chunks/8387-5e0b383d75468230.js",
          revision: "5e0b383d75468230",
        },
        {
          url: "/_next/static/chunks/8487.b460d2218b832ac5.js",
          revision: "b460d2218b832ac5",
        },
        {
          url: "/_next/static/chunks/8511-05d1124b6ef48547.js",
          revision: "05d1124b6ef48547",
        },
        {
          url: "/_next/static/chunks/8598-01b73f9d7b62e65d.js",
          revision: "01b73f9d7b62e65d",
        },
        {
          url: "/_next/static/chunks/8632.5321b8fedb69fa03.js",
          revision: "5321b8fedb69fa03",
        },
        {
          url: "/_next/static/chunks/8664.a42f10de1cc86365.js",
          revision: "a42f10de1cc86365",
        },
        {
          url: "/_next/static/chunks/873.dee2ebd8f57f731e.js",
          revision: "dee2ebd8f57f731e",
        },
        {
          url: "/_next/static/chunks/8831.fce5c5c43ac1b5cf.js",
          revision: "fce5c5c43ac1b5cf",
        },
        {
          url: "/_next/static/chunks/8858-5ffd1808c427a2ef.js",
          revision: "5ffd1808c427a2ef",
        },
        {
          url: "/_next/static/chunks/8907-9d6f1eff2d6d9a9e.js",
          revision: "9d6f1eff2d6d9a9e",
        },
        {
          url: "/_next/static/chunks/8937.bf3950838f99e1b7.js",
          revision: "bf3950838f99e1b7",
        },
        {
          url: "/_next/static/chunks/8959.b334e095e161f74a.js",
          revision: "b334e095e161f74a",
        },
        {
          url: "/_next/static/chunks/9067.c919fc6dca1f2a03.js",
          revision: "c919fc6dca1f2a03",
        },
        {
          url: "/_next/static/chunks/9085.cfaebd08cff1d6a9.js",
          revision: "cfaebd08cff1d6a9",
        },
        {
          url: "/_next/static/chunks/9095.a34b29dc9261e1c9.js",
          revision: "a34b29dc9261e1c9",
        },
        {
          url: "/_next/static/chunks/9120.ffc241f9ac825e78.js",
          revision: "ffc241f9ac825e78",
        },
        {
          url: "/_next/static/chunks/9155.bf492190336b1cf2.js",
          revision: "bf492190336b1cf2",
        },
        {
          url: "/_next/static/chunks/9159.0ee30d4c275c8667.js",
          revision: "0ee30d4c275c8667",
        },
        {
          url: "/_next/static/chunks/9193-0bdd11d8ca37415e.js",
          revision: "0bdd11d8ca37415e",
        },
        {
          url: "/_next/static/chunks/92d86bc8.07b999d5642644b7.js",
          revision: "07b999d5642644b7",
        },
        {
          url: "/_next/static/chunks/9431-66096d986932381f.js",
          revision: "66096d986932381f",
        },
        {
          url: "/_next/static/chunks/9495-33ec33e249c173ba.js",
          revision: "33ec33e249c173ba",
        },
        {
          url: "/_next/static/chunks/952.40e67acf16280cae.js",
          revision: "40e67acf16280cae",
        },
        {
          url: "/_next/static/chunks/9625.fa8ec4510926cdb9.js",
          revision: "fa8ec4510926cdb9",
        },
        {
          url: "/_next/static/chunks/9638-0f2463a67c56f21f.js",
          revision: "0f2463a67c56f21f",
        },
        {
          url: "/_next/static/chunks/9645-0e222d3a5ddac645.js",
          revision: "0e222d3a5ddac645",
        },
        {
          url: "/_next/static/chunks/9661-f65ffaaf8cf00024.js",
          revision: "f65ffaaf8cf00024",
        },
        {
          url: "/_next/static/chunks/9666.96347364ab11ed17.js",
          revision: "96347364ab11ed17",
        },
        {
          url: "/_next/static/chunks/968.9c86b925499e538b.js",
          revision: "9c86b925499e538b",
        },
        {
          url: "/_next/static/chunks/9682.5f163e6432b9c416.js",
          revision: "5f163e6432b9c416",
        },
        {
          url: "/_next/static/chunks/9733.abe6b0c32918b4e9.js",
          revision: "abe6b0c32918b4e9",
        },
        {
          url: "/_next/static/chunks/9739.3b0ccc5a06f1081e.js",
          revision: "3b0ccc5a06f1081e",
        },
        {
          url: "/_next/static/chunks/9752-f171681b1bcffdc1.js",
          revision: "f171681b1bcffdc1",
        },
        {
          url: "/_next/static/chunks/9758.b925158f81b3df70.js",
          revision: "b925158f81b3df70",
        },
        {
          url: "/_next/static/chunks/9761.2dee4b95c0c7f488.js",
          revision: "2dee4b95c0c7f488",
        },
        {
          url: "/_next/static/chunks/9773.8c11d5b4a29ecb37.js",
          revision: "8c11d5b4a29ecb37",
        },
        {
          url: "/_next/static/chunks/979-1c0765ddef73892c.js",
          revision: "1c0765ddef73892c",
        },
        {
          url: "/_next/static/chunks/9841-dd3a29c466cd4aab.js",
          revision: "dd3a29c466cd4aab",
        },
        {
          url: "/_next/static/chunks/9873-cfb0b634ceb48f88.js",
          revision: "cfb0b634ceb48f88",
        },
        {
          url: "/_next/static/chunks/9884.2a78f985bce53002.js",
          revision: "2a78f985bce53002",
        },
        {
          url: "/_next/static/chunks/9909.68544207d27a05e5.js",
          revision: "68544207d27a05e5",
        },
        {
          url: "/_next/static/chunks/9926.3ab175ba4afdd7d4.js",
          revision: "3ab175ba4afdd7d4",
        },
        {
          url: "/_next/static/chunks/9987.889d2da21e0f6939.js",
          revision: "889d2da21e0f6939",
        },
        {
          url: "/_next/static/chunks/9992.07c9f9680aab5f05.js",
          revision: "07c9f9680aab5f05",
        },
        {
          url: "/_next/static/chunks/9dd718ab.573c5f9e32724710.js",
          revision: "573c5f9e32724710",
        },
        {
          url: "/_next/static/chunks/9e784b99-dc13607460b9af1a.js",
          revision: "dc13607460b9af1a",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-586e6176daf10af7.js",
          revision: "586e6176daf10af7",
        },
        {
          url: "/_next/static/chunks/app/admin/setup/migrations/page-845718908538a12d.js",
          revision: "845718908538a12d",
        },
        {
          url: "/_next/static/chunks/app/api/account/export/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/account/password/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/account/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/advanced-analytics/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/cards/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/create-admin/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/cron/reminders/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/dashboard-stats/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/feedback/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/general-analytics/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/hall-of-fame/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/health/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/impersonate/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/migrations/execute/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/late-liquidations/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/learner-engagement/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/semester-summary/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/tutor-compliance/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/semester-config/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/stats/%5Btype%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/timesheets/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/%5Bid%5D/logs/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/bulk-import/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/designations/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/track/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/auth/card-login/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/auth/register-card/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/auth/revert-role/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/avatar/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/calendar/%5BtutorId%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/dashboard/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/feedback/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/finance/attachment/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/finance/ocr/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/%5Bid%5D/fork/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/%5Bid%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/attempt/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/attempts/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/create/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/generate/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/my-sets/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/shared/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/gamification/daily/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/messages/conversations/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/messages/users/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/results/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/vote/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/polls/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/%5Bid%5D/export/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/%5Bid%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/attempt/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/create/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/flag/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/generate-from-resource/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/generate/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/my-sets/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/shared/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/repositories/%5Bid%5D/resources/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/repositories/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/resources/extract-topics/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/join/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/memo/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/rate/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/status/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/config/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/correction/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/%5Bid%5D/activate/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/%5Bid%5D/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/tutors/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/users/device-token/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/discord/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/email/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/push/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/api/xp/earn/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/auth/callback/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/auth/error/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/auth/layout-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/auth/login/page-fcf644ab879a3189.js",
          revision: "fcf644ab879a3189",
        },
        {
          url: "/_next/static/chunks/app/auth/setup-profile/page-28555b0bc52e2534.js",
          revision: "28555b0bc52e2534",
        },
        {
          url: "/_next/static/chunks/app/auth/sign-up-success/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/auth/sign-up/page-ad7e65c5549569c9.js",
          revision: "ad7e65c5549569c9",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/analytics/page-70185a6560882c27.js",
          revision: "70185a6560882c27",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/export/page-3ba98754e39b70a5.js",
          revision: "3ba98754e39b70a5",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/feedback/page-2887e7842e9dc70b.js",
          revision: "2887e7842e9dc70b",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/health/page-72b48e5db18717e1.js",
          revision: "72b48e5db18717e1",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/integrations/page-cedcb9246e309dcd.js",
          revision: "cedcb9246e309dcd",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/layout-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/logs/page-1ab7e64c1958e5d8.js",
          revision: "1ab7e64c1958e5d8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/messages/page-5fbb1ec16863efe1.js",
          revision: "5fbb1ec16863efe1",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/page-7de5ce4bff260c20.js",
          revision: "7de5ce4bff260c20",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/reports/page-4ca172f0fd7e54ae.js",
          revision: "4ca172f0fd7e54ae",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/roles/page-4c3bb98e0772dc27.js",
          revision: "4c3bb98e0772dc27",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/scanner/page-75abb19adae61420.js",
          revision: "75abb19adae61420",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/sessions/page-7349f6486d541776.js",
          revision: "7349f6486d541776",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/settings/page-c45a0dfd7442d47e.js",
          revision: "c45a0dfd7442d47e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/support/%5Bid%5D/page-2809fbfeafddeafe.js",
          revision: "2809fbfeafddeafe",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/support/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/timesheets/page-771c1a3dff2ee023.js",
          revision: "771c1a3dff2ee023",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/tutor-stats/page-d5d6c7c87d99c8a6.js",
          revision: "d5d6c7c87d99c8a6",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/users/page-e3e90b4e8542915e.js",
          revision: "e3e90b4e8542915e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/verifications/page-480fe20c31280304.js",
          revision: "480fe20c31280304",
        },
        {
          url: "/_next/static/chunks/app/dashboard/ai-tutor/page-cef6375acaa8df52.js",
          revision: "cef6375acaa8df52",
        },
        {
          url: "/_next/static/chunks/app/dashboard/availability/layout-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/availability/page-1c7ee6a083eedc3c.js",
          revision: "1c7ee6a083eedc3c",
        },
        {
          url: "/_next/static/chunks/app/dashboard/calendar/page-580d572c8b3b6540.js",
          revision: "580d572c8b3b6540",
        },
        {
          url: "/_next/static/chunks/app/dashboard/error-bc2a96f2c834640e.js",
          revision: "bc2a96f2c834640e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/events/page-e39edf6b19ff7d16.js",
          revision: "e39edf6b19ff7d16",
        },
        {
          url: "/_next/static/chunks/app/dashboard/finance/page-266beac14e9dda9a.js",
          revision: "266beac14e9dda9a",
        },
        {
          url: "/_next/static/chunks/app/dashboard/finance/register/page-18d47c634e53ebae.js",
          revision: "18d47c634e53ebae",
        },
        {
          url: "/_next/static/chunks/app/dashboard/flashcards/page-54081db75ef4d77f.js",
          revision: "54081db75ef4d77f",
        },
        {
          url: "/_next/static/chunks/app/dashboard/flashcards/study/%5Bid%5D/page-413d4eb875b31cf3.js",
          revision: "413d4eb875b31cf3",
        },
        {
          url: "/_next/static/chunks/app/dashboard/forums/%5Bid%5D/page-834e6386a6566217.js",
          revision: "834e6386a6566217",
        },
        {
          url: "/_next/static/chunks/app/dashboard/forums/page-7a7fcebe87d61cf8.js",
          revision: "7a7fcebe87d61cf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/groups/%5Bid%5D/page-708b8ec686c9b137.js",
          revision: "708b8ec686c9b137",
        },
        {
          url: "/_next/static/chunks/app/dashboard/groups/page-7283ff4109487744.js",
          revision: "7283ff4109487744",
        },
        {
          url: "/_next/static/chunks/app/dashboard/home/page-04ee38d8f7594a36.js",
          revision: "04ee38d8f7594a36",
        },
        {
          url: "/_next/static/chunks/app/dashboard/layout-4ce52622cefe2e33.js",
          revision: "4ce52622cefe2e33",
        },
        {
          url: "/_next/static/chunks/app/dashboard/leaderboard/page-e23e1010b3360851.js",
          revision: "e23e1010b3360851",
        },
        {
          url: "/_next/static/chunks/app/dashboard/messages/page-95012ff7f226e9da.js",
          revision: "95012ff7f226e9da",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/alumni/page-0253f2296f29bc9d.js",
          revision: "0253f2296f29bc9d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/layout-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/study-buddies/page-a4c5ea52d9d7eb23.js",
          revision: "a4c5ea52d9d7eb23",
        },
        {
          url: "/_next/static/chunks/app/dashboard/notifications/page-35686ead6a28262e.js",
          revision: "35686ead6a28262e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/page-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/profile/page-2f63fe99bc616170.js",
          revision: "2f63fe99bc616170",
        },
        {
          url: "/_next/static/chunks/app/dashboard/quizzes/page-f7589c63ad45134d.js",
          revision: "f7589c63ad45134d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/quizzes/study/%5Bid%5D/page-aa295735780c2894.js",
          revision: "aa295735780c2894",
        },
        {
          url: "/_next/static/chunks/app/dashboard/resources/library/page-9752ba9fcbf23a9e.js",
          revision: "9752ba9fcbf23a9e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/resources/page-a5db076e9425e51a.js",
          revision: "a5db076e9425e51a",
        },
        {
          url: "/_next/static/chunks/app/dashboard/roadmap/page-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sessions/%5Bid%5D/whiteboard/page-ec730f2e0a7231ea.js",
          revision: "ec730f2e0a7231ea",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sessions/page-ae3d18c4bf38c2bc.js",
          revision: "ae3d18c4bf38c2bc",
        },
        {
          url: "/_next/static/chunks/app/dashboard/team/page-ed217a0cf9a4610f.js",
          revision: "ed217a0cf9a4610f",
        },
        {
          url: "/_next/static/chunks/app/dashboard/timesheet/layout-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/timesheet/page-a66fcfa60c444b62.js",
          revision: "a66fcfa60c444b62",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/%5Bid%5D/page-72b613f1e3c7d69b.js",
          revision: "72b613f1e3c7d69b",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/page-3226d82b7a157298.js",
          revision: "3226d82b7a157298",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/reviews/page-873fc4b60b64e67b.js",
          revision: "873fc4b60b64e67b",
        },
        {
          url: "/_next/static/chunks/app/dashboard/voting/page-2d0df4b2014cb6e6.js",
          revision: "2d0df4b2014cb6e6",
        },
        {
          url: "/_next/static/chunks/app/error-88e4d663dc4a3f90.js",
          revision: "88e4d663dc4a3f90",
        },
        {
          url: "/_next/static/chunks/app/global-error-fe92499d95a76d74.js",
          revision: "fe92499d95a76d74",
        },
        {
          url: "/_next/static/chunks/app/layout-aa268f95d135d108.js",
          revision: "aa268f95d135d108",
        },
        {
          url: "/_next/static/chunks/app/manifest.webmanifest/route-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/app/page-7bd366295d067d87.js",
          revision: "7bd366295d067d87",
        },
        {
          url: "/_next/static/chunks/b3ebb074.952a56f6b23f835f.js",
          revision: "952a56f6b23f835f",
        },
        {
          url: "/_next/static/chunks/b671bc47.6250edaf09ec4e6b.js",
          revision: "6250edaf09ec4e6b",
        },
        {
          url: "/_next/static/chunks/badf541d.c38ba789e41c9993.js",
          revision: "c38ba789e41c9993",
        },
        {
          url: "/_next/static/chunks/c07d0c89.1764869113b1a545.js",
          revision: "1764869113b1a545",
        },
        {
          url: "/_next/static/chunks/c132bf7d-b905b14271e2392e.js",
          revision: "b905b14271e2392e",
        },
        {
          url: "/_next/static/chunks/cdfede43.7fdf1c2ed43af463.js",
          revision: "7fdf1c2ed43af463",
        },
        {
          url: "/_next/static/chunks/framework-272635e557826bfa.js",
          revision: "272635e557826bfa",
        },
        {
          url: "/_next/static/chunks/main-app-c6206fc1dced42e7.js",
          revision: "c6206fc1dced42e7",
        },
        {
          url: "/_next/static/chunks/main-be67d42e3c4ad87d.js",
          revision: "be67d42e3c4ad87d",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/not-found-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-ea004ce6dae9baf8.js",
          revision: "ea004ce6dae9baf8",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-1e791e3fb4b4a7be.js",
          revision: "1e791e3fb4b4a7be",
        },
        {
          url: "/_next/static/css/3ccae28c6a204ee7.css",
          revision: "3ccae28c6a204ee7",
        },
        {
          url: "/_next/static/css/a614887f4b52cc5d.css",
          revision: "a614887f4b52cc5d",
        },
        {
          url: "/_next/static/css/e24a3da8258faa20.css",
          revision: "e24a3da8258faa20",
        },
        {
          url: "/_next/static/media/0aa834ed78bf6d07-s.woff2",
          revision: "324703f03c390d2e2a4f387de85fe63d",
        },
        {
          url: "/_next/static/media/19cfc7226ec3afaa-s.woff2",
          revision: "9dda5cfc9a46f256d0e131bb535e46f8",
        },
        {
          url: "/_next/static/media/21350d82a1f187e9-s.woff2",
          revision: "4e2553027f1d60eff32898367dd4d541",
        },
        {
          url: "/_next/static/media/67957d42bae0796d-s.woff2",
          revision: "54f02056e07c55023315568c637e3a96",
        },
        {
          url: "/_next/static/media/886030b0b59bc5a7-s.woff2",
          revision: "c94e6e6c23e789fcb0fc60d790c9d2c1",
        },
        {
          url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
          revision: "01ba6c2a184b8cba08b0d57167664d75",
        },
        {
          url: "/_next/static/media/939c4f875ee75fbb-s.woff2",
          revision: "4a4e74bed5809194e4bc6538eb1a1e30",
        },
        {
          url: "/_next/static/media/ba9851c3c22cd980-s.woff2",
          revision: "9e494903d6b0ffec1a1e14d34427d44d",
        },
        {
          url: "/_next/static/media/bb3ef058b751a6ad-s.p.woff2",
          revision: "782150e6836b9b074d1a798807adcb18",
        },
        {
          url: "/_next/static/media/c5fe6dc8356a8c31-s.woff2",
          revision: "027a89e9ab733a145db70f09b8a18b42",
        },
        {
          url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
          revision: "d54db44de5ccb18886ece2fda72bdfe0",
        },
        {
          url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
          revision: "65850a373e258f1c897a2b3d75eb74de",
        },
        {
          url: "/_next/static/media/f911b923c6adde36-s.woff2",
          revision: "0f8d347d49960d05c9430d83e49edeb7",
        },
        {
          url: "/apple-icon.png",
          revision: "734ce6c878789fcd5843e8a7963e0756",
        },
        {
          url: "/campus-map.png",
          revision: "8baabf4cfbee48e229de9fc2a15e8ac2",
        },
        {
          url: "/honsoc-logo-black.png",
          revision: "ac5717bb3649308539615214fb8e2f3b",
        },
        {
          url: "/honsoc-logo-gold.png",
          revision: "b227200f00effeba29b93f2ecc97c72d",
        },
        {
          url: "/honsoc-logo-white.png",
          revision: "13ec79ddf04047522b382bb1996968a4",
        },
        {
          url: "/honsoc-logo.png",
          revision: "6fe8ab3b4e1abb1c3cb0269c4367c7e0",
        },
        {
          url: "/icon-dark-32x32.png",
          revision: "abd5ebe9e287ca0a89f4fd3da2b5cf9c",
        },
        {
          url: "/icon-light-32x32.png",
          revision: "53426c910bcab7d3e5213cc64aa1b2c5",
        },
        { url: "/icon.svg", revision: "0285a820d3fb2d06a9fb098ef84c1174" },
        { url: "/manifest.json", revision: "52e281402201c19d618a4eb61e459995" },
        { url: "/offline.html", revision: "32ae5fce4d4e4cba3024ab4e9bdcb049" },
        {
          url: "/placeholder-logo.png",
          revision: "95d8d1a4a9bbcccc875e2c381e74064a",
        },
        {
          url: "/placeholder-logo.svg",
          revision: "1e16dc7df824652c5906a2ab44aef78c",
        },
        {
          url: "/placeholder-user.jpg",
          revision: "7ee6562646feae6d6d77e2c72e204591",
        },
        {
          url: "/placeholder.jpg",
          revision: "1e533b7b4545d1d605144ce893afc601",
        },
        {
          url: "/placeholder.svg",
          revision: "35707bd9960ba5281c72af927b79291f",
        },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: e }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e, url: { pathname: a } }) =>
        !(!e || a.startsWith("/api/auth/callback") || !a.startsWith("/api/")),
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: s }) =>
        "1" === e.headers.get("RSC") &&
        "1" === e.headers.get("Next-Router-Prefetch") &&
        s &&
        !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ request: e, url: { pathname: a }, sameOrigin: s }) =>
        "1" === e.headers.get("RSC") && s && !a.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: { pathname: e }, sameOrigin: a }) => a && !e.startsWith("/api/"),
      new e.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ sameOrigin: e }) => !e,
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});
