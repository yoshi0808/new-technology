---
title: VMware ESXiにパッチを適用する
tags:
  - ESXi
categories:
  - Software
date: 2020-06-14 22:19:20
---

<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、VMwareのサイトから製品パッチに関する情報を入手し、ESXi上でパッチを適用します。この記事ではESXi6.7、7.0を対象にしています。

<!-- more -->

## パッチ適用に必要なもの

SSHでESXiに接続し、コマンドラインでパッチを適用します。昔から有名なのはTera Termですが、Windows10ではOpenSSHがサポートされていますので、{% label primary@オプション機能を追加する %}から{% label primary@OpenSSHクライアント %}を有効にし、コマンドラインから`ssh  root@ESXiのIPアドレス`で接続可能です。

## VMwareのパッチ情報

ESXiのパッチ情報は以下を参照してください。当該ページの左ペインメニューには最新パッチの情報が掲載されていますので、最新のパッチ情報を辿ってください。また、過去のパッチの情報も提供されています。
> VMware ESXi 6.7、パッチ リリース ESXi670-202201001
 <https://docs.vmware.com/jp/VMware-vSphere/6.7/rn/esxi670-202201001.html>

> VMware ESXi 7.0 Update 3c
 <https://docs.vmware.com/en/VMware-vSphere/7.0/rn/vsphere-esxi-70u3c-release-notes.html>

## 製品パッチの情報を入手する

ESXiのセットアップ時にCustomer Connectへの登録を行い、個人向けvSphere Hypervisorのライセンス（無償）を入手されている事を前提にしています。

**VMware Customer Connect**にサインインし、{% label primary@製品とエンタイトルメント　アカウント %}メニューから、"製品パッチ"を選択します。
> VMware Customer Connect
 <https://customerconnect.vmware.com/jp>

{% asset_img myvm3.png alt %}

さらに、"ESXi"とバージョンの"6.7"または"7.0"を選択し"検索"ボタンをクリックすると、パッチの一覧が表示されます。

{% asset_img myvm2.png alt %}

基本的にESXiは7.0のバージョンのまま修正パッチを適用する場合はこの7.0という2桁の数字は変わりません。この数字が変わる更新をアップグレードと呼びます。それ以外の小さい更新をパッチまたはアップデートと呼びます。VMwareのパッチは累積パッチとなるため、最新のパッチを適用するだけでよく、古いパッチの適用は必要ありません。ここでは最新版のパッチをダウンロードします。

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
 アップロードボタンをクリックし、ダウンロードしたパッチファイルをアップロードします。

5. SSHでESXiにログイン
 ログイン後、パッチをアップロードしたフォルダ（*Datastore/DirectoryName*）に移動しアップロードしたパッチファイルが存在するか`ls`で確認します
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
  [root@esxi:~] cd /vmfs/volumes/Datastore/DirectoryName
  [root@esxi:~] ls
 ```

6. パッチ適用コマンドを入力します
 パッチのコマンドは2種類あります。パッチだけであればvib updateで可能ですが、新しいドライバなども含めたprofileとして整合性が取れたvibのアップデートはprofile updateを実行します。丁寧にprofileを指定する方法が一般的です。ここでは、2022年1月27日に発表されたESXi7.0Update3cにアップデートすることを例にします。
 - esxcle software profile update（推奨）
 現在の実行中のprofileを確認します。`esxcli software profile get`
 ``` bash
[root@esxi:~] esxcli software profile get
(Updated) ESXi-7.0U2a-17867351-standard
 ```
 一般的にはバージョンの最後に"-standard"の文字が付いています。standard版がインストールされている事を示します。
 次に、パッチファイルに登録されているprofileを確認します。
 ``` bash
 [root@esxi] esxcli software sources profile list -d /vmfs/volumes/*Datastore/DirectoryName*/VMware-ESXi-7.0U3c-19193900-depot.zip
Name                           Vendor        Acceptance Level  Creation Time        Modification Time
-----------------------------  ------------  ----------------  -------------------  -----------------
ESXi-7.0U3c-19193900-standard  VMware, Inc.  PartnerSupported  2022-01-18T00:00:00  2022-01-18T00:00:00
ESXi-7.0U3c-19193900-no-tools  VMware, Inc.  PartnerSupported  2022-01-18T00:00:00  2022-01-12T00:03:42
 ```
 以下のようにパッチファイルのzipをフルパスで指定し、VMwareのパッチ情報にあるプロファイル名を指定しパッチを適用します。
 ``` bash
  [root@esxi:~] esxcli software profile update -d /vmfs/volumes/*Datastore/DirectoryName*/VMware-ESXi-7.0U3c-19193900-depot.zip -p ESXi-7.0U3c-19193900-standard
 ```

 - esxcli software vib update（ご参考）
 インストール済みのvibのパッチであればこちらでも実施可能です。
 ``` bash
 [root@esxi:~] esxcli software vib update -d "/vmfs/volumes/Datastore/DirectoryName/ESXi670-202006001.zip"
 ```

7. 実行後しばらくしてから、たくさんの更新結果としての文字の羅列が一気に表示され、再びコマンドプロンプトになるので、`# reboot`としてESXiを再起動します。

8. 再起動完了後、ESXiにログインします。左ペインメニューの"ホスト"をクリックし、バージョンの表記に今回パッチを当てたビルド番号が表示されている事を確認してください
 {% asset_img esxi4.png alt %}

   ESXi7.0は上記画面ではビルド番号までは判明しません。sshでESXiに接続し、`esxcli system version get`を実行し確認します。

   ``` bash
   [root@esxi:~] esxcli system version get
   Product: VMware ESXi
   Version: 7.0.3
   Build: Releasebuild-19193900
   Update: 3
   Patch: 20
   ```

8. 最後にこれまで実施してきたメンテナンス準備とは反対の作業をします。メンテナンスモードの終了・SSHの無効化・仮想マシンの起動と続けます。

## パッチのロールバック

あまり考えたくはありませんが、パッチ適用後、うまく動作しないなどの場合にはロールバックします。ESXiはひとつ前のバージョンに簡単に戻すことができます（2つ前に戻すのはとても大変です）。
ESXiホストを再起動し、起動中にShift+’R'キーを押すことによって1つ前のバージョンに戻せます。

> VMware ESXi を前のバージョンに戻す (1033604)
 <https://kb.vmware.com/s/article/1033604?lang=ja>

 >Hypervisor のプログレス バーの読み込みが開始されたら、Shift+R を押します。(これはバーが表示されたロード後ではなく、ロード中に実行する必要があります。コマンドを実行するタイミングを逃さないよう、"system is preparing to boot" 表示中に Shift+R を繰り返し押すことをお勧めいたします)。

 以下のように、今動いているビルド番号と前のビルド番号が表示されます。

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
先頭に`http://*/`とありますが、ここはESXiのホスト名またはIPアドレスを指定しブラウザからアクセスします。例えば、`http://192.168.1.1/downloads〜`という具合です。万が一レストアが必要になってしまった場合はESXiをクリーンインストール後、バックアップを取得したバージョンのパッチを適用の上、メンテナンスモードに移行してから`vim-cmd hostsvc/firmware/restore_config /your_backup_location/configBundle-esxi.local.tgz`で戻します。仮想マシンはデータストアブラウザから再登録する必要があります。詳細は上記VMwareのドキュメントを参照してください。
