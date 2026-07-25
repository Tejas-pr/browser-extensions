from PIL import Image, ImageDraw
import math
import os

SIZE = 512
BG = (20, 22, 26, 255)      # #14161a
AMBER = (255, 184, 77, 255)  # #ffb84d
TEAL = (94, 234, 212, 255)   # #5eead4

def rounded_square(size, radius, color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=color)
    return img

def loop_arrow(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    r = size * 0.26
    stroke = size * 0.075

    bbox = [cx - r, cy - r, cx + r, cy + r]
    # two-tone ring: teal for the "A" half, amber for the "B" half,
    # leaving a gap on the right for the arrowhead
    d.arc(bbox, start=150, end=330, fill=TEAL, width=int(stroke))
    d.arc(bbox, start=-30, end=150, fill=AMBER, width=int(stroke))

    # arrowhead at the amber end (~-30deg), pointing tangentially
    ang = math.radians(-30)
    tip_x = cx + r * math.cos(ang)
    tip_y = cy + r * math.sin(ang)
    tang = ang - math.pi / 2  # tangent direction (loop travels clockwise)
    head_len = size * 0.16
    head_w = size * 0.14

    p_tip = (tip_x + head_len * 0.55 * math.cos(tang), tip_y + head_len * 0.55 * math.sin(tang))
    perp = tang + math.pi / 2
    p_left = (tip_x - head_len * 0.35 * math.cos(tang) + head_w / 2 * math.cos(perp),
              tip_y - head_len * 0.35 * math.sin(tang) + head_w / 2 * math.sin(perp))
    p_right = (tip_x - head_len * 0.35 * math.cos(tang) - head_w / 2 * math.cos(perp),
               tip_y - head_len * 0.35 * math.sin(tang) - head_w / 2 * math.sin(perp))
    d.polygon([p_tip, p_left, p_right], fill=AMBER)

    return img

def build(size):
    radius = size * 0.22
    base = rounded_square(size, radius, BG)
    glyph = loop_arrow(size)
    base.alpha_composite(glyph)
    return base

os.makedirs("icons", exist_ok=True)
master = build(SIZE)
for px in (128, 48, 16):
    out = master.resize((px, px), Image.LANCZOS)
    out.save(f"icons/icon{px}.png")
    print(f"wrote icons/icon{px}.png")
