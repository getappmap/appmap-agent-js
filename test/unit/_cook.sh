npx prettier --write $1
npx eslint $1
echo $1
if [[ $1 == lib/* ]]
  then
    TEST=test/${1:4}
    echo $TEST
    npx prettier --write $TEST
    npx eslint $TEST
    node $TEST
fi