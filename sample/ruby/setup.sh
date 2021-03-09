rvm implode
# check ~/.bashrc, ~/.bash_profile, ~/.zshrc, ~/.profile
brew update
brew install rbenv ruby-build

echo 'export PATH="$HOME/.rbenv/shims:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc

rbenv install 2.7.2
rbenv install -l

bundle config path 'modules' --local

bundle install

APPMAP=true bundle exec ruby hello/hello_test.rb
