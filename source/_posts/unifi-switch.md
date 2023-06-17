---
title: UniFiスイッチ
date: 2022-11-23T09:00:00+09:00
tags:
- UniFi
- SFP+
- 10GbE
categories:
- [Hardware]
- [Network]
---

{% asset_img title.png 1024 alt %}
<p class="onepoint">この記事で実現すること</p>

この記事ではホームユーザー向けにUniFiスイッチの設定ができるようになることを目的としています。
<!-- more -->

## UniFiスイッチの特徴

UniFiネットワークスイッチの特徴としては、どちらかといえばスモールビジネス向けの製品が中心ではあります。
スモールオフィスの基幹ネットワークを構成しながら、監視カメラやWi-Fiシステムを導入し、トータルソリューションが売りになります。
ネットワークスイッチ単独の機能として見ると、以下の特徴があります。
1. Wi-FiにRJ45ケーブルで通信と電力出力を兼ねるPoE
2. SFP＋などの10GbEネットワーク
3. UniFiネットワークアプリケーションによる集中管理

ホームユーザー向けとして自宅内のネットワークを10GbEかつSFP+を選択する場合は、いくつかの魅力的なネットワークスイッチが候補に上がります。
発熱対策のために各部屋にSFP+でOM3などの光ケーブルを通す場合は、個人向けのネットワークスイッチではPortが不足してしまうのが実態です。
機器の価格帯が個人向け、かつ消去法でいくとMikroTikかUniFiが選択肢に上がります。円安で昔ほどは安いと思えなくなりましたが、SFP+スイッチは廉価です。

## 基本設定

基本設定です。UniFiスイッチを新規導入する際には、ネットワークアプリケーションに登録（採用）する必要があります。初期セットアップについては、以下の記事を参照してください。UniFi製品群の標準の考え方ではセキュリティゲートウェイをインターネットルーターの役割として配置し、そこに各UniFi製品群をぶら下げることになります。私はSophos Firewallを利用しており、UniFiセキュリティゲートウェイは不要としているため、集中管理のためのUniFiネットワークアプリケーションを導入しています。

- {% post_link ubiquiti-unifi %}
- {% post_link unifi-network-application %}
- {% post_link unifi-network-application2 %}

UniFiスイッチが採用（Adoption）されると、ネットワークアプリケーションから管理できるようになります。

スイッチ毎の{% label primary @Settings %}では、{% label primary @Service %}で基本設定を、{% label primary @Network %}でIPアドレスを設定できます。

{% asset_img netapp2.png 360 alt %}

{% label primary @Service %}では、スイッチ自身がどのネットワーク（VLAN）に属するのかを決め、Flow ControlやJumbo Frameの設定が可能です。デフォルトでFlow ControlはOffです。ネットワーク速度が異なる端末を接続する場合は、Flow ControlはOnの方が良いでしょう。もちろん、送信側端末のネットワークカードがFlow Controlに対応している必要はあります。最近、UniFiネットワークアプリケーションではスイッチのGlobalSettingが可能となり、スイッチ毎にこれらの設定が不要になっています。

{% asset_img netapp3.png 360 alt %}

{% label primary @Network %}では、静的IPアドレスを設定することもできます。
その他、{% label primary @Settings %}からは、スイッチの再起動が可能です。

## スイッチポート確認

スイッチ毎の{% label primary @Ports %}からはPortの稼働状況が確認できます。
{% asset_img netapp4.png 360 alt %}

| 項目名  | 内容                                                                                                                                                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status  | 実際に接続されている速度を示します。稀にファームウェアのアップデートのタイミングで誤った認識になる場合があります                                                                                                                                            |
| Tx/Rx   | 送信(Tx)、受信(Rx)量を示します                                                                                                                                                                                                                              |
| Profile | UniFiのVLANは複数のネットワークを指定した上で纏めたトランクポートを複数種類作成可能です。ネットワークアプリケーション7.4からは仮想ネットワークバインディングという概念があり、このProfileは使わなくても済むようになりました（もちろん使っても構いません）。 |
| Uplink  | 上流の機器を示します。UniFiがInternetへのルーティングを解析し、Internet接続ルーターを上流として自動的にUplinkポートを判別します                                                                                                                             |

