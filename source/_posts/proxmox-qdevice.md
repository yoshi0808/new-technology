---
title: Proxmox 2ノードクラスタにqdeviceを追加する
date: 2026-06-20T18:20:00+09:00
tags: proxmox
categories:
---


{% asset_img Title.png 1024 alt %}

<p class="onepoint">この記事で実現すること</p>

前回の記事では、2台のProxmoxノード（V9.x）でクラスタを構成し、VMマイグレーションとZFSレプリケーションを使える状態にしました。

ただし、2ノードクラスタにはquorumの課題があります。片方のノードが停止した場合、残った1台だけではクラスタとしての判断が難しくなるためです。

そこで今回は、外部投票サーバーとしてqdeviceを追加し、2ノードクラスタのquorumを安定させます。さらに、HA構成を作成し、テストVMを使って障害時のフェイルオーバーを確認します。

<!-- more -->

## 今回の構成

| 名称       | pve1                         | pve2                         | quory                |
| ---------- | ---------------------------- | ---------------------------- | -------------------- |
| 役割       | メインノード                 | セカンダリノード             | QDevice / automation |
| CPU        | AMD Ryzen 9 7900 (12C/24T)   | AMD Ryzen 5 5600G (6C/12T)   | N100                 |
| メモリ     | 64GB DDR5-4800               | 48GB DDR4-3200               | 16GB DDR4-3200       |
| ストレージ | NVMe 2TB ×2（ZFS mirror）    | NVMe 1TB（ZFS single）       | NVMe 500MB(Ext4)     |
| NIC        | Intel X710 10GbE ×4          | Intel X710 10GbE ×4          | Realtek 1GbE         |
| OS         | Debian 13 + Proxmox VE 9.1.9 | Debian 13 + Proxmox VE 9.1.9 | Ubuntu Server 26.04  |

※名称は私が名付けたホスト名です。特に記載する必要もありませんが文中で引用する時にわかりやすくするためですのでご理解ください。

クラスタ構成では、できればCPUの種類は同じメーカーで揃えておいた方が安全です。完全に同じハードウェア構成にできれば理想ですが、家庭内のホームラボでは必ずしもそうはいきません。

今回の構成でも、pve1はRyzen 9 7900、pve2はRyzen 5 5600Gで、世代も性能も異なります。そのため、VMのCPU設定では互換性を意識する必要があります。

ネットワークについては、VMマイグレーションや将来的なフェイルオーバーを考えると、各ノードで同じ構成にしておくべきです。構成が揃っていれば、VMが別ノードへ移動した場合でも、どのネットワークを利用すべきかが明確になります。

## 第1部：quorumとqdevice

### 2ノードクラスタの問題

Proxmoxを2台でクラスタ化すると、VMのマイグレーションや管理の一元化ができるようになります。
しかし、2ノードクラスタにはquorumの問題があります。
クラスタでは、複数のノードが協調して動作します。そのため、障害やネットワーク分断が発生したときに、「どのノードが正しいクラスタとして動き続けてよいのか」を判断する必要があります。
3台以上のクラスタであれば、多数決によって判断しやすくなります。たとえば3台構成で1台が停止しても、残り2台で多数派を維持できます。
一方、2台構成では片方のノードが停止した場合、残ったノードは1台だけになります。この状態では、多数決という意味では過半数を作りにくくなります。

また、単純なノード停止ではなく、ノード間の通信だけが切れた場合には、両方のノードが「相手が停止した」と判断してしまう可能性があります。このような状態で両方のノードが独立して動き続けると、両方のノードが稼働中になり、それぞれのノードはもう一方のノードが停止しているように見えてしまいます。
そのため、2ノードクラスタでは、単に2台をクラスタ化するだけでなく、quorumをどう扱うかを考える必要があります。

### quorumとは何か

quorumは、クラスタが安全に動作を継続してよいかを判断するための多数決の考え方です。
クラスタ内の各ノードにはvote（投票）があり、クラスタ全体として必要な票数を満たしている場合に、quorate（定足数を満たした）状態になります。
Proxmoxクラスタでは、pvecm statusでquorumの状態を確認できます。

