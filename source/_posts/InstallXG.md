---
title: XG Firewall v18のインストール（事前準備）
date: 2020-03-06 18:12:36
tags:
  - XG Firewall
categories:
  - Security
#comments: false
---
<p class="onepoint">この記事で実現すること</p>
XG Firewall v18をESXi 6.7で稼働させるためのインストールイメージ（isoファイル）をダウンロードし、ESXi上で、XGのための仮想マシンを構築できるようになります。

<!-- more -->
## XG Firewallのダウンロード

Sophosのサイトより、"Sophos XG Firewall Home Edition"モジュールをダウンロードします。
{% linkgrid %}
Sophos 無償ツール | https://www.sophos.com/ja-jp/products/free-tools.aspx | お客様がご家庭でも常に安全に PC を利用できるようソフォスでは無償ツールを提供しています。セキュリティリスクのチェックや、マルウェアの駆除、ネットワークの保護にご活用いただけます。 | https://secure2.sophos.com/ja-jp/medialibrary/Images/Products/FreeTools/img-xg-firewall-home-full.ashx
{% endlinkgrid %}

<!-- more -->
氏名、勤務先メールアドレスとありますが、ホームユースなので、遠慮なくGmailなどのアドレスを登録します。あっさりとISOファイルのダウンロードボタンが表示されると共に、メール宛にライセンス番号が送られてきます。送られてきたメールの本文には、「利用条件としては、あくまで家庭での個人的な使用に限って無料です」と丁寧な日本語で記載されています。
ダウンロードはISOイメージです。2021年5月20日時点では、最新のバージョンは"SW-18.0.1_MR-1-Build396-396.iso"となっています。

クライアントPC（Windowsなど）から、ESXi管理画面にログインします。ESXiの管理画面の左ペインのストレージからデフォルトのストレージである、datastore1を選択し、データストアブラウザをクリックして下さい。次にアップロードボタンをクリックし、ダウンロードされた"SW-18.0.1_MR-1-Build396-396.iso"ファイルをアップロードして下さい。

{% asset_img datastore.png alt %}
 　
## 仮想マシンの作成
 　
ここから仮想マシンの初期設定です。

1. ESXiの管理画面の仮想マシンから新規仮想マシンを選択します。
2. 仮想マシンの作成を選択し、次へのボタンを押します。
3. 仮想マシンの名前を決め、ゲストOSを選択します。OSファミリはLinuxで、OSバージョンはその他のLinux4.x（64ビット）を選択します。

{% asset_img vm2.png alt %}

1. ストレージを確認し、次へのボタンを押します。

{% asset_img vm3.png alt %}

2. ここでは、ネットワークカードの追加をし、WAN側のNICを追加します。ネットワークアダプタの詳細（▶︎マークをクリック）でドライバがE1000など選択されている事を確認して下さい。

{% asset_img vm4.png alt %}

3. また、仮想CD-ROMにXG Firewallのインストールイメージ（isoファイル）をマウントします。

{% asset_img vm4-1.png alt %}

4. 起動オプションのファームウェアは**EFIからBIOSに変更**して下さい。

{% asset_img vm5.png alt %}

5. さて、最終確認です。今回のプロビジョニングはシック（Lazy Zeroed）となっています。

{% asset_img vm6.png alt %}

6. 最後に完了ボタンを押します。これで仮想マシンが作成されます。

{% asset_img vm7.png alt %}

いったんここまでで仮想マシンの作成は終了となります。なお、仮想マシンを選択した状態で「アクション」という歯車マークがあります。これをクリックして、コンソール→VMRCのダウンロードを選択し、"VMware Remote Console"をインストールして下さい。これがあるとブラウザから仮想マシンの画面がポップアップし、仮想マシンを操作出来るようになります。もし物理マシンに直接USBメモリ等でXGをインストールする場合は、対象マシンのBIOS設定でUEFIのチェックを外して下さい。

(2021-7-3 追記)
2021-7-3時点での最新パッチはMR-5（Maintenance Release 5）となります。最新パッチについては、「{% post_link xg-v18-mr5 %}」を参照ください。MR-3で導入されたセキュア・ストレージ・マスターキーはMR-5でも引き続き設定が必要なものですので、詳しくは「{% post_link xg-v18-mr3 %}」を参照ください。XG MR-1をインストールした後のパッチについては、MR-3、MR-4を適用せず、直接MR-5を適用できます。

{% note warning %}
ファイアウォールとしては、UEFIによるセキュアブートが期待されますが、現時点では対応していないようです（Sophosコミュニティでも明確な情報はありませんでした）
{% endnote %}

{% note info %}
Intelの10GbpsのNICをお使いの方は、速度の面で有利なVMXNET3ドライバを選択可能です。ただし、VMXNET3を使う場合は、MTUは1500のまま変更しないことをお勧めします。MTU9000でXGが再起動を繰り返す事象を確認しています
{% endnote %}