その他、SFPモジュールの情報などが出力されています。

## スイッチポート設定

スイッチ毎の{% label primary @Ports %}からさらに{% label primary @Port Management %}を選択すると、個々のPortの設定を行えます。
{% asset_img netapp5.png 1024 alt %}

これはPro-Aggregationの例ですが、Portごとに接続されているクライアントが表示されています。ここで個別のPortを選択すると、ポートの速度やVLANを設定できます。

### Portの設定変更

Portの物理的な設定変更は以下の{% label primary @Port Profile Override %}から行います。
{% asset_img netapp7.png 360 alt %}

| 項目名                 | 内容                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| Operation              | Switching または、Aggregate（複数のPortを束ねて帯域を増やす）、Mirrorを選択します。           |
| Link Speed             | オートネゴ、10Gbps、2.5Gbpsなどの速度固定を選択します。なお、2.5Gはオートネゴでは動作しません |
| Port Isolation         | Uplinkポートのみトラフィックを転送します                                                      |
| Storm Control          | ブロードキャスト、マルチキャストなどの飽和を某防止します                                      |
| LLDP                   | ディスカバリプロトコルを有効にします（デフォルトON）                                          |
| Spanning Tree Protocol | スパニングツリーを有効にします（デフォルトON）                                                |

ミラーPortはトラブル時の確認のために使います。トラブルのあるPort番号を指定し、ミラーに設定することで同じデータが流れます。ノートPCなどを接続し、WireSharkなどを使いパケット解析します。

SFP+の製品であっても、USW-AggregationスイッチやUSW-Enterprise-8-PoEのSFP+ポートは2.5GbEに対応していません。過去記事「{% post_link sfp-plus-nbaset %}」で書いたように、10GbEを2.5GbEとして偽装させる特殊なSFP+モジュールが必要になります（もっとも、USW-Enterprise-8-PoEは2.5GbEのRJ45ポートを備えているので運用上困ることはありませんが）。

## VLANを設定

VLANを作成するにはネットワークアプリケーションの{% label primary @SETTINGS %}から{% label primary @NETWORKS %}を選択し、{% label primary @Create New Network %}をクリックします。

L3スイッチではなく、単にVLANを作成したい場合は、ここで{% label primary @VLAN-only Network %}のチェックボックスをONにし、VLAN IDを決定します。
{% asset_img netapp8.png 360 alt %}

こういったネットワーク構成全般の変更を行うと、全てのスイッチに対してコンフィグの転送が行われ、スイッチの再構成が実行されます。

トランクポートとして使う場合は２つの方法があります。
1. 仮想ネットワークバインディングで許可するVLANまたはブロックするVLANを指定します。
2. 予め作成した複数のネットワークを束ねたProfileを作成した上でそれを指定します。

### 仮想ネットワークバインディングを使う方法

ネットワークアプリケーションv7.4から導入された仮想ネットワークバインディングは、従前のように、トランクポートのネットワークの組み合わせをわざわざProfileで作成しなくて済むというメリットがあります。
{% asset_img netapp10.png 1024 alt %}
タグなしのメインのネットワーク（ネイティブVLAN）を決めた上で、タグ付きのVLANについては、許可する、ブロックするの分類を指定します。ファイアウォールのように許可かブロックかを選択するというものではなく、ネイティブVLAN以外のタグ付きVLANを全て列挙し、許可またはブロックの何れかに分類するという方が近いでしょう。

仮想ネットワークバインディングで{% label primary @該当なし %}を選択すると、そのポートには全てのデータが流れることになるようです。Switch Flex MiniのようにProfileを割り当てできない小型スイッチではこの該当なしを選択してアップリンクのスイッチからタグ無し、タグ有りのパケットをそのまま送受信する事になります。

### 従来からのProfileを使う方法

