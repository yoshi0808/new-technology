---
title: VMware vSphere Hypervisor（ESXi）の設定
tags:
  - XG Firewall
  - ESXi
categories:
  - Software
date: 2020-03-01 09:30:49
---
{% note success  %}

## この記事で実現すること

XG Firewall v18をESXi 6.7上で稼働させるために、ホームゲートウェイの後ろに、XGを挟み込んだネットワーク全体の考え方を解説します。また、ESXi上で2枚のNICを利用し仮想スイッチの設定を行い、2枚のNICを持った仮想マシンを作成する環境を構築します。

{% endnote %}

<!-- more -->

## ネットワークの確認

ESXiのWeb管理画面にログイン後、左ペインの"ネットワーク"をクリックし、"物理NIC"のタブをクリックすると、ESXiに認識されているNICの一覧がリストされます。

{% asset_img conf_esxi.png alt %}

1GbpsのNICであれば、ドライバーはne1000として認識されています。（環境にもより異なりますが）vmnic0、vmnic1という物理NICが2つ表示されている事を確認してください。

 {% note danger %}
 　物理NICが1つしかない場合は、XG Firewallのセットアップはできません。

 {% endnote %}

## 仮想環境上のFirewall向け構成

ESXiにおけるネットワークの構成は、物理NICと仮想スイッチとの関係が重要です。以下の図のように、ESXiにおける物理NICはケーブルとして見立て、実際に仮想マシンが複数台存在する事を鑑み、ESXiの中にスイッチングハブが存在していると考えてください。

{% asset_img vswitch.png alt %}

※便宜上、一般的なホームユーザーの構成図としてLinuxの仮想マシンやWIFIアクセスポイント等を記載していますが、これまでのセットアップでは存在していません。また、XG Firewallのインストールに、LinuxやWIFIアクセスポイントは必要ありません。

## セットアップ状況の確認

ここまでのセットアップで、以下の構成になっています。

- 物理NICであるvmnic0、vmnic1
- バーチャルスイッチのvSwitch0
- ネットワークポート（仮想IP）として、LAN側の管理用のManagement Networkおよびデフォルトで仮想マシンのために作成されているVM Network

## WANの仮想スイッチの作成

{% asset_img vswitch1.png alt %}

XGのWAN側インタフェースを担う仮想スイッチを追加します（赤字の部分）。

1. ESXiの管理画面の左ペイン、ネットワークをクリック、続いて仮想スイッチのタブをクリックします。
2. 標準仮想スイッチの追加をクリックします。
3. WAN側の仮想スイッチを作成するため、ここでは、vSwitch1と命名します。MTUは1500のままで構いません。
4. "アップリンク1"は物理NICとの関連付けです。vmnic1などWAN側に使う予定の物理NICを選択してください。

以下の通り、仮想スイッチの作成は完了です。

{% asset_img vswitch2.png alt %}

## ネットワークポートの作成

1. vSwitch1をクリックし、物理NICのWAN向けである、vmnic1と関連付けられている事を確認してください。
2. XGのLANとWANのネットワークポートを作成します。左ペインのネットワークからポートグループのタブをクリックし、ポートグループの追加を選択します。
3. 新規ポートグループとして、LANはここではXG-LANと命名し作成します。LANなので、vSwitch0を関連づけます。
4. 続いてWANのために、XG-WANと命名し、vSwitch1と関連づけます。

これらの設定が終わり、LAN側のネットワーク構成は以下の通りとなります。

{% asset_img vswitch3.png alt %}

WAN側のネットワーク構成は以下の通りです。

{% asset_img vswitch4.png alt %}

これで、ESXiのネットワーク設定は完了となります。一旦PCのネットワークをホームゲートウェイに接続し、XG Firewallのモジュールをダウンロードしてください。
