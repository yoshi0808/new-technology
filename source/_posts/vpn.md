---
title: XG Firewall VPNについて
tags:
  - XG Firewall
categories:
  - Security
  - VPN
date: 2020-03-28 11:41:42
---

{% note success  %}

## この記事で実現する内容について

外出先から、PC（Windows、macOS）を使い、宅内にあるXG FirewallのVPNへ接続できるようになります。それによりウィルスおよびマルウェア対策やWebフィルタなどを含んだ安全なネット閲覧や、宅内のLANリソースへリモートアクセス出来るようになります。

{% endnote %}
<!-- more -->

{% note primary no-icon %}

## XG FirewallのVPNについて

{% endnote %}

　XGのVPNはプロトコルが何種類かあります。一般的なSSL-VPN,L2TP,PPTP、そしてSophosConnectというIPSecベースのものがあります。SophosConnectは速く安定しているため、ここではSophosConnectのVPN導入について説明します。

{% note primary no-icon %}

## Sophos Connectの事前確認

{% endnote %}

　Sophos Connectの設定にあたり、インターネットに接続されているホームゲートウェイから、VPNのパケットについては内部のXGのWANインターフェースに転送しなくてはなりません。一般的に市販されているルーターにも装備されていますが、この方法には2通りあります。

1. 全ての宅内へのトラフィックは全てXGに転送する
2. SophosConnectに必要なプロトコルおよび通信PortのみXGに転送する

    1. 全てXGに転送する
     ルーターやホームゲートウェイの製品によって呼び方は異なりますが、DMZホスト機能などと呼ばれます。この場合はインターネットから入ってくるデータは全てXGに送られますので、宅内にサーバーを立てる場合、ホームゲートウェイからはXG以外の端末は接続出来なくなります。ただし、設定は単純というメリットがあります。
     {% asset_img dmz.png alt %}

    2. 必要なプロトコルおよび通信PortのみXGに転送する
     こちらは一般的にポートマッピングと呼ばれます。内→外、外→内の方向について細かく設定を行う事になります。SophosConnectに必要なプロトコルとPortは外→内で以下の通信になります。
        - ESPプロトコル（プロトコル番号：50）
        - UDP 500,UDP 4500
    {% asset_img portmapping.png alt %}
  
　上記の2つのどちらか対応できれば、XGに対するVPN接続が行えます。

{% note primary no-icon %}

## XG側のVPN接続設定（ユーザーの登録）

{% endnote %}

　まず、VPNの具体的な接続の前に、ユーザーの登録が必要です。VPNの最終接続形態としては、ワンタイムパスワード付きのセキュアなものを目指したいとおもいます。ただし、いきなり全ての事を実施すると切り分けが難しいのでまずはワンタイムパスワード無しでの接続をし、次にワンタイムパスワード有りの接続に取り組みたいとおもいます。
 XGの左ペインメニューから{% label info @認証 %}を選択、{% label info @ユーザー %}のタブから、追加ボタンをクリックします。そして以下のようにユーザー名、パスワードとメールアドレスを入力します。

{% asset_img user1.png alt %}
{% asset_img user2.png alt %}

　他はグループのところで、{% label info @OPEN Group %}を選択するくらいで設定するところはありません。このまま保存をクリックします。VPNは、このユーザー名/パスワードで接続する事になります。

{% note primary no-icon %}

## XG側のSophos Connectの設定

{% endnote %}

　XGの左ペインメニューから{% label info @VPN %}を選択、{% label info @Sophos Connect %}のタブを選択します。特に拘りがなければ、デジタル証明書ではなく、事前共有鍵を選択する事にしましょう。それなりの鍵の長さを設定しておけば安全です。また最終的にはワンタイムパスワードを設定する事でかなりの安心感が得られます。鍵はパスワードと異なり、一度クライアントに設定すれば接続の都度入力する必要もないため、複雑で長い鍵長の事前共有鍵の設定が好ましいでしょう。

　設定は以下の通りに行います。

- {% label info @インターフェース %}はPort2(WAN)を選択します
- {% label info @認証タイプ %}は事前共有鍵を選択します
- {% label info @事前共有鍵 %}は文字列を入力、また繰り返し同じ鍵を入力します
- {% label info @許可されたユーザー %}には、上記で作成したユーザーを選択します

{% asset_img vpn1.png alt %}

- 名前はXGの配置場所として適当な名前を入力します
- XGのVPNの割り当てネットワークは、LANとは別のネットワークアドレスを入力します。例えばLANが192.168.2.0/24のネットワークならば、192.168.20.1〜192.168.20.8などと別のネットワークを入力します
- DNSについては、XG自身のDNS（XGのLAN側のIPアドレス）を入力します
- 詳細設定の{% label info @トンネルがアイドルの時に切断 %}を有効にします
- {% label info @アイドルセッション時間の間隔 %}は600にします（特段のこだわりはありません）

{% asset_img vpn2.png alt %}

　適用ボタンをクリックすると、{% label info @これにより、同じローカルピアとリモートピア間で設定したすべての接続の事前共有鍵が更新されます。続行してもよいですか？　%}　と表示されます。OKをクリックすれば、VPNが有効になります。

{% note primary no-icon %}

## XG側のFirewallルールの確認

{% endnote %}

