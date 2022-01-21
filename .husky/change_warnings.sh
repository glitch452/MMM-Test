#!/bin/sh

function changed {
  git diff --name-only HEAD@{1} HEAD | grep "^$1" > /dev/null 2>&1
}

if changed 'package-lock.json'; then
  echo ""
  echo "######################################################"
  echo "#                                                    #"
  echo "#   📦  package-lock.json has changed.               #"
  echo "#   Run 'npm install' to update your dependencies.   #"
  echo "#                                                    #"
  echo "######################################################"
  echo ""
fi

exit 0
