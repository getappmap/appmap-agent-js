# https://github.com/applandinc/appmap-java/releases
# https://sourceforge.net/projects/junit/files/junit/4.10/

javac -classpath "junit-4.10.jar" hello/*.java
java -classpath ".:./junit-4.10.jar" hello/Runner
APPMAP=true java -classpath ".:./junit-4.10.jar" -javaagent:appmap-0.5.0-java11.jar hello/Runner

# APPMAP=true java -classpath ".:./junit-4.10.jar" -javaagent:appmap-0.5.0-java11.jar hello/Runner

# jar cfe hello.jar hello.Runner hello/*.class
# jar cfe hello.jar hello.Hello hello/Hello.class
# java -jar -javaagent:appmap-0.5.0-java11.jar hello.jar
# javac -cp junit-4.10.jar hello/Hello.java hello/HelloTest.java hello/Runner.java