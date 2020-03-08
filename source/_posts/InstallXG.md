---
title: XG Firewallのインストール（事前準備）
date: 2020-03-06 18:12:36
tags:
  - XG Firewall
categories:
  - Security
#comments: false
---
{% note primary no-icon %}

## XG Firewallのダウンロード

{% endnote %}
　Sophosのサイトの[（無償ツール）](https://www.sophos.com/ja-jp/products/free-tools.aspx)より、「Sophos XG Firewall Home Edition」モジュールのダウンロードを行います。氏名、勤務先メールアドレスとありますが、ホームユースなので、遠慮なくGmailなどのアドレスを登録します。あっさりとISOファイルのダウンロードボタンが表示されると共に、メール宛にライセンス番号が送られてきます。
　送られてきたメールの本文には、「利用条件としては、あくまで家庭での個人的な使用に限って無料です」と丁寧な日本語で記載されています。
<!-- more -->
 　ダウンロードはISOイメージです。2020年3月6日時点では、最新のバージョンはv17.5のようです。ただし、Sophosからのお知らせに[v18がリリースされたとの記載](https://community.sophos.com/products/xg-firewall/b/blog/posts/sophos-xg-firewall-v18-is-now-available)があるため、こちらのISOファイルからインストールします。As usual, this firmware update is no charge for all licensed XG Firewall customers. とありますし問題なさそうです。VMware向けのテンプレートもダウンロード出来るようですが、仮想環境ではなくいきなり物理PCにインストールする方のために、ISOファイルからのセットアップ手順であった方が良いですね。上記のリンクから、SW-18.0.0_GA-Build321-321.isoをダウンロードして下さい。

 　いつも使っているPC（Windowsなど）から、ESXi管理画面にログインします。ESXiの管理画面の左ペインのストレージからデフォルトのストレージである、datastore1を選択し、データストアブラウザをクリックして下さい。次にアップロードボタンをクリックし、ダウンロードされたSW-18.0.0_GA-Build321-321.isoファイルをアップロードして下さい。

 {% asset_img datastore.png alt %}
 　
{% note primary no-icon %}

## XG Firewall仮想マシンの作成

{% endnote %}
 　
 　さて、ここから仮想マシンの初期設定です。

1. ESXiの管理画面の仮想マシンから新規仮想マシンを選択します。
1. 仮想マシンの作成を選択し、次へのボタンを押します。
1. 仮想マシンの名前を決め、ゲストOSを選択します。OSファミリはLinuxで、OSバージョンはその他のLinux3.x（64ビット）を選択します。※以下の図では、その他のLinux4.x（64ビット）を選択しています。

{% asset_img vm2.png alt %}

1. ストレージを確認し、次へのボタンを押します。

{% asset_img vm3.png alt %}

1. ここでは、ネットワークカードの追加をし、WAN側のNICを追加します。ネットワークアダプタの詳細（▶︎マークをクリック）でドライバがE1000を確認して下さい。まずは安定性優先のためにE1000を選ぶ事をお勧めします。

{% asset_img vm4.png alt %}

1. また、仮想CD-ROMにXG Firewallのインストールイメージ（isoファイル）をマウントします。

{% asset_img vm4-1.png alt %}

7. 起動オプションのファームウェアはEFIからBIOSに変更して下さい。

{% asset_img vm5.png alt %}

8. さて、最終確認です。今回のプロビジョニングはシック（Lazy Zeroed）となっています。

{% asset_img vm6.png alt %}

9. 最後に完了ボタンを押します。これで仮想マシンが作成されます。

{% asset_img vm7.png alt %}

　いったんここまでで仮想マシンの作成は終了となります。なお、仮想マシンを選択した状態で「アクション」という歯車マークがあります。これをクリックして、コンソール→VMRCのダウンロードを選択し、VMware Remote Consoleをインストールして下さい。これがあるとブラウザから仮想マシンの画面がポップアップし、仮想マシンを操作出来るようになります。

余談ですが、もし物理マシンに直接USBメモリ等でXGをインストールする場合は、対象マシンのBIOS設定でUEFIのチェックを外して下さい。

＜補足＞

　ESXiの知識がある方であれば、今回のｖ18よりその他のLinux4.x以降（64ビット）を選択可能なようですので、そちらを選んでみて下さい。また、NICのドライバについては、速度の面で有利なVMXNET3を選択可能です。まだ私自身もVMXNET3の検証は十分に行えていません。