Profile作成時には指定する複数のネットワークのうちどれか1つをネイティブVLANとしてタグ無しに設定します。昨今、デフォルトVLANを変えることがセキュリティ上優位であるとも思えないので、私は管理用VLANは無条件にデフォルトVLAN（VLAN ID=1）で管理するようにしています。

Profileを使う方式では、このようにネイティブVLANがどのネットワークか定め、タグ付きのVLANを追加で選択していきます。
{% asset_img netapp6.png 1024 alt %}

Profileを作成後、スイッチポートの設定にて、{% label primary @イーサネットポートプロファイル %}のチェックボックスをオンにしてリストボックスからProfileを指定します。
{% asset_img netapp11.png 480 alt %}

この例では、 UniFi-APはデフォルトVLANで接続し、AP同士の制御用パケットは全てデフォルトVLAN配下に流れます。また、タグ付きネットワークでVLAN-XXX（一般端末向け）とGuestがありますが、UniFi-APは複数のネットワークに属することができますので1つのAPで複数のネットワークに対してWi-Fiサービス提供できるようになります。

ネットワーク機器のLANをデフォルトVLAN、かつ、ネイティブVLAN（タグ無し）としているのは何らかのトラブル時に復旧させやすいという点もあります。

## SSH

UniFiスイッチは廉価なSwitch Flex Miniを除き、大半のスイッチはSSH接続が可能です。ネットワークアプリケーションで設定したID/パスワードでも接続できますし、公開鍵認証でも接続可能です。スイッチにSSHすると Linuxのインタフェースのように見えます。

``` bash
$ ssh xxx


BusyBox v1.25.1 () built-in shell (ash)


  ___ ___      .__________.__
 |   |   |____ |__\_  ____/__|
 |   |   /    \|  ||  __) |  |   (c) 2010-2022
 |   |  |   |  \  ||  \   |  |   Ubiquiti Inc.
 |______|___|  /__||__/   |__|
            |_/                  https://www.ui.com

      Welcome to UniFi USW-Aggregation!

********************************* NOTICE **********************************
* By logging in to, accessing, or using any Ubiquiti product, you are     *
* signifying that you have read our Terms of Service (ToS) and End User   *
* License Agreement (EULA), understand their terms, and agree to be       *
* fully bound to them. The use of SSH (Secure Shell) can potentially      *
* harm Ubiquiti devices and result in lost access to them and their data. *
* By proceeding, you acknowledge that the use of SSH to modify device(s)  *
* outside of their normal operational scope, or in any manner             *
* inconsistent with the ToS or EULA, will permanently and irrevocably     *
* void any applicable warranty.                                           *
***************************************************************************

USW-Aggregation-US.6.3.13# cd /var/log
USW-Aggregation-US.6.3.13# vi messages
USW-Aggregation-US.6.3.13# ping 192.168.x.100
PING 192.168.x.100 (192.168.x.100): 56 data bytes
64 bytes from 192.168.x.100: seq=0 ttl=64 time=0.000 ms
64 bytes from 192.168.x.100: seq=1 ttl=64 time=10.000 ms
64 bytes from 192.168.x.100: seq=2 ttl=64 time=10.001 ms
64 bytes from 192.168.x.100: seq=3 ttl=64 time=10.000 ms
64 bytes from 192.168.x.100: seq=4 ttl=64 time=10.001 ms
```

` /var/log/messages`にはsyslogがありますので、たまには中身を確認されることをお勧めします（viコマンドなどで開きます）。表向き、SFPモジュールが動作しているように見えても、互換性の問題でエラーを吐いている場合もあります。ダイレクトアタッチケーブルなどを対向の端末を繋がずスイッチに接続している場合など定期的にLinkDownのアラートが出ている場合もあります。RJ45とは動きは異なります。

上記はUSW-Aggregationに接続した状態ですが、pingも動作しますが、レスポンスは悪いです。LAN内の機器の応答に10ms掛かっていますが驚かないでください。スイッチのデータ転送は専用チップ（ASIC）が行うため、機器のCPUがスイッチの実力にはなりません。OSに割り当てるCPUリソースの関係でしょうか、このpingの応答速度は「ご参考」として割り切った方が良さそうです。

