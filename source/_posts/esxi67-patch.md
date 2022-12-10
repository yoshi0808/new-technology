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

無償版ESXi（VMware vSphere Hypervisor）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。この記事ではESXi7.0を対象にしています。2022年12月現在、ESXi8.0は発表されていますが、私は当面安定しているESXi7.0を稼働させる予定で、ESXi7.0のパッチ情報を記載していきます。

<!-- more -->

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。Windows10ではOpenSSHがサポートされていますので、{% label primary@オプション機能を追加する %}から{% label primary@OpenSSHクライアント %}を有効にし、コマンドラインから`ssh  root@ESXiのIPアドレス`で接続可能です。

## VMwareのパッチ情報

ESXiのパッチ情報は以下を参照してください。当該ページの左ペインメニューには最新パッチの情報が掲載されていますので、最新のパッチ情報を辿ってください。また、過去のパッチの情報も提供されています。

> VMware ESXi 7.0 Update 3i（2022-12-8発表）
 <https://docs.vmware.com/en/VMware-vSphere/7.0/rn/vsphere-esxi-70u3i-release-notes.html>

## 製品パッチの情報を入手する

ESXiのセットアップ時にCustomer Connectへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

**VMware Customer Connect**にサインインし、{% label primary@製品とエンタイトルメント　アカウント %}メニューから、"製品パッチ"を選択します。
> VMware Customer Connect
 <https://customerconnect.vmware.com/jp>

{% asset_img myvm3.png alt %}

さらに、"ESXi"とバージョンの"7.0"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。以下は7.0U3iの画面です。

{% asset_img myvm2.png alt %}

基本的にESXiは7.0のバージョンのまま修正パッチを適用する場合はこの7.0という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。但し、ESXi7.0の場合はUpdate2,Update3というグループがあり、さらにUpdate3g、Update3iという具合にグループ単位でパッチ毎に末尾の英字が大きくなっていきます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。

## パッチ適用作業

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
 {% label primary@アップロード %}ボタンをクリックし、ダウンロードしたパッチファイルをZIPのままアップロードします。ここの例では{% label primary@ディレクトリの作成 %}ボタンでupdateフォルダを作成し、そこにアップロードします。

5. SSHでESXiにログイン
 ログイン後、パッチをアップロードしたフォルダ（datastore1/update）に移動しアップロードしたパッチファイルが存在するか`ls`で確認します
 ``` bash
  The time and date of this login have been sent to the system logs.

  WARNING:
    All commands run on the ESXi shell are logged and may be included in
    support bundles. Do not provide passwords directly on the command line.
    Most tools can prompt for secrets or accept them from standard input.

  VMware offers supported, powerful system administration tools.  Please
  see www.vmware.com/go/sysadmintools for details.

  The ESXi Shell can be disabled by an administrative user. See the
  vSphere Security documentation for more information.
  [root@esxi:~] cd /vmfs/volumes/datastore1/update
  [root@esxi:~] ls
 ```

6. パッチ適用コマンドを入力します
 新しいドライバやバグフィックス、セキュリティパッチなど含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。ここでは、ESXi7.0Update3gからUpdate3iにアップデートすることを例にします。

 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
[root@esxi2:] esxcli software profile get
(Updated) ESXi-7.0U3g-20328353-standard
   Name: (Updated) ESXi-7.0U3g-20328353-standard
   Vendor: VMware, Inc.
   Creation Time: 2022-09-03T03:53:39
   Modification Time: 2022-12-10T08:23:23
   Stateless Ready: True
 ```

 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します（パッチはフルパス指定が必要です）。
 ``` bash
