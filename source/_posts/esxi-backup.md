---
title: VMware ESXiの仮想マシンをバックアップする
tags:
  - ESXi
  - XG Firewall
categories:
  - Software
date: 2020-10-11 11:45:41
---
{% asset_img backup.png alt %}

<p class="onepoint">この記事で実現すること</p>

無償版ESXi6.7（VMware vSphere Hypervisor6.7）にセットアップしたXG Firewallなどの仮想マシンをバックアップ、レストアします。

<!-- more -->

## ghettoVCBでバックアップする

このブログで紹介している{% label primary@XG Firewall %}は、ESXi上にセットアップする事をお勧めしています。その理由としては仮想マシンは比較的バックアップが取得しやすく、万が一のトラブル発生時に速やかに復元（レストア）しやすい事が理由でもあります。もちろん、XG Firewallには設定ファイルをバックアップする機能が存在しますが、バージョンアップやデバイスの入れ替え等何らかのきっかけでうまく稼働しなくなるリスクがあります。XG Firewall自体がOSとして起動するため、ハードウェア（ベアメタル）に直接インストールした場合はOS毎のバックアップが事実上不可能です。このghettoVCBはESXi上で動作させるコマンドラインのスクリプトですが、利用は難しくありません。

## ESXiのスナップショット

ESXiはスナップショットという機能を持っており、その時点の稼働状態について保存可能です。動画の一瞬を絵として切り取るという表現が適切でしょうか、これは一瞬で完了し、いつでもロールバックが可能です。複数の世代を持て使い勝手はとても良好です。ビジネスの世界では本番環境にパッチを当てる際などの最終確認フェーズで活用されます。つまり、万が一の時にはロールバックする事で速やかに以前の状態に戻す事が可能です。但し、このスナップショットを取ったまま長時間運用する事をVMWareは推奨していません。スナップショットを取得した後のメモリを含む稼働状況の差分をDiskに記録していく必要があり、これがパフォーマンスに悪影響を及ぼすためです。従い、スナップショットは恒久的なバックアップの役割にはなりません。

## ghettoVCBについて

このghettoVCBはWilliam Lam氏が作成したMITライセンス（フリーソフト）のソフトウェアで、VMWareの正式な製品ではありません。但し、フリーのESXi向けにはデファクトスタンダードとも言えるスクリプトです。ソフトウェアはGitHub上にあります。以下のGitHubから{% label primary@Codeボタン %}→{% label primary@Download ZIP %}と進み、{% label primary@ghettoVCB-master.zip %}をダウンロードしてください。私はESXi6.7の環境で動作検証していますが、このブログを記載している途中の2020-10-10に"Adding support for ESXi 7.0 update 1"と更新が入りましたので、新しいESXiのバージョンにも積極的に対応されているようです。

{% linkgrid %}
ghettoVCB | https://github.com/lamw/ghettoVCB | The ghettoVCB script performs backups of virtual machines residing on ESX(i) 3.x, 4.x, 5.x & 6.x servers using methodology similar to VMware's VCB tool.  | https://avatars2.githubusercontent.com/u/602199?s=460&u=4f1ad87802c6b2fc5e9e2be1638656504af12f5b&v=4
{% endlinkgrid %}

このghettoVCBは前述したスナップショットを活用し、システムを止める事なくスナップショットを取り、バックアップを行ってくれるため非常に便利です。またバックアップを複数世代持つ事が可能です。単一のファイルとしてバックアップされるため、非常に取り扱いがしやすいのも特徴です。