``` bash
pvecm status
```
正常な状態であれば、以下のように表示されます。
``` bash
Quorate: Yes
```
Quorate: Yesの状態であれば、そのクラスタは必要な票数を満たしており、クラスタとして動作を継続できます。
逆にquorumを失うと、クラスタとして安全に判断できない状態になります。

quorumは、単なる死活監視ではありません。
「ノードが生きているか」だけではなく、「クラスタとして多数派を維持できているか」を判断するための仕組みです。

### qdeviceとは何か

qdeviceは、クラスタのquorum判定を補助するための外部投票デバイスです。

2ノードクラスタでは、pve1とpve2の2票だけで構成されます。この状態では、片方のノードが停止したときに、残った1台だけでは多数派を作りにくくなります。
そこで、Proxmoxノードとは別にqdeviceを追加します。
qdeviceを追加すると、2台のProxmoxノードに加えて、外部の投票役を持つ構成になります。
今回の構成では、以下のような考え方になります。

``` bash
pve1   : 1 vote
pve2   : 1 vote
quory  : qdevice
合計   : 3 votes

quorum : 2 votes
```
これにより、片方のProxmoxノードが停止した場合でも、残ったノードとqdeviceによってquorumを維持しやすくなります。
qdeviceは、Proxmoxノードそのものではありません。VMやCTを動かす役割もありません。
あくまで、クラスタの投票を補助するための外部サーバーです。

### quoryの役割

今回の環境では、quoryと名付けたUbuntu Server26.04をqdeviceとして利用します。
quoryはProxmoxノードではありません。pve1やpve2のようにVMを動かすことはありません。
役割は、corosync-qnetdを動作させ、Proxmoxクラスタのqdeviceとしてquorum判定を補助することです。

qdevice用途であれば、高性能なCPUや大容量メモリは必要ありません。通信量も少なく、1GbEでも十分すぎるくらいです。
重要なのは、性能よりも安定して常時稼働できることです。

また、qdeviceはクラスタの判断を補助する役割を持つため、できればProxmoxノードと同じ障害点に置きすぎない方が安全です。ホームラボでは色々な限界はありますが、同じ電源タップ、同じスイッチ、同じ物理場所にすべてを集約すると、障害時にまとめて影響を受ける可能性があります。

家庭内のホームラボでは完全な分離は難しいですが、qdeviceは「3台目のProxmoxノード」ではなく、「軽量な外部投票役」として考えると分かりやすいと思います。

一方で、qdeviceは万能ではありません。qdeviceはバックアップではありません。VMやCTのデータを保存するわけではありませんし、ストレージ冗長化もレプリケーションもバックアップとは全く関係ありません。
qdeviceが提供するものは、あくまでquorum判定の補助です。

## 第2部：qdeviceセットアップ

### qdeviceに必要なハードウェア

実際のところ、ホームユーザーが導入するqdeviceとしては以下のようなものが選択されるようです。

1. 極めて小型のPC（ラズベリーパイなど）にセットアップ
2. NASにVMとしてセットアップ
3. 小型PCにセットアップ

私は、3の小型PCを選びました。クラスタ運用やVMの管理のために定期的なジョブ実行を行う処理もこのQuorumでも兼ねられるのが良いのではないかと思ったためです。但し過負荷になってはクラスタ通信に影響が出るのでそれは避けたいところです。省電力ならラズベリーパイが一番ですが、電源やパーツの安定稼働については今ひとつ心配なところがありました。

### 今回使ったMSIサーバー

省電力で安定していそうな小型のハードウェアというのはありそうでなかなか探すのは難しいものです。今回は以下のハードウェアにしました。

{% asset_img msi.png 1024 alt %}

MSI Cubi N ADL S-055BUS

| **項目**   | **内容**                                                |
| ---------- | ------------------------------------------------------- |
| 用途       | Proxmoxクラスタ用 qdevice / 管理用サーバー              |
| CPU        | Intel Celeron N100（TDP 6w）                            |
| メモリ     | Crucial 16GB SODIMM PC4-25600（DDR4-3200）CT16G4SFS832A |
| ストレージ | KINGSTON OM8S 500GB NVMe SSD                            |
| NIC        | 1GbE ×2（REALTEK RTL8111H）                             |
| OS         | Ubuntu Server 26.04                                     |

