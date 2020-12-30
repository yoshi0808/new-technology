---
title: XG Firewall v18 MR4の更新
date: 2020-12-17T19:41:04+09:00
tags:
  - XG Firewall
categories:
  - Security
---

{% asset_img XG.png alt %}

## XG Firewall v18 MR-4

XG Firewall v18のMR-4が2020年12月15日に発表されました。MR3に続き、マイナーアップデートですが、変更点について記載します。
<!-- more -->

## 主なエンハンスの内容

- セキュリティ強化
- IPSecリモートアクセス用の新しい高度なオプション（scadminの代用）。Sophos Connect VPNクライアントのダウンロードがユーザーポータルから可能に
- より強力なパスワードハッシュ - この重要な機能をフルに活用するため、アップグレードするときにパスワードを変更するように促されます
- ウェブフィルタリング - インターネット・ウォッチ・ファウンデーション(IWF)によって児童の性的虐待コンテンツを含むと特定されたウェブサイトは、ウェブフィルタリングが有効になっている場合、自動的にブロックされます。

v18 MR-4の詳細な説明はSophos Communityの[こちらの記事](https://community.sophos.com/xg-firewall/b/blog/posts/xg-firewall-v18-mr4-is-now-available)を参照してください。可能な限り迅速にアップグレードするように推奨されています。

{% cq %}
##### Upgrade as soon as possible

While we always encourage you to keep your firewalls up to date with the latest firmware, over the next few months we are recommending you rapidly apply maintenance releases to ensure you have all the important security, performance, and feature enhancements applied as soon as possible.

ファイアウォールを最新のファームウェアで最新の状態に保つことを常に推奨していますが、今後数ヶ月間は、重要なセキュリティ、パフォーマンス、機能強化のすべてを可能な限り早く適用できるように、メンテナンスリリースを迅速に適用することをお勧めします。

{% endcq %}

## XGのアップデート

XGのv17からのアップデートは、 v17.5 MR6以降から可能です。XGのv18であればMR-4へのアップデートは可能です。
XGの管理画面にログイン後、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアの確認 %}ではただちに全てのユーザーにアップデートの案内が来るわけでは無いようなので、アップデートにはMySophosにログインし、バージョンアップの差分モジュールをダウンロードします。

1. [Sophosのサイト](https://www.sophos.com/ja-jp.aspx)の右上のプルダウンメニューから、{% label primary @ライセンスポータル %}をクリックします。
2. Sophos IDをお持ちでなければIDを作成します。
3. ログイン後、{% label primary @Network Protection %}をクリックします。
4. {% label primary @ファームウェアの更新 %}をクリックします。
5. 「製品名/OSを使った検索」で”ファイアーウォール”を選択し、その後現れるプルダウンは"ソフトウェア"を選択します。
6. {% label primary @選択可能なダウンロードを表示 %}ボタンをクリックします。

{% asset_img mysophos.png 640 alt %}

7. 上記画面で"SW-18.0.4_MR-4.SFW-506.sig"というアップデータが表示されますのでダウンロードします。
8. MY Sophosはここで終了してXGの管理画面にログインし、左ペインメニューの{% label primary @バックアップ＆ファームウェア %}の{% label primary @ファームウェアのタブメニュー %}から以下の画面に赤丸で囲った矢印のアイコンをクリックし、ダウンロードしたモジュールをアップロードします。

{% asset_img verup.png alt %}

アップロード＆再起動ボタンをクリックし、MR-4へのアップグレードを完了させます。

### MR-4で注意する点

XGv18のいつのバージョンからか気付きませんでしたが、IPSec VPNのiPhoneの構成ファイルのダウンロード（ユーザーポータル画面からダウンロード）ができなくなっていました。今回のバージョンではVPNについて、scadmin（IPSec構成ファイル作成ツール）を使わず構成ファイルが作成できるような感じでしたので早速検証したところ、「Install」ボタンをクリックすると再びユーザーポータルのログインページに飛ばされてしまいファイルをダウンロードする事すらできなくなっていました。

幸いにも、iPhoneからIPSec VPNでXG Firewallに接続する方法は、代替策があるのでVPN構成ファイルをダウンロードせずとも対応は可能です。
「{% post_link vpn-iphone %}」の記事については代替策について追記しておきました。

また、[Sophos Community](https://community.sophos.com/xg-firewall/f/discussions/124771/xg-firewall-v18-mr-4-feedback-and-experiences/455768#455768)に、この不具合について投稿したところ、5分後にSophosの方（いつも手厚いサポートのLuCar Toniさん）から既知の不具合（Bug ID: NC-64758）というレスポンスがありました。早い！

{% note info no-icon %}
仮想環境（ESXi）上にXGをインストールされている方はアップグレードの前に、「{% post_link esxi-backup %}」を参考に、XGのバックアップを確保される事をお勧めします。
{% endnote %}
