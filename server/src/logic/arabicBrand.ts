export function buildPreferredArabicBrandName(brandName: string): string {
  const raw = String(brandName ?? "").trim();
  if (!raw) return "";

  if (/[\u0600-\u06FF]/.test(raw)) {
    return raw;
  }

  const clean = raw.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return raw;

  const twoLetterMap: Record<string, string> = {
    sh: "ش",
    kh: "خ",
    gh: "غ",
    th: "ث",
    dh: "ذ",
    ph: "ف",
    ch: "تش",
    ou: "و",
    oo: "و",
    ee: "ي",
    ie: "ي",
    aa: "ا",
  };

  const oneLetterMap: Record<string, string> = {
    a: "ا",
    b: "ب",
    c: "ك",
    d: "د",
    e: "ي",
    f: "ف",
    g: "ج",
    h: "ه",
    i: "ي",
    j: "ج",
    k: "ك",
    l: "ل",
    m: "م",
    n: "ن",
    o: "و",
    p: "ب",
    q: "ق",
    r: "ر",
    s: "س",
    t: "ت",
    u: "و",
    v: "ف",
    w: "و",
    x: "كس",
    y: "ي",
    z: "ز",
  };

  const words = clean.split(" ").filter(Boolean).map((word) => {
    let out = "";
    let i = 0;

    while (i < word.length) {
      const pair = word.slice(i, i + 2);
      if (twoLetterMap[pair]) {
        out += twoLetterMap[pair];
        i += 2;
        continue;
      }

      const ch = word[i];
      if (/\d/.test(ch)) {
        out += ch;
      } else if (ch === "a" && i === 0) {
        out += "أ";
      } else {
        out += oneLetterMap[ch] ?? "";
      }

      i += 1;
    }

    return out;
  });

  return words.join(" ").trim() || raw;
}