> MSI BUSINESS & PRODUCTIVITY PCS Cubi N ADL
 <https://storage-asset.msi.com/specSheet/uk/mini-pcs/Cubi%20N%20ADL%20S-055BUS.pdf>

ベアボーンなのでSSDとメモリは別途手持ちのものを流用、購入しています。
このハードウェアは見た通り非常に小さいことと電源としてACアダプタが付いてます。
2PortのNICがあるので、Quorum用途だけではなく、色々な目的に使い回しが効きそうです。

### qdevice用途としてはオーバースペックだった話

ひたすらPVE1、PVE2との通信が発生するのだろうということで機器選定したものの、完全にオーバースペックです。

ネットワーク

{% asset_img port.png 1024 alt %}

CPU/メモリ

8日以上連続稼働した状態でも、load averageは0.00, 0.00, 0.00で、CPU idleは97.7% でした。
メモリについても、16GB搭載に対して実使用量は約790MiB程度でした。qdevice用途としては、今回のIntel Celeron N100 / 16GB RAM / NVMe SSD 500GBという構成は、かなり余裕のある構成です。

``` bash
yoshi@quory:~$ top -b -n 1 | head -20
top - 19:37:42 up 8 days,  5:29,  1 user,  load average: 0.00, 0.00, 0.00
Tasks: 144 total,   1 running, 143 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  2.3 sy,  0.0 ni, 97.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :  15317.8 total,  12795.5 free,    790.0 used,   2078.5 buff/cache
MiB Swap:   4096.0 total,   4096.0 free,      0.0 used.  14527.8 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  69179 yoshi     20   0    8944   5824   3780 R   9.1   0.0   0:00.01 top
      1 root      20   0   25504  16308  11172 S   0.0   0.1   0:31.64 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.83 kthreadd

```

実際にqdeviceとして動作しているcorosync-qnetdの使用量を確認すると、CPU使用率は0.0%、RSSは13,864 KiB、つまり約13.5MiBでした。

この結果からも、qdevice用途では高性能なCPUや大容量メモリはほとんど必要ないことが分かります。

今回のquoryはIntel Celeron N100、メモリ16GB、NVMe SSD 500GBという構成ですが、qdevice用途としては明らかに余裕のある構成です。

| **項目**     | **値**                  |
| ------------ | ----------------------- |
| プロセス     | corosync-qnetd          |
| CPU使用率    | 0.0%                    |
| メモリ使用率 | 0.0%                    |
| RSS          | 13,864 KiB（約13.5MiB） |
| VSZ          | 16,228 KiB（約15.8MiB） |

### ネットワーク構成

qdevice用途では、大容量の通信は発生しません。

quoryはVMを実行するProxmoxノードではなく、VMマイグレーションやZFSレプリケーションのデータ転送にも使いません。あくまで、Proxmoxクラスタのquorum判定を補助する外部投票サーバーです。
そのため、qdevice用途であれば、ネットワークは1GbE 1ポートでも十分です。
今回の構成では、qdevice通信はDefault VLANのみを使用します。厳密に言えば、同じセグメントである必要はありませんが、できるだけ通信が妨げられることは防ぐために同一のネットワークに設定されることをお勧めします。

``` bash
pve1.internal  : 192.168.x.11
pve2.internal  : 192.168.x.12
quory.internal : 192.168.x.14
```

前回の記事では、VMマイグレーションやZFSレプリケーション用の通信をServer VLAN側に分けました。

一方で、qdeviceは大容量データを流す用途ではありません。そのため、quoryはDefault VLANに接続し、pve1 / pve2から安定して名前解決と通信ができる状態にしています。
corosync-qnetdはTCP 5403を使用します。
そのため、pve1 / pve2 **から** quoryのTCP 5403へ到達できることが必要です。

私の環境では、quoryには1GbEポートが2つありますが、qdevice用途では片方だけ使用しています。qdeviceは大容量通信を行わないため、複数NICや10GbEは不要です。

### 事前確認

ここからはUbuntu26.04 Serverを前提に、qdeviceの具体的なセットアップを行なっていきます。qdeviceを追加する前に、名前解決、SSH疎通、時刻同期、クラスタ状態を確認します。

