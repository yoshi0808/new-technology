---
title: XG Firewall VPNにスマホから接続する
tags:
  - XG Firewall
categories:
  - Security
  - VPN
  - ワンタイムパスワード
date: 2020-03-31 19:44:58
---

{% note success  %}

## この記事で実現する内容について

スマホ（iPhone、Android）からXG FirewallのVPNへ接続できるようになります。ワンタイムパスワードの設定も可能です。

{% endnote %}
<!-- more -->

{% note primary no-icon %}

## スマホからXG Firewall VPNに接続する事前準備

{% endnote %}

　前回の記事でPC（WindowsおよびmacOS）からXGの{% label info @VPN（Sophos Connect）%}にワンタイムパスワードを使って安全に接続できるようになりました。ここでは、スマホからVPNへ接続できるように設定していきます。この記事では、XG側に一通りVPNの設定が終わっている事を前提としています。以下の記事も参考にしてください。

　 {% post_link vpn %}
　 {% post_link vpnotp %}

　前提条件は以下の通りです。なお、この記事では、ワンタイムパスワードを必ず必須とはしていません。PCとは異なり、移動しながら使うスマホは毎回ワンタイムパスワードを入力するのでは利便性に欠けます。ここは利便性とセキュリティの安全面を比較し判断という事になるかとおもいます。

- XGにVPN(Sophos Connect)の設定を終えている
- XGの外側（インターネット側）にホームゲートウェイがあり、ホームゲートウェイからXGに対し必要なVPNのパケットを転送出来ている

{% note primary no-icon %}

## iOS(iPhone)からVPN接続のための設定を行う

{% endnote %}

　まず、{% label info @PC %}から{% label info @LAN %}環境にて、XGのユーザーポータル`https://XGのIPアドレス/`に接続します。ユーザーポータルには、前回までに作成したVPNユーザーでログインします。ポータルのログイン後には、以下の画面のように、iPhone（iOS）のIPSec VPNに必要な設定ファイルをダウンロードできるようになっています。

{% asset_img iphone.png alt %}

{% note warning  %}

ダウンロードした設定ファイルは一部修正が必要ですので、PCからダウンロード・修正の後、iOSにインストールする事をお勧めします。

{% endnote %}

　ファイルをダウンロードしたらメモ帳やテキストエディットなどで設定ファイルを開きます。以下はファイルの先頭からの抜粋ですが、11行目にXGのWAN側のIPアドレスが記載されている行があります。内容は以下の通りです。

```xml
<plist version="1.0">
<dict>
        <key>PayloadContent</key>
        <array>
                <dict>
                        <key>IPSec</key>
                        <dict>
                                <key>AuthenticationMethod</key>
                                <string>SharedSecret</string>
                                <key>RemoteAddress</key>
                                <string>192.168.x.x</string>
```

　上記のIPアドレスをXGで設定してあるダイナミックDNSのホスト名に書き換えます（Sophos社が提供しているダイナミックDNSであれば、xxxx.myfirewall.coです）。その後、ファイルを保存し、iCloudまたはメールなどでiPhoneに転送し、iPhoneから設定ファイルをインストールします。macOSだとFinderからファイルを選んでAirDropでiPhoneに送信すると簡単ですね。iPhoneではプロファイルのインストール時には、最初にiPhoneのパスワードを求められますのでiPhoneのパスワードを入力します。
　次にXGの接続ユーザーのパスワードを求められますが、ここはワンタイムパスワードの有無で設定が異なります。前回の記事ではワンタイムパスワードが必要なユーザーを作成しましたが、ワンタイムパスワードが不要であれば、ワンタイムパスワードを使わないユーザーを改めて作成してください。

- 以下の場合は、XGの接続ユーザーのパスワードを入力します
  - ワンタイムパスワードは利用しない
  - iPhoneにパスワードを記憶させたい


- 以下の場合は、パスワードを入力せずプロファイルのインストールを完了させます
  - ワンタイムパスワードを利用する
  - iPhoneにパスワードを記憶させたくない

　これでプロファイルのインストールは完了です。

{% note primary no-icon %}

## iOS(iPhone)からVPNに接続する

{% endnote %}

　早速、iPhoneからVPNに接続します。設定アプリからVPNを選択、XGの接続先が選択されている状態で{% label info @状況 %}のトグルスイッチをオンにします。パスワードが設定済みの方は1秒も掛からず、すぐにXGへの接続が完了します。
　ワンタイムパスワードを設定している方、或いはパスワードを記憶させていない方は、パスワード入力のポップアップが表示されます。ワンタイムパスワードは、パスワードのあと続けてワンタイムパスワードの6つの数字を続けて入力します。一旦ポップアップが表示されると他のアプリに切り替えられないので一旦キャンセルします。ワンタイムパスワードアプリで6桁の数字を記憶するかコピーするなどし、最大30秒以内で設定アプリに再度切り替え、VPNのパスワードを完成させ接続する事になります。
　ちょっと最後が慌ただしいのですが、iPhoneからXGのVPNへ接続できるようになりました。

{% note primary no-icon %}

## AndroidからVPN接続のための設定を行う

{% endnote %}

　AndroidからVPNに接続する場合は、以下の設定を行います。今回の実例はAndroidのバージョン9のタブレットで説明します。機種によって操作は異なるかとおもいますが、ご容赦ください。
　無線とネットワーク→VPN→{% label info @VPNネットワークの追加 %}をタップします。

| 説明            | 内容                                                         |
| --------------- | ------------------------------------------------------------ |
| 名前            | 接続名を入力します                                           |
| タイプ          | {% label info @IPSec Xauth PSK %}を選択します                |
| サーバー        | xxx.myfirewall.coなどのダイナミックDNSのホスト名を入力します |
| IPSec ID        | 空白のままで構いません                                       |
| IPSec事前共有鍵 | XGで設定した共有鍵を入力します                               |

{% asset_img android.png alt %}
　この後、ユーザーIDとパスワードを入力し、接続します。iOSと同様に、ワンタイムパスワードを利用する場合は、パスワードの後ろにワンタイムパスワード（6桁の数字）を続けて入力します。こちらも接続は一瞬で完了します。

　Androidに関しては1点、注意点があります。Androidは、SSLインスペクションについて、Chromeブラウザ以外のアプリからは使えない前提があります。そこで、Android専用のVPNユーザーを作成しSSLインスペクションの対象からAndroidユーザーを除外するなどの設定が必要となります。

　これで、スマホからもXGのVPNに接続する事が出来ました。スマホからXG Firewallを活用した安全なネットアクセスや宅内に設置してあるサーバーの操作ができるのは大変魅力的だとおもいます。
