---
title: VMware ESXiを6.7から7.0にアップグレードする
date: 2021-12-25 07:15:25
tags:
  - ESXi
categories:
  - Software
---
{% asset_img title.png 1024 alt %}
<p class="onepoint">この記事で実現すること</p>

無償版ESXi（VMware vSphere Hypervisor）について、ESXi6.7からESXi7.0にアップグレードします。ここではUEFI（セキュアブート）で構成されているESXiを対象とし、できるだけ安全にアップグレードを行います。

<!-- more -->

## ESXiのアップグレード

まず正式なアップグレードに関するドキュメントがVMwareより提供されており、こちらでポイントを確認します。アップデートとアップグレードとは異なります。
ESXiのバージョン体系は、"x"."y" update "z" ビルド番号 という並びで表現されます。
- アップグレードは、前2桁（x,y）を上げることを指します。
- アップデートは、前2桁が変わりません。それ以降の数字があるケース、またはUpdate"z"などの形式があります。Update2を省略してU2、さらにU2a、U2cなど英数字が上がっていきます。

アップデートによってこれまで動いていたハードウェアが動かなくなるという事は大々的にはおきません（ドライバーの更新によって認識しなくなったりうまく動作しないという一般的な理由はあります）。アップグレードではハードウェアのサポート対象の見直しが入ります。

> ESXiのアップグレード
 <https://docs.vmware.com/jp/VMware-vSphere/7.0/vsphere-esxi-70-upgrade-guide.pdf>

例によってVMwareのマニュアルは法人向けにvCenter Serverを中心に記載されているのでポイントを無償版ESXiに絞ります。

- VMWare互換性ガイドでアップグレードが可能か確認する（P8）
- バージョン6.5または6.7から7.0にバージョンアップ可能（P9）
- ESXi7.0にアップグレードするとダウングレードできない（P15）
- esxcliコマンドまたはISOブートからのアップグレードの2種類がある（P38,P64）
- アップグレードには新たにESXi7.0向けの（無償版ESXiの）ライセンスを登録する（P80）
- 仮想マシンとVMware Toolsのアップグレード（P12）

注意点は以下の通りです。
> esxcliコマンドを使用してアップグレードすると、古いバージョンのESXiは新しいVIBのインストールを実行するため、署名が保存されずセキュアブートは実行できません。ISOを使用してアップグレードすると、新しいVIBは署名を保存できます。（P80）

上記の注意点の通り、UEFIのセキュアブートで稼働しているESXiのバージョンアップにはISOを使用してアップグレードすべきと読めます。一方、セキュアブートでなければ、`esxcli software profile update --depot=<depot_location> --profile=<profile_name> `のコマンドでアップグレード可能です。（パッチ適用のように`esxcli software vib update`ではありません。）

VMware互換性ガイドは個人向けのハードウェアが殆ど列挙されておらずチェックが困難なのが実態です。ハードウェアが準拠しているかどうかのチェックについては後述します。

また、上記マニュアルには注意点としての記載がありませんが、スナップショットを取得していない状態でアップグレードされる事をお勧めします。

この記事はESXi6.7からESXi7.0にアップグレードする例を記載しています。厳密なアップグレードパスについては以下を確認してください。
{% asset_img upgradepath.png 1024 alt %}

> VMware Product Interoperability Matrix
 <https://interopmatrix.vmware.com/Upgrade?productId=1>

※ESXi7.0U3は2021/12/25時点現在は提供中止となっています。


## 仮想マシンのバックアップ（任意）

バージョンアップの前には仮想マシンのバックアップを別の筐体またはメディアに取得される事をお勧めします。「{% post_link esxi-backup %}」の記事を参照してください。ghettoVCBを使ったバックアップでは、ESXiにsshした上で、次のコマンドで全ての仮想マシンのバックアップ取得が可能です。`/bin/sh ./ghettoVCB.sh -a`

## ESXi6.7の構成情報のバックアップ（任意）

アップグレードで何かトラブルがあった場合、既存のESXi6.7に戻すことになります。構成が単純であれば再インストール後手動で再設定することになりますが、迅速に構成を再現するため、システム構成をバックアップすることをお勧めします。構成情報はESXiの前2桁のバージョンとビルド番号が一致していなければ戻すことはできません。

参考にするドキュメントはこちらです。

> ESXi ホストの構成のバックアップ方法 (2042141)
 <https://kb.vmware.com/s/article/2042141?lang=ja>

1. SSHを有効にする
 ESXiの左ペインの{% label primary@ホストー管理 %}から、"サービス"のタブをクリックし、"TSM-SSH"を選択し"起動"ボタンをクリックし、SSHを有効にします。
 {% asset_img esxi1.png alt %}
