---
title: VMware ESXiを8.0にアップグレードする
date: 2023-6-18 07:00:00
tags:
  - ESXi
categories:
  - Software
---
{% asset_img title.png 1024 alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、ESXi8.0U1にアップグレードします。

<!-- more -->

## ESXiのアップグレード

まず正式なアップグレードに関するドキュメントがVMwareより提供されており、こちらでポイントを確認します。アップデートとアップグレードとは異なります。
ESXiのバージョン体系は、"x"."y" update "z" ビルド番号 という並びで表現されます。
- アップグレードは、前2桁（x,y）を上げることを指します。
- アップデートは、前2桁が変わりません。それ以降の数字があるケース、またはUpdate"z"などの形式があります。Update2を省略してU2、さらにU2a、U2cなど英数字が上がっていきます。

**アップデート**によってこれまで動いていたハードウェアが動かなくなるという事は大々的にはおきません（ドライバーの更新によって認識しなくなったりうまく動作しないという一般的な理由はあります）。**アップグレード**ではハードウェアのサポート対象の見直しが入ります。

> ESXiのアップグレード
 <https://docs.vmware.com/jp/VMware-vSphere/8.0/vsphere-esxi-80-upgrade-guide.pdf>

例によってVMwareのマニュアルは法人向けにvCenter Serverを中心に記載されているのでポイントを無償版ESXiに絞ります。

- VMWare互換性ガイドでアップグレードが可能か確認する（P8）
- ESXi8のハードウェア要件（P17）
- アップグレード後はDiskのパーティション要件にてロールバック不可（P19）
- esxcliコマンドまたはISOブートからのアップグレードの2種類がある（P37,P70）
- アップグレードには新たにESXi8.0向けの（無償版ESXiの）ライセンスを登録する（P87）
- 仮想マシンとVMware Toolsのアップグレード（P11）

注意点は以下の通りです。
> esxcliコマンドを使用してアップグレードすると、古いバージョンのESXiは新しいVIBのインストールを実行するため、署名が保存されずセキュアブートは実行できません。ISOを使用してアップグレードすると、新しいVIBは署名を保存できます。（P88）

上記の注意点の通り、UEFIのセキュアブートで稼働しているESXiのバージョンアップにはISOを使用してアップグレードすべきと読めます。一方、セキュアブートでなければ、`esxcli software profile update --depot=<depot_location> --profile=<profile_name> `のコマンドでアップグレード可能です。詳細は、「{% post_link esxi67-patch %}」の記事を参照してください。但し、ESXi8.0におけるハードウェア互換性が維持できるか慎重に確認するためには、ISOでのアップグレードを検討してください。

VMware互換性ガイドは個人向けのハードウェアが殆ど列挙されておらずチェックが困難なのが実態です。ハードウェアが準拠しているかどうかのチェックについては後述します。

また、上記マニュアルには注意点としての記載がありませんが、スナップショットを取得していない状態でアップグレードされる事をお勧めします。

ESXi8にアップグレードする例を記載しています。厳密なアップグレードパスについては以下を確認してください。
{% asset_img upgradepath.png 1024 alt %}

<https://interopmatrix.vmware.com/Upgrade?productId=1363>


> vCenter Server Back-in-time release 
 <https://kb.vmware.com/s/article/67077#vCenterServer_7.0.x_to_8.0_upgrade_matrix>


## 仮想マシンのバックアップ（任意）

バージョンアップの前には仮想マシンのバックアップを別の筐体またはメディアに取得される事をお勧めします。「{% post_link esxi-backup %}」の記事を参照してください。ghettoVCBを使ったバックアップでは、ESXiにsshした上で、次のコマンドで全ての仮想マシンのバックアップ取得が可能です。`/bin/sh ./ghettoVCB.sh -a`

## アップグレード対象のESXi8.0を確認する

ESXiのISOインストーラのダウンロードは、2023年6月1日時点ではESXi8.0 Update1（8.0U1a）となっています。

>VMware vSphere Hypervisor 8.0 ダウンロード センター(※VMware Customer Connectへログインが必要です)
 <https://customerconnect.vmware.com/jp/evalcenter?p=free-esxi8>

## ESXi8.0インストールメディア（USB）の作成

ここではUSBメモリを用意し、ESXi8.0のインストーラーをセットアップします。
事前にハードウェア互換リストを元に互換性があるかチェックしたいところですが、実際に個人向けのハードウェアは殆ど列挙されていません。

> VMware Compatibility Guide
 <https://www.vmware.com/resources/compatibility/search.php>

以前は検証のためにUSB上にESXi7.0をセットアップできましたが、 ESXi8からはUSBへのテストセットアップできなくなっています。ハードウェアが準拠せずアップグレード後起動しない、NICが利用できない可能性があるため、仮想マシンのバックアップを確保される事をお勧めします。なお、個人向けのハードウェアで関係するところは、Mellanox Connect X-3がサポート対象外となりました。Mellanoxユーザーとしては、Connect X-4/X-5を使う事になるでしょう。

### ESXi8.0 インストーラーのダウンロード

以下からISOをダウンロードします。

<https://customerconnect.vmware.com/jp/web/vmware/evalcenter?p=free-esxi8>

ダウンロードは、”VMware vSphere Hypervisor (ESXi ISO) image”をダウンロードします。

また、製品のライセンスキーが表示されていますので、メモを取っておいてください。

### Rufusによるisoメディアの作成

以下のサイトからRufusをWindowsでダウンロードし実行します。
 > Rufus
 <https://rufus.ie/ja/>

 以下のオプションでUSBメディアにESXi8のインストーラーを書き込みます。

 {% asset_img rufus1.png 480 alt %}
 UEFIのセキュアブートに対応させるためにはGPTとUEFIを選択してください。

## ESXi8.0へのアップグレード

以下の動画を参考にしてください。特に難しいものはありません。途中、新規インストールかアップグレードか選択する箇所があります。この動画では新規インストールを選択していますが、アップグレードを選んでください。

> <https://www.youtube.com/watch?v=eiZn54GPfzI>
{% asset_img install.png 1024 alt %}

アップグレードが終了し、再起動する際にはUSBメディアは外してください。

無事再起動したら管理画面にログインします。
sshでESXiに接続し、`esxcli system version get`を実行し確認します。

``` bash
[root@localhost:~] esxcli system version get
   Product: VMware ESXi
   Version: 8.0.1
   Build: Releasebuild-21495797
   Update: 1
   Patch: 0
[root@localhost:~]
```

管理画面でもESXi8になっていることは確認できますし、`vmware -l`コマンドでも確認できますが、Versionとビルド番号で見るには上記コマンドを使います。

## 後処理
無事アップグレードが成功したら、以下の作業を行います。

1. ESXi8.0のライセンス登録
 ESXiにログイン後、左ペインメニューの{% label primary@ホスト %}-{% label primary@管理 %}から{% label primary@ライセンスタブ %}を選択し、{% label primary@ライセンスの割り当て %}でダウンロード時に控えたライセンスキーを登録します。
2. ESXi8.0の最新パッチ適用
 ESXiのパッチ適用については、「{% post_link esxi67-patch %}」を参照してください。
3. ESXi8.0の構成情報のバックアップ（任意）

## 仮想マシンのアップグレード（任意）

ESXiのバージョンアップ後、仮想マシンのバージョンをアップグレードできます。

アップグレードしたESXi8.0VMware Toolsよりも新しいバージョンがある場合は以下のように表示されます。
{% asset_img vmwaretools2.png 640 alt %}

この場合はWebUIで左ペインの{% label primary@仮想マシン %}で対象仮想マシンを選択し、{% label primary@アクション %}メニュー→{% label primary@ゲストOS %}から{% label primary@VMware Toolsのアップグレード %}を実行します。

詳細は以下の内容を参照してください。

> VMware Tools のアップグレード
 <https://docs.vmware.com/jp/VMware-Tools/11.3.0/com.vmware.vsphere.vmwaretools.doc/GUID-A2491004-1C67-4E14-B47B-807E20C19108.html>

VMware Toolsを最新にした後、仮想マシンハードウェアをアップグレードすることができます。ただし、下記のドキュメントに注意書きがある通り、新しいハードウェアバージョンの付属機能が必要な場合のみ実行することとあり、これはESXiのアップグレードに対して必須事項ではありません。

> 仮想マシンの互換性の手動アップグレード
 <https://docs.vmware.com/jp/VMware-vSphere/7.0/com.vmware.vsphere.vm_admin.doc/GUID-60768C2F-72E1-42E0-8A17-CA76849F2950.html>


{% note warning %}
- 仮想マシン ハードウェアをアップグレードすると、一部のアプリケーションまたはオペレーティング システムが適切に動作しなくなることがあります。ハードウェア バージョンのアップグレードは、新しいハードウェア バージョンの付属機能が必要な場合のみ実行します。
- Microsoft Windows 仮想マシンで VMware Tools をアップグレードする前に互換性をアップグレードすると、仮想マシンのネットワーク設定が失われることがあります。
{% endnote %}

この操作は以下の通りWebUIで左ペインの{% label primary@仮想マシン %}で対象仮想マシンを選択し、{% label primary@アクション %}メニューから{% label primary@仮想マシンの互換性のアップグレード %}を実行します。

{% asset_img upgrade-vm.png 800 alt %}

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