qdeviceのセットアップでは、Proxmoxノードからqdeviceへ接続して設定を行います。そのため、Proxmoxノードからqdeviceへ到達できることが前提になります。

### 名前解決確認
まず、qdevice上でproxmoxノード、qdevice自身の名前解決を確認します。以下は私の環境ですが、ご自身の環境で、事前に`/etc/hosts`でホスト名の登録をしてください。

``` bash
getent hosts pve1.internal
getent hosts pve2.internal
getent hosts quory.internal
```

期待する結果は以下の通りです。

``` bash
192.168.x.11 pve1.internal
192.168.x.12 pve2.internal
192.168.x.14 quory.internal
```

次に、Proxmoxノード側からqdeviceの名前解決を確認します。
pve1で実行します。

``` bash
getent hosts quory.internal
```

pve2でも同様に確認します。

``` bash
getent hosts quory.internal
```

どちらも以下のように解決できれば問題ありません。

``` bash
192.168.x.14 quory.internal
```

qdeviceはクラスタの判断に関わるため、名前解決が不安定な状態で進めるのは避けるべきです。DNSを使う場合でも、/etc/hostsを使う場合でも、pve1 / pve2 / quoryの相互解決が安定していることを確認しておきます。

### rootの有効化

`pvecm qdevice setup` は、Proxmox側からqdeviceへroot SSH接続して初期設定を行います。
そのため、qdevice登録直前のみquory側でroot SSHログインを一時的に許可します。

qdevice上で実行します。一時的なrootパスワードを設定してください。

``` bash
sudo passwd root
```

通常運用ではroot SSHは無効にするのが一般的です。

### root SSH 一時許可

qdevice上で実行します。一時的に`00-qdevice-root-temp.conf`ファイルを作成します。viまたはnanoで

``` bash
vi /etc/ssh/sshd_config.d/00-qdevice-root-temp.conf
```

そして、以下の内容を登録します。

``` bash
PermitRootLogin yes
PasswordAuthentication yes
KbdInteractiveAuthentication yes
ChallengeResponseAuthentication yes
```

SSH設定の構文確認です。慎重にやりましょう。

``` bash
sudo sshd -t
```

SSHを再起動します。

``` bash
sudo systemctl restart ssh
```


### SSH疎通確認

qdevice setupでは、Proxmoxノードからqdeviceへ接続します。
そのため、proxmox1号機とproxmox2号機からqdeviceへSSH接続できることを確認します。
pve1で実行します。ホスト名はご自身の環境で読み替えてください。

``` bash
ssh root@quory.internal hostname
```

期待する結果は以下です。

``` bash
quory
```

pve2でも同様に確認します。

``` bash
ssh root@quory.internal hostname
```

``` bash
quory
```

qdeviceのセットアップ完了後に、あらためて公開鍵認証へ移行し、パスワード認証を無効化する流れがおすすめです。

### 時刻同期確認

クラスタ構成では、各ノードの時刻が大きくずれていないことも重要です。
quoryで時刻同期状態を確認します。

``` bash
timedatectl
```

確認するポイントは以下です。

``` bash
System clock synchronized: yes
```
pve1 / pve2についても、通常はNTPまたはchronyで時刻同期されていることを確認しておきます。
クラスタやqdeviceのトラブル調査ではログ時刻を突き合わせることが多いため、時刻同期は地味ですが重要です。

### クラスタ状態確認

qdeviceを追加する前に、現在のProxmoxクラスタが正常であることを確認します。
pve1またはpve2で以下を実行します。

``` bash
pvecm status
```

確認するポイントは以下です。

``` bash
Quorate: Yes
```

この時点では、まだqdeviceを追加していないため、2ノードクラスタとして表示されます。
qdevice追加前の状態でクラスタが不安定な場合は、先にその原因を解消してから進めた方が安全です。

### quoryにqnetdをインストールする

次に、quory側にcorosync-qnetdをインストールします。qnetdは、qdeviceの投票を受け持つ外部サーバー側のサービスです。
quoryで実行します。

``` bash
sudo apt update
sudo apt install -y corosync-qnetd
```

