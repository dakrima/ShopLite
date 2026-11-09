#!/bin/zsh
cd -- "${0:A:h}" || exit 1
/usr/bin/open "$PWD/public/index.html"
