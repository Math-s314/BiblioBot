cd "%~dp0"
git checkout helloworld
git pull origin helloworld  
call npm install
node .
pause