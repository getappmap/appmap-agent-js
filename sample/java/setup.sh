# https://github.com/applandinc/appmap-java/releases
# https://sourceforge.net/projects/junit/files/junit/4.10/

javac -g -classpath "junit-4.10.jar" hello/*.java

java -classpath ".:./junit-4.10.jar" hello/Runner

APPMAP=true java -classpath ".:./junit-4.10.jar" -javaagent:appmap-0.5.0-java11.jar hello/Runner