### スイッチの詳細情報について

Linuxのコンソールから、`cli`コマンドを投入することで、Ciscoライクなスイッチのコマンドモードに入ることができます。
コマンド入力途中でタブを押下するとコマンドが補完されます。
`show  running-config`などそのまま使えます。`copy running-config startup-config`なども実行できそうですが、UniFiではネットワークアプリケーションから完全同期されていることが大前提であり、コマンドモードで設定しても再起動時にはネットワークアプリケーションから上書きされてしまいます。
ややこしいのは、スイッチ毎にコマンドの互換性が殆どないことです。コマンドの途中で`"？"`を入力すると、実行できるパラメータが列挙されるので推測でコマンドを補完しながら入力することになります。私の知る限り、機種毎のコマンドラインのマニュアルは存在しないようです。

### USW-Pro-Aggregation(L3スイッチ)

このスイッチは比較的コマンドが充実しています。`cli`でコマンドモードに入り、`en`で特権モードに入ります。
Portの状況を見るには以下のコマンドを使います。
```
(UBNT) #show interface ethernet 0/x
```
これだと100行余りの結果が表示されるのでパイプ（｜）で区切り、必要な項目だけフィルタできます。

```
(UBNT) #show interface ethernet 0/x | include Error|Collision|Discard

Total Packets Received Without Errors.......... 43388669
Receive Packets Discarded...................... 0
Total Packets Received with MAC Errors......... 0
Alignment Errors Received...................... 0
FCS Errors Received............................ 0
URPF Discards.................................. 0
Transmit Packets Discarded..................... 0
Total Transmit Errors.......................... 0
FCS Errors Transmitted......................... 0
Total Transmit Packets Discarded............... 0
Single Collision Frames........................ 0
Multiple Collision Frames...................... 0
Excessive Collision Frames..................... 0

(UBNT) #
```

このようにして重要な情報のみ取得できます。あくまで一般的なパラメータとしていますが、現代の全二重の通信前提であればCollisionまで見る必要はないですね。一般的にはReceiveでエラーがあるときはケーブルを最初に疑ってみること、Transmit Packets Discardedの場合はVLANの設定が間違っている可能性があることでしょうか。

```
clear counters all
```
カウンタをクリアします。

```
show fiber-ports optics-info all
```
モジュールのメーカーやシリアル番号を表示します。

```
(UBNT) #show fiber-ports optics all

                                                 Output   Input
Port    Physical Port/  Temp  Voltage  Current   Power    Power     TX     LOS
        Lane Number     [C]   [Volt]     [mA]    [dBm]    [dBm]     Fault
------  --------------  ----  -------  -------   -------  -------   -----  ---
0/4     0/4-Lane1       34.2    3.328     10.2    -3.370   -2.496   No     No
0/5     0/5-Lane1       34.5    3.265     10.4    -2.976   -3.373   No     No
0/8     0/8-Lane1       34.0    3.360     10.2    -3.799   -1.643   No     No
0/9     0/9-Lane1        N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/12    0/12-Lane1       N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/15    0/15-Lane1       N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/18    0/18-Lane1       N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/19    0/19-Lane1       N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/22    0/22-Lane1       N/A      N/A      N/A       N/A      N/A   N/A    N/A
0/26    0/26-Lane1      33.3    3.235      6.0    -3.002   -3.002   No     No

 Temp - Internally measured transceiver temperatures.
 Voltage - Internally measured supply voltage.
 Current - Measured TX bias current.
 Output Power - Measured optical output power relative to 1mW.
 Input Power - Measured optical power received relative to 1mW.
 TX Fault - Transmitter fault.
 LOS - Loss of signal.

(UBNT) #
```
モジュールのDDM（温度、光の強さ）を表示します。


### USW-Aggregation(SFP+ 8Port)

このスイッチは`cli`でコマンドモードに入ったら、すぐに大半のコマンドが実行できます。代表的なのは以下のものです。

