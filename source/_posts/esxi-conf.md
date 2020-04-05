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

## この記事で実現する内容について

　Firewall v18をESXi（ｖ6.7）上で稼働させるために、ホームゲートウェイの後ろに、XGを挟み込んだネットワーク全体の考え方を学びます。また、ESXi上で2枚のnicを利用し仮想スイッチの設定を行い、2枚のnicを持った仮想マシンを作成する環境が構築できるようになります。

{% endnote %}

<!-- more -->

{% note primary no-icon %}

## ネットワークの確認

{% endnote %}

 1. ESXiのWeb管理画面にログイン後、左ペインの「ネットワーク」をクリック
 2. 「物理NIC」のタブをクリック
 　以下の画面のように、ESXiに認識されているNICの一覧がリストされます

{% asset_img conf_esxi.png alt %}

 　1GbpsのNICであれば、ドライバーはne1000として認識されています。（環境にもより異なりますが）vmnic0、vmnic1という物理NICが2つ表示されている事を確認してください。

 {% note warning %}
 　物理NICが1つしかない場合は、XG Firewallのセットアップはできません。
 {% endnote %}

{% note primary no-icon %}

## ESXiを利用したXG Firewallの最終構成

{% endnote %}

　ESXiにおけるネットワークの構成は、物理NICと仮想スイッチとの関係を理解する事が必要です。以下の図のように、ESXiにおける物理NICはケーブルとして見立て、実際に仮想マシンが複数台存在する事を鑑み、ESXiの中にスイッチングハブが存在していると考えてください。

{% asset_img vswitch.png alt %}

 {% note info %}

便宜上、構成図にLinuxの仮想マシンを記載していますが、これまでのセットアップでは存在していません。

 {% endnote %}

{% note primary no-icon %}

## 現時点でのセットアップ状況の確認

{% endnote %}

　ここまでのセットアップで、以下の構成になっています。

- 物理NICであるvmnic0、vmnic1
- バーチャルスイッチのvSwitch0
- ネットワークポート（仮想IP）として、Lan側の管理用のManagement Networkおよびデフォルトで仮想マシンのために作成されているVM Network

{% note primary no-icon %}

## Wanのための仮想スイッチの作成

{% endnote %}

{% asset_img vswitch1.png alt %}

 次に、XGのWan側インタフェースを担う仮想スイッチを追加し、LanとWanとのネットワークポートを追加する事になります（赤字の部分）。

 1. ESXiの管理画面の左ペイン、ネットワークをクリック、続いて仮想スイッチのタブをクリックします。
 2. 標準仮想スイッチの追加をクリックします。
 3. Wan側の仮想スイッチを作成するため、ここでは、vSwitch1と命名します。MTUは1500のままで構いません。

これで、以下の通り、仮想スイッチの作成は完了です。

{% asset_img vswitch2.png alt %}

{% note primary no-icon %}

## ネットワークポートの作成

{% endnote %}

 1. vSwitch1をクリックし、物理NICのWan向けである、vmnic1と関連付けられている事を確認してください。
 2. XGのLanとWanのネットワークポートを作成します。左ペインのネットワークからポートグループのタブをクリックし、ポートグループの追加を選択します。
 3. 新規ポートグループとして、LanはここではXG-Lanと命名し作成します。Lanなので、vSwitch0を関連づけます。
 4. 続いてWanのために、XG-Wanと命名し、vSwitch1と関連づけます。

　これらの設定が終わり、Lan側のネットワーク構成は以下の通りとなります。

{% asset_img vswitch3.png alt %}

　また、Wan側のネットワーク構成は以下の通りです。

{% asset_img vswitch4.png alt %}

　これで、ESXiのネットワーク設定は完了となります。
　面倒ですが、一旦またPCのネットワークを元に戻し、ホームゲートウェイに接続します。そしてXG Firewallのモジュールをダウンロードしてまいりましょう。
