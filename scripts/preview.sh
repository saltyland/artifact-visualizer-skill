#!/usr/bin/env bash
# Wrap an artifact body file in the publish skeleton and serve it locally for checking.
# usage: preview.sh <page.html> [port]
set -e
src="$1"; port="${2:-8765}"
dir="$(cd "$(dirname "$src")" && pwd)"; base="$(basename "$src" .html)"
out="$dir/${base}.preview.html"
{ printf '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style></head><body>'; cat "$src"; printf '</body></html>'; } > "$out"
# An old server left on the port answers 404, so move to the next free one.
while (echo > "/dev/tcp/127.0.0.1/$port") 2>/dev/null; do port=$((port+1)); done
# Windows Python cannot resolve the POSIX cwd from Git Bash, so pass a Windows path.
serve_dir="$dir"; command -v cygpath >/dev/null 2>&1 && serve_dir="$(cygpath -w "$dir")"
echo "http://127.0.0.1:${port}/${base}.preview.html"
exec python -m http.server "$port" --bind 127.0.0.1 --directory "$serve_dir"
