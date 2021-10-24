---
title: XG Firewall v18 MR5の更新
date: 2021-04-07T19:00:00+09:00
tags:
  - XG Firewall
categories:
  - Security
---


{% asset_img XG.png alt %}

## XG Firewall v18 MR-5

2021年4月28日に、v18-MR5のbuild586が発表されています。すでにv18.5のユーザーはこのパッチの適用は不要です。
<!-- more -->

## 主なエンハンスの内容

### VPNの新機能

- 同時IPSecVPNトンネル容量の大幅な50%の増加
- ソフォス接続v2.1経由のリモートアクセスのためのIPSecプロビジョニングファイルのサポート（Windows）

### 証明書の管理とセキュリティ

- 秘密キーのセキュリティ強化
- PEM形式証明書のアップロード/ダウンロードのサポート

その他、Sophos Central Firewallレポーティングの強化、50項目以上の不具合修正があります。また、build586では、SNMPとIPSecVPNに関する細かな不具合が修正されています。
> <https://community.sophos.com/sophos-xg-firewall/b/blog/posts/sophos-xg-firewall-v18-mr5--build-586-is-now-available>

>**Upgrade as soon as possible**

>While we always encourage you to keep your firewalls up to date with the latest firmware, over the next few months we are recommending you rapidly apply maintenance releases to ensure you have all the important security, performance, and feature enhancements applied as soon as possible.

>ファイアウォールを最新のファームウェアで最新の状態に保つことを常に推奨していますが、今後数ヶ月間は、重要なセキュリティ、パフォーマンス、機能強化のすべてを可能な限り早く適用できるように、メンテナンスリリースを迅速に適用することをお勧めします。

## XGのアップデート

XGのv17からのアップデートは、 v17.5 MR6以降から可能です。XGのv18であればMR-5へのアップデートは可能です。
XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. Sophosのサイトの右上のプルダウンメニューから、{% label primary @ライセンスポータル %}をクリックします。
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 640 alt %}

7. 上記画面で"SW-18.0.5_MR-5.SFW-586.sig"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png alt %}

アップロード＆再起動ボタンをクリックし、MR-5へのアップグレードを完了させます。

{% note info %}
仮想環境（ESXi）上にXGをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、XGのバックアップを確保される事をお勧めします。
{% endnote %}

## IPSec VPNのiOSの構成ファイル

v18のMR4で気づいた、IPSec VPNのiOSの構成ファイルのダウンロード（ユーザーポータル画面からダウンロード）ができなくなっていた件は、今回のバージョンで修正された事を確認しました。サポートから連絡のあった、NC-64758という不具合番号も今回の解消リストに含まれています。
修正されたissueは以下を参照してください。
> <https://docs.sophos.com/releasenotes/index.html?productGroupID=nsg&productID=xg&versionID=18.0>
