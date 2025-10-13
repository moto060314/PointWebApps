# RE･CREATION point calc apps

## 納期期限

~ 2025/10/14

筋肉バスターズとコスプレの点数によるランキングアニメーション

~ 2025/10/21

完成

## 必要技能要件

- ポイントの加算
  - ポイントのフォーム集計

## フロー

ダウンロードしてください

https://nodejs.org/ja/download

git clone

cosplay_contest/index.html と muscle_busters/index.html は、得点の表示用です。
そのため、リンクは、

http://localhost:5500/muscle_busters/index.html
http://localhost:5500/cosplay_contest/index.html

この 2 になります。

データの加算などは、
http://localhost:5500/
に接続したときの、このディレクトリだと、index.html がベースになります。

そこで、データを入力する形です。

で、この際に入力するデータ（ポイント）は、事前に google forms でいただくデータをもとに、入力する形になります。

保存される先は local storage なので、chrome の中に保存されます。

# TODO

- コスプレで今だれが優勢かを表示するカード式（投票数と順位）

- 筋肉バスターズ各種目の回数（1 位）
