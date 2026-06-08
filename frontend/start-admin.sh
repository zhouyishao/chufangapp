#!/bin/zsh

PROJECT_DIR="/Users/oooz/Desktop/Z_ou/chufangapp"

osascript <<APPLESCRIPT
tell application "Terminal"
  activate
  do script "cd \"$PROJECT_DIR/server\" && npm run dev"
  delay 1
  do script "cd \"$PROJECT_DIR/admin-frontend\" && npm run dev"
  delay 1
  do script "cd \"$PROJECT_DIR/frontend\" && npm run dev:h5"
end tell
APPLESCRIPT

sleep 8
open "http://localhost:5174"
open "http://localhost:5175"
