#!/bin/bash

#TODO: replace by better solution

set -e

op="$PWD"

files=""

for file in $(dir -w 1 | grep "^zeronet-"); do
  if [ -d $file ]; then
    files="$files $file"
  fi
done

files="$files . "

ver=$(echo $(cat package.json | grep "version" | sed "s|\"||g" | sed "s|  ||g" | grep " .*" -o))

echo "Publishing $files @ $ver"

echo "Sure?"

sed -r 's|"([a-z-]+)": "file:.*"|"\1": "'$ver'"|g' -i package.json

read foo

[ "$foo" != "yes" ] && echo "Abort." && exit 2

set -x

for dir in $files; do
  cd $dir
    [ ! -e .gitignore ] && ln -s ../.gitignore
    npm publish
  cd ..
done

cd $op
sed -r 's|"(zeronet-[a-z-]+)": ".*"|"\1": "file:\1"|g' -i package.json