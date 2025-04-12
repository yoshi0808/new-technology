---
title: VMware ESXi8 Update3eのパッチを適用する
date: 2025-04-12T09:30:47+09:00
tags:
  - ESXi
categories:
  - Software
---


{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、2025-4-10にESXi8 Update3eが発表されています。今回、Broadcomサポートサイトからisoファイルをダウンロードできるようになっています。また、ESXi8 Update3dの時と同様にVMWareのサイトから製品パッチをESXi本体から直接ダウンロードし、ESXi上でパッチを適用する方法も（推奨されませんが）存在します。従来は、BroadcomからパッチのZIPファイルをダウンロードしESXiに適用する方法でしたが、ESXi8 Update3eではISOによるファイルのダウンロードおよび、（非推奨の）コマンドからのUpdateについて説明します。

<!-- more -->

## Broadcomのパッチのダウンロードについて

2025-04-12の時点でESXi8.0は　Update3eのパッチが提供されています。但しこれはISOファイルであって、従来コマンドでパッチを適用していたZIPファイルではありません。おそらくユーザーのESXiはヘッドレス環境（モニタがない）で運用されているでしょうから、USBメモリにISOを書き込みブートしてから画面操作というのはなかなか面倒でしょう。しかし、正式にBroadcomからESXiの最新版のISOファイルが再び提供されるようになったのは喜ばしいことです。

ISOファイルのダウンロード手順は下記の通りです。

1. Broadcomサポートポータルに接続し、ログインします。
　<https://support.broadcom.com/>
1. 以下でVMwareのメニューを選択します。
 {% asset_img bc1.png 1024 alt %}
1. 左ペインの{% label primary@My Downloads %}をクリックすると、{% label primary@Free Software Downloads available HERE %}と表示されますのでリンクをクリックします。
 {% asset_img bc2.png 1024 alt %}
1. FreeDownloadsの画面から{% label primary@Search Product Name %}の入力ボックスに"vSphere"と入力します。
 {% asset_img bc3.png 1024 alt %}
1. 以下のようにvSphereの項目が表示されますのでさらにクリックします。
 {% asset_img bc4.png 1024 alt %}
1. vSphereからさらに次のページのLinkをクリックします。
 {% asset_img bc5.png 1024 alt %}
1. "8.0U3e"のリンクが表示されますのでさらにLinkをクリックします。
 {% asset_img bc6.png 1024 alt %}
1. 以下のダウンロードリンクをクリックします。Agreementと共に個人情報を入力する画面が出る場合があります。
 {% asset_img bc7.png 1024 alt %}

ISOファイルがダウンロードできたら、USBメモリに焼いてESXiのマシンにおいてUSBブート、アップグレード（実際にはアップデート）を実施します。ESXiに対するISOを使ったアップグレードの手順については、以下のESXiセットアップ動画を参考にしてください。特に難しいものはありません。途中、新規インストールかアップグレードかを選択する箇所があります。この動画では新規インストールを選択していますが、アップグレードを選んでください。
<https://www.youtube.com/watch?v=eiZn54GPfzI>

## Broadcomのサイトから直接のダウンロード（非推奨）

{% note warning %}

#### 今回のパッチ適用方法についてのご注意事項

今回はパッチ適用にあたり、暫定方式（一部メーカーが明確に推奨していない方法を含む）を紹介していますので、リスクをご理解の上で利用されているESXiへのパッチ適用をおすすめします。

{% endnote %}

##　ESXi8 Update3e

このリリースでは、新たに発見された脆弱性（CVE）はありませんが、未然防止としてのセキュリティパッチと不具合修正が含まれています。
CVEは発行されていないといっても、重要度についてはCriticalとなっていますので、迅速なパッチ適用が求められます。

> パッチ情報（Broadcom）
<https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/release-notes/esxi-update-and-patch-release-notes/vsphere-esxi-80u3e-release-notes.html>

##　パッチの内容について

前述したパッチ情報によれば、今回のProfileは以下の4つです。
Image Profile Name
ESXi-8.0U3e-24674464-standard
ESXi-8.0U3e-24674464-no-tools
ESXi-8.0U3se-24659227-standard
ESXi-8.0U3se-24659227-no-tools
ここではセキュリティパッチ＋バグに対応したもの、かつ、VMware Tools込みのものを適用します（ESXi-8.0U3e-24674464-standard）。

現在稼働しているESXiのバージョンについては、ESXiにSSHし、以下のコマンドで確認できます（任意）。

``` bash
[root@localhost:~] esxcli software profile get
(Updated) ESXi-8.0U3d-24585383-standard
```

ESXi上でSSH Serverを起動するには以下で行います。
 ESXiの左ペインの{% label primary@ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}

これまではオフラインバンドル、つまりESXiはセキュリティのために最小限のアクセスに留めるべく、インターネットに接続するのは最低限度（NTPのみ）という構成を前提としていました。一旦Broadcomからパッチをダウンロードし、それをESXiにアップロード、パッチ適用という流れです。しかし、現時点ではこれまでの方法が取れません。ESXi本体にSSHし、ESXiのコマンドにて直接VMwareサイト（実際はBroadcom）からのパッチの確認、ダウンロードします。このために少しハックが必要です。

## ESXCLIコマンドの修正（ハック）

William氏のブログでは以下のコマンドパッチを適用することでコマンドエラーが無くなるとのことです。まずはESXiにSSHした上で以下の５つのコマンドパッチを投入してください。なお、再起動などで今回のコマンドパッチはリセットされますので改めて設定が必要です。

``` bash
[root@localhost:~] esxcli system settings advanced set -o /VisorFS/VisorFSPristineTardisk -i 0
[root@localhost:~] cp /usr/lib/vmware/esxcli-software /usr/lib/vmware/esxcli-software.bak
[root@localhost:~] sed -i 's/mem=300/mem=500/g' /usr/lib/vmware/esxcli-software.bak
[root@localhost:~] mv /usr/lib/vmware/esxcli-software.bak /usr/lib/vmware/esxcli-software -f
[root@localhost:~] esxcli system settings advanced set -o /VisorFS/VisorFSPristineTardisk -i 1
```

> William Lam氏の該当記事
 <https://williamlam.com/2024/03/quick-tip-using-esxcli-to-upgrade-esxi-8-x-throws-memoryerror-or-got-no-data-from-process.html>

## パッチ情報の確認

最初にESXiからhttpクライアントをFirewallで通すため、ESXiにSSHしたあと、以下のコマンドを投入します。
``` bash
esxcli network firewall ruleset set -e true -r httpClient
```

すでにリリースノートで、パッチのProfileは`ESXi-8.0U3e-24674464-standard`と判明していますが、SSHから確認してみます（任意）。
``` bash
[root@localhost:~] esxcli software sources profile list -d https://hostupdate.vmware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml | grep ESXi-8.0U3e
```
数分、時間がかかる場合があります。
``` bash
ESXi-8.0U3e-24674464-no-tools     VMware, Inc.  PartnerSupported  2025-04-10T00:00:00  2025-04-10T00:00:00
ESXi-8.0U3e-24674464-standard     VMware, Inc.  PartnerSupported  2025-04-10T00:00:00  2025-04-10T00:00:00
```

情報に相違はないことが確認できました。セキュリティパッチのみの方は、Profile名が"ESXi-8.0U3se"なのでgrepの結果抽出されていません。

## パッチ適用の事前準備

1. 仮想マシンを全てシャットダウンします
2. ESXiをメンテナンスモードに切り替えます
 {% asset_img esxi2.png alt %}

さて、最後にパッチ適用のコマンドを投入しますが、前述したWilliam氏のブログでのコメントも認識しておいてください。いつまでこの方法が通用するかはわかりません。
{% cq %}これがあなたのホームラボであり、私のようなESXiホストが1つしかない場合、オンラインのVMwareパッチリポジトリを引き続き使用できるようにする回避策を見つけることができましたが、これは間違いなく公式にはサポートされていません。{% endcq %}

3. SSHから以下のコマンドを投入します。

 ``` bash
esxcli software profile update -p ESXi-8.0U3e-24674464-standard -d https://hostupdate.vmware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml
 ```
4. 実行後しばらくしてから、結果が表示されます。

 ```
 Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   ...
   Reboot Required: true
 ```
5. 再びESXiのFirewallでhttpsアクセスを閉じます。
　`esxcli network firewall ruleset set -e false -r httpClient`

6. `reboot`とし、ESXiを再起動します。

再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU3eとなっているはずです。

{% asset_img esxi4.png 1024 alt %}

または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@localhost:~] vmware -v
VMware ESXi 8.0.3 build-24674464
 ```
## 事後作業

これまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。

