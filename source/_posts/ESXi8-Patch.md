---
title: VMware ESXi8 Update3dのパッチを適用する
date: 2025-03-08T13:00:55+09:00
tags:
  - ESXi
categories:
  - Software
---


{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、VMWareのサイトから製品パッチをESXi本体から直接ダウンロードし、ESXi上でパッチを適用します。この記事ではESXi8.0を対象にしていますが、コマンド自体はESXi7.0も変わりません。従来は、BroadcomからパッチをダウンロードしESXiに適用する方法でしたが、ESXi8 Update3dから、少し対応しづらくなってきたので別の方法を紹介します。

<!-- more -->

## Broadcomのパッチのダウンロードについて

2025-03-08の時点でESXi8.0は　Update3dのパッチが提供されています。しかしながら、私のBroadcomアカウントが個人のgmailで登録していたためか、Broadcomのサイトからパッチがダウンロードできなくなっています。個人のProfileを構成しなくてはなりませんが、「non-corporate email domain」はProfileが構成できないとのことです。無償ユーザーは少しづつ制約が加えられてきていることをひしひしと感じます。昨年末まではパッチをダウンロードできていましたが、現時点ではこれまで紹介してきた方法では実施できなくなっています。とはいえ、このブログは個人のためのものであり、自分が勤めている会社のメールを登録するつもりは全くありませんし、他の方法を模索しなくてはなりません。

{% note warning %}

#### 今回のパッチ適用方法についてのご注意事項

今回はパッチ適用にあたり、暫定方式（一部メーカーが明確に推奨していない方法を含む）を紹介していますので、リスクをご理解の上で利用されているESXiへのパッチ適用をおすすめします。

{% endnote %}

##　ESXi8 Update3d

このリリースは、CVE-2025-22224、CVE-2025-22225、CVE-2025-22226の脆弱性に対応したものです。
| **脆弱性ID**   | **対象製品**                     | **概要**                                                                                                                                                                                                                                       | **深刻度 (CVSSv3.1)** | **既知の悪用**     |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------ |
| CVE-2025-22224 | VMware ESXi、Workstation         | TOCTOU（Time-of-Check Time-of-Use）レースコンディションにより、ヒープオーバーフローが発生し、境界外書き込みが可能となる脆弱性。これにより、ローカルの管理者権限を持つ攻撃者が、ホスト上でVMXプロセスとしてコードを実行できる可能性があります。 | 9.3 (Critical)        | 確認されています。 |
| CVE-2025-22225 | VMware ESXi                      | VMXプロセス内で権限を持つ攻撃者が、任意のカーネル書き込みをトリガーし、サンドボックスを回避する可能性がある脆弱性。                                                                                                                            | 8.2 (Important)       | 確認されています。 |
| CVE-2025-22226 | VMware ESXi、Workstation、Fusion | HGFSにおける境界外読み取りにより、情報漏洩が発生する脆弱性。仮想マシン上でローカルの管理者権限を持つ攻撃者が、VMXプロセスのメモリ内容を取得する可能性があります。                                                                              | 7.1 (Important)       | 確認されています。 |

これは、すでに仮想マシンのゲストOSを侵害し、特権アクセス（管理者またはルート）を取得した攻撃者がハイパーバイザー自体に移動できる状況です。詳細は以下の「脆弱性に関する追加情報」を参照してください。すでに悪用が確認されていること、過去の脆弱性から鑑みても今回はかなりインパクトのある脆弱性と考えられます。


> 脆弱性に関する追加情報（GitHub）
 <https://github.com/vmware/vcf-security-and-compliance-guidelines/tree/main/security-advisories/vmsa-2025-0004> 

> パッチ情報（Broadcom）
<https://techdocs.broadcom.com/us/en/vmware-cis/vsphere/vsphere/8-0/release-notes/esxi-update-and-patch-release-notes/vsphere-esxi-80u3d-release-notes.html>

##　パッチの内容について

前述したパッチ情報によれば、今回のProfileは以下の2つです。
- ESXi-8.0U3d-24585383-standard
- ESXi-8.0U3d-24585383-no-tools

いつものようにシンプルなパッチのプロファイルであり、通常はVMware Tools込みのものを適用します。
現在稼働しているESXiのバージョンについては、ESXiにSSHし、以下のコマンドで確認できます（任意）。

``` bash
[root@localhost:~] esxcli software profile get
(Updated) ESXi-8.0U3c-24414501-standard
```

ESXi上でSSH Serverを起動するには以下で行います。
 ESXiの左ペインの{% label primary@ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}

これまではオフラインバンドル、つまりESXiはセキュリティのために最小限のアクセスに留めるべく、インターネットに接続するのは最低限度（NTPのみ）という構成を前提としていました。一旦Broadcomからパッチをダウンロードし、それをESXiにアップロード、パッチ適用という流れです。しかし、現時点ではこれまでの方法が取れません。ESXi本体にSSHし、ESXiのコマンドにて直接VMwareサイト（実際はBroadcom）からのパッチの確認、ダウンロードします。このために少しハックが必要です。

### ESXCLIコマンドの修正（ハック）

注意点は2点あります。
1. パッチを適用するためのProfileは、<hostupdate.vmware.com>にあります。これはDNSでLookupすると、IPv4とIPv6のホストが存在します。
2. VMware改め、Broadcomの社員である有名なWilliam LAM氏のブログによれば、ESXi8でESXCLIコマンドでメモリエラーが出るケースに遭遇するとのこと。それらの対策のためにいくつかのコマンドをESXi本体にSSHして実行する必要があります。

#### hostupdate.vmware.com

ESXi8にSSHしてからnslookupしてみると以下の通りです。IPアドレスは伏せてあります。

``` bash
[root@localhost:~] nslookup hostupdate.vmware.com
Server:		192.168.x.x
Address:	192.168.x.x:53

Non-authoritative answer:
hostupdate.vmware.com	canonical name = hostupdate.broadcom.com
hostupdate.broadcom.com	canonical name = hostupdate.broadcom.com.cdn.cloudflare.net
Name:	hostupdate.broadcom.com.cdn.cloudflare.net
Address: 2606:xxxx:xxxx::xxxx
Name:	hostupdate.broadcom.com.cdn.cloudflare.net
Address: 2a06:xxxx:xxxx::xxxx

Non-authoritative answer:
hostupdate.vmware.com	canonical name = hostupdate.broadcom.com
hostupdate.broadcom.com	canonical name = hostupdate.broadcom.com.cdn.cloudflare.net
Name:	hostupdate.broadcom.com.cdn.cloudflare.net
Address: x.x.x.x
Name:	hostupdate.broadcom.com.cdn.cloudflare.net
Address: x.x.x.x

```

これまで直接パッチのProfileを確認したり、ダウンロードするには、`hostupdate.vmware.com`を使っていましたが、今後もそのまま使えるようではあります。ただ、どうもホストのどれかには情報が乗っていないサーバーがあるのか、`Got no data from process.`という結果が返ったりします。私はこれまでESXiではIPv4のみ利用していましたが、X（Twitter）でIPv6でしか情報が取れないなどのポストがあったので改めてESXiにIPv6を設定して実行しています。

もし、IPv6が必要そうなのであれば、これはESXiのWebコンソールの左ペイン{% label primary@ネットワーク %}から、ESXiのマネジメントインタフェース、おそらくvSwitch0のVMKernelであるvmk0が対象と思われますが、ご自身のマネジメントネットワークを選択の上、設定を編集し、IPv6を有効にしてください。
 {% asset_img esxi3.png alt %}


#### ESXCLIコマンドのパッチ

William氏のブログでは以下のコマンドパッチを適用することでコマンドエラーが無くなるとのことです。まずはESXiにSSHした上で以下の５つのコマンドパッチを投入してください。なお、新しいESXiパッチを適用すると今回のコマンドパッチはリセットされますので改めて設定が必要です。

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

すでにリリースノートで、パッチのProfileは`ESXi-8.0U3d-24585383-standard`と判明していますが、SSHから確認してみます（任意）。数分、時間がかかります。
``` bash
[root@localhost:~] esxcli software sources profile list -d https://hostupdate.vm
ware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml | grep ESXi-8.0U3d
ESXi-8.0U3d-24585383-no-tools     VMware, Inc.  PartnerSupported  2025-03-04T00:00:00  2025-03-04T00:00:00
ESXi-8.0U3d-24585383-standard     VMware, Inc.  PartnerSupported  2025-03-04T00:00:00  2025-03-04T00:00:00
```

情報に相違はないことが確認できました。

## パッチ適用の事前準備

1. 仮想マシンを全てシャットダウンします
2. ESXiをメンテナンスモードに切り替えます
 {% asset_img esxi2.png alt %}

さて、最後にパッチ適用のコマンドを投入しますが、前述したWilliam氏のブログでのコメントも認識しておいてください。いつまでこの方法が通用するかはわかりません。
{% cq %}これがあなたのホームラボであり、私のようなESXiホストが1つしかない場合、オンラインのVMwareパッチリポジトリを引き続き使用できるようにする回避策を見つけることができましたが、これは間違いなく公式にはサポートされていません。{% endcq %}

3. SSHから以下のコマンドを投入します。

 ``` bash
 esxcli software profile update -p ESXi-8.0U3d-24585383-standard -d https://hostupdate.vmware.com/software/VUM/PRODUCTION/main/vmw-depot-index.xml
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

再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU3dとなっているはずです。

{% asset_img esxi4.png 640 alt %}

または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@localhost:~] vmware -v
VMware ESXi 8.0.3 build-24585383
 ```
## 事後作業

これまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。
