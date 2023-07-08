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

無償版ESXi（VMware vSphere Hypervisor）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。この記事ではESXi7.0、8.0を対象にしています。

<!-- more -->

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。Windows10ではOpenSSHがサポートされていますので、{% label primary@オプション機能を追加する %}から{% label primary@OpenSSHクライアント %}を有効にし、コマンドラインから`ssh  root@ESXiのIPアドレス`で接続可能です。Windows11ではOpenSSHがデフォルトで導入されています。

## VMwareのパッチ情報

ESXiのパッチ情報は以下を参照してください。当該ページの左ペインメニューには最新パッチの情報が掲載されていますので、最新のパッチ情報を辿ってください。また、過去のパッチの情報も提供されています。


> VMware ESXi 8.0 Update 1a （2023-6-2発表）
 <https://docs.vmware.com/en/VMware-vSphere/8.0/rn/vsphere-esxi-80u1a-release-notes/index.html>

　主に不具合修正となっています。主としてvSANの不具合の対応ということで個人向けにはあまり関連しそうなところはありませんが、Mellanoxカード（Connect X-4,5,6）に関するパラメータがリセットされる（デフォルト値以外は非推奨）という記載があります。

> VMware ESXi 7.0 Update 3n（2023-7-6発表）
 <https://docs.vmware.com/en/VMware-vSphere/7.0/rn/vsphere-esxi-70u3n-release-notes.html>

 NICにおいてハードウェアラージ受信 オフロード (LRO) 機能の不具合を修正するなどの記載があります。

## 製品パッチの情報を入手する

ESXiのセットアップ時にCustomer Connectへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

**VMware Customer Connect**にサインインし、{% label primary@製品とエンタイトルメント　アカウント %}メニューから、"製品パッチ"を選択します。
> VMware Customer Connect
 <https://customerconnect.vmware.com/jp>

{% asset_img myvm3.png alt %}

さらに、"ESXi"とバージョンの"7.0"または"8.0"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。以下は7.0U3mの画面です。

{% asset_img myvm2.png alt %}

基本的にESXiは7.0のバージョンのまま修正パッチを適用する場合はこの7.0という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。但し、ESXi7.0の場合はUpdate2,Update3というグループがあり、さらにUpdate3k、Update3lという具合にグループ単位でパッチ毎に末尾の英字が大きくなっていきます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。

## 事前準備（ESXi7,8共通）

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

## ESXiのパッチ適用

パッチ適用のコマンドは7.0、8.0とで違いはありません。ここでは直近バージョンからのパッチ適用のための具体的なコマンドを記載しています。

### ESXi8.0のパッチ適用

#### 現在稼働中のプロファイルを確認
 新しいドライバやバグフィックス、セキュリティパッチなど含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。ここでは、ESXi8.0Update1からUpdate1aにアップデートすることを例にします。

 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
[root@localhost:~] esxcli software profile get
ESXi-8.0U1-21495797-standard
   Name: ESXi-8.0U1-21495797-standard
   Vendor: VMware, Inc.
   Creation Time: 2023-04-29T21:45:50
   Modification Time: 2023-06-03T09:26:33
   Stateless Ready: False
 ```

 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します（パッチはフルパス指定が必要です）。
 ``` bash
 [root@localhost:/vmfs/volumes/datastore1/update] esxcli software sources profile list -d /vmfs/volumes/dat
astore1/update/VMware-ESXi-8.0U1a-21813344-depot.zip
Name                           Vendor        Acceptance Level  Creation Time        Modification Time
-----------------------------  ------------  ----------------  -------------------  -----------------
ESXi-8.0U1a-21813344-standard  VMware, Inc.  PartnerSupported  2023-06-01T00:00:00  2023-06-01T00:00:00
ESXi-8.0U1a-21813344-no-tools  VMware, Inc.  PartnerSupported  2023-06-01T00:00:00  2023-05-24T06:02:20
```

 VMWare Toolsを含まないProfileであるno-tools、VMWare Tools付きのstandard版となります。VMWare Toolsを使う一般的なユーザーはStandardを選択することになります。

#### パッチ適用

以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。ここではstandardを指定します。

``` bash
[root@localhost:/vmfs/volumes/datastore1/update] esxcli software profile update -d /vmfs/volumes/datastore
1/update/VMware-ESXi-8.0U1a-21813344-depot.zip -p ESXi-8.0U1a-21813344-standard
```

`esxcli software profile update`の実行後しばらくしてから、結果が表示されます。

```
Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true
```

#### 再起動と結果確認

コマンドプロンプトから、`reboot`としてESXiを再起動します。

再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU1aとなっているはずです。

{% asset_img esxi6.png 1024 alt %}

または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@localhost:~] vmware -v
VMware ESXi 8.0.1 build-21813344
 ```

### ESXi7.0のパッチ適用

#### 現在稼働中のプロファイルを確認
 新しいドライバやバグフィックス、セキュリティパッチなど含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。ここでは、ESXi7.0Update3mからUpdate3nにアップデートすることを例にします。

 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
 [root@esxi2:/vmfs/volumes/datastore1/update] esxcli software profile get
(Updated) ESXi-7.0U3m-21686933-standard
   Name: (Updated) ESXi-7.0U3m-21686933-standard
   Vendor: VMware, Inc.
   Creation Time: 2023-06-18T09:50:05
   Modification Time: 2023-07-07T09:43:39
   Stateless Ready: True
   Description:
 ```

 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します（パッチはフルパス指定が必要です）。
 ``` bash
[root@esxi2:/vmfs/volumes/datastore1/update] esxcli software sources profile list -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3n-21930508-depot.zip
Name                           Vendor        Acceptance Level  Creation Time        Modification Time
-----------------------------  ------------  ----------------  -------------------  -----------------
ESXi-7.0U3n-21930508-standard  VMware, Inc.  PartnerSupported  2023-07-06T00:00:00  2023-07-06T00:00:00
ESXi-7.0U3n-21930508-no-tools  VMware, Inc.  PartnerSupported  2023-07-06T00:00:00  2023-06-15T12:39:40
 ```

 VMWare Toolsを含まないProfileであるno-tools、VMWare Tools付きのstandard版となります。VMWare Toolsを使う一般的なユーザーはNo Tools版を選択しないので除外します。

#### パッチ適用

以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。ここではstandardを指定します。

``` bash
 [root@esxi:~] esxcli software profile update -d /vmfs/volumes/datastore1/update/VMware-ESXi-7.0U3n-21930508-depot.zip -p ESXi-7.0U3n-21930508-standard
```

`esxcli software profile update`の実行後しばらくしてから、結果が表示されます。

```
Update Result
   Message: The update completed successfully, but the system needs to be rebooted for the changes to be effective.
   Reboot Required: true
```

#### 再起動と結果確認

コマンドプロンプトから、`reboot`としてESXiを再起動します。

再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください。今回はU3nとなっているはずです。

{% asset_img esxi5.png 1024 alt %}

または、sshでESXiに接続し、`vmware -v`を実行し確認します。

 ``` bash
[root@esxi2:~] vmware -v
VMware ESXi 7.0.3 build-21930508
 ```

## 事後作業（ESXi7,8共通）

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
