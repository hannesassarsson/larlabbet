"""Gör om dist-preview/index.html till en sida som kan publiceras som förhandsvisning
(utan doctype/head/body, utan PWA-taggar, med relativa sökvägar)."""
import pathlib, re
d = pathlib.Path(__file__).resolve().parent.parent / "dist-preview"
html = (d / "index.html").read_text()
head = re.search(r"<head>(.*)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
head = re.sub(r"<!--STARTUP_IMAGES-->.*?<!--/STARTUP_IMAGES-->", "", head, flags=re.S)
head = re.sub(r'\s*<meta (charset|name="viewport"|name="apple-[^"]*"|name="mobile-web-app-capable"|name="theme-color"|name="color-scheme"|name="format-detection")[^>]*>', "", head)
head = re.sub(r'\s*<link rel="(manifest|apple-touch-icon)"[^>]*>', "", head)
head = head.replace('href="/icons/', 'href="./icons/')
head = head.replace("<title>Lärlabbet</title>", '<title>Lärlabbet</title>\n<meta name="claude:viewport-fit-sides" content="cover">')
out = head.strip() + "\n" + body.strip() + "\n"
(d / "leklandet.html").write_text(out)
print("dist-preview/leklandet.html", len(out), "tecken")