```
show interfaces TenGigabitEthernet x
```
Port xのPort状況を表示します。パケットカウントやコリジョンなどの数を示します。

```
clear interfaces TenGigabitEthernet  x counters
```
Port xのカウンタをクリアします。

```
show fiber-transceiver-info interfaces  TenGigabitEthernet  x
```
SFPモジュールの種類やシリアル番号を表示します。

```
show fiber-transceiver interfaces  TenGigabitEthernet x
```
SFPモジュールのDDM（信号の強さ、温度）を示します。

## L3スイッチの制約

UniFiのL3スイッチはDHCP機能を持ちますが、管理機能やルーティングについてはIPv6には対応していません。スイッチ自身はIPv6アドレスを持てるようですが、現段階でIPv6のL3ルーティングできるようにはなっていません。別のルーターでDHCPv6を割り当て、そちらをゲートウェイにするなどが必要です。L2スイッチを含めてIPv6通信が行えないということではありません。

## SFPモジュール

Ubiquitiのモジュール群は廉価なため、光モジュールは純正が間違いないでしょう。OM3ケーブルやDACはさまざまなメーカーのものを使いましたが、UniFi製品で問題が発生したことはありません。RJ45モジュールは特に10GbEのものは低電力を踏まえるとSFPメーカーの製品の選定も視野に入ります。

{% asset_img module.png 640 alt %}

1GbE tp-link TL-SM331
一般的なMarvell社88E1111などを使ったモジュールが通常使用（Typical）で1.05Wの消費電力なのに対し、その半分以下の0.5Wとなっており、発熱もかなり抑えられています。最近、国内でも発売になったようですが、私は今年の5月に米Amazonで$19.99で購入し、問題なく使えています。

> tp-link
 <https://www.tp-link.com/jp/service-provider/switch-accessory/tl-sm331t/>

10GbE Fiber mall SFP-10G-T-UB-80m
80mまで対応した省電力の10GbEモジュールです。こちらも米Amazonで購入しました。＄68.99でした。BroadcomのBCM84891のチップを採用している80mに対応したモジュールはいくつか存在します。Cisco用のモジュール（SFP-10G-TS80）についてはメーカーの公表ではDDMに対応していないと記載があるものの、UniFiスイッチ上では、モジュールの温度などのパラメータが出力されています。

> Fiber mall
 <https://www.fibermall.com/ja/news/10g-copper-sfp.htm>

英語ですが、ぜひAmazonのカスタマーレビューを見てください。より詳細で素晴らしい知見に基づいたコメントが見られます。
> 米Amazon Customer Review
 <https://www.amazon.com/gp/customer-reviews/RLHW2OL4I1QZP/ref=cm_cr_dp_d_rvw_ttl?ie=UTF8&ASIN=B0B18BY1XK>

## PoE

スイッチにおけるPoEもネットワークアプリケーションから設定できます。USW-Enterprise-8-PoEの例では、Switch Flex MiniおよびAPのU6 Proに給電している状況が確認できます。
{% asset_img netapp9.png 640 alt %}

Port ManagementからPoEのOn/Offが可能となっています。

## まとめ

これらのように、ネットワークスイッチをただ単に繋げるための道具ではなく、ITやネットワークを見える化するという目的においては非常に有用な機器になります。セキュリティ観点ではできることは限られていますが、ホームユーザーにとっても有用な機能は活用できると思われます。

Ubiquiti 日本語ガイドのスイッチに関する記事は以下が参考になります。

> UniFi Network - 有線ネットワーク速度の最適化
 <https://help.jp.ui.com/articles/6949005136919/>

## リソース

以下の日本語ヘルプ、コミュニティがUniFiの構築には大いに参考になります。

> Ubiquiti コミュニティ（日本）
 <https://www.facebook.com/groups/uijapan>

> UI 日本語ヘルプ記事
 <https://help.jp.ui.com/categories/6583256751383/>

> Ubiquiti Community（米国中心）
 <https://community.ui.com/>