2. SSHクライアントでESXiに接続します（Windows10では{% label primary@オプション機能を追加する %})からOpenSSH クライアントをインストールできます）
2. ストレージの確実な同期のためのコマンド`vim-cmd hostsvc/firmware/sync_config`を実行します。
3. バックアップコマンド`vim-cmd hostsvc/firmware/backup_config`を実行します。
4. 画面にダウンロードパスが表示されるのでそのURLにブラウザから接続し構成情報をダウンロードします。

``` bash
[root@esxi:~] vim-cmd hostsvc/firmware/sync_config
[root@esxi:~] vim-cmd hostsvc/firmware/backup_config
Bundle can be downloaded at : http://*/downloads/52ce000f-cad4-20c0-078d-a111fa1ad82x/configBundle-esxi.local.tgz
[root@esxi:~]
```
先頭に`http://*/`とありますが、ここはESXiのホスト名またはIPアドレスを指定しブラウザでアクセスします。例えば、`http://192.168.1.1/downloads〜`という具合です。万が一レストアが必要になってしまった場合はESXi6.7をクリーンインストール後、バックアップを取得したバージョンのパッチを適用の上、メンテナンスモードに移行してから`vim-cmd hostsvc/firmware/restore_config /backup_location/configBundle-esxi.local.tgz`で戻します。仮想マシンはデータストアブラウザから再登録する必要があります。詳細は上記VMwareのドキュメントを参照してください。

## アップグレード対象のESXi7.0を確認する

ESXiのISOインストーラをダウンロードは、2022年2月6日時点ではESXi7.0 Update3cとなっています。

>VMware vSphere Hypervisor 7.0 Update3c ダウンロード センター(※VMware Customer Connectへログインが必要です)
 <https://customerconnect.vmware.com/jp/web/vmware/evalcenter?p=free-esxi7>

## ESXi6.7のダウングレード（ご参考）

（この章は、ESXi6.7からESXi7.0Update2aへのアップグレード時にエラーが発生するケースがあり記載しています）

ESXi6.7で運用されている方は最新パッチの適用がなされているかと思います。ESXi6.7の最新パッチはESXi670-202111001でリリース日は2021年11月23日です。一方、ESXi7.0Update2aのリリース日は2021年4月29日です。

結論から書きますが、この日付が逆転していることでESXi6.7からESXi7.0へのアップグレードが行えません。

{% asset_img err.png 1024 alt %}

`VMW_bootbank_vmkusb_0.1-4vmw.670.3.159.18828794`と依存関係の問題があるとのことで、調べたところ、ESXi6.7の最新パッチでした。

対策としてESXi6.7のひとつ前のパッチリリースに戻すことを検討します。ESXiホストを再起動し、起動中にShift+’R'キーを押すことによって1つ前のバージョンに戻せます。

> VMware ESXi を前のバージョンに戻す (1033604)
 <https://kb.vmware.com/s/article/1033604?lang=ja>

 >Hypervisor のプログレス バーの読み込みが開始されたら、Shift+R を押します。(これはバーが表示されたロード後ではなく、ロード中に実行する必要があります。コマンドを実行するタイミングを逃さないよう、"system is preparing to boot" 表示中に Shift+R を繰り返し押すことをお勧めいたします)。

 私の環境では以下のように表示されました。

{% asset_img rollback.png 1024 alt %}

戻す対象のビルド番号は17700523と表示されています。これは、Patch Release ESXi670-202103001であり、2021年3月18日にリリースされているESXi6.7の一つ前のパッチリリースです。これはリリース日付が逆転しておらず、うまくいきそうです。ここでロールバックを実行します。

## ESXi7.0インストールメディア（USB）の作成

ここではUSBメモリを用意し、ESXi7.0のインストーラーをセットアップします。
事前にハードウェア互換リストを元に互換性があるかチェックしたいところですが、実際に個人向けのハードウェアは殆ど列挙されていません。

> VMware Compatibility Guide
 <https://www.vmware.com/resources/compatibility/search.php>

運まかせでアップグレードを実行するのは勇気が要ります。また、ESXi7.0にアップグレードした後はダウングレードできません。そこで、**32GBのUSBインストールメディア自身にESXi7.0をクリーンインストールし、検証する方法をお勧めします。**
つまり、USBメディアにインストールするISOイメージをセットアップし、マシンブートしセットアップを開始しますが、実際のセットアップはそのUSBをフォーマットしてUSB上にESXi7.0を新規でセットアップするというものです。フォーマットしてしまったらセットアップが動かなくなりそうですが、インストーラは最初にモジュールを全て読み込むのでこの方法が可能になります。これで既存の環境を壊さず、そのハードウェアにESXi7.0が導入できるかテストできます。もちろん、正式なセットアップをするためには再度ISOのインストーラーをUSBにコピーする必要があります。

