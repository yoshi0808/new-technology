---
title: Mellanox Connect XとWindows11
date: 2023-03-25T09:00:01+09:00
tags:
- SFP+
- 10GbE
categories:
- [Hardware]
- [Network]
---

{% asset_img title.png 1024 alt %}
<p class="onepoint">この記事で実現すること</p>

この記事ではSFP+のネットワークカードである、Mellanox Connect XについてWindows11の対応状況やWindowsでのファームウェアアップデートなどを記します。
<!-- more -->

## 安価なMellanox Connect-Xカード

すでに販売終了となったConnect X-3はeBayで5,000円弱で売られています。MellanoxのConnect Xシリーズは脆弱性の指摘も見かけず、安定しているNICでしょうか。intelに比べればマイナーですが、SFP＋で安価に入手可能となっており、ホームユーザーにとっても大変ありがたい存在です。
Connect X-3はWindows10までのドライバはNvidiaのサイトに掲載されていますがWindows11ではドライバの存在はありません。

しかしながら、Windows11ではConnect Xを認識してWindowsとして用意されたドライバのインストールが行われ、すぐに使えます。

最近、2PortのMellanox Connect X-4 LxをeBayでちらほら見かけるようになってきました。販売終了した製品ですが、サポートはされています。

**MCX4121A-ACAT**という型番は、**Mellanox ConnectX-4 LX 25GBE SFP28 2ポートPCIeイーサネット アダプター**となっており、eBayで15,000円ほどで購入できます。SFP28はSFP+とモジュール接続口の互換性があります。SFP＋のダイレクトアタッチケーブル（DAC）やOM3ケーブルと共に使うSFP+短距離マルチモードファイバ（MM SR）モジュール等の10GbE SFP+で問題なく10Gbps通信できます。もちろん25GbEとしても使えますが、PCなどホスト端末に挿して使うには他の機器との速度差が大きすぎて使いにくいものです。intel製のNICは在庫不足から回復傾向にあるようですが、まだまだ高額です。

詳しいスペックは以下のリンクを参照してください。PCIe3 x8となっています。
> Mellanox Connect X-4
 <https://network.nvidia.com/files/doc-2020/pb-connectx-4-lx-en-card.pdf>

Connect X-3はやや個人向けの色合いが強かったですが、Connect X-4あたりからはサーバー製品としての要素が強くなっていきます。OEM版（HPE、DELL向け等）は避けることをお勧めします。これはベンダーロックインが掛かっている可能性が高く、ファームウェアの強制書き込みなどが必要になります。また、それでうまくいく保証もありません。また、Connect X-4はいろいろなホストインタフェースがありますので、Ethernet、PCIeというところに気をつけてください。PCIeスロットに挿すだけですぐにWindows11で使えるMCX4121A-ACATはお勧めです。

2Portも要らないといっても、eBayでは意外と1Portものが出ていません。また、他カードとの兼ね合い（x16が埋まっている）でPCIe x4までという方は一般論としてConnect X-3（MCX311A-XCAT）が向いています。

> Nvidia ConnectX-4 Lx 製品概要
 <https://www.nvidia.com/ja-jp/networking/ethernet/connectx-4-lx/>

> NVidiaフォーラムでConnect X-3のWin11のドライバが無いことをNVidiaのテクニカルサポートが示唆
 <https://forums.developer.nvidia.com/t/connectx-3-cx311a-xcat-for-win11-crashed/205962>

## Windows11でのデバイスドライバ

### Connect X-3

Connect X-3をPCIeにセットしてWin11を起動します。デバイスドライバを見てみます。
{% asset_img x3.png 480 alt %}

2019年のドライバが自動的に取り込まれます。このドライバに脆弱性が出てしまえば、リスクがあり別の製品に買い替えが必要となりますが、脆弱性データベースでもなかなかMellanoxの名前を見ることはありません。

お約束ですが、ESXi上のUbuntuとのiperf3を実行してみます。MTUは1,500のデフォルト、スイッチはフローコントロールをオンにしています。
多重度3でUbuntuからダウンロードする方向（-Rオプション）に実行して以下の通りです。
```
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.05  sec  3.81 GBytes  3.26 Gbits/sec  615             sender
[  5]   0.00-10.00  sec  3.81 GBytes  3.27 Gbits/sec                  receiver
[  7]   0.00-10.05  sec  3.46 GBytes  2.96 Gbits/sec  423             sender
[  7]   0.00-10.00  sec  3.46 GBytes  2.97 Gbits/sec                  receiver
[  9]   0.00-10.05  sec  3.79 GBytes  3.24 Gbits/sec  623             sender
[  9]   0.00-10.00  sec  3.78 GBytes  3.25 Gbits/sec                  receiver
[SUM]   0.00-10.05  sec  11.1 GBytes  9.45 Gbits/sec  1661             sender
[SUM]   0.00-10.00  sec  11.1 GBytes  9.49 Gbits/sec                  receiver

```

