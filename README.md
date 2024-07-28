# HOWTO - Build docker image.
Remember to replace the version number with the current version.

docker build -t sune1337/iptv-player:1.0.0 -f IptvPlayer/Dockerfile .

# HOWTO - Copy docker image to file
Remember to replace the version number with the current version.

docker save sune1337/iptv-player:1.0.0 | gzip > iptv-player-1.0.0.tar.gz