　上記で設定したVPNがFirewallのルールに登録されている事を確認します。SSLインスペクションが入ると難しくなるので、まずはこの記事ではVPNとWANの接続を優先に考え設定します。以前の記事「XG Firewall v18のOutboundルールを新規作成する」で、デフォルトのルール「To_Internet」を作成しました。

 {% post_link rule-policy2 %}

　ルールについて、以下の図のように{% label info @送信元ゾーン %}が、LANとVPNとなっている事を確認してください。

{% asset_img rule1.png alt %}

　続いて、VPNからLANへのルールを作成します。NATは使わず全てのトラフィックを通過させるものです。以下の通り、送信元ゾーンはVPN、宛先ゾーンはLANのルールを設定します。

{% asset_img rule2.png alt %}

　以下の通り、{% label info @リンクNATルールの作成 %}を行います。こちらはVPNとLANの間であるため、NATは行いません。「NATは行わない事」を明示するために、今回は{% label info @Linked NAT %}を設定します。とはいえ、NATの情報は何も入力する事はなく、単純に保存をクリックしておくだけです。

{% asset_img rule4.png alt %}
{% asset_img rule5.png alt %}

 　NATルールで保存をクリックし、さらにルールで保存をクリックしてルールの設定は完成です。念のため現在のルールについて確認しましょう。{% label info @Traffic to Internal %}として、VPNからLANへの接続ルールがあります。もう1つは、{% label info @Traffice to WAN %}として、VPNおよびLANからWANへの接続ルールがあります。

{% asset_img rule6.png alt %}

{% note primary no-icon %}

## XG側のDynamic DNSの設定

{% endnote %}

　素晴らしい事に、XGでは無償のダイナミックDNSを用意してくれています。VPNで接続する際には、グローバルIPアドレスが必要ですが、XG用のmyfirewall.coドメインが利用できます。他に使われていない一意のホスト名を設定する事になります。{% label info @IPv4アドレス %}の箇所は、{% label info @NATされたパブリックIP %}を選んでください。その他のNo-IPなどの有名どころのダイナミックDNSを選ぶ事も可能です。

{% asset_img ddns.png alt %}

　登録が終わると、直ちにグローバルIPがダイナミックDNSに登録されます。その後、{% label info @前回更新したIP %}にグローバルIPが表示され、{% label info @前回更新した状態 %}にSuccessと表示されます。

{% asset_img ddns2.png alt %}

{% note primary no-icon %}

## XG側のデバイスのアクセス設定

{% endnote %}

　結構設定する内容が多いですが、XG側はこれが最後の設定です。左ペインの{% label info @管理 %}から、{% label info @デバイスのアクセス %}へと進みます。そこに、LAN、WAN、VPN毎にサービスのアクセス権限が定めている一覧になります。ここでは以下の項目のアクセス権を加えます。

- 管理サービス　HTTPS/SSH
    XGの管理メニューにVPN経由でアクセスする事を可能とします。
- Ping/Ping6
    VPNからは管理上pingは使えた方が便利かとおもいます。
- DNS
    LANおよびVPからのアクセスはXGのDNSをまず最初に参照します。LANにあるホストを参照する時は、XGのDNSがプライベートIPを返すように、スタティックのプライベートIPをDNSに登録しておきたいためです。これは後々サーバーを宅内に立てる場合、活用する事になります。

{% note primary no-icon %}

## Sophos Connectクライアントのダウンロード

{% endnote %}

　WindowsでVPN接続するためにはVPNクライアントをダウンロードします。上記のXGのVPN設定画面で{% label info @Sophos Connectクライアントのダウンロード %}というボタンがありました。そちらをクリックし、ソフトウェアをダウンロードします。こちらは、Windows版、macOS版のダウンロードが出来ます。
　さらに、この画面の{% label info @接続のエクスポート %}ボタンをクリックし、接続設定ファイルをダウンロードしてください（拡張子tgb）。この設定ファイルには先ほど設定したダイナミックDNSの内容も含まれています。

{% note primary no-icon %}

## Sophos Connectクライアントのセットアップ

{% endnote %}

　クライアントへのセットアップは、Windowsの場合は、SophosConnect.msiをインストールします。macOSの場合は、SophosConnect.pgkをインストールします。

　プログラム実行後、右上のメニューから、{% label info @Import Connection %}をクリックし、先ほどダウンロードした接続設定ファイル（拡張子tgb）を読み込んでください。

{% asset_img install.png alt %}

　そして{% label info @Connect %}をクリックし、VPN用に設定したユーザー名とパスワードでインターネットから、宅内のXGに接続します。

{% asset_img connected1.png alt %}
{% asset_img connected2.png alt %}

　Sophosのサイトにある手順についても参考にしてみてください。
> [Sophos XG Firewall: Sophos Connect クライアント](https://community.sophos.com/kb/ja-jp/133109)
　このサイトの説明は業務向けの設定です。

　さて、ここまでの設定で、IPSec-VPNの設定は一段落です。ただし、まだワンタイムパスワードは設定しておらず、VPN経由のSSLインスペクションも設定していません。まずはこの段階でVPN接続が正常に行われ、VPN経由でWAN側（インターネット）にアクセスした際には、自身のIPアドレスがXGのグローバルIPアドレスになっているか確認してください。