インストール後、サービスを有効化して起動します。

``` bash
sudo systemctl enable --now corosync-qnetd
```

状態を確認します。

``` bash
systemctl status corosync-qnetd --no-pager
```

active (running) になっていれば問題ありません。

``` bash
active (running)
```

また、corosync-qnetdはTCP 5403で待ち受けます。quoryで以下を実行します。

``` bash
ss -lntp | grep 5403
```

以下のようにLISTENしていれば、qnetdが待ち受けています。

``` bash
LISTEN ... :5403 ...
```
pve1 / pve2からquoryのTCP 5403へ到達できる必要があります。

### Proxmoxノード側のqdeviceパッケージを確認する

次に、pve1 / pve2側でcorosync-qdeviceがインストールされているか確認します。pve1で実行します。

``` bash
dpkg -l | grep corosync-qdevice
```

pve2でも確認します。

``` bash
dpkg -l | grep corosync-qdevice
```

インストールされていない場合は、それぞれのProxmoxノードでインストールします。

``` bash
apt update
apt install -y corosync-qdevice
```

インストール後、再度確認します。

``` bash
dpkg -l | grep corosync-qdevice
```
qnetdはquory側、qdeviceはProxmoxノード側で動作する、という役割分担です。

### corosync設定をバックアップする

pvecm qdevice setupは、Proxmoxクラスタのcorosync設定を変更します。そのため、実行前に /etc/pve/corosync.confをバックアップしておきます。

今回はpve1で作業します。

``` bash
mkdir -p /root/backup/corosync
```

corosync.confをバックアップします。

``` bash
cp -a /etc/pve/corosync.conf \
  /root/backup/corosync/corosync.conf.$(date +%Y%m%d-%H%M%S)
```

現在のクラスタ状態も保存しておきます。

``` bash
pvecm status > /root/backup/corosync/pvecm-status.$(date +%Y%m%d-%H%M%S).txt
```

バックアップが取得できていることを確認します。

``` bash
ls -l /root/backup/corosync
```

クラスタ構成を変更する作業では、作業前の状態を残しておくことが重要です。
通常はpvecm qdevice removeでqdeviceを削除できますが、万が一の切り戻しを考えると、設定変更前のファイルを残しておくと安心です。

### pvecm qdevice setupを実行する

準備ができたら、Proxmoxノード側でqdevice setupを実行します。qdevice setupは、pve1またはpve2のどちらか一方でのみ実行します。
今回はpve1で実行します。

``` bash
pvecm qdevice setup quory.internal
```

初回接続時には、SSH fingerprintの確認が表示される場合があります。その場合は内容を確認してyesを入力します。

セットアップ中には、qnetd証明書の設定、corosync設定の更新、qdeviceサービスの起動などが行われます。正常に完了したら、エラーが出ていないことを確認します。エラーが出た場合は、そのまま先へ進まず、以下を確認します。

pve1 / pve2側です。

``` bash
pvecm status
systemctl status corosync --no-pager
systemctl status corosync-qdevice --no-pager
```

quory側です。

``` bash
systemctl status corosync-qnetd --no-pager
```

qdeviceはクラスタ構成に関わるため、エラーが出た状態で作業を続けない方が安全です。

### qdevice追加後の状態確認

qdevice setupが完了したら、クラスタ状態を確認します。
pve1またはpve2で実行します。

``` bash
pvecm status
```

確認するポイントは以下です。

``` bash
Expected votes: 3
Total votes: 3
Quorum: 2
Quorate: Yes
Qdevice
```

この状態になっていれば、pve1 / pve2の2ノードに加えて、qdeviceが投票に参加している状態です。
考え方としては以下のようになります。

``` bash
pve1  : 1 vote
pve2  : 1 vote
quory : qdevice

合計  : 3 votes
quorum: 2 votes
```
次に、corosync-qdeviceの状態を確認します。

``` bash
corosync-qdevice-tool -s
```

Membership information、Vote、Stateなどが表示され、qdeviceが正常に認識されていることを確認します。
サービス状態も確認します。
pve1で実行します。

``` bash
systemctl status corosync-qdevice --no-pager
```

pve2でも確認します。

``` bash
systemctl status corosync-qdevice --no-pager
```

