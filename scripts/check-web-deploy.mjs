const sites = [
  "https://covenant-web-mu.vercel.app",
  "https://covenant-skill.vercel.app",
  "https://covenant-izs47bhc0-mohamedwael201193s-projects.vercel.app",
];

for (const site of sites) {
  const html = await fetch(site).then((r) => r.text());
  const m = html.match(/src="(\/assets\/[^"]+\.js)"/);
  if (!m) {
    console.log(site, "no bundle");
    continue;
  }
  const js = await fetch(site + m[1]).then((r) => r.text());
  console.log(site, {
    bundle: m[1],
    a81a1: js.includes("a81a1"),
    a8231: js.includes("a8231"),
  });
}
