cd path\to\backend
espeak.lnk --ipa -a 200 -s 175 -p 50 -b 2 -v en -w "path\to\wave\file.wav" "message to speak"
"path\to\ffmpeg" -y -i "path\to\wave\file.wav" -b:a 128k -ar 48000 "path\to\output\file.mp3"
cd path\to\backend
echo %CD%