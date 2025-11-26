#!/bin/bash
# Create placeholder assets for Expo app

mkdir -p assets

# Create a simple icon (1x1 transparent PNG as placeholder)
# Using ImageMagick if available, or create minimal PNG
if command -v convert &> /dev/null; then
  convert -size 1024x1024 xc:"#6366f1" assets/icon.png
  convert -size 1284x2778 xc:"#6366f1" assets/splash.png
  convert -size 1024x1024 xc:"#6366f1" assets/adaptive-icon.png
  convert -size 48x48 xc:"#6366f1" assets/favicon.png
  convert -size 96x96 xc:"#6366f1" assets/notification-icon.png
  echo "✅ Assets created with ImageMagick"
else
  # Create minimal valid PNG files using Python
  python3 << 'PYTHON'
from PIL import Image, ImageDraw

# Icon (1024x1024)
icon = Image.new('RGB', (1024, 1024), color='#6366f1')
icon.save('assets/icon.png')

# Splash (1284x2778 for iPhone)
splash = Image.new('RGB', (1284, 2778), color='#6366f1')
splash.save('assets/splash.png')

# Adaptive icon (1024x1024)
adaptive = Image.new('RGB', (1024, 1024), color='#6366f1')
adaptive.save('assets/adaptive-icon.png')

# Favicon (48x48)
favicon = Image.new('RGB', (48, 48), color='#6366f1')
favicon.save('assets/favicon.png')

# Notification icon (96x96)
notif = Image.new('RGB', (96, 96), color='#6366f1')
notif.save('assets/notification-icon.png')

print("✅ Assets created with Python PIL")
PYTHON
fi

echo "📦 Assets created in assets/ directory"