(Ryzen 7 5700G、メモリDDR4-3200 DIMM (PC4-25600)32GByte)
このPCにはPCIe×16のスロットにConnect X-4を、PCIe x4のスロットにConnect X-3を挿しています。

少しリトライが多いようですが、9.49Gbpsです。`-R -P3`オプションとして逆方向の送信（ダウンロード）、多重度3のみ、それ以外のオプションは指定していません。Windows10時代でも多重度は4程度から9.3Gbpsをマークしていたと記憶しているので、まずまずでしょうか。Windows11側がダウンロード側ですのでUbuntu側の送信速度に少し追いついていないようです。これはドライバが最適化されていない可能性もあります。しかし、実運用として使うのであれば十分でしょう。

### Connect X-4

Connect X-4はWindows11で自動導入されるドライバは2020年のものですが、新しいドライバをNvidiaからダウンロードできます。
{% asset_img x4.png 480 alt %}

NVidiaではSoftwareのEthernetの分類でドライバを検索することになります。
<https://developer.nvidia.com/networking/ethernet-software>

具体的には、以下のWinOF-2がWin10以降のドライバとなります。

> MLNX_OFED for Windows - WinOF / WinOF-2
 <https://network.nvidia.com/products/adapter-software/ethernet/windows/winof-2/>

Connect X-4は2023年2月2日に発表されたRevision3.20.50010が最新のようですが、実際のドライバは上記のキャプチャの通り、3.2.25がインストールされます。

セットアップはただインストーラの指示に従い、進めていくだけなので何も難しいものはありません。
{% asset_img setup.png 480 alt %}

## Connect X-4のスループット

PCのConnect X-4（SFP28スロット）にSFP＋モジュールを挿入し、対向もスイッチに挿します。

Connect X-3もConnect X-4も同じ10GbEとして使うなら変わらないように思えますが、ドライバの違いもさることながら能力は結構違います。
多重度1でUbuntuに対して実行した結果です。

``` bash
Connect X-4 flow control send

[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  1.11 GBytes  9.51 Gbits/sec
[  5]   1.00-2.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   2.00-3.00   sec  1.10 GBytes  9.49 Gbits/sec
[  5]   3.00-4.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   4.00-5.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   5.00-6.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   6.00-7.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   7.00-8.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   8.00-9.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   9.00-10.00  sec  1.10 GBytes  9.49 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  11.1 GBytes  9.49 Gbits/sec                  sender
[  5]   0.00-10.04  sec  11.0 GBytes  9.45 Gbits/sec                  receiver

Connect X-4 flow control recv

[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  1.11 GBytes  9.51 Gbits/sec
[  5]   1.00-2.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   2.00-3.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   3.00-4.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   4.00-5.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   5.00-6.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   6.00-7.00   sec  1.10 GBytes  9.49 Gbits/sec
[  5]   7.00-8.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   8.00-9.00   sec  1.10 GBytes  9.48 Gbits/sec
[  5]   9.00-10.00  sec  1.11 GBytes  9.49 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.05  sec  11.1 GBytes  9.45 Gbits/sec    0             sender
[  5]   0.00-10.00  sec  11.1 GBytes  9.49 Gbits/sec                  receiver
```

非常に安定していますね。Windowsのiperf3のシングルプロセスでRetryが0です。
ちなみにこれだけ安定しているならということでスイッチのフローコントロールを外してみます。

``` bash
Connect X-4 no flow control send

[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  1.11 GBytes  9.52 Gbits/sec
[  5]   1.00-2.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   2.00-3.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   3.00-4.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   4.00-5.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   5.00-6.00   sec  1.10 GBytes  9.49 Gbits/sec
[  5]   6.00-7.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   7.00-8.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   8.00-9.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   9.00-10.00  sec  1.11 GBytes  9.49 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  11.1 GBytes  9.50 Gbits/sec                  sender
[  5]   0.00-10.04  sec  11.1 GBytes  9.45 Gbits/sec                  receiver

Connect X-4 no flow control recv

[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  1.11 GBytes  9.49 Gbits/sec
[  5]   1.00-2.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   2.00-3.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   3.00-4.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   4.00-5.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   5.00-6.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   6.00-7.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   7.00-8.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   8.00-9.00   sec  1.10 GBytes  9.47 Gbits/sec
[  5]   9.00-10.00  sec  1.10 GBytes  9.45 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.05  sec  11.0 GBytes  9.42 Gbits/sec    0             sender
[  5]   0.00-10.00  sec  11.0 GBytes  9.47 Gbits/sec                  receiver
```

