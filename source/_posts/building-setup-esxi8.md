---
title: ESXi8.0をRyzen5 5600Gで構築
date: 2023-07-07T18:58:48+09:00
tags:
 - ESXi
 - 25GbE
categories:
 - Hardware
---

<p class="onepoint">この記事で実現すること</p>

1年半前に、「{% post_link building-setup-esxi7 %}」の記事で、Ryzen7 5700GでESXi7のセットアップをしました。今回はESXi8.0の動作確認も含めてRyzen5 5600Gでセットアップしました。

<!-- more -->

## ESXi8のためのハードウェア選定検討

実は最初からESXi8をセットアップするつもりはなく、WindowsPCを新調するつもりでした。私はゲームはやらないので、せいぜい4Kのビデオが見られれば十分というPCの使い方をしており、ビデオカードを購入する事は殆どありません。パソコン工房で「STYLE-S0P5-R55G-EZX」という5600Gを積んだ機種が8万円台と安かった事もあり、あまり深くは考えずに注文しました。

> パソコン工房
 <https://www.pc-koubou.jp>

## ハードウェア構成

注文したPCは以下の構成でした。
【OS】Windows 11 Home
　【プロセッサー】AMD Ryzen 5 5600Gプロセッサー (3.9-4.4GHz/6コア/12スレッド/16MBキャッシュ/TDP 65W)
　【CPU冷却グリス】【熱伝導率： 9W/m K】 シルバーグリスArctic Silver 5塗布サービス
　【CPUクーラー】静音CPUクーラー Wraith Stealth[トップフロー]
　【グラフィックアクセラレーター】Radeon Graphics(CPU統合グラフィックス）
　【メインメモリ】16GB(8GB×2)[DDR4-3200 / デュアルチャンネル］
　【1stストレージ［OSインストール］】500GB SSD / NVMe M.2[PCIe 3.0×4]
　【チップセット】AMD B550チップセット
　【サウンド機能】High Definition Audio subsystem
　【内蔵ネットワークカード】有線：1000BASE-T ※無線機能はついておりません
　【光学ドライブ】DVDスーパーマルチドライブ［LG GH24NSxx]
　【電源】400W[80PLUS BRONZE認証］/ TFX電源
　【ケース】スリムタイプMicroATXケースHEC 7KJC[フロントUSB3.0]ブラック

さて、PCが届いてから、ハードウェアを確認したところ、NVMeはウェスタンデジタルのBlueが組み込まれていました。また、マザーボードはASRock社のものです。そういえば、前回のESXi7.0のセットアップでは、セキュアブートは断念していました。Win11 Homeがセットアップされているモデルでしたが、WDのBlue（SN570）が入っていた事もあり、ふつふつとESXi8.0をインストールしたいと思い始め、ESXi8をクリーンインストールする事にしました。

### ストレージ

前回は、VMware Commmunityで鉄板だった970EVO Plusでした。ESXiではSamsungが確実という印象でしたが、980 Pro NVMeでは、ファームウェアの不具合で故障率が高いという報告が上がっています。ESXiはNVMeストレージの種類を選ぶため事前調査が必要ですが、今回、何となくうまく行くだろう感があってBlue（SN570）にESXi8をセットアップしました。結果、全く問題ありませんでした。なぜかESXiの事例としてあまり出てこないのが不思議です。。。

うまく行かなければ、William Lam氏のNVMeに関する情報で、SabrentのRocket Plus NVMeを試そうと思っていたところでした。
<https://williamlam.com/2023/02/quick-tip-additional-nvme-vendors-sk-hynix-sabrent-for-esxi-homelab.html>

### ネットワークカード

前回は、intelのX710のSFP+4Portを使いましたが、今回はSFP28の検証も兼ねてMellanox Connect X-5を選定しました。Connect X-4はWindowsやNASで使おうと計画してます。前回はセキュアブートがうまく行かなかった点は課題でしたが、実はそれが功を奏したところもありました。X710のESXiのドライバーはデフォルトではフローコントロール（pauseパラメータ）がオフになっています。それで、ブート時に、`/etc/rc.local.d/local.sh`にpauseパラメータを有効にする設定を加えていました。もし、セキュアブートであれば、`/etc/rc.local.d/local.sh`にスクリプトを記述しても無視されます。

### UEFIの設定

さて、UEFIのリベンジです。色々な情報をこれまで収集し、セキュアブートの初期化をすればセキュアブートが可能と調べがついていました。

最初、Secure Boot Modeを{% label primary@Custom %}に変更し、{% label primary@Install default Secure Boot keys %}を実施した上でセットアップしましたが、セキュアブートでインストールされませんでした。以下のページでGIGABYTEのマザーということでセキュアブートに関する情報がありました。

<https://support.pcdiy.newx.co.jp/hc/ja/articles/6572156997657--GIGABYTEマザーボード全般-Secure-Boot-の設定方法について>

> **Restore Factory Keys** を選択していただき、ポップアップが表示されますのでYes(はい)を選択してください

今回のマザーボードはASRockですが、以下の手順でセキュアブートにできました。

1. {% label primary@Secure Boot Mode %}を{% label primary@Normal %}から{% label primary@Custom %}に変更する。
2. {% label primary@Clear Secure Boot Keys %}を実行する
3. {% label primary@Install default Secure Boot keys %}を実行する。
4. {% label primary@Secure Boot Mode %}を{% label primary@Normal %}に戻す。

この手順を踏んでセットアップ開始したところ、無事セキュアブートが可能になりました。無償版ESXiはTPMは使えませんので、単に改ざん防止という事になります。
簡単な確認方法として、セキュアブートが有効である場合、ESXiの管理コンソールの{% label primary@セキュリティとユーザー %}の許容レベルをパートナーからコミュニティに変更できなくなります。また、前述した`local.sh`もスキップされます。

## インストール

これまで同様、Rufusで32GBのUSBメモリにISOファイルを登録しUSBブートからESXi8.0Update1aをセットアップします。
なお、セットアップされる場合はVMWareのサイトで最新のバージョンを確認下さい。

VMWare ESXi8.0
<https://customerconnect.vmware.com/jp/evalcenter?p=free-esxi8>

{% asset_img esxi1.png 800 alt %}
メーカーはiiyamaなのに、なんでMouseComputerなんだろう。。。

## ネットワーク

ドライバーはnmlx5_coreとなっています。SFP28のDACケーブルをスイッチに接続し、vmnic0が25Gbpsでリンクアップしています。

{% asset_img esxi2.png 800 alt %}

ESXi8にセットアップしたUbuntu22ではOS上は10GbEと認識していますが、速度は23Gbps近くは出ています。
{% asset_img ubuntu1.png 640 alt %}

Ubuntuからの送信
``` bash
yoshi@ub22:~$ iperf3 -c 192.168.x.20
Connecting to host 192.168.x.20, port 5201
[  5] local 192.168.x.182 port 47676 connected to 192.168.x.20 port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec  2.61 GBytes  22.4 Gbits/sec  6519    967 KBytes
[  5]   1.00-2.00   sec  2.54 GBytes  21.9 Gbits/sec  5013   1.01 MBytes
[  5]   2.00-3.00   sec  2.50 GBytes  21.4 Gbits/sec  3376    667 KBytes
[  5]   3.00-4.00   sec  2.57 GBytes  22.1 Gbits/sec  5961    612 KBytes
[  5]   4.00-5.00   sec  2.53 GBytes  21.8 Gbits/sec  4767    648 KBytes
[  5]   5.00-6.00   sec  2.57 GBytes  22.1 Gbits/sec  6294    765 KBytes
[  5]   6.00-7.00   sec  2.55 GBytes  21.9 Gbits/sec  4271    489 KBytes
[  5]   7.00-8.00   sec  2.56 GBytes  22.0 Gbits/sec  3493    573 KBytes
[  5]   8.00-9.00   sec  2.55 GBytes  21.9 Gbits/sec  5756    789 KBytes
[  5]   9.00-10.00  sec  2.58 GBytes  22.2 Gbits/sec  4816    546 KBytes
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  25.6 GBytes  22.0 Gbits/sec  50266             sender
[  5]   0.00-10.00  sec  25.6 GBytes  22.0 Gbits/sec                  receiver

iperf Done.
```

Ubuntuの受信
``` bash
yoshi@ub22:~$ iperf3 -c 192.168.x.20 -R
Connecting to host 192.168.x.20, port 5201
Reverse mode, remote host 192.168.x.20 is sending
[  5] local 192.168.x.182 port 44930 connected to 192.168.x.20 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec  2.68 GBytes  23.0 Gbits/sec
[  5]   1.00-2.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   2.00-3.00   sec  2.72 GBytes  23.4 Gbits/sec
[  5]   3.00-4.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   4.00-5.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   5.00-6.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   6.00-7.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   7.00-8.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   8.00-9.00   sec  2.73 GBytes  23.4 Gbits/sec
[  5]   9.00-10.00  sec  2.73 GBytes  23.4 Gbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  27.2 GBytes  23.4 Gbits/sec  279             sender
[  5]   0.00-10.00  sec  27.2 GBytes  23.4 Gbits/sec                  receiver

iperf Done
```

受信は25Gbpsのワイヤレートが出ています。
Ubuntuからの送信側では再送が多いようです。これはまだESXiの構成または設定の問題なのか私の環境の問題なのかは分かっていません。
NVidiaのサイトのInboxドライバの情報はESXi8.0向けは4.23.0.36-8vmwという事になっています。

> NVIDIA Native Drivers for VMware ESXi Inbox Drivers Release Notes
 <https://docs.nvidia.com/networking/display/VMwareESXiInboxDriversReleaseNotes>

なお、最新のESXi8.0Update1aでのMellanoxのドライバのバージョンは以下の通りです。NVidiaのサイトのものよりも新しいですね。これはまた次回にドライバが更新されるかもしれません。

``` bash
[root@localhost:~] esxcli software vib list | grep nmlx
nmlx5-core                     4.23.0.36-14vmw.801.0.0.21495797     VMW     VMwareCertified   2023-04-29    host
nmlx5-rdma                     4.23.0.36-14vmw.801.0.0.21495797     VMW     VMwareCertified   2023-04-29    host
```

色々な情報を探してみてもやはりESXi7.0の情報は充実しており、まだESXi8.0は安定というには早いかなと感じます。

## ESXiにおけるNICのフローコントロールについて

ESXiにはフローコントロールの制御について、送信、受信のpauseパラメータを設定できます。
Connect X-5を使っている状況でESXiにSSHし、以下のコマンドでpauseパラメータの状況が確認できます。

``` bash
[root@localhost:~] esxcli network nic pauseParams list
NIC     Pause Params Supported  Pause RX  Pause TX  Auto Negotiation  Auto Negotiation Resolution Avail  RX Auto Negotiation Resolution  TX Auto Negotiation Resolution
------  ----------------------  --------  --------  ----------------  ---------------------------------  ------------------------------  ------------------------------
vmnic0                    true      true      true             false                              false                           false                           false
vmnic1                    true      true      true             false                              false                           false                           false
```
`Pause Params Supported`が`true`の場合は、フローコントロールの機能を持っています。Pause RXがfalseだとスイッチからpauseフレームの通知を無視してしまいます。またPause TXがfalseだと自身が飽和した時にpauseフレームを送信しません。上記ではデフォルトでフローコントロールがオンになっています。

一方、ESXi7.0のintel x710では、以下の結果になりました。Pause RX/TXがfalseとなっています。
```
[root@esxi2:~] esxcli network nic pauseParams list
NIC     Pause Params Supported  Pause RX  Pause TX  Auto Negotiation  Auto Negotiation Resolution Avail  RX Auto Negotiation Resolution  TX Auto Negotiation Resolution
------  ----------------------  --------  --------  ----------------  ---------------------------------  ------------------------------  ------------------------------
vmnic0                    true     false     false             false                              false                           false                           false
vmnic1                    true     false     false             false                              false                           false                           false
vmnic2                    true     false     false             false                              false                           false                           false
vmnic3                    true     false     false             false                              false                           false                           false
```

この場合は、前述した、`/etc/rc.local.d/local.sh`にフローコントロールをOnにするコマンドを列挙します。

```
esxcli network nic pauseParams set -n vmnic0 -t t -r t
esxcli network nic pauseParams set -n vmnic1 -t t -r t
esxcli network nic pauseParams set -n vmnic2 -t t -r t
esxcli network nic pauseParams set -n vmnic3 -t t -r t
```

繰り返しですが、これはセキュアブートではない場合にのみ設定が可能です。
10GbEとWi-Fiなど、**速度差がある端末同士で効率の良い通信を行うためにはフローコントロールは必要**と言えます。フローコントロールが無い場合、私の環境ではWi-Fi6のiperf3の例では900Mbps→750Mbps程度には劣化します。Wi-Fi電波の範囲ギリギリとかWi-Fiの別のAPへのローミングなどセンシティブな箇所で安定度が高まるとお考えください。

フローコントロールはこのようにホスト側での設定とネットワークスイッチ側と双方で有効にしておく必要があります。

なお、ESXiにおいて少し高度な話としては、Single Root I/O Virtualization（SR-IOV）による仮想マシンにNIC（NICが持つ仮想機能）を直接割り当てる方法で高速化する方法もあります。Windows ServerやRed Hat Enterprise LinuxなどOSを選びますが今後機会があればテストしてみます。

{% asset_img esxi3.png 800 alt %}

※ESXi上のUbuntuはSR-IOVに対応していません。

## まとめ

25GbEはあくまで実験的に検証しているものであり、私自身がパワーユーザーではない事もあり、今のところメインは10GbEとし、スイッチ間を25GbEで使うつもりでいます。ただし、アプリケーション同士で9Gbps程度の速度が25GbE環境下で出ているからといって、ネットワークを10Gbpsに変更しても影響が出ないかと言われるとそうでもなく、7Gbps程度に落ち込むケースも確認できています。今後色々検証していきたいと考えています。このブログで紹介している25GbEは簡単に接続できているように見えますが、私の使っているネットワークスイッチ（Ubiquiti PRO Aggregationスイッチ）とMellanox Connect Xカードとの相性が良い事もあります。
