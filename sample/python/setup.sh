brew install python3
python3 -m pip install --upgrade pip

python3 -m pip install --target modules appmap

PYTHONPATH=modules:$PYTHONPATH APPMAP=true python3 hello/hello_test.py

PYTHONPATH=modules:$PYTHONPATH APPMAP=true python3 hello/deep/deep_test.py

PYTHONPATH=modules:$PYTHONPATH APPMAP=true python3 hello/main.py > tmp/appmap/hello.appmap.json