---
title: XG Firewall SSL-VPN
date: 2021-05-30 9:10:00
tags:
  - XG Firewall
categories:
  - Security
  - VPN
---

{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

XG FirewallのSSL-VPNを構成し、実家や友人宅または、ホテル滞在時など公衆Wi-FiをはじめとしたさまざまなWi-Fi環境下においてIPSec-VPNよりも接続可能性を高める事を目的にします。SSL-VPNのTCPの待ち受けポートを設定し、自宅がv6プラスの環境でも接続可能となる期待があります。公衆Wi-Fiによく見られるIPv4アドレスのみ払い出しされる環境においても、IPv4 VPNトンネルの中でIPv4/IPv6デュアルスタックによるインターネットアクセス、および自宅LANリソースにアクセスできます。

<!-- more -->

## XG FirewallのIPSec-VPN

IPSec-VPNは一般的に安全性が高く安定しているため、それが使える場合はまずは最優先候補に挙げられますが、制約があります。

1. v6プラスの環境では接続に必要なポートが制限され接続できません（別途PPPoEで接続している場合は可能です）。
2. 公衆Wi-Fiの一部では最低必要なUDPを除き、UDP全般を止めているところがあります（VPNを禁止していないところでも）。
3. 公衆WIFIではIPv4のみ提供している場所が多いです。

外出先でPCを使う場合、スマホのテザリングができれば公衆Wi-Fiは不要です。私は滅多に公衆Wi-Fiは使いませんが、何かの時に役に立つ事もあるでしょう。新幹線、ホテル滞在など、最近ではすっかり機会は減ってしまいましたが {% emoji worried %}

## SSL VPNについて

Sophosは昨年（2020年10月）に[Sophos ConnectクライアントのVer2を発表](https://partnernews.sophos.com/ja-jp/2020/10/products/sophos-connect-v2-remote-access-vpn/)し、SSL VPNで接続できるようになりました。またv18 MR3より、SSL-VPNのパフォーマンスが向上しているとの事です。

XGのIPSec-VPNの速度と安定性は大変満足していますが、IPv6インターネットに対応しません<sup>**[[1]](#note1)**</sup>。デュアルスタック環境のWi-Fiに接続した場合、VPNを張ってもIPv4のみがVPNを経由し、IPv6は素のままInternetに出ていきます。また大部分のUDPポートが止められているケースを想定し、IPSec-VPNとは別にSSL-VPNもセットアップしておこうと考えました。前述したSophosのドキュメントでは、"macOSサポートが間も無く予定されていますが"との事ですが、なかなか発表される様子がありません。Big Sur対応で苦労されているんでしょうか。現時点において、IPSec-VPNを補完する**HTTPS接続によるSSL-VPN構成**を考えてみます。

## SSL VPNの構成

ここでは、一般例としてXGとインターネットとの間にホームゲートウェイ（HGW）が配置されている前提です。もちろん、IPv4のみのネットワーク環境でもVPNは構築できます。自宅のパブリックIPアドレスに接続するためにダイナミックDNS(DDNS)としてSophosが提供している`myfirewall.co`を使います。

 {% asset_img sslvpn2.drawio.png alt %}

| ネットワーク      | 内容                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| IPv4 LAN Segment① | LANで利用しているIPv4プライベートネットワーク                                                                                                                      |
| IPv6 LAN Segment② | LANで利用しているIPv6プライベートネットワーク。`fdxx:xxxx:xxxx/48`を先頭に持つ64ビットPrefixのユニークローカルアドレス（ULA）です。                                |
| IPv4 Session③     | XGのWANに流れるInternet向けのトラフィックです。このセグメントは一般的にプライベートIPで、HGWでNAT変換されます。                                                    |
| IPv6 Session④     | XGのWANに流れるInternet向けのIPv6トラフィックです。このセグメントは一般的にHGWからDHCPv6またはRouter Advertisement(RA)によって、パブリックIPアドレスが振られます。 |

ここまでが通常LANからInternetに接続する構成です。そしてSSL-VPNではIPv4のVPNトンネルを1つ、その中にIPv4セッション、IPv6セッションを張ります。このトンネルを張る事で、XGの物理インタフェースのWAN、LANに加えて仮想のVPNセグメントが設定されます。

| ネットワーク         | 内容                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| IPv4 SSL VPN Tunnel⑤ | テザリングや公衆Wi-Fiで振られたIPアドレスから、Internetを経由し、XGのWANポートとを結ぶセッション。           |
| IPv4 VPN Segment⑥    | VPNトンネルの中で作成される仮想IPv4ネットワーク。これはLANとは異なるプライベートIPネットワークアドレスです。 |
| IPv6 VPN Segment⑦    | VPNトンネルの中で作成される仮想IPv6ネットワーク。これはLANとは異なるULAです。                                |

仮想のVPNセグメントは、LANとネットワークアドレスを重複させてはいけません。あくまで別のセグメントです。また可能性は低いですが、公衆Wi-FiなどプライベートIPを使う場所でVPNセグメントのプライベートIPと重複し、VPNセッションを張れない可能性があります。
私が知る限り、公衆Wi-Fiでは10.x.x.xのネットワークが多く使われるようです。
⑤のトンネルが張られると、クライアントでは仮想ネットワークインタフェース{% label primary @Sophos TAP Adapter %}がActiveになります。
 {% asset_img TAP-Driver.png 480 alt %}


## SSL VPNの事前準備

1. VPNセッションのためのIPv4ネットワークアドレス（IPの範囲でも可能）を決める
2. XGのSSL待ち受けポートを決める
3. DDNSのホスト名を決定する
4. VPNセッションのためのIPv6 ULAを決める

XGのSSL-VPNはUDPがTCPの3倍ほど高速ですが、公衆Wi-Fiを使う場合、**安全・安心・確実に接続するにはHTTPS(443/TCP)を使う事が手堅いです**。自宅がv6プラスの方はプロバイダーから自宅まで通す事のできるポートの範囲を選定する事になります。

DDNSについては、「{% post_link vpn %}」の記事を参照してください。

LANのIPv6は、「{% post_link xg-ipv6-2 %}」の記事で設定したように、ULAの48ビットPrefixにサブネットの16ビットを加えて64ビットPrefixを決定しました。今回のVPNはサブネットの16ビットの値を変える事で別のセグメントを割り当てます。

## サーバー（XG）側の設定

### SSL VPNの設定

XGの管理画面の左ペイン{% label primary @VPN %}を選択すると、右上に{% label primary @VPN設定を表示 %}という項目があるのでこれをクリックします。さらに{% label primary @SSL VPN %}と{% label primary @L2TP %}のタブがありますので、SSLVPNを選択します。

{% asset_img vpn-conf.png 1024 alt %}

前の章で事前に決めた設定内容を加えていきます。

- 赤枠で囲ったTCP/UDPの別はTCPとポート番号、そして、{% label primary @ホスト名の上書き %}というところはmyfirewall.coなどのダイナミックDNSホスト名を入力します。
- IPv4のVPNネットワークの範囲は、LANやその他競合しないと思われるプライベートIP群から設定します。デフォルトの10.xでも構いませんが、あまり使われない、`192.168.200.x/24`近辺を使ってはいかがでしょうか。
- VPNクライアントが参照するDNSはXGのDNSですので、XGのLAN側IPアドレスを入力します。
- IPv6は利用しているULAの別のサブネットを設定します。`fd00:beef:cafe:2::/64`をLANで使っているとすれば、`fd00:beef:cafe:12::/64`という具合です。
- IPv6を利用するのであれば、リースモードを"IPv4とIPv6の両方"を選択します。

適用をクリックし変更を完了させます。

もし、VPNの待ち受けポートを443/TCPとするならば、ユーザーポータルがデフォルト443/TCPですので合わせて変更する必要があります。これは、XGの左ペインメニューの{% label primary @管理 %}→{% label primary @管理者とユーザーの設定 %}に{% label primary @ユーザーポータルHTTPSポート %}とありますので、そこの443を別のポートに変更します。

{% note warning  %}

{% label primary @ホスト名の上書き %}にDDNSホストを登録しないとVPN設定ファイルにXGのWANのプライベートIPアドレスが含まれてしまい、VPN接続に大幅に時間が掛かりますので必ず設定してください。XGにパブリックIPアドレスが割り振られている環境の方は設定は不要です。

{% endnote %}

### 利用セグメントのIPホストへの登録

XGでは、セグメント間の通信には必ずそのネットワークの名前を登録し、その名前でアクセス許可を行うため、ネットワークやホストの名前を付ける必要があります。左ペインメニューの{% label primary @ホストとサービス %}→{% label primary @IPホスト %}でVPNとLANの相互アクセスのために、LANで利用しているIPv4のネットワークアドレスとIPv6のネットワークアドレスを登録します。

また、SSLインスペクションをVPNでも使う方は、VPNで割り当てる上記のIPv4の範囲とIPv6のネットワークアドレスを登録します。

以下のように、VPNのネットワーク、いつも利用しているLANの合計4つ（IPv4のみであれば2つ）を名前をつけて登録します。
{% asset_img ipv4host.png 800 alt %}
{% asset_img ipv6host.png 800 alt %}

### VPNユーザーの作成

初めてVPNを設定する方はユーザーの作成が必要です。既にIPSec-VPNを設定されている方は対応不要です。XGの左ペインメニューから{% label primary@認証 %}を選択、{% label primary@ユーザー %}のタブから、追加ボタンをクリックします。そして以下のようにユーザー名、パスワードとメールアドレスを入力します。

{% asset_img user1.png alt %}
{% asset_img user2.png alt %}

### SSL VPN設定2

左ペインメニューの{% label primary @VPN %}から{% label primary @SSL VPN（リモートアクセス） %}に進み、{% label primary @追加 %}ボタンをクリックします。

{% asset_img vpn-conf2.png 640 alt %}

- 名前を決め、{% label primary @ポリシーメンバー %}には、ユーザーグループまたはユーザーを追加します。
- {% label primary @デフォルトのゲートウェイとして使用 %}を"ON"にします。
- 許可するネットワークソースには、上記で作成済みのLANのネットワークアドレスを追加します（VPNのネットワークアドレスではありません）。

適用をクリックして登録を完了させます。
{% note info  %}
XGをデフォルトゲートウェイとする事で、DNSを含めた全てのリクエスト情報を公衆回線に流さない事をお勧めします
{% endnote %}

### デバイスのアクセス

左ペインメニューの{% label primary @管理 %}から{% label primary @デバイスのアクセス %}に進み、{% label primary @ローカルサービスACL %}でWANにSSL VPNの権限を付与します。また、VPNからXGのDNSが参照できるように設定します。

{% asset_img acl.png 1024 alt %}

LANからVPNを張る事が無ければ、LANのSSLVPNのチェックは外した方が良いでしょう。

### ファイアウォールルール

ファイアウォールルールでは、VPNからInternetとLANへのアクセスを許可します。送信元ゾーンがLANとVPNになっている事を確認します。
{% asset_img rule1.png 1024 alt %}

また、LANとVPNとが相互に許可されている事を確認します。

{% asset_img rule2.png 1024 alt %}

これらはIPv4、IPv6それぞれで設定が必要です。また、NATルールに関しては、WANポートから出ていくパケットが変換対象となるので追加設定は不要です。ただし、XGv17以前の互換性のために用意されているLinkedNATを利用されている方は、ファイアウォールルール毎に対応したリンクNATルールを追加してください。

もし、VPNに対してもSSLインスペクションを有効にするのであれば、SSL/TLSインスペクションのルールにVPNセグメントのネットワーク情報を追加します。

{% asset_img rule3.png 1024 alt %}

## ホームゲートウェイの設定

HGWはユーザーの環境によって異なりますが、IPsec VPNで設定したように、HGWでIPv4のSSL VPNに関するパケットをXGに着信させる設定を加えます。
{% asset_img hgw.png 800 alt %}

## VPNクライアント（Windows）

Windowsでは、Sophos提供のSophos Connectを利用します。クライアントとVPN設定ファイルのダウンロードのために、ユーザーポータル`https://xgのIPアドレス:443/`にログインします。ユーザーポータルの待ち受けポートを変更された方は443を適切な値に変更してアクセスしてください。

{% asset_img portal.png 480 alt %}

赤枠で囲った"Download client for Windows"のリンクをクリックします。Windowsクライアントのセットアップは難しくありません、順に進めていけば完了します。セットアップが完了するとプロセスがタスクバーに常駐します。
続いて、"その他のOS向け設定のダウンロード"を行います。ここでは拡張子ovpnのファイルがダウンロードされます。ダウンロードしたファイルをダブルクリックすると、VPN設定ファイルがSophos Connectに取り込まれます。

{% asset_img sc1.png 480 alt %}

少し判りづらいですが、Homeの項目がIPSec-VPNでmyfirewall.coのものがSSL-VPNです。

ユーザーIDとパスワードを入力し、接続ボタンをクリックすると接続に掛かる時間は12秒程度でしょうか、IPSec-VPNが2〜3秒程度なので、結構時間が掛かる気がします。

{% asset_img sc2.png 480 alt %}

このSophosConnectはアプリケーションの作りが洗練されていません。一旦接続しにいくと、キャンセルをクリックしようとしてもボタンが押せず、タイムアウトが発生するまで、十数秒〜数十秒くらい待たされてしまいます。Sophos Connectの[紹介記事](https://partnernews.sophos.com/ja-jp/2020/10/products/sophos-connect-v2-remote-access-vpn/)ではmacOS向けに[OPENVPN Connect](https://openvpn.net/vpn-client/)を勧めていますが、OPENVPN Connectは、Windows版もあります。OPENVPN ConnectではVPNの接続ネゴシエーション中にキャンセルすると即座にVPNサーバーに対しRSTを送信すると共に、瞬時にUIもキャンセル応答します。このあたりは流石デファクトスタンダードというところでしょうか。もちろん、正しくセションを終了した時は行儀良くFINを送信し接続終了しています。IPSec-VPNとSSL-VPNとで2つのクライアントを持つのが嫌でなければ、操作性でシンプルなOPENVPN Connectのほうが使い勝手が良いでしょう。設定もovpnファイルを取り込むだけでそれ以外の設定はありません。

{% asset_img openvpn.png 480 alt %}

## VPNクライアント（macOS）

macOSはOPENVPN Connectがお勧めされているわけですが、もしmacOS Catalinaをお使いの方であれば、[Tunnelblick](https://tunnelblick.net/)をお勧めします。こちらはオープンソースでGNU GPLv2です。UIが少し古いかなという印象はありますが、日本語に翻訳されており細かい設定が可能で詳細なログも分かり易いのでエンジニア向けです。設定は2箇所あります。
{% asset_img tunnelblick.png 1024 alt %}

- IPv6無効のチェックを外しIPv6を有効にする
- 不意の切断時に「ネットワーク接続を切断する」を選択する

この2つの設定を加えます。後者はいつの間にかVPNセションが切れていてVPNを通さず公衆Wi-Fiを使っていた、という事が無くなり、ピタリとアクセスが止まります。安全措置として良い機能です。

macOS Big Surではインストールに少し手間が掛かるようです。詳細は[こちら](https://tunnelblick.net/cKextsInstallation.html)を参照してください。

これら2つのクライアントは、Homebrewからもインストール可能です。
`brew install openvpn-connect --cask`
`brew install tunnelblick --cask`

Tunnelblickは前述した接続キャンセル時の応答性も機敏です（RST送信と即座のUI応答）。

## VPNクライアント（その他）

スマホ、Linux向けにも、OPENVPN Connectがあります。設定ファイルの取り込みは、クラウド経由やメールの添付などの方法でアプリに渡します。

## ワンタイムパスワード

XGではSSL-VPNにおいても2要素認証の設定が可能ですので設定される事をお勧めします。「{% post_link vpnotp %}」の記事を参照してください。XGにおけるVPN-SSLのワンタイムパスワードはパスワードの文字列に続けてOTPの数字6文字を入力する事で2要素認証を行います。パスワードが"abcdef"でOTPが"123456"ならば、パスワードに"abcdef123456"を入力します。

 <small id="note1">**[1]**
IPSecによるサイト間接続VPNはIPv6に対応しています。クライアントからのリモートアクセスとしてのIPSecはIPv6未対応です。
</small>