フローコントロール無しでこれは良い結果です。もっとも、アプリケーション（iperf3）が再送を必要としていないだけであって、NIC同士がオフロードして送受信管理するのでOSまでその情報は見えていないと考えられます。昔はとても高価かつ使いこなすのが難しいNICでしたが、シンプルに使うだけであれば、容易にその高い性能がホームユーザーにも享受できるようになってきました。

## Connect Xのファームウェア更新（Windows版）

特にMellanoxのNICで脆弱性という話を聞いたことはなく、頻繁にパッチが出ないので本当に運用が楽ではありますが購入時にファームウェアを更新しておきましょう。「{% post_link nic-firmware  %}」ではネットに接続されていない前提としてパッチを個別にダウンロードしましたが、Windowsの場合はネットに接続されている事が前提でしょうから、もう少し手間は省けます（ESXiホスト自身はNTPなど限定されたサービスを除きインターネットアクセスしないのが一般的です）。

WindowsにおいてMellanoxカードのファームウェアの更新にはMFTとmlxupの2つのツールが必要です。
まずMFTのインストールになります。以下のURLからMFTをダウンロードします。

> NVIDIA Firmware Tools (MFT)
 <https://network.nvidia.com/products/adapter-software/firmware-tools/>

2023-3-25時点では、2023-1-31リリースの4.23.0が最新のようです。
MFTもインストーラーで特に悩むこともなくセットアップを完了させます。OSを再起動するとMFTツールは自動起動されますが、再起動しなくともコマンドプロンプトから`mst server start`でサービスが起動します。
```
C:\Users\yoshi>mst server start

C:\Users\yoshi>Waiting for connection on port 23108
```
引き続き、管理者権限のコマンドプロンプトを開き、`mst status`を実行するとNICの情報が得られます。
```
C:\Windows\System32>mst status
MST devices:
------------

  mt4117_pciconf0

C:\Windows\System32>

```

続いてmlxupのダウンロードです。これはexeファイルそのものなので、ブラウザからのダウンロード時に警告が出るかもしれません。
> mlxup - Update and Query Utility
 <https://network.nvidia.com/support/firmware/mlxup-mft/>

ダウンロードしたら、コマンドプロンプトにて`mlxup.exe --query`を実行します。

```
mlxup --query

Querying Mellanox devices firmware ...

Device #1:
----------

  Device Type:      ConnectX4LX
  Part Number:      MCX4121A-ACA_Ax
  Description:      ConnectX-4 Lx EN network interface card; 25GbE dual-port SFP28; PCIe3.0 x8; ROHS R6
  PSID:             MT_2420110034
  PCI Device Name:  mt4117_pciconf0
  Base MAC:         0c42a1000000
  Versions:         Current        Available
     FW             14.25.1020     14.32.1010
     PXE            3.5.0701       3.6.0502
     UEFI           14.18.0019     14.25.0017

  Status:           Update required
```

