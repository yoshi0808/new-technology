---
title: XG Firewall VPNに2要素認証を設定する
tags:
- XG Firewall
categories:
- Security
- VPN
- ワンタイムパスワード
date: 2020-03-28 18:22:30
---
<p class="onepoint">この記事で実現すること</p>
PC（Windows、macOS）からXG FirewallのVPNへ接続しているユーザーに、スマホアプリを使ったワンタイムパスワードによる2要素認証機能を追加し、セキュリティを高められます。

<!-- more -->

## XGが提供するVPNの2要素認証

XGのVPNにおいて、SSL-VPNとIPSecはワンタイムパスワードが設定できます。SSHのように、パスワードに加え、事前共有鍵を持つ事でずいぶんセキュリティは高まります。しかし、さらにワンタイムパスワードを加える事で、侵入者に突破される可能性はほぼ無いものと考えます。出先や多くの人がいる場所で端末に対し、IDとパスワードを入力するのも大きなリスクです。端末が指紋認証などで守られている前提で、XGのSophos ConnectはIDおよびパスワードを接続アプリケーションに保存しておけますので、ワンタイムパスワードのみでVPNに接続できます。

## ワンタイムパスワードアプリ

ワンタイムパスワードについては、定番のGoogleのオーセンティケーターが有名です。GoogleのオーセンティケーターはXGが表示するワンタイムパスワードのQRコードが読み込めません。Sophosからは、以下のスマホアプリが提供されています。

- [Sophos Intercept X for Mobile(iOS)](https://apps.apple.com/jp/app/sophos-intercept-x-for-mobile/id1086924662)
- [Sophos Intercept X for Mobile(Android)](https://play.google.com/store/apps/details?id=com.sophos.smsec)

なお、私は複数の端末でワンタイムパスワードの同期ができる[Authy](https://apps.apple.com/jp/app/authy/id494168017)を利用しています。

## ワンタイムパスワードの基本設定

XGにおけるワンタイムパスワードの設定は、左ペインの{% label primary@認証 %}から{% label primary@ワンタイムパスワード %}へと進んでください。設定ボタンをクリックし、以下の項目を設定します。
{% asset_img otp3.png alt %}

- {% label primary@ワンタイムパスワード %}のトグルをオンにします
- {% label primary@全ユーザーのOTP %}のトグルはオフにします
- {% label primary@ユーザーのOTPトークンを自動生成 %}のトグルはオンにします
- {% label primary@以下のユーザーとグループにOTPが必要 %}のリストボックスからは、Open Groupを選択します
- {% label primary@以下について、OTPを有効化 %}は、{% label primary@ユーザーポータル %}、{% label primary@IPSecリモートアクセス %}にチェックします
- 最後に適用ボタンをクリックします

## ワンタイムパスワードの自動生成

続いて、ユーザーポータルという画面にログインします。これは管理者向けではなく、ユーザー向けに提供されているものです。XGの管理者メニューは、デフォルトでは、`https://XGのIPアドレス:4444/`になっていますが、`https://XGのIPアドレス/`に接続するとユーザーポータル画面が開きます。この画面では、VPN向けに作成したユーザーとパスワードでログインします。すると、次にワンタイムパスワードのトークンが自動生成され、QRコードが表示されます。

{% asset_img otp1.png alt %}

ここで、必ずワンタイムパスワードのアプリでQRコードを読み込み、アプリにトークンを取り込んでください。完了後、XGのメニューで{% label primary@ログインに進む %}をクリックすると、再びログイン画面になります。ここではユーザーはそのまま入力、パスワードの部分は、**パスワード＋ワンタイムパスワードの数字6桁を続けて入力**します。ユーザーポータルにログインできれば、ワンタイムパスワードは正しくアプリに取り込まれています。

再び、XGの管理画面にadminでログインします。左ペインの{% label primary@認証 %}から{% label primary@ワンタイムパスワード %}に進むと、{% label primary@シークレット %}が生成されている事がわかります。

{% asset_img otp2.png alt %}

これで、IPsecVPNにはワンタイムパスワードが必須となりました。以前作成したSophosConnectクライアントの接続設定ファイルについて、再設定が必要になります。「{% post_link vpn %}」ではVPNのセットアップを行い、クライアントソフトウェアをダウンロードしましたが、2要素認証の設定を加える必要があります。

## scadminツールで設定ファイルを作成

今回はSophosConnectクライアントではなく、もう1つの設定ファイル作成ツールである、scadminツールをWindowsにインストールします。このアプリケーションはmacOS版がありませんので、Windowsで設定ファイルを作成する事になります。出力された設定ファイルは、Windows、mac共に共通で利用出来ますので、それをSophosConnectクライアントに取り込みます。scadmin.msiをインストールし起動します。OPENボタンを押して、以前に生成された接続設定ファイル（拡張子tgb）ファイルを開きます。

{% asset_img otp4.png alt %}

設定は{% label primary@Allow Password Saving %}と、{% label primary@Prompt for 2FA %}のトグルスイッチをOnにするのみです。そして、右下のSaveで保存してください。今回はファイルの拡張子は、scxとなっています。最後に、Sophos Connect Clientより、再度作成した設定ファイル（scx）を読み込み完了です。IDとパスワードに加え、ワンタイムパスワードをセットし接続できる事を確認してください。次回の接続からは、以下の画面のように、ワンタイムパスワードのみを入力し接続することになります。

{% asset_img otp5.png alt %}

これまでの設定で、外出先から2要素認証による堅牢な環境でLANの機器にアクセスしたり、安全なWebブラウジングができるようになりました。