### ESXi7.0 インストーラーのダウンロード

以下からISOをダウンロードします。

<https://customerconnect.vmware.com/jp/web/vmware/evalcenter?p=free-esxi7>

ダウンロードは、”VMware vSphere Hypervisor (ESXi ISO) image”をダウンロードします。

また、製品のライセンスキーが表示されていますので、メモを取っておいてください。

### Rufusによるisoメディアの作成

以下のサイトからRufusをWindowsでダウンロードし実行します。
 > Rufus
 <https://rufus.ie/ja/>

 Rufusの最新バージョンは3.17です。以下のオプションでUSBメディアにESXi7.0のインストーラーを書き込みます。

 {% asset_img rufus1.png 480 alt %}
 UEFIのセキュアブートに対応させるためにGPTとUEFIを選択してください。

## ESXi7.0のテストインストール

ESXi6.7がインストールされているハードウェアにUSBを挿しUSBブートします。

> <https://www.youtube.com/watch?v=eiZn54GPfzI>
{% asset_img install.png 1024 alt %}

ビデオの45秒あたりのところで、どのディスクにインストールするか選択しますが、ここではUSBメモリを選択します。ここは少し緊張感が必要です。テストインストールですのでパスワードも簡単なものに、といきたいところですが、パスワード要件として小文字、大文字、数字、および特殊文字を含める必要があります。よってキーボードも日本語キーボードであればきちんとキーボードの種類も選択する必要があります。

{% note danger %}
誤って既存のESXi6.7がインストールされているドライブに新規インストールを選択してしまうと、既存の環境が全てフォーマットされてしまいます。

{% endnote %}

セットアップ終了後、再びUSBメモリからブートします。今度はセットアップではなく、ESXi7.0が起動します。ブートシーケンスが既存のSSD等から起動した場合はESXi6.7が起動してしまいます。一旦この状態で、PCをESXiに接続し、ブラウザからESXiにログインし、ストレージやネットワークが使えるか確認できます。当然ながらここには既存の仮想マシンは存在しません。

## ESXi7.0へのアップグレード

再び、Rufusを使い、USBメディアにISOイメージを作成します。そして前述したビデオを参考に今度は既存のESXi6.7がインストールされているSSDに対してアップグレードを選択します。

> <https://www.youtube.com/watch?v=eiZn54GPfzI>
{% asset_img install.png 1024 alt %}

今回はアップグレードが終了し、再起動する際にはUSBメディアは外してください。

無事再起動したら管理画面にログインします。
ESXi7.0はWebUIではビルド番号までは判明しません。sshでESXiに接続し、`esxcli system version get`を実行し確認します。

``` bash
[root@esxi:~] esxcli system version get
Product: VMware ESXi
Version: 7.0.2
Build: Releasebuild-17867351
```

コマンドで確認する際は、Versionとビルド番号で見るのが確実です。VMwareのサイトではパッチは7.0を対象に検索し、あとはビルド番号で照会します。

## 後処理
無事アップグレードが成功したら、以下の作業を行います。

1. ESXi7.0のライセンス登録
 ESXiにログイン後、左ペインメニューの{% label primary@ホスト %}-{% label primary@管理 %}から{% label primary@ライセンスタブ %}を選択し、{% label primary@ライセンスの割り当て %}でダウンロード時に控えたライセンスキーを登録します。
2. ESXi7.0の最新パッチ適用
 ESXiのパッチ適用については、過去記事「{% post_link esxi67-patch %}」を参照してください。
3. ESXi7.0の構成情報のバックアップ（任意）

## 仮想マシンのアップグレード（任意）

ESXiのバージョンアップ後、仮想マシンのバージョンをアップグレードできます。

VMware ToolsのアップグレードはESXiをアップグレード後、仮想マシンを起動させた時にアップグレードが可能な場合、WebUIの当該仮想マシンの項目にメッセージが表示されます。

{% asset_img vmwaretools.png 640 alt %}
アップグレードしたESXi7.0VMware Toolsよりも新しいバージョンがある場合は以下のように表示されます。
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

## 補足
今回はこのブログで紹介している各プロダクトについてESXi7.0の動作確認のためアップグレードの記事を書きましたがESXi6.7は非常に安定しており、個人向け用途であれば無理に7.0にアップグレードする理由は見当たりません。