するとこのようにファームウェアの情報とアップデート可能か否かの情報が得られます。
実際のファームウェアの更新は`mlxup --online`です。これで適切なファームウェアがダウンロードされ適用されます。
```
C:\Users\yoshi\Downloads>mlxup --online
Querying Mellanox devices firmware ...

Device #1:
----------

  Device Type:      ConnectX4LX
  Part Number:      MCX4121A-ACA_Ax
  Description:      ConnectX-4 Lx EN network interface card; 25GbE dual-port SFP28; PCIe3.0 x8; ROHS R6
  PSID:             MT_2420110034
  PCI Device Name:  mt4117_pciconf0
  Base MAC:         0c42a1000000
  Versions:         Current        Available
     FW             14.25.1020     14.32.1010
     PXE            3.5.0701       3.6.0502
     UEFI           14.18.0019     14.25.0017

  Status:           Update required

Release notes for the available Firmware:
-----------------------------------------

  For more details, please refer to the following FW release notes:
    1- ConnectX3 (2.42.5000):    http://www.mellanox.com/pdf/firmware/ConnectX3-FW-2_42_5000-release_notes.pdf
    2- ConnectX3Pro (2.42.5000): http://www.mellanox.com/pdf/firmware/ConnectX3Pro-FW-2_42_5000-release_notes.pdf
    3- Connect-IB (10.16.1200):  http://www.mellanox.com/pdf/firmware/ConnectIB-FW-10_16_1200-release_notes.pdf
    4- ConnectX4 (12.28.2006):   http://docs.mellanox.com/display/ConnectX4Firmwarev12282006
    5- ConnectX4Lx (14.32.1010): http://docs.mellanox.com/display/ConnectX4LxFirmwarev14321010
    6- ConnectX5 (16.35.2000):   http://docs.mellanox.com/display/ConnectX5Firmwarev16352000
    7- ConnectX6 (20.36.1010):   http://docs.mellanox.com/display/ConnectX6Firmwarev20361010
    8- ConnectX6Dx (22.36.1010):   http://docs.mellanox.com/display/ConnectX6DxFirmwarev22361010
    9- ConnectX6Lx (26.36.1010):   http://docs.mellanox.com/display/ConnectX6LxFirmwarev26361010
    10- BlueField2 (24.35.2000):   http://docs.mellanox.com/display/BlueField2Firmwarev24352000
    11- ConnectX7 (28.36.1010):   http://docs.mellanox.com/display/ConnectX7Firmwarev28361010

---------
Found 1 device(s) requiring firmware update...

Perform FW update? [y/N]: y

---


CMD: mlxup -u --log-on-update --ssl-certificate C:\Users\yoshi\AppData\Local\Temp\sfxter_yoshi_3512\mlxup-dir\ca-bundle.crt --current-dir C:\Users\yoshi\Downloads\  --online
Querying Mellanox devices firmware ...

Device #1:
----------

  Device Type:      ConnectX4LX
  Part Number:      MCX4121A-ACA_Ax
  Description:      ConnectX-4 Lx EN network interface card; 25GbE dual-port SFP28; PCIe3.0 x8; ROHS R6
  PSID:             MT_2420110034
  PCI Device Name:  mt4117_pciconf0
  Base MAC:         0c42a1000000
  Versions:         Current        Available
     FW             14.25.1020     14.32.1010
     PXE            3.5.0701       3.6.0502
     UEFI           14.18.0019     14.25.0017

  Status:           Update required

Release notes for the available Firmware:
-----------------------------------------

  For more details, please refer to the following FW release notes:
    1- ConnectX3 (2.42.5000):    http://www.mellanox.com/pdf/firmware/ConnectX3-FW-2_42_5000-release_notes.pdf
    2- ConnectX3Pro (2.42.5000): http://www.mellanox.com/pdf/firmware/ConnectX3Pro-FW-2_42_5000-release_notes.pdf
    3- Connect-IB (10.16.1200):  http://www.mellanox.com/pdf/firmware/ConnectIB-FW-10_16_1200-release_notes.pdf
    4- ConnectX4 (12.28.2006):   http://docs.mellanox.com/display/ConnectX4Firmwarev12282006
    5- ConnectX4Lx (14.32.1010): http://docs.mellanox.com/display/ConnectX4LxFirmwarev14321010
    6- ConnectX5 (16.35.2000):   http://docs.mellanox.com/display/ConnectX5Firmwarev16352000
    7- ConnectX6 (20.36.1010):   http://docs.mellanox.com/display/ConnectX6Firmwarev20361010
    8- ConnectX6Dx (22.36.1010):   http://docs.mellanox.com/display/ConnectX6DxFirmwarev22361010
    9- ConnectX6Lx (26.36.1010):   http://docs.mellanox.com/display/ConnectX6LxFirmwarev26361010
    10- BlueField2 (24.35.2000):   http://docs.mellanox.com/display/BlueField2Firmwarev24352000
    11- ConnectX7 (28.36.1010):   http://docs.mellanox.com/display/ConnectX7Firmwarev28361010

---------
Found 1 device(s) requiring firmware update...


Please wait while downloading MFA(s) ...
Device #1: Updating FW ...

FSMST_INITIALIZE -   OK

Writing Boot image component -   0%
Writing Boot image component -   1%
Writing Boot image component -   2%
(省略)
Writing Boot image component - 100%
Writing Boot image component -   OK
Done


Restart needed for updates to take effect.

```
最後にOSをリブートして完了です。ESXiよりはずいぶん簡単ですね。

個別のファームウェアを適用したい場合は、mlxupのダウンロードページにUser Manualのリンクがありますので参照してください。

## PCIe x4スロット