[root@esxi2] esxcli software sources profile list -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3i-20842708-depot.zi
p
Name                            Vendor        Acceptance Level  Creation Time        Modification Time
------------------------------  ------------  ----------------  -------------------  -----------------
ESXi-7.0U3si-20841705-standard  VMware, Inc.  PartnerSupported  2022-12-08T00:00:00  2022-12-08T00:00:00
ESXi-7.0U3si-20841705-no-tools  VMware, Inc.  PartnerSupported  2022-12-08T00:00:00  2022-11-24T01:25:32
ESXi-7.0U3i-20842708-standard   VMware, Inc.  PartnerSupported  2022-12-08T00:00:00  2022-12-08T00:00:00
ESXi-7.0U3i-20842708-no-tools   VMware, Inc.  PartnerSupported  2022-12-08T00:00:00  2022-11-24T05:06:48
 ```

今回は4つのprofileが存在しています。VMWare Toolsを含まないProfileであるno-tools、VMWare Tools付きのstandard版、それとU3siがセキュリティパッチのみ、U3iがセキュリティパッチを含む一般的なエンハンスとなります。
VMWare Toolsを使う一般的なユーザーはNo Tools版を選択しないので除外します。
以下のように、セキュリティパッチのみのプロファイルは全て一般的なエンハンスに包含されていますので、特に互換性に拘るのでなければ不具合の修正も含んだスタンダードであるESXi-7.0U3i-20842708-standardを適用するのがおすすめです。

| ESXi-7.0U3si-20841705-standard                                    | ESXi-7.0U3i-20842708-standard                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| VMware_bootbank_esx-base_7.0.3-0.60.20841705                      | VMware_bootbank_esx-base_7.0.3-0.65.20842708                      |
| VMware_bootbank_trx_7.0.3-0.60.20841705                           | VMware_bootbank_trx_7.0.3-0.65.20842708                           |
| VMware_bootbank_vsanhealth_7.0.3-0.60.20841705                    | VMware_bootbank_vsanhealth_7.0.3-0.65.20842708                    |
| VMware_bootbank_cpu-microcode_7.0.3-0.60.20841705                 | VMware_bootbank_cpu-microcode_7.0.3-0.65.20842708                 |
| VMware_bootbank_crx_7.0.3-0.60.20841705                           | VMware_bootbank_crx_7.0.3-0.65.20842708                           |
| VMware_bootbank_vsan_7.0.3-0.60.20841705                          | VMware_bootbank_vsan_7.0.3-0.65.20842708                          |
| VMware_bootbank_native-misc-drivers_7.0.3-0.60.20841705           | VMware_bootbank_native-misc-drivers_7.0.3-0.65.20842708           |
| VMware_bootbank_esx-xserver_7.0.3-0.60.20841705                   | VMware_bootbank_esx-xserver_7.0.3-0.65.20842708                   |
| VMware_bootbank_esx-dvfilter-generic-fastpath_7.0.3-0.60.20841705 | VMware_bootbank_esx-dvfilter-generic-fastpath_7.0.3-0.65.20842708 |
| VMware_bootbank_gc_7.0.3-0.60.20841705                            | VMware_bootbank_gc_7.0.3-0.65.20842708                            |
| VMware_bootbank_esx-ui_2.1.1-20188605                             | VMware_bootbank_esx-ui_2.1.1-20188605                             |
| VMware_bootbank_vdfs_7.0.3-0.60.20841705                          | VMware_bootbank_vdfs_7.0.3-0.65.20842708                          |
| VMware_bootbank_bmcal_7.0.3-0.60.20841705                         | VMware_bootbank_bmcal_7.0.3-0.65.20842708                         |
| VMware_bootbank_esxio-combiner_7.0.3-0.60.20841705                | VMware_bootbank_esxio-combiner_7.0.3-0.65.20842708                |
| VMware_bootbank_loadesx_7.0.3-0.60.20841705                       | VMware_bootbank_loadesx_7.0.3-0.65.20842708                       |
| VMware_bootbank_esx-update_7.0.3-0.60.20841705                    | VMware_bootbank_esx-update_7.0.3-0.65.20842708                    |
| VMware_locker_tools-light_12.1.0.20219665-20841705                | VMware_locker_tools-light_12.1.0.20219665-20841705                |
|                                                                   | VMW_bootbank_ntg3_4.1.8.0-4vmw.703.0.65.20842708                  |

以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。ここではstandardを指定します。
 ``` bash
  [root@esxi:~] esxcli software profile update -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3i-20842708-depot.zip -p ESXi-7.0U3i-20842708-standard
 ```
 1. `esxcli software profile update`の実行後しばらくしてから、結果が表示されます。
 ```
Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true...
 ```

2. コマンドプロンプトから、`reboot`としてESXiを再起動します。

3. 再起動完了後、ESXiにログインします。画面デザインが大きく変わっています。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU3iとなっているはずです。

 - ESXi7.0
  {% asset_img esxi5.png alt %}

  または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@esxi2:~] vmware -v
VMware ESXi 7.0.3 build-20842708
 ```

4. 最後にこれまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。

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
