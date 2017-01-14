1. Checkout code
1. Install homebrew from http://brew.sh/
1. Install node: ``` $ brew install node```
1. Install mongodb: ``` $ brew install mongodb```
1. Setup mongodb for start on login and start now. Commands are in output of brew install mongodb.
1. Enter the code directory: ``` $ cd feightyserver```
1. Install all node dependencies: ``` $ npm install```
1. Install gulp: ``` $ npm install -g gulp```
1. To run the server. ``` $ gulp```


# How to setup two server - Demo and Staging
1. In a new folder (let's say feighty-staging) - execute git clone git@heroku.com:feighty-staging.git
1. change the .git/config file and add following lines
[remote "heroku"]
        url = git@heroku.com:feighty.git
        fetch = +refs/heads/*:refs/remotes/heroku/*
        pushurl = git@heroku.com:feighty-staging.git
1. whenever you have to update staging execute 'git push heroku' from this folder after 'git push'.  This will update staging heroku.