さて、エイプリールフールも近いのでネタを1つご紹介します。
今回紹介したMellanox Connect X-4の必要レーン数は、PCIe x8です。グラフィックカードをPCIe x16に挿していらっしゃる方は残りのPCIe x4のスロットしか使えず、最初からPCIe x8のネットワークカードは候補に上がらないと思います。

私のもう1台のPC（Ryzen5 5600G）のPCIe x4のスロットです（PCIe3 x4で動作）。物理的なスロットは長いですが、接続端子がx4の部分までしかありません（画像をクリックして拡大できます）。
{% asset_img pci1.png 1024 alt %}

Connect X-4を挿すところです。どう見てもレーン数が不足しています。

{% asset_img pci2.png 1024 alt %}

とりあえずはスロットにConnect X-4を差し込み、Windows11を起動すると無事にカードは認識されています。**SFP28モジュール**とOM3ケーブルとを使ってスイッチに繋いでみます。

{% asset_img unifi1.png 1024 alt %}

（UbiquitiのSwitch Pro Aggregationスイッチは4つのSFP28ポートを持っています。見た目はSFP+と区別がつきませんが、右側の4PortがSFP28です）

iperf3のテストです。Windows11同士、それぞれがConnectx-4で片方がPCIe x4です。多重度は2です。

``` bash
iperf3 PCIe x4 Ryzen5(SFP28) <- Ryzen7(SFP28)

C:\Users\yoshi>iperf3 -c 192.168.x.165 -R -P2
Connecting to host 192.168.x.165, port 5201
Reverse mode, remote host 192.168.x.165 is sending
[  5] local 192.168.x.112 port 49813 connected to 192.168.x.165 port 5201
[  7] local 192.168.x.112 port 49814 connected to 192.168.x.165 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  1.37 GBytes  11.8 Gbits/sec
[  7]   0.00-1.00   sec  1.35 GBytes  11.6 Gbits/sec
[SUM]   0.00-1.00   sec  2.72 GBytes  23.3 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   1.00-2.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   1.00-2.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   1.00-2.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   2.00-3.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   2.00-3.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   2.00-3.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   3.00-4.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   3.00-4.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   3.00-4.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   4.00-5.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   4.00-5.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   4.00-5.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   5.00-6.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   5.00-6.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   5.00-6.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   6.00-7.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   6.00-7.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   6.00-7.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   7.00-8.00   sec  1.38 GBytes  11.9 Gbits/sec
[  7]   7.00-8.00   sec  1.38 GBytes  11.9 Gbits/sec
[SUM]   7.00-8.00   sec  2.76 GBytes  23.7 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   8.00-9.00   sec  1.35 GBytes  11.6 Gbits/sec
[  7]   8.00-9.00   sec  1.39 GBytes  11.9 Gbits/sec
[SUM]   8.00-9.00   sec  2.74 GBytes  23.5 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[  5]   9.00-10.00  sec  1.39 GBytes  11.9 Gbits/sec
[  7]   9.00-10.00  sec  1.35 GBytes  11.6 Gbits/sec
[SUM]   9.00-10.00  sec  2.73 GBytes  23.5 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec  13.8 GBytes  11.8 Gbits/sec                  sender
[  5]   0.00-10.00  sec  13.8 GBytes  11.8 Gbits/sec                  receiver
[  7]   0.00-10.00  sec  13.8 GBytes  11.8 Gbits/sec                  sender
[  7]   0.00-10.00  sec  13.8 GBytes  11.8 Gbits/sec                  receiver
[SUM]   0.00-10.00  sec  27.5 GBytes  23.6 Gbits/sec                  sender
[SUM]   0.00-10.00  sec  27.5 GBytes  23.6 Gbits/sec                  receiver

iperf Done.
```

中途半端な繋ぎ方ですが、25GbEワイヤレートの速度がしっかり出ています。25GbEの全二重通信の検証まではやっていませんが、そもそもPCIe x8で25GbEが2Portならば、PCIe x4で25GbEの1Portはいけるでしょうし、10GbEなら2Portともに大丈夫でしょう。

まるでギャンブルですが、エイプリールフールでした、、、ということではありません。Mellanox Connect X-4はこういった接続方法に対応しています。
{% asset_img mellanox.png 480 alt %}

冒頭で紹介した製品スペックのPDFでは、赤枠で囲ったところに、オートネゴシエートとあります。理論上、PCIe3 x4では帯域が32Gbpsですから25Gbpsの通信は可能ということになります。

どうしても先入観があって、x4のスロットにx8のカードを挿そうと思いませんよね。

PCIeのレーン数はご利用のマザーボードによって様々な仕様がありますで事前のご確認をお勧めします。
