#! /usr/bin/bash

# backend setup 
apt update
add-apt-repository -y ppa:deadsnakes/ppa
apt install -y python3.11
apt install -y curl
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 1
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 2
printf "2" | update-alternatives --config python3 
sudo cp /usr/lib/python3/dist-packages/apt_pkg.cpython-38-x86_64-linux-gnu.so /usr/lib/python3/dist-packages/apt_pkg.so
apt install -y postgresql postgresql-contrib
sudo -u postgres createdb fiveguys
sudo -u postgres psql -d fiveguys -f backend/fiveguys_preloaded.dump
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
pip install -r requirements.txt
pip install flask==2.3.2 flask_cors==4.0.0 apscheduler==3.10.1