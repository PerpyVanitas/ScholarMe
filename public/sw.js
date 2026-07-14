if (!self.define) {
  let a,
    e = {};
  const s = (s, c) => (
    (s = new URL(s + ".js", c).href),
    e[s] ||
      new Promise((e) => {
        if ("document" in self) {
          const a = document.createElement("script");
          ((a.src = s), (a.onload = e), document.head.appendChild(a));
        } else ((a = s), importScripts(s), e());
      }).then(() => {
        let a = e[s];
        if (!a) throw new Error(`Module ${s} didn’t register its module`);
        return a;
      })
  );
  self.define = (c, i) => {
    const t =
      a ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (e[t]) return;
    let n = {};
    const r = (a) => s(a, t),
      b = { module: { uri: t }, exports: n, require: r };
    e[t] = Promise.all(c.map((a) => b[a] || r(a))).then((a) => (i(...a), n));
  };
}
define(["./workbox-3c9d0171"], function (a) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: "/_next/static/AqrzA5vMlj8btA0-LICF7/_buildManifest.js",
          revision: "d8d3a863a57290f912b2b8f6cd3a1a7f",
        },
        {
          url: "/_next/static/AqrzA5vMlj8btA0-LICF7/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/1014-a0d8977ae38062bd.js",
          revision: "a0d8977ae38062bd",
        },
        {
          url: "/_next/static/chunks/1034-cf1a4d3c6748d238.js",
          revision: "cf1a4d3c6748d238",
        },
        {
          url: "/_next/static/chunks/1055-db6286a31752b8c1.js",
          revision: "db6286a31752b8c1",
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
          url: "/_next/static/chunks/1308.d576b6a0473f54f1.js",
          revision: "d576b6a0473f54f1",
        },
        {
          url: "/_next/static/chunks/133-90fb06c31783e0dd.js",
          revision: "90fb06c31783e0dd",
        },
        {
          url: "/_next/static/chunks/1357.ebd6daf6df3c9f9e.js",
          revision: "ebd6daf6df3c9f9e",
        },
        {
          url: "/_next/static/chunks/1397-3b2a7de0e4ebd964.js",
          revision: "3b2a7de0e4ebd964",
        },
        {
          url: "/_next/static/chunks/1426.d25340dcd7590eec.js",
          revision: "d25340dcd7590eec",
        },
        {
          url: "/_next/static/chunks/1430-242c3ea467bd2942.js",
          revision: "242c3ea467bd2942",
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
          url: "/_next/static/chunks/1773-f8d3d9eec120e439.js",
          revision: "f8d3d9eec120e439",
        },
        {
          url: "/_next/static/chunks/1818.8aad2ea12161d524.js",
          revision: "8aad2ea12161d524",
        },
        {
          url: "/_next/static/chunks/1871.0c9a2e5a01c0a27b.js",
          revision: "0c9a2e5a01c0a27b",
        },
        {
          url: "/_next/static/chunks/1909-2e0999edcd4ba2f8.js",
          revision: "2e0999edcd4ba2f8",
        },
        {
          url: "/_next/static/chunks/1922.fec19300185dd548.js",
          revision: "fec19300185dd548",
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
          url: "/_next/static/chunks/2044-0f4e86f4014cb5ee.js",
          revision: "0f4e86f4014cb5ee",
        },
        {
          url: "/_next/static/chunks/2079.3d0a2bb526cba4f8.js",
          revision: "3d0a2bb526cba4f8",
        },
        {
          url: "/_next/static/chunks/208-19ffec8900f55756.js",
          revision: "19ffec8900f55756",
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
          url: "/_next/static/chunks/2279-664616958b974d25.js",
          revision: "664616958b974d25",
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
          url: "/_next/static/chunks/2569.5cbe54da2e08ea7a.js",
          revision: "5cbe54da2e08ea7a",
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
          url: "/_next/static/chunks/2763-58120a2f801378e9.js",
          revision: "58120a2f801378e9",
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
          url: "/_next/static/chunks/2903-d6b9603799ae924d.js",
          revision: "d6b9603799ae924d",
        },
        {
          url: "/_next/static/chunks/2961-5fef4bf5dd3e8929.js",
          revision: "5fef4bf5dd3e8929",
        },
        {
          url: "/_next/static/chunks/2985203e.ac572cb0959fdf6e.js",
          revision: "ac572cb0959fdf6e",
        },
        {
          url: "/_next/static/chunks/312.84dd55e3e07d9e79.js",
          revision: "84dd55e3e07d9e79",
        },
        {
          url: "/_next/static/chunks/3140.797fdbab798b2bfb.js",
          revision: "797fdbab798b2bfb",
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
          url: "/_next/static/chunks/3279-a5ae383e302184f8.js",
          revision: "a5ae383e302184f8",
        },
        {
          url: "/_next/static/chunks/329.c9819f55e1ed1456.js",
          revision: "c9819f55e1ed1456",
        },
        {
          url: "/_next/static/chunks/3307.1b2079d8f1abbf8d.js",
          revision: "1b2079d8f1abbf8d",
        },
        {
          url: "/_next/static/chunks/331-d9054dae35b34536.js",
          revision: "d9054dae35b34536",
        },
        {
          url: "/_next/static/chunks/3371.b3f5787311c209ef.js",
          revision: "b3f5787311c209ef",
        },
        {
          url: "/_next/static/chunks/342.29e0b80e5917b5aa.js",
          revision: "29e0b80e5917b5aa",
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
          url: "/_next/static/chunks/3652.951736d1d1e8622a.js",
          revision: "951736d1d1e8622a",
        },
        {
          url: "/_next/static/chunks/3653.edfbfb1e887011cd.js",
          revision: "edfbfb1e887011cd",
        },
        {
          url: "/_next/static/chunks/371-e76cf148f6c3db1a.js",
          revision: "e76cf148f6c3db1a",
        },
        {
          url: "/_next/static/chunks/3726.92a2c481a2b9d00d.js",
          revision: "92a2c481a2b9d00d",
        },
        {
          url: "/_next/static/chunks/3742-687e1605704599b8.js",
          revision: "687e1605704599b8",
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
          url: "/_next/static/chunks/3997-29f915c944897c8e.js",
          revision: "29f915c944897c8e",
        },
        {
          url: "/_next/static/chunks/39a02dcd-d6b3b84ddc411bff.js",
          revision: "d6b3b84ddc411bff",
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
          url: "/_next/static/chunks/420-3ad8a1f56a6c1223.js",
          revision: "3ad8a1f56a6c1223",
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
          url: "/_next/static/chunks/45-a7f4c541bc3b9798.js",
          revision: "a7f4c541bc3b9798",
        },
        {
          url: "/_next/static/chunks/4522-344242cdc5fb3a94.js",
          revision: "344242cdc5fb3a94",
        },
        {
          url: "/_next/static/chunks/4537-760be2929c7cccf0.js",
          revision: "760be2929c7cccf0",
        },
        {
          url: "/_next/static/chunks/4545-af6794fbe611fafe.js",
          revision: "af6794fbe611fafe",
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
          url: "/_next/static/chunks/4641-f5e97aad6d2f8dc2.js",
          revision: "f5e97aad6d2f8dc2",
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
          url: "/_next/static/chunks/4743-79446ef1ce873b1e.js",
          revision: "79446ef1ce873b1e",
        },
        {
          url: "/_next/static/chunks/4744-46d2eb00fc15e3e5.js",
          revision: "46d2eb00fc15e3e5",
        },
        {
          url: "/_next/static/chunks/4856.13f3118e00bd52e2.js",
          revision: "13f3118e00bd52e2",
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
          url: "/_next/static/chunks/5129.2cbaee949f315527.js",
          revision: "2cbaee949f315527",
        },
        {
          url: "/_next/static/chunks/5132-b63d9a77f04cf138.js",
          revision: "b63d9a77f04cf138",
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
          url: "/_next/static/chunks/5263-7edc0b040f7bd260.js",
          revision: "7edc0b040f7bd260",
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
          url: "/_next/static/chunks/5757-bfaba6661cc7f45c.js",
          revision: "bfaba6661cc7f45c",
        },
        {
          url: "/_next/static/chunks/5903.0882f06e697903dd.js",
          revision: "0882f06e697903dd",
        },
        {
          url: "/_next/static/chunks/5950-b0782b6b4c6d93e7.js",
          revision: "b0782b6b4c6d93e7",
        },
        {
          url: "/_next/static/chunks/597.f636a12bbda4438c.js",
          revision: "f636a12bbda4438c",
        },
        {
          url: "/_next/static/chunks/5997.797fdbab798b2bfb.js",
          revision: "797fdbab798b2bfb",
        },
        {
          url: "/_next/static/chunks/6064.4472fc95178ca6bb.js",
          revision: "4472fc95178ca6bb",
        },
        {
          url: "/_next/static/chunks/608.00868f87f8f3a8d2.js",
          revision: "00868f87f8f3a8d2",
        },
        {
          url: "/_next/static/chunks/6110.0ff5e527bae9129b.js",
          revision: "0ff5e527bae9129b",
        },
        {
          url: "/_next/static/chunks/6111-8c3bb6608fe2ea62.js",
          revision: "8c3bb6608fe2ea62",
        },
        {
          url: "/_next/static/chunks/61421ee2-49a7021c2d3e950e.js",
          revision: "49a7021c2d3e950e",
        },
        {
          url: "/_next/static/chunks/6153-a6216d97983abbaa.js",
          revision: "a6216d97983abbaa",
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
          url: "/_next/static/chunks/6281.0a756c76ea6eb9eb.js",
          revision: "0a756c76ea6eb9eb",
        },
        {
          url: "/_next/static/chunks/63-9b053b4ca39600f8.js",
          revision: "9b053b4ca39600f8",
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
          url: "/_next/static/chunks/6455-643db95dbd4d9067.js",
          revision: "643db95dbd4d9067",
        },
        {
          url: "/_next/static/chunks/6566.ab710933471e4385.js",
          revision: "ab710933471e4385",
        },
        {
          url: "/_next/static/chunks/6586-d4a90fbba1d32103.js",
          revision: "d4a90fbba1d32103",
        },
        {
          url: "/_next/static/chunks/6597-ac3f600a4a1c1803.js",
          revision: "ac3f600a4a1c1803",
        },
        {
          url: "/_next/static/chunks/6609-c070bb1c397ab60e.js",
          revision: "c070bb1c397ab60e",
        },
        {
          url: "/_next/static/chunks/6629.3ae8fe9c1687effc.js",
          revision: "3ae8fe9c1687effc",
        },
        {
          url: "/_next/static/chunks/6664-e007bea75884610f.js",
          revision: "e007bea75884610f",
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
          url: "/_next/static/chunks/6729.e49d83d95ca4af4a.js",
          revision: "e49d83d95ca4af4a",
        },
        {
          url: "/_next/static/chunks/6747-b63685b78dddf0ee.js",
          revision: "b63685b78dddf0ee",
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
          url: "/_next/static/chunks/6872-e27980a53445fea7.js",
          revision: "e27980a53445fea7",
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
          url: "/_next/static/chunks/7073-fafba4e7e41e3ae9.js",
          revision: "fafba4e7e41e3ae9",
        },
        {
          url: "/_next/static/chunks/7129-a059906341679dac.js",
          revision: "a059906341679dac",
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
          url: "/_next/static/chunks/7377.96fa2f26f51b2105.js",
          revision: "96fa2f26f51b2105",
        },
        {
          url: "/_next/static/chunks/7464-f97f7236e3d1b8a7.js",
          revision: "f97f7236e3d1b8a7",
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
          url: "/_next/static/chunks/759.797fdbab798b2bfb.js",
          revision: "797fdbab798b2bfb",
        },
        {
          url: "/_next/static/chunks/7639-5851e07d82266c3a.js",
          revision: "5851e07d82266c3a",
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
          url: "/_next/static/chunks/8016-74c015f6e49f71c9.js",
          revision: "74c015f6e49f71c9",
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
          url: "/_next/static/chunks/8087-00f2d8b15e6c4775.js",
          revision: "00f2d8b15e6c4775",
        },
        {
          url: "/_next/static/chunks/8129.3943e1728d3f5d48.js",
          revision: "3943e1728d3f5d48",
        },
        {
          url: "/_next/static/chunks/8148-6e00356976085434.js",
          revision: "6e00356976085434",
        },
        {
          url: "/_next/static/chunks/8160-27089a6bda078d15.js",
          revision: "27089a6bda078d15",
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
          url: "/_next/static/chunks/8378.797fdbab798b2bfb.js",
          revision: "797fdbab798b2bfb",
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
          url: "/_next/static/chunks/8571-97a8c42a1c0cd83e.js",
          revision: "97a8c42a1c0cd83e",
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
          url: "/_next/static/chunks/8635-219b826d82f67a51.js",
          revision: "219b826d82f67a51",
        },
        {
          url: "/_next/static/chunks/8664.a42f10de1cc86365.js",
          revision: "a42f10de1cc86365",
        },
        {
          url: "/_next/static/chunks/87-f0b89a2f98a24af5.js",
          revision: "f0b89a2f98a24af5",
        },
        {
          url: "/_next/static/chunks/873.dee2ebd8f57f731e.js",
          revision: "dee2ebd8f57f731e",
        },
        {
          url: "/_next/static/chunks/8736-081ee473a6a1059c.js",
          revision: "081ee473a6a1059c",
        },
        {
          url: "/_next/static/chunks/8831.2ac915e1c4ba1010.js",
          revision: "2ac915e1c4ba1010",
        },
        {
          url: "/_next/static/chunks/8910-f176dedef3c614d9.js",
          revision: "f176dedef3c614d9",
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
          url: "/_next/static/chunks/9085.5911b3565a932052.js",
          revision: "5911b3565a932052",
        },
        {
          url: "/_next/static/chunks/9095.a34b29dc9261e1c9.js",
          revision: "a34b29dc9261e1c9",
        },
        {
          url: "/_next/static/chunks/91-bb50c7284a27bada.js",
          revision: "bb50c7284a27bada",
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
          url: "/_next/static/chunks/92d86bc8.58b8f9ae52033c59.js",
          revision: "58b8f9ae52033c59",
        },
        {
          url: "/_next/static/chunks/9360-0e7272459ff66537.js",
          revision: "0e7272459ff66537",
        },
        {
          url: "/_next/static/chunks/9375-584e18de432939a3.js",
          revision: "584e18de432939a3",
        },
        {
          url: "/_next/static/chunks/9495-33ec33e249c173ba.js",
          revision: "33ec33e249c173ba",
        },
        {
          url: "/_next/static/chunks/9509-d1a20e4a037b18ad.js",
          revision: "d1a20e4a037b18ad",
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
          url: "/_next/static/chunks/9761.2dee4b95c0c7f488.js",
          revision: "2dee4b95c0c7f488",
        },
        {
          url: "/_next/static/chunks/9773.8c11d5b4a29ecb37.js",
          revision: "8c11d5b4a29ecb37",
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
          url: "/_next/static/chunks/9dd718ab.573c5f9e32724710.js",
          revision: "573c5f9e32724710",
        },
        {
          url: "/_next/static/chunks/9e784b99-dc13607460b9af1a.js",
          revision: "dc13607460b9af1a",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-586e6176daf10af7.js",
          revision: "586e6176daf10af7",
        },
        {
          url: "/_next/static/chunks/app/admin/setup/migrations/page-f3745a54f043ba64.js",
          revision: "f3745a54f043ba64",
        },
        {
          url: "/_next/static/chunks/app/api/account/export/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/account/password/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/account/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/advanced-analytics/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/cards/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/create-admin/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/cron/reminders/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/dashboard-stats/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/feedback/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/general-analytics/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/hall-of-fame/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/health/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/impersonate/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/migrations/execute/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/org-structure/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/late-liquidations/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/learner-engagement/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/semester-summary/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/reports/tutor-compliance/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/resign-role/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/semester-config/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/stats/%5Btype%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/timesheets/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/%5Bid%5D/logs/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/bulk-import/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/designations/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/admin/users/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/track/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/auth/card-login/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/auth/register-card/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/auth/revert-role/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/avatar/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/calendar/%5BtutorId%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/cron/sessions/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/cron/timesheets/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/dashboard/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/feedback/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/finance/attachment/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/finance/ocr/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/%5Bid%5D/fork/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/%5Bid%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/attempt/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/attempts/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/create/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/generate/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/my-sets/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/flashcards/shared/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/gamification/daily/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/messages/conversations/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/messages/users/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/results/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/polls/%5Bid%5D/vote/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/polls/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/%5Bid%5D/export/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/%5Bid%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/attempt/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/create/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/flag/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/generate-from-resource/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/generate/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/my-sets/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/quizzes/shared/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/rag/ingest/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/rag/search/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/repositories/%5Bid%5D/resources/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/repositories/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/resources/extract-topics/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/join/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/memo/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/rate/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/%5Bid%5D/status/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/sessions/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/config/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/correction/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/%5Bid%5D/activate/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/%5Bid%5D/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/periods/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/timesheets/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/tutors/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/users/device-token/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/discord/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/email/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/webhooks/push/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/api/xp/earn/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/auth/callback/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/auth/error/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/auth/layout-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/auth/login/page-bc7d9b0dc1d12909.js",
          revision: "bc7d9b0dc1d12909",
        },
        {
          url: "/_next/static/chunks/app/auth/setup-profile/page-ffaa77a859576ed4.js",
          revision: "ffaa77a859576ed4",
        },
        {
          url: "/_next/static/chunks/app/auth/sign-up-success/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/auth/sign-up/page-21ae686e5d003f8f.js",
          revision: "21ae686e5d003f8f",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/analytics/page-8f30b957dcdf139c.js",
          revision: "8f30b957dcdf139c",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/export/page-a98b3d263c247182.js",
          revision: "a98b3d263c247182",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/feedback/page-dea3ff8233386b74.js",
          revision: "dea3ff8233386b74",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/health/page-e05e481c4447c4ba.js",
          revision: "e05e481c4447c4ba",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/integrations/page-88598b9edf0a3b29.js",
          revision: "88598b9edf0a3b29",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/layout-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/logs/page-89f1471db841cfbf.js",
          revision: "89f1471db841cfbf",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/messages/page-79391245b49243ba.js",
          revision: "79391245b49243ba",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/org-structure/layout-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/org-structure/page-8f08b6a8ea9241ed.js",
          revision: "8f08b6a8ea9241ed",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/page-e0d6be532716f964.js",
          revision: "e0d6be532716f964",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/reports/page-5d7cdba33b439ffe.js",
          revision: "5d7cdba33b439ffe",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/scanner/page-9bc08157d24de3fa.js",
          revision: "9bc08157d24de3fa",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/sessions/page-8a3a8e3ca3420ea9.js",
          revision: "8a3a8e3ca3420ea9",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/settings/page-68a481de08b9e7f1.js",
          revision: "68a481de08b9e7f1",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/support/%5Bid%5D/page-21462282077487b4.js",
          revision: "21462282077487b4",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/support/page-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/timesheets/page-d0be280239fbe24b.js",
          revision: "d0be280239fbe24b",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/tutor-stats/page-50491b6d63435bef.js",
          revision: "50491b6d63435bef",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/users/page-60d800890a4e7396.js",
          revision: "60d800890a4e7396",
        },
        {
          url: "/_next/static/chunks/app/dashboard/admin/verifications/page-9730fcfc596dbc14.js",
          revision: "9730fcfc596dbc14",
        },
        {
          url: "/_next/static/chunks/app/dashboard/ai-tutor/page-658fb160b8647aed.js",
          revision: "658fb160b8647aed",
        },
        {
          url: "/_next/static/chunks/app/dashboard/availability/layout-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/availability/page-5eb78ee5cd44d452.js",
          revision: "5eb78ee5cd44d452",
        },
        {
          url: "/_next/static/chunks/app/dashboard/calendar/page-dfb043752adb3f1d.js",
          revision: "dfb043752adb3f1d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/error-86c660a5c23a88b0.js",
          revision: "86c660a5c23a88b0",
        },
        {
          url: "/_next/static/chunks/app/dashboard/events/page-b8477e993770c0ec.js",
          revision: "b8477e993770c0ec",
        },
        {
          url: "/_next/static/chunks/app/dashboard/finance/page-cd4a3eb02e837825.js",
          revision: "cd4a3eb02e837825",
        },
        {
          url: "/_next/static/chunks/app/dashboard/finance/register/page-509271b5a1e29fa2.js",
          revision: "509271b5a1e29fa2",
        },
        {
          url: "/_next/static/chunks/app/dashboard/flashcards/page-ac8b2479f3b4c571.js",
          revision: "ac8b2479f3b4c571",
        },
        {
          url: "/_next/static/chunks/app/dashboard/flashcards/study/%5Bid%5D/page-adce5de10d621141.js",
          revision: "adce5de10d621141",
        },
        {
          url: "/_next/static/chunks/app/dashboard/forums/%5Bid%5D/page-1b26f3f75daf44a5.js",
          revision: "1b26f3f75daf44a5",
        },
        {
          url: "/_next/static/chunks/app/dashboard/forums/page-4cf5db419dc59255.js",
          revision: "4cf5db419dc59255",
        },
        {
          url: "/_next/static/chunks/app/dashboard/friends/page-504824dba4f7b9d2.js",
          revision: "504824dba4f7b9d2",
        },
        {
          url: "/_next/static/chunks/app/dashboard/groups/%5Bid%5D/page-ea7a707f83308af8.js",
          revision: "ea7a707f83308af8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/groups/page-566350ceafdb722d.js",
          revision: "566350ceafdb722d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/home/page-2d8aae5a7f3604f2.js",
          revision: "2d8aae5a7f3604f2",
        },
        {
          url: "/_next/static/chunks/app/dashboard/layout-992aa1feeb2844fa.js",
          revision: "992aa1feeb2844fa",
        },
        {
          url: "/_next/static/chunks/app/dashboard/leaderboard/page-2eb2c08b992f82e0.js",
          revision: "2eb2c08b992f82e0",
        },
        {
          url: "/_next/static/chunks/app/dashboard/messages/page-784e9e90c387c0da.js",
          revision: "784e9e90c387c0da",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/alumni/page-60e1d4f2c6a59176.js",
          revision: "60e1d4f2c6a59176",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/layout-f9c9c3913fa8528d.js",
          revision: "f9c9c3913fa8528d",
        },
        {
          url: "/_next/static/chunks/app/dashboard/network/study-buddies/page-9f0fdde105f32c4c.js",
          revision: "9f0fdde105f32c4c",
        },
        {
          url: "/_next/static/chunks/app/dashboard/notifications/page-84124874c4e8a84c.js",
          revision: "84124874c4e8a84c",
        },
        {
          url: "/_next/static/chunks/app/dashboard/page-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/profile/page-9b19f0bed6cf7055.js",
          revision: "9b19f0bed6cf7055",
        },
        {
          url: "/_next/static/chunks/app/dashboard/quizzes/page-1b18b1ea2fcf15b8.js",
          revision: "1b18b1ea2fcf15b8",
        },
        {
          url: "/_next/static/chunks/app/dashboard/quizzes/study/%5Bid%5D/page-9449c12749e93686.js",
          revision: "9449c12749e93686",
        },
        {
          url: "/_next/static/chunks/app/dashboard/resources/library/page-44ae4047b13f3b4c.js",
          revision: "44ae4047b13f3b4c",
        },
        {
          url: "/_next/static/chunks/app/dashboard/resources/page-f0cc362d43aebb28.js",
          revision: "f0cc362d43aebb28",
        },
        {
          url: "/_next/static/chunks/app/dashboard/roadmap/page-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sessions/%5Bid%5D/whiteboard/page-bf4998dc542d6981.js",
          revision: "bf4998dc542d6981",
        },
        {
          url: "/_next/static/chunks/app/dashboard/sessions/page-576519bf90a3c835.js",
          revision: "576519bf90a3c835",
        },
        {
          url: "/_next/static/chunks/app/dashboard/settings/page-46f52772321a0f12.js",
          revision: "46f52772321a0f12",
        },
        {
          url: "/_next/static/chunks/app/dashboard/team/page-5a48710e0904b24e.js",
          revision: "5a48710e0904b24e",
        },
        {
          url: "/_next/static/chunks/app/dashboard/template-7ca903c864242400.js",
          revision: "7ca903c864242400",
        },
        {
          url: "/_next/static/chunks/app/dashboard/timesheet/layout-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/dashboard/timesheet/page-d6c8638bcb606179.js",
          revision: "d6c8638bcb606179",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/%5Bid%5D/page-36b84ce47cc8a5b4.js",
          revision: "36b84ce47cc8a5b4",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/page-b16c705b446f452b.js",
          revision: "b16c705b446f452b",
        },
        {
          url: "/_next/static/chunks/app/dashboard/tutors/reviews/page-ba4e54619dd23086.js",
          revision: "ba4e54619dd23086",
        },
        {
          url: "/_next/static/chunks/app/dashboard/users/%5Bid%5D/page-fe506914c77d36fe.js",
          revision: "fe506914c77d36fe",
        },
        {
          url: "/_next/static/chunks/app/dashboard/users/page-03116f68d1215def.js",
          revision: "03116f68d1215def",
        },
        {
          url: "/_next/static/chunks/app/dashboard/voting/page-b91cbcc02db8a56b.js",
          revision: "b91cbcc02db8a56b",
        },
        {
          url: "/_next/static/chunks/app/error-7e04b587a0be33e4.js",
          revision: "7e04b587a0be33e4",
        },
        {
          url: "/_next/static/chunks/app/global-error-fe92499d95a76d74.js",
          revision: "fe92499d95a76d74",
        },
        {
          url: "/_next/static/chunks/app/layout-5b33ce5dec0192f5.js",
          revision: "5b33ce5dec0192f5",
        },
        {
          url: "/_next/static/chunks/app/manifest.webmanifest/route-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/app/page-859063adf4abaa24.js",
          revision: "859063adf4abaa24",
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
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/not-found-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-692b3b48aafcd580.js",
          revision: "692b3b48aafcd580",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-f00afd0a2e8b4416.js",
          revision: "f00afd0a2e8b4416",
        },
        {
          url: "/_next/static/css/359a6caf690053a5.css",
          revision: "359a6caf690053a5",
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
          revision: "ffffe727042c01b65017514d25a78e93",
        },
        {
          url: "/honsoc-logo-gold.png",
          revision: "b227200f00effeba29b93f2ecc97c72d",
        },
        {
          url: "/honsoc-logo-white.png",
          revision: "bc7d650809a94b8fa76e52cac2079663",
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
        {
          url: "/kuya-nicolai.png",
          revision: "66420e7999820db6dfb2740bdb69ad4e",
        },
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
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      "/",
      new a.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ response: a }) =>
              a && "opaqueredirect" === a.type
                ? new Response(a.body, {
                    status: 200,
                    statusText: "OK",
                    headers: a.headers,
                  })
                : a,
          },
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new a.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new a.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\/_next\/static.+\.js$/i,
      new a.CacheFirst({
        cacheName: "next-static-js-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new a.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:mp4|webm)$/i,
      new a.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:js)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:css|less)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new a.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ sameOrigin: a, url: { pathname: e } }) =>
        !(!a || e.startsWith("/api/auth/callback") || !e.startsWith("/api/")),
      new a.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ request: a, url: { pathname: e }, sameOrigin: s }) =>
        "1" === a.headers.get("RSC") &&
        "1" === a.headers.get("Next-Router-Prefetch") &&
        s &&
        !e.startsWith("/api/"),
      new a.NetworkFirst({
        cacheName: "pages-rsc-prefetch",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ request: a, url: { pathname: e }, sameOrigin: s }) =>
        "1" === a.headers.get("RSC") && s && !e.startsWith("/api/"),
      new a.NetworkFirst({
        cacheName: "pages-rsc",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ url: { pathname: a }, sameOrigin: e }) => e && !a.startsWith("/api/"),
      new a.NetworkFirst({
        cacheName: "pages",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    a.registerRoute(
      ({ sameOrigin: a }) => !a,
      new a.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});
