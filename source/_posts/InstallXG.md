---
title: Sophos Firewall のインストール（事前準備）
date: 2020-03-06 18:12:36
tags:
  - XG Firewall
categories:
  - Security
#comments: false
---
<p class="onepoint">この記事で実現すること</p>
Sophos FirewallをESXiで稼働させるためのインストールイメージ（isoファイル）をダウンロードし、ESXi上で、Sophos Firewallのための仮想マシンを構築できるようになります。

<!-- more -->
## Sophos Firewallのダウンロード

Sophosのサイトより、"Sophos Firewall Home Edition"モジュールをダウンロードします。

https://www.sophos.com/ja-jp/products/free-tools.aspx
{% linkgrid %}
Sophos無償ツール | https://www.sophos.com/ja-jp/products/free-tools.aspx | (https://www.sophos.com/ja-jp/products/free-tools.aspx)お客様がご家庭でも常に安全に PCを利用できるようソフォスでは無償ツールを提供しています。 | product-firewall.png
{% endlinkgrid %}

<!-- more -->
Sophos Firewallは、V18まではXG Firewallと呼ばれていました。v18.5よりSophos Firewallに名前が変更になっています。

ダウンロードサイトでは氏名、勤務先メールアドレスとありますが、ホームユースなので、遠慮なくGmailなどのアドレスを登録します。あっさりとISOファイルのダウンロードボタンが表示されると共に、メール宛にライセンス番号が送られてきます。利用条件としては、あくまで家庭での個人的な使用に限って無料です。
ダウンロードはISOイメージです。2022年4月23日時点では、最新のバージョンは"SW-18.5.2_MR-2-380.iso"となっています。

クライアントPC（Windowsなど）から、ESXi管理画面にログインします。ESXiの管理画面の左ペインのストレージからデフォルトのストレージである、datastore1を選択し、データストアブラウザをクリックして下さい。次にアップロードボタンをクリックし、ダウンロードされた"SW-18.5.2_MR-2-380.iso"ファイルをアップロードして下さい。

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

3. また、仮想CD-ROMにFirewallのインストールイメージ（isoファイル）をマウントします。

{% asset_img vm4-1.png alt %}

4. 起動オプションのファームウェアは**EFIからBIOSに変更**して下さい。

{% asset_img vm5.png alt %}

5. さて、最終確認です。今回のプロビジョニングはシック（Lazy Zeroed）となっています。

{% asset_img vm6.png alt %}

6. 最後に完了ボタンを押します。これで仮想マシンが作成されます。

{% asset_img vm7.png alt %}

いったんここまでで仮想マシンの作成は終了となります。なお、仮想マシンを選択した状態で「アクション」という歯車マークがあります。これをクリックして、コンソール→VMRCのダウンロードを選択し、"VMware Remote Console"をインストールして下さい。これがあるとブラウザから仮想マシンの画面がポップアップし、仮想マシンを操作出来るようになります。もし物理マシンに直接USBメモリ等でXGをインストールする場合は、対象マシンのBIOS設定でUEFIのチェックを外して下さい。

(2022-04-23追記）
現時点でダウンロードされるモジュールは、Sophos Firewall v18.5がベースとなります。このブログではv18からの記事を掲載しております。

Sophos Firewallの最新バージョンはv19となっています（パッチとしての提供のみです）。新規にインストールされる方はv18.5をインストールしてからv19へのバージョンアップを行うことになります。v19を導入される方はv18.5MR3のパッチ適用は不要でいきなりv19へのバージョンアップが可能です。
- {% post_link xg-v19 %}

{% note warning %}
ファイアウォールとしては、UEFIによるセキュアブートが期待されますが、現時点では対応していないようです（Sophosコミュニティでも明確な情報はありませんでした）
{% endnote %}

{% note info %}
Intelの10GbpsのNICをお使いの方は、速度の面で有利なVMXNET3ドライバを選択可能です。ただし、VMXNET3を使う場合は、MTUは1500のまま変更しないことをお勧めします。MTU9000でXGが再起動を繰り返す事象を確認しています
{% endnote %}

