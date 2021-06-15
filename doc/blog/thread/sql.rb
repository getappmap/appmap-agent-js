# sql.rb
require 'sqlite3'
class Main
  def main ()
    db = SQLite3::Database.new(':memory:');
    thread = Thread.new {
      x = db.execute('SELECT 2 * 3')[0][0]
      puts(x)
    }
    x = db.execute('SELECT 4 * 5')[0][0];
    puts(x)
    thread.join
    return 0
  end
end
Main.new.main()