#!/usr/bin/env bash

# If an argument is provided, use it as the cache-buster.
# Otherwise, default to ?v=<epoch_timestamp>
CACHE_STR="$(date +%s)"
if [ -n "$1" ]; then
  CACHE_STR="$1"
fi

CACHE_BUSTER="?v=$CACHE_STR"
echo "Using cache-buster: $CACHE_BUSTER"

############################################
# 1) Update ./index.html (Main.js)
############################################
# Example: change
#   <script type="module" src="js/Main.js"></script>
# to
#   <script type="module" src="js/Main.js?v=abc123"></script>
sed -i.bak "s|src=\"js/Main.js\"|src=\"js/Main.js$CACHE_BUSTER\"|g" ./index.html
rm -f ./index.html.bak

############################################
# 3) Update all JS in ./js/*.js except VortexLib.js
############################################
# a) Append cache-buster to import statements:
#       import Something from './Something.js';
#    becomes
#       import Something from './Something.js?v=abc123';
# b) Replace __CACHE_BUSTER__ placeholders with $CACHE_BUSTER

for jsFile in ./js/*.js; do
  # Skip VortexLib.js
  if [[ "$jsFile" == *"VortexLib.js" ]]; then
    continue
  fi

  # Append ?v=... to ES import statements.
  # This will look for: import ... from "<anything>.js"
  # and change it to:   import ... from "<anything>.js?v=abc123"
  sed -i.bak "s|\(\import[[:space:]][^;]* from[[:space:]]*[\"'][^\"']*\.js\)\([\"']\)|\1$CACHE_BUSTER\2|g" "$jsFile"

  # Replace any manual placeholders __CACHE_BUSTER__
  sed -i.bak "s|__CACHE_BUSTER__|$CACHE_STR|g" "$jsFile"

  rm -f "$jsFile.bak"
done

echo "Cache-busting complete."