どちらもactive (running) であれば問題ありません。quory側では、qnetdの状態を確認します。

``` bash
systemctl status corosync-qnetd --no-pager
```

こちらもactive (running) であることを確認します。最後に、quory側でTCP 5403の待ち受けも確認しておきます。

``` bash
ss -lntp | grep 5403
```

これで、2ノードProxmoxクラスタにqdeviceが追加され、quorumを安定させる構成になりました。

### セットアップ完了後

一時許可ファイル削除

``` bash
sudo rm -f /etc/ssh/sshd_config.d/00-qdevice-root-temp.conf
```

SSH設定構文確認

``` bash
sudo sshd -t
```

問題がなければ

``` bash
sudo systemctl restart ssh
```

rootパスワードのロック（必要に応じて）

``` bash
sudo passwd -l root
```

ユーザーがsudo付きのコマンドを叩いたり、sudo -iするときのパスワードには無影響です。

公開鍵認証
普段、公開鍵認証をお使いの方はこのタイミングで公開鍵認証に移行されることをお勧めします。ここでは公開鍵認証の手順については割愛します。

ufwを設定される方は、以下のPortが開いている必要があります※IPv6やFromはお好みで。

``` bash
sudo ufw status

Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
5403/tcp                   ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
5403/tcp (v6)              ALLOW       Anywhere (v6)

```

## 第3部：HA構成と検証

さて、いよいよProxmoxサーバー側でのHA対応です。ここまで来れば、VMのマイグレーションもqdeviceがある状態で安全に運用できています。

改めての確認ですが、この記事では、前回記事の{% post_link proxmox-cluster %}で紹介した通り、共有Diskは保有せずにZFSレプリケーションで、別ノードにVMディスクのコピーを作っておく方法を前提としています。
高価な共有Diskが無くて良い代わりに、レプリケーションにはその間隔が開きますから、同期できていない時間の情報はフェイルオーバーすると失われます。最新のメモリも連携されていないので、VMはもう片方のノードでブートから始まります。ここはライブマイグレーションとは大きく異なります。

### HAに登録するVMを絞る

前述した通り、そのVMの適正に応じてHA戦略を立てる必要があります。HAに向いているVMは情報更新があまり発生しないものが対象になります。データ損失が致命的であるならばHAには向きません。

| **分類**                 | **条件**                                                              | **例**                                                             | **補足**                                                                               |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| HA対象にしやすいVM       | ZFSレプリケーションなどにより、復旧先ノードにVMディスクのコピーがある | FreeRADIUS、DNS、軽量な認証系、監視補助系                          | VMディスクが復旧先に存在しない場合、HAで起動できません                                 |
| HA対象にしやすいVM       | 最後のレプリケーション以降の更新が失われても影響が小さい              | 設定変更が少ないサービス、読み取り中心のサービス                   | ZFSレプリケーションは非同期のため、数分〜1時間程度の巻き戻りを許容できる必要があります |
| HA対象にしやすいVM       | サービス停止をできるだけ避けたい                                      | 認証、名前解決、ファイアウォール、家庭内ネットワークの基盤サービス | HAで復旧できても、完全な無停止ではありません                                           |
| HA対象にしやすいVM       | 障害時に別ノードで自動起動しても問題が少ない                          | ステートレス寄りのサービス、設定変更頻度が低いVM                   | 起動後にサービスが自動復旧できることも重要です                                         |
| HAに向かないVM           | データ損失が許されない                                                | データベース、会計データ、重要な業務データを持つVM                 | 非同期レプリケーションでは、最後の同期後の更新が失われる可能性があります               |
| HAに向かないVM           | 書き込みが頻繁に発生する                                              | ログサーバー、監視DB、時系列DB、頻繁に更新されるアプリケーション   | 障害時の巻き戻りによる不整合が問題になりやすいです                                     |
| HAに向かないVM           | 障害後に手動確認してから起動した方が安全                              | ストレージ系サービス、複雑なDB、状態管理が重いサービス             | 自動起動よりも、状態確認後に復旧した方が安全な場合があります                           |
| HA対象にしなくてもよいVM | 停止しても影響が小さい                                                | 検証用VM、一時的な作業VM、Cloud-Initで再作成できるVM               | HA対象を増やしすぎると、障害時の挙動が複雑になります                                   |
| HA対象にしなくてもよいVM | バックアップから戻せば十分                                            | 開発用VM、テスト環境、利用頻度の低いVM                             | HAではなく、バックアップと再作成で十分な場合があります                                 |

