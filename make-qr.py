#!/usr/bin/env python3
"""Write a large, high-contrast QR code for a presentation slide.

Usage:
    python3 make-qr.py [url]

Needs: pip install "qrcode[pil]"
"""
import sys

import qrcode

url = sys.argv[1] if len(sys.argv) > 1 else "https://thecreativezellie.github.io/TeamBingo/"
# 8 modules of quiet zone is twice the ISO minimum of 4, so a slide photo still scans.
BORDER = 8
MIN_PX = 1200

qr = qrcode.QRCode(
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    border=BORDER,
)
qr.add_data(url)
qr.make(fit=True)
modules = qr.modules_count + 2 * BORDER
qr.box_size = max(1, (MIN_PX + modules - 1) // modules)
img = qr.make_image(fill_color="#000000", back_color="#ffffff").convert("RGB")
img.save("qr-code.png", format="PNG")
print(f"qr-code.png {img.size[0]}x{img.size[1]} -> {url}")
