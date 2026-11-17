"""Generates the app icons (PNG) with no third-party libraries. Run: python tools/make-icons.py"""
import os, struct, zlib

BG = (20, 40, 29)        # deep forest green
RING = (233, 239, 233)   # off-white
BOLT = (255, 159, 28)    # amber

# lightning bolt polygon in a 512x512 design space
BOLT_PTS = [(300, 100), (165, 292), (248, 292), (212, 420), (356, 214), (270, 214)]
CX, CY, R_OUT, R_IN = 256.0, 256.0, 184.0, 160.0


def in_poly(x, y, pts):
    inside = False
    n = len(pts)
    j = n - 1
    for i in range(n):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def pixel(x, y):
    d2 = (x - CX) ** 2 + (y - CY) ** 2
    if in_poly(x, y, BOLT_PTS):
        return BOLT
    if R_IN ** 2 <= d2 <= R_OUT ** 2:
        return RING
    return BG


def render(size, ss=3):
    scale = 512.0 / size
    rows = []
    for py in range(size):
        row = bytearray([0])  # filter type 0
        for px in range(size):
            r = g = b = 0
            for sy in range(ss):
                for sx in range(ss):
                    x = (px + (sx + 0.5) / ss) * scale
                    y = (py + (sy + 0.5) / ss) * scale
                    c = pixel(x, y)
                    r += c[0]; g += c[1]; b += c[2]
            n = ss * ss
            row += bytes((r // n, g // n, b // n))
        rows.append(bytes(row))
    return b''.join(rows)


def chunk(tag, data):
    c = struct.pack('>I', len(data)) + tag + data
    return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, size, ss):
    raw = render(size, ss)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + \
        chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print('wrote', path, len(png), 'bytes')


SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="rgb(20,40,29)"/>
  <circle cx="256" cy="256" r="172" fill="none" stroke="rgb(233,239,233)" stroke-width="24"/>
  <polygon points="300,100 165,292 248,292 212,420 356,214 270,214" fill="rgb(255,159,28)"/>
</svg>
"""

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'icon.svg'), 'w') as f:
        f.write(SVG)
    write_png(os.path.join(out, 'icon-512.png'), 512, 2)
    write_png(os.path.join(out, 'icon-192.png'), 192, 3)
    write_png(os.path.join(out, 'apple-touch-icon.png'), 180, 3)
