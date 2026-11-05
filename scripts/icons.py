"""Genererar appikoner och startbilder för iPad från SVG (kräver rsvg-convert).
Kör: python3 scripts/icons.py
"""
import pathlib, re, subprocess, tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
(PUB / "icons").mkdir(parents=True, exist_ok=True)
(PUB / "startup").mkdir(parents=True, exist_ok=True)

INK = "#3B2F5C"

def mark(x, y, s):
    """Logotypens motiv (sol-boll bakom grön kulle) i en ruta på s×s px."""
    k = s / 120
    return f'''<g transform="translate({x} {y}) scale({k})">
      <circle cx="60" cy="56" r="30" fill="#FFD166"/>
      <circle cx="50" cy="52" r="5" fill="{INK}"/><circle cx="70" cy="52" r="5" fill="{INK}"/>
      <circle cx="51.5" cy="50.5" r="1.6" fill="#fff"/><circle cx="71.5" cy="50.5" r="1.6" fill="#fff"/>
      <path d="M49 64q11 9 22 0" stroke="{INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>'''

def icon_svg(size, rounded, pad=0.0):
    """Full ikon. rounded=False ger fyrkantig ikon (iOS rundar själv)."""
    r = size * 0.27 if rounded else 0
    inner = size * (1 - 2 * pad)
    off = size * pad
    k = inner / 120
    hill = f'<path transform="translate({off} {off}) scale({k})" d="M-40 90q28-20 60-6t60-4 80 0V170H-40z" fill="#7BD389"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
      <defs><clipPath id="c"><rect width="{size}" height="{size}" rx="{r}"/></clipPath></defs>
      <g clip-path="url(#c)">
        <rect width="{size}" height="{size}" fill="#FF8A5B"/>
        <circle cx="{size*0.22}" cy="{size*0.2}" r="{size*0.05}" fill="#fff" opacity=".5"/>
        {mark(off, off, inner)}
        {hill}
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
render(icon_svg(512, False, pad=0.12), PUB / "icons" / "maskable-512.png", 512)

# Startbilder för iPad (stående och liggande). Storlek i CSS-px och pixeltäthet.
IPADS = [(768, 1024), (744, 1133), (810, 1080), (820, 1180), (834, 1112), (834, 1194), (834, 1210), (1024, 1366), (1032, 1376)]
links = []
for w, h in IPADS:
    for orient in ("portrait", "landscape"):
        pw, ph = (w * 2, h * 2) if orient == "portrait" else (h * 2, w * 2)
        s = min(pw, ph) * 0.22
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{pw}" height="{ph}" viewBox="0 0 {pw} {ph}">
          <rect width="{pw}" height="{ph}" fill="#FFF8EE"/>
          <g transform="translate({pw/2 - s/2} {ph/2 - s*0.75})">
            <svg width="{s}" height="{s}" viewBox="0 0 512 512">{re.sub(r'^<svg[^>]*>|</svg>$', '', icon_svg(512, True).strip())}</svg>
          </g>
          <text x="{pw/2}" y="{ph/2 + s*0.55}" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="{s*0.32}" fill="{INK}">Leklandet</text>
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