ESXiをバックアップする製品はたくさん存在するのですが、基本はESXiの有償版が前提です。バックアップに使用されるvStorage APIは無償のESXi向けにはロックが掛かっており使えません。GUIによる製品も全く無いわけではありませんが、イチオシはghettoVCBになります。William Lam氏のホームページは[こちら](https://www.virtuallyghetto.com)を参照してください。

## バックアップ先の準備

ESXi上のディスクにバックアップを取得し、作成されたファイルをESXiのデータストアブラウザからダウンロードしたり、SCPを使いPCなどにファイルコピーする事は最もシンプルな方法です。しかし、NASがあると非常に便利です。最近のNASはNFSによるファイル共有が使えるので、予めNASに設定したNFSドライブをESXiからマウントし、その領域にghettoVCBでバックアップを取得するのがお勧めです。QNAP・SynologyというNASの2大メーカーは、NFSおよびブロックベースのiSCSIにも対応しています。速度的にはNFSよりブロックベースのiSCSIの方が若干早いのとNAS上のVMFSフォーマットされたディスク上では複製した仮想マシンを立ち上げられます（ネットワーク越しとなるため遅いですが）。万が一のサルベージ（復旧作業）はNFSやファイルベースのiSCSIの方がNASからファイルを確認できる事、NFSは特に扱いがシンプルなため、まずはNFSのファイル共有がお勧めです。

### NAS上でのNFSの設定

まず、ESXiでサポートされるNFSのバージョンは3および4となります。v3はシンプルにクライアントのIPアドレスで認証し、v4はIPアドレスに加えユーザー単位の認証が可能です。

ここではQNAPを実例に設定を記載します。
1. {% label primary@コントロールパネル %}から、{% label primary@ネットワークサービスとファイルサービス %}を選択し、NFSv3またはNFSv4を有効にします。
{% asset_img qnap1.png alt %}

#### NFSv3の場合

1. バックアップを取得する共有フォルダを作成します。{% label primary@コントロールパネル %}の、{% label primary@権限設定 %}でバックアップを取得する共有フォルダを選択し、共有フォルダの権限画面を設定します
{% asset_img qnap2.png alt %}
2. NFSについて設定します。ユーザーはguest扱いで接続します。
{% asset_img qnap3.png alt %}

#### NFSv4の場合

1. 認証するバックアップ専用のユーザー（一般ユーザー）を作成します。
2. バックアップを取得する共有フォルダを作成し、管理者とバックアップ専用ユーザーにアクセス権を付与します。{% label primary@コントロールパネル %}の、{% label primary@権限設定 %}でバックアップを取得する共有フォルダを選択し、共有フォルダの権限を設定します。
{% asset_img qnap2.png alt %}

 ここでは、bkupという一般ユーザーでbackupという共有フォルダのアクセス権を設定しています。bkupユーザーはこのbackupフォルダのみにアクセス権を与えており、他のフォルダにはアクセスしない設定にします。

3. NFSv4ではESXiのrootで接続された場合を含め、権限を一般ユーザーに格下げする、Squashオプションに"ALL_SQUASH"を設定します。
{% asset_img qnap4.png alt %}

 QNAP以外のNASでも若干設定内容は異なりますが、大きく違いはありません。

{% note info %}

NASのセキュリティ強化のため、NFSv4で新規作成したユーザーに対し、NFS以外のNASアクセス権の解除およびWebサービスのログイン時に2要素認証を必須（通常Webサービスにログインしないので実質無効化）とする設定をお勧めします。

{% endnote %}

## ESXiからNFSサーバーに接続する

ESXi側からNFSでファイルをマウントするのは簡単です。ESXiの左ペインメニューの{% label primary@ストレージ %}から、{% label primary@新しいデータストア %}を選択します。次に{% label primary@NFSデータストアのマウント %}を選びます。以下のダイアログが表示されますので、ESXiで使うボリューム名を決め、NFSサーバーのIPアドレス、マウント名、NFSv4であればユーザーIDとパスワードを入力します。NFSv3の場合は、ユーザーIDとパスワードを入力する場所はありません。

{% asset_img esxi1.png alt %}

これで、ESXiでは、"/vmfs/volumes/NFSデータストア名"としてnfsサーバーのフォルダがマウントされます。nfsサーバーを"¥¥YourNAS"、ESXiのデータストア名を"your-nfs"とするならば、¥¥YourNAS¥backup¥の中身が/vmfs/volumes/your-nfs/に対応します。

## ESXiでの事前準備

1. ESXiにSSHで接続する必要があるため、ESXiの左ペインメニューの{% label primary@ホスト→管理 %}から{% label primary@サービス %}タブをクリックし、{% label primary@TSM %}および{% label primary@TSM-SSH %}を起動します。
2. ESXiのストレージ、nfsボリュームを選択し、データストアブラウザを開きます。アップロードボタンをクリックし、ダウンロード済みの{% label primary@ghettoVCB-master.zip %}をアップロードします。

### ghettoVCBの展開

sshクライアントから、rootユーザーでESXiに接続し、ghettoVCBのzipを展開します。

``` bash
The ESXi Shell can be disabled by an administrative user. See the
vSphere Security documentation for more information.
[root@esxi:~] cd /vmfs/volumes/your-nfs/
[root@esxi:/vmfs/volumes/your-nfs] ls
ghettoVCB-master.zip
[root@esxi:/vmfs/volumes/your-nfs] unzip ghettoVCB-master.zip
Archive:  ghettoVCB-master.zip
   creating: ghettoVCB-master/
  inflating: ghettoVCB-master/README.md
  inflating: ghettoVCB-master/ghettoVCB-restore.sh
  inflating: ghettoVCB-master/ghettoVCB-restore_vm_restore_configuration_template
  inflating: ghettoVCB-master/ghettoVCB-vm_backup_configuration_template
  inflating: ghettoVCB-master/ghettoVCB.conf
  inflating: ghettoVCB-master/ghettoVCB.sh
  inflating: ghettoVCB-master/vghetto-ghettoVCB-offline-bundle.zip
  inflating: ghettoVCB-master/vghetto-ghettoVCB.vib
[root@esxi:/vmfs/volumes/your-nfs]
```

## バックアップする
### バックアップの設定
バックアップを行う本体は、{% label primary@ghettoVCB.sh %}です。新しく作成されたghettoVCB-masterフォルダに移動し、ghettoVCB.shをviで開きます。このスクリプトで変更すべき箇所は最低1箇所で、15行目にバックアップを保存するパスを指定します。

```bash
# Author: William Lam
# Created Date: 11/17/2008
# http://www.virtuallyghetto.com/
# https://github.com/lamw/ghettoVCB
# http://communities.vmware.com/docs/DOC-8760

##################################################################
#                   User Definable Parameters
##################################################################

LAST_MODIFIED_DATE=2020_10_10
VERSION=4

# directory that all VM backups should go (e.g. /vmfs/volumes/SAN_LUN1/mybackupdir)
VM_BACKUP_VOLUME=/vmfs/volumes/your-nfs/backups
```

上記で指定した"backups"フォルダを作成します。

```bash
[root@esxi:/vmfs/volumes/your-nfs] mkdir backups
[root@esxi:/vmfs/volumes/your-nfs]
```

さらに、バックアップ対象となるvmのListを作成します。1行1ホストとなります。XGFirewall、Win10という仮想マシンが2つ存在しそれをバックアップするのであれば、以下のようにghettoVCB-masterフォルダでvmlist.txtなどの名前で仮想マシンの一覧を作成します。

```bash
[root@esxi:/vmfs/volumes/your-nfs/ghettoVCB-master] vi vmlist.txt

XGFirewall
Win10
```

### バックアップの実行

ghettoVCB-masterフォルダから以下のコマンドでバックアップが取得できます。

```bash
[root@esxi:/vmfs/volumes/your-nfs/ghettoVCB-master] /bin/sh ./ghettoVCB.sh -f ./vmlist.txt
```

私の環境での実行結果（一部ホスト名などは書き換えています）は以下の通りです。

```bash
2020-10-10 13:29:17 -- info: Initiate backup for XGFirewall
2020-10-10 13:29:17 -- info: Creating Snapshot "ghettoVCB-snapshot-2020-10-10" for XGFirewall
Option --adaptertype is deprecated and hence will be ignored
Destination disk format: VMFS thin-provisioned
Cloning disk '/vmfs/volumes/datastore1/XGFirewall/XGFirewall/XGFirewall-0.vmdk'...
Clone: 100% done.
2020-10-10 13:30:59 -- info: Removing snapshot from XGFirewall ...
2020-10-10 13:31:00 -- info: Slept 1 seconds to work around NFS I/O error
2020-10-10 13:31:00 -- info: Backup Duration: 1.72 Minutes
2020-10-10 13:31:00 -- info: Successfully completed backup for XGFirewall!
```

### バックアップ結果の確認

実際にバックアップが作成されたフォルダを確認すると以下のようになっています。

```bash
[root@esxi:/vmfs/volumes/your-nfs/backups/XGFirewall/XGFirewall-2020-10-10_13-29-16] ls -al
total 29407336
drwxr-xr-x    2 root     root          4096 Oct 10 13:30 .
drwxr-xr-x    5 root     root          4096 Oct 10 13:30 ..
-rw-r--r--    1 root     root            30 Oct 10 13:30 STATUS.ok
-rw-------    1 root     root       2621952 Oct 10 13:30 XGFirewall-0-ctk.vmdk
-rw-------    1 root     root     42949672960 Oct 10 13:30 XGFirewall-0-flat.vmdk
-rw-------    1 root     root           612 Oct 10 13:30 XGFirewall-0.vmdk
-rwxr-xr-x    1 root     root          3712 Oct 10 13:29 XGFirewall.vmx
```

環境によってファイル名は少し異なります。仮想マシンは、-flat.vmdkが本体です。私の場合は、別のバックアップソフトで差分バックアップを有効にしているため別にファイル名が"-ctk.vmdk"というものもあります。これはvSphereの機能であるCBT（Changed Block Tracking）を用いて更新のあったブロックのみを差分バックアップする機能で、これを使うとvmdkが2つ作成されます。このCBTはghettoVCBには無関係ですが混乱を避けるために参考までに記載しました。

ファイルのサイズを確認すると、`XGFirewall-0-flat.vmdk`は40GByteとなっています。これはそもそもの仮想マシンを作成した時に設定したサイズが示されています。ghettoVCBはデフォルトのthinモードでバックアップするため、thickで構成された仮想マシンよりは実際の消費されているディスク量は小さく済みます。実際に消費されたディスクは以下の通り確認できます。

```bash
[root@esxi:/vmfs/volumes/your-nfs/backups/XGFirewall/XGFirewall-2020-10-10_13-29-16] du -h
28.0G	.
```

つまり、シンプロビジョニング（通称シンプロ）はこうやってディスク領域を節約する仕組みになっているわけです。

私の環境ではNFSサーバーはQNAPのTVS473eというモデルでウェスタンデジタル社のHDDを4台RAID10で使っており、NICはAquantia AQC107です。ESXi側のNICはintel X550T2で、共に10GbpsのNICです。XGの仮想マシン（28ギガバイト）をバックアップするのに1分40秒ですのでまずまずの速度でしょうか。参考までに、殆どアプリの入っていないWin10だと、4分20秒程度でした。
デフォルトでは3世代バックアップを取得するようになっていますが、その他カスタマイズする箇所については、[英語版の公式マニュアル](https://communities.vmware.com/docs/DOC-8760)を参照してください。

## ESXiのちょっと特殊な点

このシェルを実行する時に、頭に`/bin/sh`を加えました。単体でghettoVCB.shを実行すると`-sh: ./ghettoVCB.sh: Operation not permitted`と実行できません。ghettoVCB.shには、実行権も最初から付与されています。スクリプトの先頭にShebang（#!/bin/sh）が無いのでそれが原因かと思い加えても動作しません。これは、ESXiがUEFIのセキュアブートだとこのような挙動になるようです。スクリプトでバックアップができるようになると、Cronに登録して定期的に実行したくなりますが、改ざん防止のためそれも不可能なようです。ESXiのセキュアブートをしないように変更すれば可能ですが、XGを載せたFirewallの役割から考えると非常に悩ましいところです。定期的にバックアップ可能なソフトウェアについて、今後紹介できればと考えています。

## レストアする

さて、バックアップから戻す場合です。ESXiのハードウェア毎故障してしまってもバックアップがあれば安全です。戻し方には2つあります。

1. バックアップを取得した仮想マシンと同じ場所に戻す
2. バックアップを取得した仮想マシンの情報で、新しい仮想マシンを作成する

1の方法は元の仮想マシンを一旦ESXiメニューから削除してから同じフォルダを再作成して復旧するので比較的単純です。2の方法は重複して作成する事になるため、そのままだとネットワーク周りの環境が重複し、MACアドレスなど別の構成にしてレストアする事になります。より慎重な人は別の仮想マシンとして起動する事を確認してから元の仮想環境を削除する方法を選びたいのではないでしょうか。今回は少し手間が掛かりますが、上記でバックアップされたXGFirewallを新しい仮想マシンとして復元する方法について記載します。

### レストアの設定

通常仮想マシンが稼働しているvmfsフォーマットのフォルダを確認します。通常は`/vmfs/volumes/datastore1`ですが、ここでは、｀/vmfs/volumes/your-datastore/`とします。

バックアップしたXGFirewallを新しい仮想マシンをレストアする場所として、datastore配下に"XGFW18"フォルダを作成します。

```bash
[root@esxi:/vmfs/volumes/your-datastore] mkdir XGFW18
[root@esxi:/vmfs/volumes/your-datastore]
```

次に、ghettoVCBフォルダに移動し、レストア設定ファイルを新規作成します。以下の通り、バックアップしたファイル、戻し先と仮想マシンのディスクフォーマット（ここではデフォルトのzeroedthick"1"を指定）、仮想マシンの名称を記述します。

```bash
[root@esxi:/vmfs/volumes/your-nfs/ghettoVCB-master] vi vm_restore_list.txt

# DISK_FORMATS
# 1 = zeroedthick
# 2 = 2gbsparse
# 3 = thin
# 4 = eagerzeroedthick
# e.g.
"/vmfs/volumes/your-nfs/backups/XGFirewll/XGFirewall-2020-10-10_13-29-16;/vmfs/volumes/your-datastore/XGFW18;1;XGFW18"
```

### レストアの実行

ghettoVCB-masterフォルダから以下のコマンドでレストアを実行します。

```bash
[root@esxi:/vmfs/volumes/your-nfs/ghettoVCB-master] /bin/sh ./ghettoVCB-restore.sh -c ./vm_restore_list.txt
```

### レストア結果の確認

```bash
################## Restoring VM: XGFW18  #####################
Start time: Sun Oct 11 04:14:58 UTC 2020
Restoring VM from: "/vmfs/volumes/your-nfs/backups/XGFirewall/XGFirewall-2020-10-10_13-29-16"
Restoring VM to Datastore: "/vmfs/volumes/your-datastore/XGFW18" using Disk Format: "zeroedthick"
Creating VM directory: "/vmfs/volumes/your-datastore/XGFW18/XGFW18" ...
Copying "XGFW.vmx" file ...
Restoring VM's VMDK(s) ...
Updating VMDK entry in "XGFW18.vmx" file ...
Option --adaptertype is deprecated and hence will be ignored
Destination disk format: VMFS zeroedthick
Cloning disk '/vmfs/volumes/your-nfs/backups/XGFirewall/XGFW-2020-10-10_13-29-16/XGFirewall-0.vmdk'...
Clone: 100% done.
Registering XGFW18 ...
10
End time: Sun Oct 11 04:26:17 UTC 2020
################## Completed restore for XGFW18! #####################


Start time: Sun Oct 11 04:14:58 UTC 2020
End   time: Sun Oct 11 04:26:17 UTC 2020
Duration  : 11.32 Minutes
```

これでESXiのメニューを確認すると既に左ペインの仮想マシンに新しくレストアした"XGFW18"がインベントリ登録まで完了し停止状態となっています。すぐに起動といきたいところですが、今稼働中のXGとIPアドレスなど全てが重複しますので、事前に修正する箇所があります。

{% asset_img esxi2.png alt %}

1. ネットワーク部分ですが、ESXiの左ペインのネットワークから新しいポートグループをLANとWANとの2つ作成し、それぞれ物理NICのvmnicと関連付けます。
2. ネットワークアダプタ1（LAN）、2（WAN）とも新しいポートグループに置き換えます。
3. 既存のXGが起動中の場合は、IPアドレスが重複する事、そもそも1つのライセンスで複数起動は認められていませんので、停止します。
4. 既存のXGが停止してから、新しいXGFW18を起動します。初回起動時には以下のダイアログが表示されますので、{% label primary@コピーしました %}を選択し{% label primary@回答 %}します。バックアップした仮想マシンを既に削除している場合は、{% label primary@移動しました %}を選択します。

{% asset_img esxi3.png alt %}

これでバックアップされたXGが復元されました。ただし前述した通り、MACアドレスが初期化されていますので、ホームゲートウェイから割り当てられたIPアドレスが変わっています。また、LANで利用しているL2スイッチでMACアドレスフィルタなどACLを使っている場合も通信できなくなりますので、ご注意ください。
レストアの処理時間は11分20秒と少し時間が掛かるようですが、頻繁に行う作業ではないため、許容範囲ではないでしょうか。

{% note warning %}
復元された新しいXGをメインとして利用していく場合は、古い仮想マシンについて自動起動をオフにし、同時起動しないようにご注意ください。

{% endnote %}

レストアに関する詳細は、[公式マニュアル](https://communities.vmware.com/docs/DOC-10595)を参照してください。
