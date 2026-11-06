"""Genererar appikoner och startbilder för iPad från SVG (kräver rsvg-convert).
Kör: python3 scripts/icons.py
"""
import pathlib, re, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
(PUB / "icons").mkdir(parents=True, exist_ok=True)
(PUB / "startup").mkdir(parents=True, exist_ok=True)

INK = "#3B2F5C"

def icon_svg(size, rounded, pad=0.0):
    """Lärlabbets ikon: vit kolv med turkos vätska på mörkblå botten."""
    r = size * 0.24 if rounded else 0
    inner = size * (1 - 2 * pad)
    off = size * pad
    k = inner / 120
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
      <rect width="{size}" height="{size}" rx="{r}" fill="#1D2B4F"/>
      <g transform="translate({off} {off}) scale({k})">
        <path d="M47 24h26M51 24v24L30 84a8 8 0 0 0 7 12h46a8 8 0 0 0 7-12L69 48V24" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M38 72h44l8 12a6 6 0 0 1-5 9H35a6 6 0 0 1-5-9z" fill="#2EC4B6"/>
        <circle cx="54" cy="80" r="3.5" fill="#fff" opacity=".85"/>
        <circle cx="64" cy="64" r="3" fill="#fff" opacity=".7"/>
        <circle cx="58" cy="54" r="2.2" fill="#fff" opacity=".6"/>
        <path d="M86 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FF8A5B"/>
      </g></svg>'''

def render(svg, out, w, h=None):
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as f:
        f.write(svg)
    cmd = ["rsvg-convert", "-w", str(w), "-h", str(h or w), "-o", str(out), f.name]
    subprocess.run(cmd, check=True)

# Ikoner
(PUB / "icons" / "favicon.svg").write_text(icon_svg(120, True))
render(icon_svg(512, True), PUB / "icons" / "icon-32.png", 32)
render(icon_svg(512, False), PUB / "icons" / "apple-touch-icon.png", 180)
render(icon_svg(512, True), PUB / "icons" / "icon-192.png", 192)
render(icon_svg(512, True), PUB / "icons" / "icon-512.png", 512)
render(icon_svg(512, False, pad=0.1), PUB / "icons" / "maskable-512.png", 512)

# Startbilder för iPad (stående och liggande). Storlek i CSS-px och pixeltäthet.
IPADS = [(768, 1024), (744, 1133), (810, 1080), (820, 1180), (834, 1112), (834, 1194), (834, 1210), (1024, 1366), (1032, 1376)]
links = []
for w, h in IPADS:
    for orient in ("portrait", "landscape"):
        pw, ph = (w * 2, h * 2) if orient == "portrait" else (h * 2, w * 2)
        s = min(pw, ph) * 0.22
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{pw}" height="{ph}" viewBox="0 0 {pw} {ph}">
          <rect width="{pw}" height="{ph}" fill="#F4F5F1"/>
          <g transform="translate({pw/2 - s/2} {ph/2 - s*0.75})">
            <svg width="{s}" height="{s}" viewBox="0 0 512 512">{re.sub(r'^<svg[^>]*>|</svg>$', '', icon_svg(512, True).strip())}</svg>
          </g>
          <text x="{pw/2}" y="{ph/2 + s*0.55}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="{s*0.32}" fill="#1D2433">Lärlabbet</text>
        </svg>'''
        name = f"ipad-{pw}x{ph}.png"
        render(svg, PUB / "startup" / name, pw, ph)
        media = f"(device-width: {w}px) and (device-height: {h}px) and (-webkit-device-pixel-ratio: 2) and (orientation: {orient})"
        links.append(f'    <link rel="apple-touch-startup-image" media="{media}" href="/startup/{name}" />')

html = (ROOT / "index.html").read_text()
html = re.sub(r"    <!--STARTUP_IMAGES-->.*?<!--/STARTUP_IMAGES-->\n|    <!--STARTUP_IMAGES-->\n",
              "    <!--STARTUP_IMAGES-->\n" + "\n".join(links) + "\n    <!--/STARTUP_IMAGES-->\n", html, flags=re.S)
(ROOT / "index.html").write_text(html)
print("Ikoner och", len(links), "startbilder klara")
