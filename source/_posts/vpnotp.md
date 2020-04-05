---
title: XG Firewall VPNにワンタイムパスワードを設定する
tags:
  - XG Firewall
categories:
  - Security
  - VPN
  - ワンタイムパスワード
date: 2020-03-28 18:22:30
---

{% note success  %}

## この記事で実現する内容について

PC（Windows、macOS）からXG FirewallのVPNへ接続しているユーザーに、スマホを使ったワンタイムパスワードによる認証機能を追加し、セキュリティを高められるようになります。

{% endnote %}
<!-- more -->

{% note primary no-icon %}

## XGが提供するVPNのワンタイムパスワードについて

{% endnote %}

　XGのVPNにおいて、SSL-VPNとIPSecはワンタイムパスワードが設定できます。SSHのように、パスワードに加え、事前共有鍵を持つ事でずいぶんセキュリティは高まります。しかし、さらにワンタイムパスワードを加える事で、侵入者に突破される可能性はほぼ無いものと考えます。出先や多くの人がいる場所で端末に対し、IDとパスワードを入力するのも大きなリスクです。端末が指紋認証などで守られている前提で、XGのSophos ConnectはIDおよびパスワードを接続アプリケーションに保存しておけますので、ワンタイムパスワードのみでVPNに接続できます。

{% note primary no-icon %}

## ワンタイムパスワードのアプリケーションについて

{% endnote %}

　ワンタイムパスワードについては、定番のGoogleのオーセンティケーターなど、ご存知の方も多いとおもいます。Googleのオーセンティケーターは何故かXGが表示するワンタイムパスワードのQRコードが読み込めません。Sophosからは、以下のスマホアプリが提供されています。

> [Sophos Intercept X for Mobile(iOS)](https://apps.apple.com/jp/app/sophos-intercept-x-for-mobile/id1086924662)
> [Sophos Intercept X for Mobile(Android)](https://play.google.com/store/apps/details?id=com.sophos.smsec)

　なお、私は複数の端末でワンタイムパスワードの同期ができる[Authy](https://apps.apple.com/jp/app/authy/id494168017)を利用しています。

{% note primary no-icon %}

## ワンタイムパスワードの基本設定

{% endnote %}

　XGにおけるワンタイムパスワードの設定は、左ペインの{% label info @認証 %}から{% label info @ワンタイムパスワード %}へと進んでください。ここで以下の通り、設定ボタンをクリックし、以下の項目の設定を行います。

- {% label info @ワンタイムパスワード %}のトグルをオンにします
- {% label info @全ユーザーのOTP %}のトグルはオフにします
- {% label info @ユーザーのOTPトークンを自動生成 %}のトグルはオンにします
- {% label info @以下のユーザーとグループにOTPが必要 %}のリストボックスからは、Open Groupを選択します
- {% label info @以下について、OTPを有効化 %}は、{% label info @ユーザーポータル %}、{% label info @IPSecリモートアクセス %}にチェックします
- 最後に適用ボタンをクリックします

{% asset_img otp3.png alt %}

{% note primary no-icon %}

## ユーザーポータル画面でのワンタイムパスワードの自動生成

{% endnote %}

　続いて、ユーザーポータルという画面にログインします。これは管理者向けではなく、ユーザー向けに提供されているものです。XGの管理者メニューは、デフォルトでは、`https://XGのIPアドレス:4444/`になっていますが、`https://XGのIPアドレス/`に接続するとユーザーポータル画面が開きます。
　この画面では、VPN向けに作成したユーザーとパスワードでログインします。すると、次にワンタイムパスワードのトークンが自動生成され、QRコードが表示されます。

{% asset_img otp1.png alt %}

　ここで、必ずワンタイムパスワードのアプリでQRコードを読み込み、アプリにトークンを取り込んでください。完了後、XGのメニューで{% label info @ログインに進む %}をクリックすると、再びログイン画面になります。ここではユーザーはそのまま入力、パスワードの部分は、パスワード＋ワンタイムパスワードの数字6桁を続けて入力します。ユーザーポータルにログインできれば、ワンタイムパスワードは正しくアプリに取り込まれています。

　再び、XGの管理画面にadminでログインします。左ペインの{% label info @認証 %}から{% label info @ワンタイムパスワード %}に進むと、{% label info @シークレット %}が生成されている事がわかります。

{% asset_img otp2.png alt %}

　これで、IPsecVPNにはワンタイムパスワードが必須となりました。以前作成したSophosConnectクライアントの接続設定ファイルについて、再設定が必要になります。前回のVPNのセットアップを行ったところで、クライアントソフトウェアをダウンロードしました。

> （前回の記事）{% post_link vpn %}

{% note primary no-icon %}

## scadminツールでワンタイムパスワード対応の設定ファイルを作成する

{% endnote %}

　今回はSophosConnectクライアントではなく、もう1つの設定ファイル作成ツールである、scadminツールをWindowsにインストールします。このアプリケーションはmacOS版がありませんので、Windowsで設定する事になります。出力された設定ファイルは、Windows、mac共に共通で利用出来ますので、それをSophosConnectクライアントに取り込みます。scadmin.msiをインストールし起動します。OPENボタンを押して、以前に生成された接続設定ファイル（拡張子tgb）ファイルを開きます。

{% asset_img otp4.png alt %}

　設定は{% label info @Allow Password Saving %}と、{% label info @Prompt for 2FA %}のトグルスイッチをOnにするのみです。そして、右下のSaveで保存してください。今回はファイルの拡張子は、scxとなっています。

　最後に、Sophos Connect Clientより、再度作成した設定ファイル（scx）を読み込み完了です。IDとパスワードにワンタイムパスワードをセットし、接続できる事を確認して下さい。次回の接続からは、以下の画面のように、ワンタイムパスワードのみを入力し接続する事になります。

{% asset_img otp5.png alt %}

　少し設定が大変でしたが、これまでの設定でXGのVPN経由でLANの機器にアクセスしたり、IPSを利用した安全なWebブラウジングができるようになりました。まだもう少し書くべき事が残っています。iOS版でのVPN接続、および、VPNからWAN接続におけるSSLインスペクション対応の2点は次回以降の記事で記載します。
