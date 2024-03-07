---
title: VMware ESXiにパッチを適用する
tags:
  - ESXi
categories:
  - Software
date: 2020-06-14 22:19:20
---

{% asset_img title.png alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。この記事ではESXi8.0を対象にしていますが、コマンド自体はESXi7.0も変わりません。

<!-- more -->

## ご注意事項

2024-01-22に発表されたVMWareブログによりますと、スタンドアロン製品の提供を終了し、サブスクリプションモデルに変更されることとなりました。この無償版ESXiは今後提供停止となりますが、サポートは継続されるとの事です。
無償版ESXiの利用にあたっては、まずこちらの記事「{% post_link EOS-Free-esxi %}」を参照されることをお勧めします。

2024-02-29には、ESXi8.0の最新パッチ（VMware-ESXi-8.0U2b-23305546-depot）が提供されています。無償版ESXiの安全な運用は当面継続できそうです。

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。Windows10ではOpenSSHがサポートされていますので、{% label primary@オプション機能を追加する %}から{% label primary@OpenSSHクライアント %}を有効にし、コマンドラインから`ssh  root@ESXiのIPアドレス`で接続可能です。Windows11ではOpenSSHがデフォルトで導入されています。

## VMwareのパッチ情報

ESXiのパッチ情報は以下を参照してください。当該ページの左ペインメニューには最新パッチの情報が掲載されていますので、最新のパッチ情報を辿ってください。また、過去のパッチの情報も提供されています。

> VMware ESXi 8.0 Update 2b （2023-03-01リリースノート発表）
 <https://docs.vmware.com/en/VMware-vSphere/8.0/rn/vsphere-esxi-80u2b-release-notes/index.html>

セキュリティパッチと不具合修正があります。久しぶりのパッチだけに不具合修正もかなり多い状況です。セキュリティ対応も含め適用をお勧めします。久しぶりということで忘れがちですが、アップデートで稀に動作しなくなるデバイスが発生するケースもありますので事前の仮想マシンのバックアップをお勧めします。

参考までに、ESXi7.0は昨年の9月からまだパッチは出ていないようです。

> VMware ESXi 7.0 Update 3o（2023-9-28発表）
 <https://docs.vmware.com/en/VMware-vSphere/7.0/rn/vsphere-esxi-70u3o-release-notes/index.html>

## 製品パッチの情報を入手する

ESXiのセットアップ時にCustomer Connectへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

**VMware Customer Connect**にサインインし、{% label primary@製品とアカウント %}メニューから、"製品パッチ"を選択します。
> VMware Customer Connect
 <https://customerconnect.vmware.com/jp>

{% asset_img myvm3.png alt %}

さらに、"ESXi"とバージョンの"7.0"または"8.0"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。以下は8.0U2bの画面です。

{% asset_img myvm2.png alt %}

基本的にESXiは修正パッチを適用する場合はこの7.0、8.0という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。但し、Update2,Update3というグループがあり、さらにUpdate3k、Update3lという具合にグループ単位でパッチ毎に末尾の英字が大きくなっていきます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。

## 事前準備

ESXiにログインし、以下の作業を行います。
- SSHを有効にします
- 仮想マシンを全てシャットダウンします
- ESXiをメンテナンスモードに切り替えます
- ダウンロードしたパッチファイル（ZIPファイル）をESXiにアップロードします
- SSHでESXiにログインします
- パッチ適用コマンドを入力、リブートします
- メンテナンスモードを終了します
- SSHを無効にします
- 仮想マシンを起動します

1. SSHを有効にする
 ESXiの左ペインの{% label primary@ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}

2. 仮想マシンを全てシャットダウンします

3. ESXiをメンテナンスモードに切り替えます
 {% asset_img esxi2.png alt %}

4. パッチファイルのESXiへのアップロード
 ESXiの左ペインメニューの"ストレージ"を選択、メインのストレージ（一般的にはdatastore1）を選択し、"データストアブラウザ"をクリックします
 {% asset_img esxi3.png alt %}
 {% label primary@アップロード %}ボタンをクリックし、ダウンロードしたパッチファイルをZIPのままアップロードします。
 ここの例では{% label primary@ディレクトリの作成 %}ボタンで**updateフォルダを作成**し、そこにアップロードします。

5. SSHでESXiにログイン
 ログイン後、パッチをアップロードしたフォルダ（datastore1/update）に移動しアップロードしたパッチファイルが存在するか`ls`で確認します
 ``` bash

  [root@esxi:~] cd /vmfs/volumes/datastore1/update
  [root@esxi:~] ls
 ```

## ESXiのパッチ適用

パッチ適用のコマンドは7.0、8.0とで違いはありません。ここでは直近バージョンからのパッチ適用のための具体的なコマンドを記載しています。

### パッチ適用(ESXi8.0の場合)

ここでは、ESXi8.0の情報を掲載します。ESXi7.0についてもコマンド自体は変わりません。

#### 現在稼働中のプロファイルを確認

 新しいドライバやバグフィックス、セキュリティパッチなど含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。ここでは、ESXi8.0Update2からUpdate2bにアップデートすることを例にします。

 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
[root@localhost:~] esxcli software profile get
   ESXi-8.0U2-22380479-standard
   Name: ESXi-8.0U2-22380479-standard
   Vendor: VMware, Inc.
   Creation Time: 2023-09-28T11:26:16
   Modification Time: 2024-03-04T10:24:30
   Stateless Ready: True
 ```

 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します（パッチはフルパス指定が必要です）。
 ``` bash
[root@localhost:/vmfs/volumes/644d900e-e666deaf-8cf2-1c34da77cb4c/update] esxcli software sources profile list -d /vmfs/volumes/datastore1/update/VMware-ESXi-8.0U2b-23305546-depot.zip
Name                            Vendor        Acceptance Level  Creation Time        Modification Time
------------------------------  ------------  ----------------  -------------------  -----------------
ESXi-8.0U2sb-23305545-standard  VMware, Inc.  PartnerSupported  2024-02-29T00:00:00  2024-02-29T00:00:00
ESXi-8.0U2sb-23305545-no-tools  VMware, Inc.  PartnerSupported  2024-02-29T00:00:00  2024-02-14T06:50:08
ESXi-8.0U2b-23305546-standard   VMware, Inc.  PartnerSupported  2024-02-29T00:00:00  2024-02-29T00:00:00
ESXi-8.0U2b-23305546-no-tools   VMware, Inc.  PartnerSupported  2024-02-29T00:00:00  2024-02-14T08:21:05
```

今回は、VMWareTools有/無と通常/セキュリティパッチのみのパターンです。繰り返しとなりますが、Updateでは基本的に使えなくなるデバイスは発生しないのですが、新たな不具合によってデバイスが動かないことはありえます。
互換性ガイドでも特に8.0U2b向けのリストは出ていないので8.0U2からは変わっていないように見えます。
> VMware Compatibility Guide
 <https://www.vmware.com/resources/compatibility/search.php>

 さて、VMWareTools有を前提として、パッチを２つ比較します。
 | ESXi-8.0U2b-23305546-standard（通常）                               | ESXi-8.0U2sb-23305545-standard（セキュリティパッチのみ）            |
 | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
 | VMW_bootbank_pensandoatlas_1.46.0.E.28.1.314-2                      | VMW_bootbank_pensandoatlas_1.46.0.E.28.1.314                        |
 | VMware_bootbank_bmcal_8.0.2-0.30.23305546                           | VMware_bootbank_bmcal_8.0.2-0.25.23305545                           |
 | VMware_bootbank_bmcal-esxio_8.0.2-0.30.23305546                     | VMware_bootbank_bmcal-esxio_8.0.2-0.25.23305545                     |
 | VMware_bootbank_clusterstore_8.0.2-0.30.23305546                    | VMware_bootbank_clusterstore_8.0.2-0.25.23305545                    |
 | VMware_bootbank_cpu-microcode_8.0.2-0.30.23305546                   |                                                                     |
 | VMware_bootbank_crx_8.0.2-0.30.23305546                             | VMware_bootbank_crx_8.0.2-0.25.23305545                             |
 | VMware_bootbank_drivervm-gpu-base_8.0.2-0.30.23305546               | VMware_bootbank_drivervm-gpu-base_8.0.2-0.25.23305545               |
 | VMware_bootbank_esx-base_8.0.2-0.30.23305546                        | VMware_bootbank_esx-base_8.0.2-0.25.23305545                        |
 | VMware_bootbank_esx-dvfilter-generic-fastpath_8.0.2-0.30.23305546   | VMware_bootbank_esx-dvfilter-generic-fastpath_8.0.2-0.25.23305545   |
 | VMware_bootbank_esx-update_8.0.2-0.30.23305546                      | VMware_bootbank_esx-update_8.0.2-0.25.23305545                      |
 | VMware_bootbank_esx-xserver_8.0.2-0.30.23305546                     | VMware_bootbank_esx-xserver_8.0.2-0.25.23305545                     |
 | VMware_bootbank_esxio_8.0.2-0.30.23305546                           | VMware_bootbank_esxio_8.0.2-0.25.23305545                           |
 | VMware_bootbank_esxio-base_8.0.2-0.30.23305546                      | VMware_bootbank_esxio-base_8.0.2-0.25.23305545                      |
 | VMware_bootbank_esxio-combiner_8.0.2-0.30.23305546                  | VMware_bootbank_esxio-combiner_8.0.2-0.25.23305545                  |
 | VMware_bootbank_esxio-combiner-esxio_8.0.2-0.30.23305546            | VMware_bootbank_esxio-combiner-esxio_8.0.2-0.25.23305545            |
 | VMware_bootbank_esxio-dvfilter-generic-fastpath_8.0.2-0.30.23305546 | VMware_bootbank_esxio-dvfilter-generic-fastpath_8.0.2-0.25.23305545 |
 | VMware_bootbank_esxio-update_8.0.2-0.30.23305546                    | VMware_bootbank_esxio-update_8.0.2-0.25.23305545                    |
 | VMware_bootbank_gc_8.0.2-0.30.23305546                              | VMware_bootbank_gc_8.0.2-0.25.23305545                              |
 | VMware_bootbank_gc-esxio_8.0.2-0.30.23305546                        | VMware_bootbank_gc-esxio_8.0.2-0.25.23305545                        |
 | VMware_bootbank_infravisor_8.0.2-0.30.23305546                      | VMware_bootbank_infravisor_8.0.2-0.25.23305545                      |
 | VMware_bootbank_loadesx_8.0.2-0.30.23305546                         | VMware_bootbank_loadesx_8.0.2-0.25.23305545                         |
 | VMware_bootbank_loadesxio_8.0.2-0.30.23305546                       | VMware_bootbank_loadesxio_8.0.2-0.25.23305545                       |
 | VMware_bootbank_native-misc-drivers_8.0.2-0.30.23305546             | VMware_bootbank_native-misc-drivers_8.0.2-0.25.23305545             |
 | VMware_bootbank_native-misc-drivers-esxio_8.0.2-0.30.23305546       | VMware_bootbank_native-misc-drivers-esxio_8.0.2-0.25.23305545       |
 | VMware_bootbank_trx_8.0.2-0.30.23305546                             | VMware_bootbank_trx_8.0.2-0.25.23305545                             |
 | VMware_bootbank_vdfs_8.0.2-0.30.23305546                            | VMware_bootbank_vdfs_8.0.2-0.25.23305545                            |
 | VMware_bootbank_vds-vsip_8.0.2-0.30.23305546                        | VMware_bootbank_vds-vsip_8.0.2-0.25.23305545                        |
 | VMware_bootbank_vmware-hbrsrv_8.0.2-0.30.23305546                   |                                                                     |
 | VMware_bootbank_vsan_8.0.2-0.30.23305546                            | VMware_bootbank_vsan_8.0.2-0.25.23305545                            |
 | VMware_bootbank_vsanhealth_8.0.2-0.30.23305546                      | VMware_bootbank_vsanhealth_8.0.2-0.25.23305545                      |
 | VMware_locker_tools-light_12.3.5.22544099-23305545                  | VMware_locker_tools-light_12.3.5.22544099-23305545                  |

いつもの通りですが、通常の方はセキュリティパッチのみよりも全体的なバージョンは上なので特段の理由がない場合は通常のパッチを適用します。

#### パッチ適用

以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。ここではstandardを指定します。

``` bash
[.../update] esxcli software profile update -d /vmfs/volumes/datastore1/update/VMware-ESXi-8.0U2b-23305546-depot.zip -p ESXi-8.0U2b-23305546-standard
```

`esxcli software profile update`の実行後しばらくしてから、結果が表示されます。

```
Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
```

#### 再起動と結果確認

コマンドプロンプトから、`reboot`としてESXiを再起動します。

再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU2bとなっているはずです。

{% asset_img esxi6.png 1024 alt %}

または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@localhost:~] vmware -v
VMware ESXi 8.0.2 build-23305546
 ```

## 事後作業

これまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。

## パッチのロールバック

あまり考えたくはありませんが、パッチ適用後、うまく動作しないなどの場合にはロールバックします。ESXiはひとつ前のバージョンに戻せます（アップグレードの場合は戻せない場合があります）。
ESXiホストを再起動し、起動中にShift+’R'キーを押します。

> VMware ESXi を前のバージョンに戻す (1033604)
 <https://kb.vmware.com/s/article/1033604?lang=ja>

 >Hypervisor のプログレス バーの読み込みが開始されたら、Shift+R を押します。(これはバーが表示されたロード後ではなく、ロード中に実行する必要があります。コマンドを実行するタイミングを逃さないよう、"system is preparing to boot" 表示中に Shift+R を繰り返し押すことをお勧めいたします)。

 以下の通り、今動いているビルド番号と前のビルド番号が表示されます。

{% asset_img rollback.png 1024 alt %}

ここでロールバックを選択します。

## 構成情報のバックアップ（任意）

今後、パッチ適用を重ねていきますが、ある時点にロールバックしたいと思った時に、ホスト構成バックアップから戻す必要が出てきます。パッチを当てる度に構成情報のバックアップを取得されることをお勧めします。

参考にするドキュメントはこちらです。

> ESXi ホストの構成のバックアップ方法 (2042141)
 <https://kb.vmware.com/s/article/2042141?lang=ja>

1. SSHでESXiに接続します。
2. ストレージの確実な同期のためのコマンド`vim-cmd hostsvc/firmware/sync_config`を実行します。
3. バックアップコマンド`vim-cmd hostsvc/firmware/backup_config`を実行します。
4. 画面にダウンロードパスが表示されるのでそのURLにブラウザから接続し構成情報をダウンロードします。

``` bash
[root@esxi:~] vim-cmd hostsvc/firmware/sync_config
[root@esxi:~] vim-cmd hostsvc/firmware/backup_config
Bundle can be downloaded at : http://*/downloads/52ce000f-cad4-20c0-078d-a111fa1ad82x/configBundle-esxi.local.tgz
[root@esxi:~]
```

先頭に`http://*/`とありますが、ここはESXiのホスト名またはIPアドレスを指定しブラウザからアクセスします。例えば、`http://192.168.1.1/downloads〜`という具合です。万が一レストアが必要になってしまった場合はバックアップを取得したバージョンのパッチを適用の上、メンテナンスモードに移行してから`vim-cmd hostsvc/firmware/restore_config /your_backup_location/configBundle-esxi.local.tgz`で戻します。バックアップを取得してから既にハードウェア構成が変わっていたりする場合は戻せない場合があります。仮想マシンはデータストアブラウザから再登録する必要があります。詳細は上記VMwareのドキュメントを参照してください。