私の場合は、HAに登録しているのはFirewall、Radiusサーバーの2つです。開発環境（ansibleなど）はレプリケーションを実行していますが、HAにはしていません。ノードがダウンして開発が止まるのは（仕事ではないので）許容できますが、ダウンのタイミングによって依存関係が崩れたりするのは致命的です（そもそものバックアップはGitHubがありますが、Pushしていない開発中の依存関係が崩れるのは避けたいものです）。

Firewallは滅多にルールを更新することはなく、仮にレプリケーションの間（15分）にノードがダウンして15分前の状態に戻ったとしてもほぼ問題はありません。せいぜいルールの1つか2つを登録し直すだけで済みます。それよりもFirewallが止まれば自宅全体のネットが止まるわけですからむしろ細かいことよりもサービス復旧が優先です。

もう1つ家族のために必須のサービスがWi-Fi向けのWPA3 Enterprise認証のFree Radiusサーバーです。これは負荷も極めて低くリソースもほとんど要らないサービスですが、ダウンしていると家族がWi-Fiに接続できなくなります。私が仕事で外出している時にそうなっては困るのでFirewall同様、ダウンタイムが許されないサービスになります。個人で運用しているものなのでユーザー追加という頻度が極めて少ないというのが一般的にも言えますし、この環境ではEAP-TLSでCA証明書によって利用ユーザーが署名されているため、実はRADIUSに対してユーザー登録、新しいデバイスの登録という必要もなく、Radiusには1つのCA証明書（公開鍵）が置いてあるだけで、ほぼ更新が発生することはありません。

別の言い方をすれば、HA登録するためにできるだけ更新が発生しないような方式を選択するという考え方もあります。

### HAにVMを登録する

まず最初にHA登録されるVMがレプリケーション設定されているかを確認してください。これが大前提となります。

Proxmoxにログインし、データセンターからHAを選択します。

{% asset_img ha1.png 1024 alt %}

ここでHAを登録することになります。

{% asset_img ha2.png 480 alt %}

大事なところはフェイルバックのチェックを外すことです。これがチェックされていると、対象ノードがダウンしていない限りはVMを意図的に別ノードに移動させても、本来稼働しているノードが稼働していれば、当該ノードに戻ってしまうからです。

続いて、HAの中のアフィニティルールを定めます。

{% asset_img ha3.png 480 alt %}

通常動作するノードのプライオリティを高くしておきます。
なお、注意点として、シャットダウンやリブートなどユーザーが意図的に実施したアクションに対してはフェイルオーバーは発生しません。VMが稼働しているノードをダウンさせた場合、そのVMを抱えたままノードは停止またはリブートします。

## テストVMでフェイルオーバーを確認する

{% asset_img ha-failover-flow.png 1024 alt %}

### 実際の障害シナリオ

pve2の電源障害を想定しました。

HA対象としたVMは、検証用のUbuntu VMであるvm:100です。検証を分かりやすくするため、この時点ではSophos FirewallやRADIUS用VMはHA対象から外し、vm:100のみをHA対象としました。

事前状態は以下の通りです。

```
HA対象VM: vm:100
稼働ノード: pve2
復旧先ノード: pve1
レプリケーション: pve2 → pve1
qdevice: 有効
quorum: OK
```

pve2の電源を強制的に停止したところ、pve1側ではcorosyncがpve2との通信断を検知し、その後HA managerがpve2を障害ノードとして扱いました。

ログ上の流れは以下の通りです。

```
08:19頃     事前ログ・状態確認
08:20頃     pve2 電源断を実行
08:20:47    pve1 が pve2 の KNET link down を検知
08:20:52    pve2 が membership から離脱
08:21:05    HA manager が pve2 を unknown に変更
08:21:55    vm:100 / pve2 が fence 状態へ
08:22:55    fencing acknowledged / recovery
08:22:56    pve1 上で VM 100 起動
```

