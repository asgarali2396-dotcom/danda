"""
Generate crisp PNG icons for SoleLedger PWA using pure Python standard library (struct + zlib).
Creates 192x192 and 512x512 icons with an elegant footwear shoe & profit badge motif.
"""
import struct
import zlib
import math

def create_png(width, height, draw_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter byte 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff))
    
    # IDAT
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff))
    
    # IEND
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff))
    
    return bytes(png)

def draw_soleledger_icon(x, y, w, h):
    # Normalized coords from 0.0 to 1.0
    nx = x / (w - 1)
    ny = y / (h - 1)
    
    # Rounded squircle background
    # Center is (0.5, 0.5)
    dx = abs(nx - 0.5) * 2
    dy = abs(ny - 0.5) * 2
    # Squircle metric: dx^4 + dy^4 <= 1.0 (with slight padding)
    squircle = (dx ** 3.8) + (dy ** 3.8)
    
    if squircle > 0.95:
        # Anti-aliased edge or transparent
        if squircle > 1.0:
            return 0, 0, 0, 0
        alpha = int(255 * (1.0 - (squircle - 0.95) / 0.05))
        return 15, 23, 42, alpha
    
    # Background gradient: Deep slate navy (#090d16 to #1e293b)
    # with a top-left subtle radial highlight of emerald (#059669)
    dist_tl = math.sqrt((nx - 0.2)**2 + (ny - 0.2)**2)
    glow = max(0.0, 1.0 - dist_tl * 1.5)
    
    base_r = int(12 + (nx * 10) + glow * 25)
    base_g = int(20 + (ny * 15) + glow * 80)
    base_b = int(35 + (nx * 25) + glow * 50)
    
    # Modern Shoe Silhouette + Dollar / Percent Badge
    # Let's check distance to shoe shape in normalized coords:
    # Shoe sole: bottom curve around y=0.58 to 0.72, x from 0.20 to 0.80
    in_shoe = False
    in_accent = False
    in_percent = False
    
    # 1. Sleek Shoe Sole base
    if 0.20 <= nx <= 0.80 and 0.62 <= ny <= 0.70:
        # Sole profile
        arch = 0.04 * math.sin((nx - 0.20) / 0.60 * math.pi)
        if ny >= 0.64 - (0.03 if (0.42 <= nx <= 0.58) else 0):
            in_shoe = True
    
    # 2. Shoe Body (Sneaker silhouette)
    # Toe box: 0.65 to 0.80, y between 0.52 and 0.65
    if 0.62 <= nx <= 0.78 and 0.52 <= ny <= 0.64:
        toe_curve = (nx - 0.62) / 0.16
        if ny >= 0.52 + toe_curve * 0.08:
            in_shoe = True
    # Mid-body / instep: 0.35 to 0.65, y between 0.40 and 0.65
    if 0.36 <= nx <= 0.65 and 0.38 <= ny <= 0.65:
        in_shoe = True
        # Swoosh / dynamic athletic streak in emerald
        if 0.40 <= nx <= 0.62 and abs((ny - 0.48) - 0.35 * (nx - 0.40)) < 0.035:
            in_accent = True
    # Heel & collar: 0.24 to 0.38, y between 0.34 and 0.65
    if 0.24 <= nx <= 0.38 and 0.34 <= ny <= 0.65:
        # Heel angle
        if ny >= 0.34 + (0.38 - nx) * 0.4:
            in_shoe = True
            
    # Circular Profit Badge on Top Right: Center at (0.70, 0.30), radius ~0.16
    rb_dist = math.sqrt((nx - 0.72)**2 + (ny - 0.28)**2)
    if rb_dist <= 0.16:
        # Badge circle border/glow
        if rb_dist >= 0.14:
            return 16, 185, 129, 255 # Emerald border
        # Inside badge: glowing emerald green
        # Percentage symbol "%" or "20%"
        # Let's draw high-contrast badge
        bg_val = int(180 + 75 * (1.0 - rb_dist/0.16))
        return 16, 185, 129, 255
    
    # White percent symbol inside badge
    if rb_dist < 0.12:
        # Draw small 20% or up-arrow
        # Arrow: vertical bar (0.72, 0.22 to 0.32) and head
        if abs(nx - 0.72) <= 0.018 and 0.22 <= ny <= 0.33:
            return 255, 255, 255, 255
        if abs(ny - (0.24 + abs(nx - 0.72))) < 0.02 and 0.67 <= nx <= 0.77 and ny <= 0.26:
            return 255, 255, 255, 255
            
    if in_accent:
        return 52, 211, 153, 255 # Emerald 400
    if in_shoe:
        # Elegant gradient for shoe body: Crisp white to subtle metallic slate
        shoe_light = int(240 - ny * 50)
        return shoe_light, shoe_light + 5, shoe_light + 10, 255
        
    return min(255, base_r), min(255, base_g), min(255, base_b), 255

print("Generating 192x192 icon...")
icon_192 = create_png(192, 192, draw_soleledger_icon)
with open("c:/Users/USER/Desktop/danda/icon-192.png", "wb") as f:
    f.write(icon_192)

print("Generating 512x512 icon...")
icon_512 = create_png(512, 512, draw_soleledger_icon)
with open("c:/Users/USER/Desktop/danda/icon-512.png", "wb") as f:
    f.write(icon_512)

print("Icons created successfully!")
