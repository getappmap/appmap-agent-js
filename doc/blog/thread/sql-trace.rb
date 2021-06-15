# sql-trace.rb
require 'sqlite3'
require './trace.rb'
class Main
  def main
    db = SQLite3::Database.new(':memory:');
    thread = Thread.new {
      x = trace(db, :execute, 'SELECT 2 * 3')
      trace(self, :puts, x)
    }
    x = trace(db, :execute, 'SELECT 4 * 5')
    trace(self, :puts, x)
    thread.join()
    return 0
  end
end
trace(Main.new, :main)