実際のHAログでも、以下のようにvm:100がpve2からpve1へ復旧されたことを確認できました。

``` 
service 'vm:100': state changed from 'fence' to 'recovery'
recover service 'vm:100' from fenced node 'pve2' to node 'pve1'
service 'vm:100': state changed from 'recovery' to 'started'  (node = pve1)
VM 100 started with PID 1544351.
service status vm:100 started
```

その後、ha-manager statusを確認すると、vm:100はpve1上で起動していました。

``` 
quorum OK
master pve1
lrm pve2 (old timestamp - dead?, watchdog standby)
service vm:100 (pve1, started)
```

また、8:50時点でVM内からuptime -pを確認したところ、以下のように表示されました。

``` 
uptime -p
up 27 minutes
```

このことから、VM内のOSとしても8:23頃に起動していたことが確認できます。Proxmox側のログでは8:22:56にVM起動が完了しているため、HAログ、VM状態、ゲストOS内のuptimeが整合する結果となりました。

### フェイルオーバー後のレプリケーション

HAフェイルオーバー後、vm:100はpve1上で起動しました。

その後、pve2を起動してクラスタへ復帰させたところ、vm:100はpve1上で稼働したままでした。これは、HA設定でfailback 0としているためです。障害ノードが復帰しても、VMは自動的には元のノードへ戻りません。

一方で、ZFSレプリケーションは現在の稼働ノードに合わせて継続されました。

フェイルオーバー直後、pve2はまだ停止していたため、pve1からpve2へのレプリケーションは一度失敗し、通知が発生しました。しかし、pve2を起動してクラスタへ復帰させると、次回のレプリケーションで正常に同期されました。

8:56時点でpvesr statusを確認すると、vm:100のレプリケーション先はlocal/pve2となっており、8:45の定期同期も正常に完了していました。

``` 
JobID      Enabled    Target        LastSync             NextSync             Duration  FailCount State
100-0      Yes        local/pve2     2026-06-21_08:45:02  2026-06-21_09:00:00  3.46902          0 OK
```

通常時、vm:100はpve2で稼働し、pve2からpve1へレプリケーションされていました。

しかし、HAフェイルオーバー後はvm:100がpve1で稼働しているため、レプリケーション方向もpve1からpve2へ切り替わっていました。

この結果から、今回のProxmox VE 9.2環境では、HAフェイルオーバー後もVMの稼働ノードに合わせてZFSレプリケーションが継続されることを確認できました。

なお、このタイミングでProxmoxから通知設定されている宛先に対して自動的に通知が行われていることも確認できました。私はProxmox上でSlackに対してWeb hookを設定していますが、以下の内容がスマホのSlack宛に通知されました。

{% asset_img slack.png 360 alt %}

## まとめ

今回は、2ノードProxmoxクラスタにqdeviceを追加し、ZFSレプリケーション環境でHAフェイルオーバーがどのように動作するかを検証しました。

qdeviceを追加することで、2ノード構成でも安定してquorumを維持できるようになりました。さらに、HA対象VMを限定したうえでpve2の電源断を行い、vm:100がpve1上で自動起動することを確認しました。

今回の検証では、pve2の電源断からpve1上でVMが起動するまで、ログ上では約2分程度かかりました。HAフェイルオーバーはライブマイグレーションではないため、メモリ状態は引き継がれず、VMは復旧先ノードで再起動されます。

また、共有ストレージを利用せず、ローカルZFSとレプリケーションで構成している場合、復旧先ノードで起動するVMのディスク状態は、最後にレプリケーションされた時点のものになります。そのため、前回レプリケーションからノード障害発生までの間に更新されたデータは失われる事になります。

一方で、停止すると困るが、数分程度のデータ巻き戻りを許容できるVMに対しては、今回の構成は十分に有効だと感じました。

なお、すべてのVMをHA対象にすればよいわけではありません。例えば監視系VMのように、障害直前までのログを可能な限り保持したいVMは、あえてHAには登録しない判断もあります。

VMごとに、サービス停止の影響、データ更新頻度、失ってよいデータの範囲を整理したうえで、HA対象にするかどうかを決めることが重要です。
