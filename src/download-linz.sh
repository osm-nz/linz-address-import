mkdir -p data
cd data
rm -rf linz.csv

LINZ_ADDRESS_URL="https://linz-addr-cdn.kyle.kiwi/linz.csv"

curl -L $LINZ_ADDRESS_URL --output linz.csv
